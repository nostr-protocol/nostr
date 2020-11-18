// vuex store mutations

import {pubkeyFromPrivate} from './helpers'
import {db} from './globals'

export default {
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
  receivedSetMetadata(state, {event: evt, context}) {
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
  },
  receivedTextNote(state, {event: evt, context}) {
    if (context === 'requested') {
      state.browsing.set(evt.id, evt)
      state.browsing.set('from:' + evt.pubkey, evt)
      if (evt.ref && evt.ref.length) {
        state.browsing.set('rel:' + evt.ref, evt)
      }
    } else {
      state.home.set(evt.id + ':' + evt.created_at, evt)
    }
  },
  updatePublishStatus(state, {id, time, host, status}) {
    if (!(id in state.publishStatus)) state.publishStatus[id] = {}
    state.publishStatus[id][host] = {time, status}
  }
}
