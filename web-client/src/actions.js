// vuex store actions

import {
  verifySignature,
  publishEvent,
  broadcastEvent,
  overwriteEvent
} from './helpers'
import {
  CONTEXT_NOW,
  CONTEXT_REQUESTED,
  CONTEXT_PAST,
  KIND_METADATA,
  KIND_TEXTNOTE,
  KIND_RECOMMENDSERVER,
  KIND_CONTACTLIST
} from './constants'
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

    // save new secret key
    localStorage.setItem('key', newKey)

    store.commit('setSecretKey', newKey)
  },
  async receivedEvent(store, {event, context}) {
    if (!verifySignature(event)) {
      console.log('received event with invalid signature', event)
      return
    }

    switch (event.kind) {
      case KIND_METADATA:
        if (context === CONTEXT_REQUESTED) {
          // just someone we're viewing
          store.commit('receivedSetMetadata', {event, context})
        } else if (context === CONTEXT_NOW) {
          // an update from someone we follow that happened just now
          store.commit('receivedSetMetadata', {event, context})
          await db.events
            .where({kind: KIND_METADATA, pubkey: event.pubkey})
            .delete()
          await db.events.put(event)
        } else if (context === CONTEXT_PAST) {
          // someone we follow, but an old update -- check first
          // check first if we don't have a newer one
          let foundNewer = await overwriteEvent(
            {kind: KIND_METADATA, pubkey: event.pubkey},
            event
          )
          if (!foundNewer) store.commit('receivedSetMetadata', {event, context})
        }
        break
      case KIND_TEXTNOTE:
        if (event.pubkey === store.getters.pubKeyHex) {
          db.mynotes.put(event)
        }

        store.commit('receivedTextNote', {event, context})
        break
      case KIND_RECOMMENDSERVER:
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
      case KIND_CONTACTLIST:
        // if (!(event.pubkey in store.state.petnames)) {
        //   // we don't know this person, so we won't use their contact list
        //   return
        // }

        // check if we have a newest version already
        let foundNewer = await overwriteEvent(
          {pubkey: event.pubkey, kind: KIND_CONTACTLIST},
          event
        )
        // process
        if (!foundNewer) store.dispatch('processContactList', event)

        break
    }
  },
  async setContactName(store, {pubkey, name}) {
    db.contactlist.put({pubkey, name})
    store.commit('savePetName', {pubkey, name: [name]})

    // publish our new contact list
    publishEvent(
      {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        kind: KIND_CONTACTLIST,
        content: JSON.stringify(
          (await db.contactlist.toArray()).map(({pubkey, name}) => [
            pubkey,
            name
          ])
        )
      },
      store.state.key,
      store.getters.writeServers
    )
  },
  processContactList(store, event) {
    // parse event content
    var entries = []
    try {
      entries = JSON.parse(event.content)
    } catch (err) {
      return
    }

    for (let i = 0; i < entries.length; i++) {
      let [pubkey, name] = entries[i]

      if (pubkey in store.state.petnames) {
        // we have our own petname for this key already
        continue
      }

      store.commit('savePetName', {pubkey, name: [name, event.pubkey]})
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
  async browseEvent(store, id) {
    await store.state.haveEventSource
    for (let i = 0; i < store.getters.readServers.length; i++) {
      let host = store.getters.readServers[i]
      window.fetch(host + '/request_event?session=' + store.state.session, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({id})
      })
    }
  },
  async broadcastEvent(store, event) {
    await broadcastEvent(event, store.getters.writeServers)
  },
  async publishMetadata(store, meta) {
    let event = await publishEvent(
      {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        kind: KIND_METADATA,
        content: JSON.stringify(meta)
      },
      store.state.key,
      store.getters.writeServers
    )

    store.commit('receivedSetMetadata', {event, context: CONTEXT_NOW})
  },
  async publishNote(store, {text, reference}) {
    let event = await publishEvent(
      {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        ref: reference,
        kind: KIND_TEXTNOTE,
        content: text.trim()
      },
      store.state.key,
      store.getters.writeServers
    )

    db.mynotes.put(event)
    store.commit('receivedTextNote', {event, context: CONTEXT_NOW})
  },
  async recommendRelay(store, host) {
    publishEvent(
      {
        pubkey: store.getters.pubKeyHex,
        created_at: Math.round(new Date().getTime() / 1000),
        kind: KIND_RECOMMENDSERVER,
        content: host
      },
      store.state.key,
      store.getters.writeServers
    )
  }
}
