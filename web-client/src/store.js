import {createStore, createLogger} from 'vuex'
import {SortedMap} from 'insort'
import LRU from 'quick-lru'
import {getPublicKey, makeRandom32} from 'nostr-tools'

import {db} from './db'
import actions from './actions'
import mutations from './mutations'
import {pool, relayStorePlugin} from './relay'
import {KIND_METADATA, KIND_CONTACTLIST} from './constants'

export default createStore({
  plugins: (process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
  ).concat([relayStorePlugin, init, publishStatusLoader]),
  state() {
    let secretKey = localStorage.getItem('key')
    if (!secretKey) {
      secretKey = Buffer.from(makeRandom32()).toString('hex')
      localStorage.setItem('key', secretKey)
    }
    pool.setPrivateKey(secretKey)

    return {
      key: secretKey,
      following: [],
      home: new SortedMap(),
      metadata: new LRU({maxSize: 100}),
      browsing: new LRU({maxSize: 500}),
      publishStatus: {},
      petnames: {},
      ignoredRelays: {},
    }
  },
  getters: {
    pubKeyHex: state => getPublicKey(state.key),
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
  let [following, home, metadata, petnames] = await Promise.all([
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
    following,
    home,
    metadata,
    petnames
  })

  // process contact lists (nip-02)
  let events = await db.events.where({kind: KIND_CONTACTLIST}).toArray()
  for (let i = 0; i < events.length; i++) {
    store.dispatch('processContactList', events[i])
  }
}

function publishStatusLoader(store) {
  db.publishlog.toArray().then(logs => {
    logs.forEach(({id, time, relay, status}) => {
      if (time < new Date().getTime() / 1000 - 60 * 60 * 24 * 30) {
        // older than 30 days, delete and ignore
        db.publishlog.delete([id, relay])
        return
      }

      store.commit('updatePublishStatus', {id, time, relay, status})
    })
  })

  db.publishlog.hook('creating', (_, {id, time, relay, status}) => {
    store.commit('updatePublishStatus', {id, time, relay, status})
  })
  db.publishlog.hook('updating', (mod, _, prev) => {
    let {id, time, relay, status} = {...prev, ...mod}
    store.commit('updatePublishStatus', {id, time, relay, status})
  })
}
