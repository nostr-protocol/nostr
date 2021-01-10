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
db.relays
  .bulkPut(hardcodedRelays)
  .then(() => db.relays.toArray())
  .then(relays => {
    relays.forEach(({host, policy}) => {
      pool.addRelay(host, parsePolicy(policy))
    })
  })

export function relayStorePlugin(store) {
  store.subscribe(mutation => {
    switch (mutation.type) {
      case 'setInit':
        mutation.payload.following.forEach(key => {
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
  pool.onEvent(async (context, event, {url: relayURL}) => {
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

  // request initial feed
  setTimeout(() => {
    pool.reqFeed()
  }, 1)
}
