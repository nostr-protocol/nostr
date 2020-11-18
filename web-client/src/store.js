import {createStore, createLogger} from 'vuex'
import {SortedMap} from 'insort'
import LRU from 'quick-lru'

import {pubkeyFromPrivate, makeRandom32} from './helpers'
import {db} from './globals'
import actions from './actions'
import mutations from './mutations'

export default createStore({
  plugins: (process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
  ).concat([init, listener, publishStatusLoader]),
  state() {
    let relays = [
      {
        host: 'https://nostr-relay.bigsun.xyz',
        policy: 'rw'
      }
    ]
    db.relays.bulkPut(relays)

    let haveEventSource = new Promise(resolve => {
      setTimeout(() => {
        haveEventSource.resolve = resolve
      }, 1)
    })

    return {
      haveEventSource,
      session: null,
      relays,
      key: makeRandom32().toString('hex'),
      following: [],
      home: new SortedMap(),
      metadata: new LRU({maxSize: 100}),
      browsing: new LRU({maxSize: 300}),
      publishStatus: {},
      petnames: {}
    }
  },
  getters: {
    pubKeyHex: state => pubkeyFromPrivate(state.key),
    writeServers: state =>
      state.relays
        .filter(({policy}) => policy.indexOf('w') !== -1)
        .map(({host}) => host),
    readServers: state =>
      state.relays
        .filter(({policy}) => policy.indexOf('r') !== -1)
        .map(({host}) => host)
  },
  mutations,
  actions
})

async function init(store) {
  let data = await Promise.all([
    db.settings.get('key').then(row => {
      if (!row) {
        // use the key we generated on startup and save it
        db.settings.put({key: 'key', value: store.state.key})
        return store.state.key
      } else {
        // use the key that was stored
        return row.value
      }
    }),
    db.relays.toArray().then(rls => {
      // if blank, use hardcoded values
      if (rls.length === 0) {
        return store.state.relays
      }
      return rls
    }),
    db.following.toArray().then(r => r.map(({pubkey}) => pubkey)),
    db.mynotes
      .orderBy('created_at')
      .reverse()
      .limit(30)
      .toArray()
      .then(notes => {
        return new SortedMap(
          notes.map(n => [n.id + ':' + n.created_at, n]),
          (a, b) => b.split(':')[1] - a.split(':')[1]
        )
      }),
    db.cachedmetadata.toArray().then(metas => {
      var metadata = {}
      metas.forEach(({meta, pubkey}) => {
        metadata[pubkey] = meta
      })
      return metadata
    }),
    db.contactlist.toArray().then(contacts => {
      var petnames = {}
      contacts.forEach(({pubkey, name}) => {
        petnames[pubkey] = name
      })
      return petnames
    })
  ])

  store.commit('setInit', {
    key: data[0],
    relays: data[1],
    following: data[2],
    home: data[3],
    metadata: data[4],
    petnames: data[5]
  })
}

function publishStatusLoader(store) {
  db.publishlog.hook('creating', (_, {id, time, host, status}) => {
    store.commit('updatePublishStatus', {id, time, host, status})
  })
}

function listener(store) {
  var ess = new Map()

  store.subscribe(mutation => {
    switch (mutation.type) {
      case 'setInit':
      case 'loadedRelays':
      case 'follow':
      case 'unfollow':
        restartListeners()
    }
  })

  function restartListeners() {
    for (let [host, es] of ess) {
      es.close()
      ess.delete(host)
    }
    store.getters.readServers.forEach(listenToRelay)
  }

  function listenToRelay(host) {
    if (store.state.following.length === 0) return

    let session = new Date().getTime() + '' + Math.round(Math.random() * 100000)

    if (host.length && host[host.length - 1] === '/') host = host.slice(0, -1)
    let qs = store.state.following.map(key => `key=${key}`).join('&')
    let es = new EventSource(
      host + '/listen_updates?' + qs + '&session=' + session
    )
    ess.set(host, es)

    es.onerror = err => {
      console.log(`${host}/listen_updates error`, err)
      es.close()
      ess.delete(host)
    }

    store.commit('gotEventSource', session)

    es.addEventListener('notice', e => {
      console.log(e.data)
    })
    ;['history', 'happening', 'requested'].forEach(context => {
      es.addEventListener(context, e => {
        store.dispatch('receivedEvent', {
          event: JSON.parse(e.data),
          context
        })
      })
    })
  }
}
