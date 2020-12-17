import {createStore, createLogger} from 'vuex'
import {SortedMap} from 'insort'
import LRU from 'quick-lru'

import {pubkeyFromPrivate, makeRandom32} from './helpers'
import {db} from './globals'
import actions from './actions'
import mutations from './mutations'
import {KIND_METADATA, KIND_CONTACTLIST} from './constants'

export default createStore({
  plugins: (process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
  ).concat([init, listener, publishStatusLoader]),
  state() {
    let secretKey = localStorage.getItem('key')
    if (!secretKey) {
      secretKey = makeRandom32().toString('hex')
      localStorage.setItem('key', secretKey)
    }

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
      session: new Date().getTime() + '' + Math.round(Math.random() * 100000),
      relays,
      key: secretKey,
      following: [],
      home: new SortedMap(),
      metadata: new LRU({maxSize: 100}),
      browsing: new LRU({maxSize: 500}),
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
        .map(({host}) => host),
    ourPetNameFor: state => pubkey => {
      if (state.petnames[pubkey]) {
        let single = state.petnames[pubkey].find(name => name.length === 1)
        if (single) return single[0]
      }
      return null
    }
  },
  mutations,
  actions
})

async function init(store) {
  let data = await Promise.all([
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
    db.events
      .where({kind: KIND_METADATA})
      .toArray()
      .then(events => {
        var metadata = {}
        events.forEach(({content, pubkey}) => {
          let meta = JSON.parse(content)
          metadata[pubkey] = meta
        })
        return metadata
      }),
    db.contactlist.toArray().then(contacts => {
      var petnames = {}
      contacts.forEach(({pubkey, name}) => {
        petnames[pubkey] = [[name]]
      })
      return petnames
    })
  ])

  store.commit('setInit', {
    relays: data[0],
    following: data[1],
    home: data[2],
    metadata: data[3],
    petnames: data[4]
  })

  // process contact lists (nip-02)
  let events = await db.events.where({kind: KIND_CONTACTLIST}).toArray()
  for (let i = 0; i < events.length; i++) {
    store.dispatch('processContactList', events[i])
  }
}

function publishStatusLoader(store) {
  db.publishlog.toArray().then(logs => {
    logs.forEach(({id, time, host, status}) => {
      if (time < new Date().getTime() / 1000 - 60 * 60 * 24 * 30) {
        // older than 30 days, delete and ignore
        db.publishlog.delete([id, host])
        return
      }

      store.commit('updatePublishStatus', {id, time, host, status})
    })
  })

  db.publishlog.hook('creating', (_, {id, time, host, status}) => {
    store.commit('updatePublishStatus', {id, time, host, status})
  })
  db.publishlog.hook('updating', (mod, _, prev) => {
    let {id, time, host, status} = {...prev, ...mod}
    store.commit('updatePublishStatus', {id, time, host, status})
  })
}

function listener(store) {
  var ess = new Map()

  store.subscribe(mutation => {
    switch (mutation.type) {
      case 'setInit':
      case 'loadedRelays':
        restartListeners()
        break
      case 'follow':
        let watch = watchKey.bind(null, mutation.payload)
        store.getters.readServers.forEach(watch)
        break
      case 'unfollow':
        let unwatch = unwatchKey.bind(null, mutation.payload)
        store.getters.readServers.forEach(unwatch)
        break
    }
  })

  function restartListeners() {
    for (let [host, es] of ess) {
      es.close()
      ess.delete(host)
    }
    store.getters.readServers.forEach(listenToRelay)
  }

  function unwatchKey(key, host) {
    window.fetch(host + '/request_unwatch?session=' + store.state.session, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({keys: [key]})
    })
  }

  function watchKey(key, host) {
    window.fetch(host + '/request_watch?session=' + store.state.session, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({keys: [key]})
    })
  }

  async function listenToRelay(host) {
    if (store.state.following.length === 0) return
    if (host.length && host[host.length - 1] === '/') host = host.slice(0, -1)

    try {
      let es = new EventSource(
        host + '/listen_events?session=' + store.state.session
      )
      ess.set(host, es)

      es.onerror = err => {
        console.log(`${host}/listen_events error`, err)
        es.close()
        ess.delete(host)
      }
      es.onopen = () => {
        store.commit('gotEventSource')
      }

      // add initial keys
      await window.fetch(
        host + '/request_watch?session=' + store.state.session,
        {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({keys: store.state.following})
        }
      )

      // handle anything
      es.addEventListener('notice', e => {
        console.log(e.data)
      })
      ;['p', 'n', 'r'].forEach(context => {
        es.addEventListener(context, e => {
          store.dispatch('receivedEvent', {
            event: JSON.parse(e.data),
            context
          })
        })
      })

      // request initial feed
      await window.fetch(
        host + '/request_feed?session=' + store.state.session,
        {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({limit: 100})
        }
      )
    } catch (err) {
      console.log('error listening to relay:', host)
    }
  }
}
