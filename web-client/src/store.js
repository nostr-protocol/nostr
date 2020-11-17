import {createStore, createLogger} from 'vuex'
import {SortedMap} from 'insort'
import LRU from 'quick-lru'

import {
  pubkeyFromPrivate,
  makeRandom32,
  verifySignature,
  publishEvent
} from './helpers'
import {db} from './globals'

export default createStore({
  plugins: (process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
  ).concat([init, listener, relayLoader, publishStatusLoader]),
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
      publishStatus: {}
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
  mutations: {
    setInit(state, {relays, key, following, home, metadata}) {
      state.relays = relays
      state.key = key
      state.following = following.concat(
        // always be following thyself
        pubkeyFromPrivate(state.key)
      )
      state.home = home
      state.metadata = metadata
    },
    gotEventSource(state, session) {
      state.haveEventSource.resolve()
      state.session = session
    },
    addRelay(state, relay) {
      db.relays.put(relay)
    },
    updateRelay(state, {key, host, policy}) {
      let relay = {host, policy}
      db.relays.update(key, relay)
    },
    deleteRelay(state, host) {
      db.relays.delete(host)
    },
    loadedRelays(state, relays) {
      state.relays = relays
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
            // someone we're just browsing
            db.relays.put({
              host,
              policy: '',
              recommender: evt.pubkey
            })
          } else {
            // someone we're following
            db.relays.put({
              host,
              policy: 'r',
              recommender: evt.pubkey
            })
          }
          break
      }
    },
    updatePublishStatus(state, {id, time, host, status}) {
      if (!(id in state.publishStatus)) state.publishStatus[id] = {}
      state.publishStatus[id][host] = {time, status}
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
    },
    recommendRelay(store, host) {
      publishEvent(
        {
          pubkey: store.getters.pubKeyHex,
          created_at: Math.round(new Date().getTime() / 1000),
          kind: 2,
          content: host
        },
        store.state.key,
        store.getters.writeServers
      )
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

function relayLoader(store) {
  db.relays.hook('creating', loadRelays)
  db.relays.hook('updating', loadRelays)
  db.relays.hook('deleting', loadRelays)

  function loadRelays() {
    setTimeout(async () => {
      let relays = await db.relays.toArray()
      store.commit('loadedRelays', relays)
    }, 1)
  }
}

function publishStatusLoader(store) {
  db.publishlog.hook('creating', (_, {id, time, host, status}) => {
    store.commit('updatePublishStatus', {id, time, host, status})
  })
}

function listener(store) {
  var ess = new Map()

  db.relays.hook('creating', host => {
    listenToRelay(host)
  })

  db.relays.hook('updating', (mod, _, obj) => {
    if (obj.policy.indexOf('r') !== -1) {
      stopListeningToRelay(obj.host)
    }
    if (!mod.policy || mod.policy.indexOf('r') !== -1) {
      listenToRelay(mod.host || obj.host)
    }
  })

  db.relays.hook('deleting', host => {
    stopListeningToRelay(host)
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

  function stopListeningToRelay(host) {
    let es = ess.get(host)
    if (!es) return
    es.close()
    ess.delete(host)
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
      console.log(`${host}/listen_updates error: ${err}`)
      es.close()
      ess.delete(host)
    }

    store.commit('gotEventSource', session)

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
