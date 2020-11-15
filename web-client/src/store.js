import {createStore, createLogger} from 'vuex'
import {SortedMap} from 'insort'
import LRU from 'quick-lru'

import {verifySignature, publishEvent} from './helpers'
import {ec, db} from './globals'

export default createStore({
  plugins: (process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
  ).concat([init, listener]),
  state() {
    let relays = [
      {
        host: 'https://relay-profiles.bigsun.xyz',
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
      key: ec.genKeyPair().getPrivate('hex'),
      following: [],
      home: new SortedMap(),
      metadata: new LRU({maxSize: 100}),
      browsing: new LRU({maxSize: 300})
    }
  },
  getters: {
    pubKeyHex: state =>
      ec.keyFromPrivate(state.key, 'hex').getPublic(true, 'hex'),
    writeServers: state =>
      state.relays
        .filter(({policy}) => policy.indexOf('w') !== -1)
        .map(({host}) => host),
    readServers: state =>
      state.relays
        .filter(({policy}) => policy.indexOf('r') !== -1)
        .map(({host}) => host)
  },
  mutations: {
    setInit(state, {relays, key, following, home, metadata}) {
      state.relays = relays
      state.key = key
      state.following = following
      state.home = home
      state.metadata = metadata
    },
    gotEventSource(state) {
      state.haveEventSource.resolve()
    },
    addRelay(state, relay) {
      db.relays.put(relay)
      state.relays.push(relay)
    },
    updateRelay(state, {key, host, policy}) {
      let relay = {host, policy}
      db.relays.update(key, relay)
      let entry = state.relays.find(x => x.host === host)
      entry.host = relay.host
      entry.policy = relay.policy
    },
    follow(state, key) {
      state.following.push(key)
      db.following.put({pubkey: key})
    },
    unfollow(state, key) {
      state.following.splice(state.following.indexOf(key), 1)
      db.following.delete(key)
    },
    receivedEvent(state, {event: evt, context}) {
      if (!verifySignature(evt)) {
        console.log('received event with invalid signature', evt)
        return
      }

      switch (evt.kind) {
        case 0: // setMetadata
          let meta = JSON.parse(evt.content)
          let storeable = {
            pubkey: evt.pubkey,
            time: evt.created_at,
            meta
          }

          if (context === 'requested') {
            // just someone we're viewing
            if (!state.metadata.has(evt.pubkey)) {
              state.metadata.set(evt.pubkey, meta)
            }
          } else if (context === 'happening') {
            // an update from someone we follow that happened just now
            state.metadata.set(evt.pubkey, meta)
            db.cachedmetadata.put(storeable)
          } else if (context === 'history') {
            // someone we follow, but an old update
            db.cachedmetadata.get(evt.pubkey).then(data => {
              if (data.time < storeable.time) {
                db.cachedmetadata.put(storeable)
              }
            })
          }
          break
        case 1: // textNote
          if (context === 'requested') {
            state.browsing.set(evt.id, evt)
            state.browsing.set('from:' + evt.pubkey, evt)
            if (evt.ref && evt.ref.length) {
              state.browsing.set('rel:' + evt.ref, evt)
            }
          } else {
            state.home.set(evt.id + ':' + evt.created_at, evt)
          }
          break
        case 2: // recommendServer
          let host = evt.content
          if (context === 'requested') {
            db.relays.put({
              host,
              policy: '',
              recommender: evt.pubkey
            })
            state.relays.push({host, policy: ''})
          } else {
            db.relays.put({
              host,
              policy: 'r',
              recommender: evt.pubkey
            })
            state.relays.push({host, policy: 'r'})
          }
          break
      }
    }
  },
  actions: {
    async browseProfile(store, pubkey) {
      await store.state.haveEventSource
      for (let i = 0; i < store.getters.readServers.length; i++) {
        let host = store.getters.readServers[i]
        window.fetch(host + '/request_user?session=' + store.state.session, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({pubkey})
        })
      }
    },
    async browseNote(store, id) {
      await store.state.haveEventSource
      for (let i = 0; i < store.getters.readServers.length; i++) {
        let host = store.getters.readServers[i]
        window.fetch(host + '/request_note?session=' + store.state.session, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({id})
        })
      }
    },
    async publishMetadata(store, meta) {
      let evt = await publishEvent(
        {
          pubkey: store.getters.pubKeyHex,
          created_at: Math.round(new Date().getTime() / 1000),
          kind: 0,
          content: JSON.stringify(meta)
        },
        store.state.key,
        store.getters.writeServers
      )

      db.cachedmetadata.put({pubkey: evt.pubkey, time: evt.created_at, meta})
    },
    async publishNote(store, text) {
      let evt = await publishEvent(
        {
          pubkey: store.getters.pubKeyHex,
          created_at: Math.round(new Date().getTime() / 1000),
          kind: 1,
          content: text.trim()
        },
        store.state.key,
        store.getters.writeServers
      )

      db.mynotes.put(evt)
      store.commit('receivedEvent', {event: evt, context: 'happening'})
    }
  }
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
    db.following.toArray().then(r =>
      r
        .map(({pubkey}) => pubkey)
        .concat(
          // always be following thyself
          store.getters.pubKeyHex
        )
    ),
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
    })
  ])

  store.commit('setInit', {
    key: data[0],
    relays: data[1],
    following: data[2],
    home: data[3],
    metadata: data[4]
  })
}

function listener(store) {
  var ess = new Map()

  db.relays.hook('creating', host => {
    listenToRelay(host)
  })

  db.relays.hook('deleting', host => {
    let es = ess.get(host)
    es.close()
    ess.delete(host)
  })

  db.following.hook('creating', () => {
    restartListeners()
  })

  store.subscribe(mutation => {
    if (mutation.type === 'setInit') restartListeners()
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

    let qs = store.state.following.map(key => `key=${key}`).join('&')
    let es = new EventSource(
      host + '/listen_updates?' + qs + '&session=' + store.state.session
    )
    ess.set(host, es)

    es.onerror = e => {
      console.log(`${host}/listen_updates error: ${e.data}`)
      es.close()
      ess.delete(host)
    }

    store.commit('gotEventSource')

    es.addEventListener('notice', e => {
      console.log(e.data)
    })
    ;['history', 'happening', 'requested'].forEach(context => {
      es.addEventListener(context, e => {
        store.commit('receivedEvent', {
          event: JSON.parse(e.data),
          context
        })
      })
    })
  }
}
