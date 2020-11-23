// vuex store actions

import {verifySignature, publishEvent} from './helpers'
import {db} from './globals'

export default {
  async importSecretKey(store, newKey) {
    // save previous key in case the user wants it back later
    var discardedSecretKeys = JSON.parse(
      window.localStorage.getItem('discardedSecretKeys') || '[]'
    )
    discardedSecretKeys.push(store.state.key)
    window.localStorage.setItem(
      'discardedSecretKeys',
      JSON.stringify(discardedSecretKeys)
    )

    // save new secret key in the database
    await db.settings.put({key: 'key', value: newKey})

    store.commit('setSecretKey', newKey)
  },
  async receivedEvent(store, {event, context}) {
    if (!verifySignature(event)) {
      console.log('received event with invalid signature', event)
      return
    }

    switch (event.kind) {
      case 0: // setMetadata
        store.commit('receivedSetMetadata', {event, context})
        break
      case 1: // textNote
        store.commit('receivedTextNote', {event, context})
        break
      case 2: // recommendServer
        let host = event.content

        try {
          new URL(host)
        } catch (err) {
          // ignore invalid URLs
          return
        }

        // ignore if we already know this
        // this prevents infinite loops and overwriting of our settings
        if (await db.relays.get(host)) {
          return
        }

        if (context === 'requested') {
          // someone we're just browsing
          await db.relays.put({
            host,
            policy: '',
            recommender: event.pubkey
          })
        } else {
          // someone we're following
          await db.relays.put({
            host,
            policy: 'r',
            recommender: event.pubkey
          })
        }

        store.commit('loadedRelays', await db.relays.toArray())
        break
    }
  },
  async addRelay(store, relay) {
    await db.relays.put(relay)
    store.commit('loadedRelays', await db.relays.toArray())
  },
  async updateRelay(store, {key, host, policy}) {
    let relay = {host, policy}
    await db.relays.update(key, relay)
    store.commit('loadedRelays', await db.relays.toArray())
  },
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
    let event = await publishEvent(
      {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        kind: 0,
        content: JSON.stringify(meta)
      },
      store.state.key,
      store.getters.writeServers
    )

    store.commit('receivedSetMetadata', {event, context: 'happening'})
  },
  async publishNote(store, text) {
    let event = await publishEvent(
      {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        kind: 1,
        content: text.trim()
      },
      store.state.key,
      store.getters.writeServers
    )

    db.mynotes.put(event)
    store.commit('receivedTextNote', {event, context: 'happening'})
  },
  async recommendRelay(store, host) {
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
