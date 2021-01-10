import {relayPool} from 'nostr-tools'

import {db} from './db'
import {parsePolicy} from './helpers'

export const pool = relayPool()

const hardcodedRelays = [
  {
    host: 'https://nostr-relay.bigsun.xyz',
    policy: 'rw'
  }
]

export function relayStorePlugin(store) {
  db.relays
    .bulkPut(hardcodedRelays)
    .then(() => db.relays.toArray())
    .then(relays => {
      relays.forEach(({host, policy}) => {
        if (policy.indexOf('i') !== -1) {
          store.commit('ignoreRelay', host)
        }

        let relay = pool.addRelay(host, parsePolicy(policy))
        setTimeout(() => {
          relay.reqFeed()
        }, 1)
      })
    })

  store.subscribe(mutation => {
    switch (mutation.type) {
      case 'setInit':
        store.state.following.forEach(key => {
          pool.subKey(key)
        })
        break
      case 'follow':
        pool.subKey(mutation.payload)
        break
      case 'unfollow':
        pool.unsubKey(mutation.payload)
        break
    }
  })

  // setup event listener
  pool.onEvent(async (event, context, {url: relayURL}) => {
    store.dispatch('receivedEvent', {event, context})

    // is this our note? mark it as published on this relay
    if (await db.mynotes.get(event.id)) {
      db.publishlog.put({
        id: event.id,
        time: Math.round(Date.now() / 1000),
        relay: relayURL,
        status: 'published'
      })
    }
  })

  // setup attempt status listener
  pool.onAttempt((eventId, status, {url: relayURL}) => {
    db.publishlog.put({
      id: eventId,
      time: Math.round(Date.now() / 1000),
      relay: relayURL,
      status
    })
  })
}
