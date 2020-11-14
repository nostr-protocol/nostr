import {createStore, createLogger} from 'vuex'
import elliptic from 'elliptic'
import shajs from 'sha.js'
import Dexie from 'dexie'
import {SortedMap} from 'insort'

import {verifySignature, serializeEvent} from './helpers'

const ec = new elliptic.ec('secp256k1')
const db = new Dexie('db')

db.version(1).stores({
  settings: 'key', // as in key => value
  relays: 'host',
  following: 'pubkey',
  mynotes: 'id, kind, created_at',
  cachedmetadata: 'pubkey',
  cachednotes: 'id, pubkey, created_at'
})

export default createStore({
  plugins: (process.env.NODE_ENV !== 'production'
    ? [createLogger()]
    : []
  ).concat([init, listener]),
  state() {
    return {
      relays: {
        'https://relay-profiles.bigsun.xyz': 'rw'
      },
      key: ec.genKeyPair().getPrivate('hex'),
      following: [],
      notes: new SortedMap([], (a, b) => b[1] - a[1])
    }
  },
  getters: {
    privKeyHex: state => state.key,
    pubKeyHex: state =>
      ec.keyFromPrivate(state.key, 'hex').getPublic(true, 'hex'),
    writeServers: state =>
      Object.keys(state.relays).filter(
        host => state.relays[host].indexOf('w') !== -1
      ),
    readServers: state =>
      Object.keys(state.relays).filter(
        host => state.relays[host].indexOf('r') !== -1
      )
  },
  mutations: {
    setInit(state, {relays, key, following, notes}) {
      state.relays = relays
      state.key = key
      state.following = following
      state.notes = notes
    },
    follow(state, key) {
      state.following.push(key)
      db.following.put({pubkey: key})
    },
    unfollow(state, key) {
      state.following.splice(state.following.indexOf(key), 1)
      db.following.delete(key)
    },
    receivedEvent(state, evt) {
      if (!verifySignature(evt)) {
        console.log('received event with invalid signature', evt)
        return
      }

      switch (evt.kind) {
        case 0: // setMetadata
          break
        case 1: // textNote
          state.notes.set([evt.id, evt.created_at], evt)
          break
        case 2: // recommendServer
          break
      }
    }
  },
  actions: {
    publishNote(store, text) {
      text = text.trim()

      let evt = {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        kind: 1,
        content: text
      }

      let hash = shajs('sha256').update(serializeEvent(evt)).digest()
      evt.id = hash.toString('hex')

      evt.sig = ec
        .keyFromPrivate(store.state.key, 'hex')
        .sign(hash, {canonical: true})
        .toDER('hex')

      for (let i = 0; i < store.getters.writeServers.length; i++) {
        let host = store.getters.writeServers[i]
        window
          .fetch(host + '/save_update', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(evt)
          })
          .then(r => {
            if (!r.ok) console.log(`failed to publish ${evt} to ${host}`)
          })
      }

      db.mynotes.put(evt)
      store.commit('receivedEvent', evt)
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

      var relays = {}
      rls.forEach(({host, policy}) => {
        relays[host] = policy
      })

      return relays
    }),
    db.following.toArray().then(r => r.map(({pubkey}) => pubkey)),
    db.mynotes
      .orderBy('created_at')
      .reverse()
      .limit(30)
      .toArray()
      .then(notes => {
        return new SortedMap(
          notes.map(n => [[n.id, n.created_at], n]),
          (a, b) => b[1] - a[1]
        )
      })
  ])

  store.commit('setInit', {
    key: data[0],
    relays: data[1],
    following: data[2],
    notes: data[3]
  })
}

function listener(store) {
  var ess = []

  store.subscribe(mutation => {
    if (
      mutation.type === 'setInit' ||
      mutation.type === 'changeRelay' ||
      mutation.type === 'follow' ||
      mutation.type === 'unfollow'
    ) {
      ess.forEach(es => {
        es.close()
      })
      startListening()
    }
  })

  function startListening() {
    store.getters.readServers.forEach(listenToRelay)
  }

  function listenToRelay(relayURL, i) {
    if (store.state.following.length === 0) return

    let qs = store.state.following.map(key => `key=${key}`).join('&')
    let es = new EventSource(relayURL + '/listen_updates?' + qs)
    ess.push(es)

    es.onerror = e => {
      console.log(`${relayURL}/listen_updates error: ${e.data}`)
      ess.splice(i, 1)
    }

    es.addEventListener('notice', e => {
      console.log(e.data)
    })

    es.addEventListener('event', e => {
      let evt = JSON.parse(e.data)
      store.commit('receivedEvent', evt)
    })
  }
}
