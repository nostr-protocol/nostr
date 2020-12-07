// vuex store mutations

import {pubkeyFromPrivate} from './helpers'
import {db} from './globals'
import {CONTEXT_REQUESTED, CONTEXT_NOW, CONTEXT_PAST} from './constants'

export default {
  setInit(state, {relays, following, home, metadata, petnames}) {
    state.relays = relays
    state.following = following.concat(
      // always be following thyself
      pubkeyFromPrivate(state.key)
    )
    state.home = home
    for (let key in metadata) {
      state.metadata.set(key, metadata[key])
    }
    state.petnames = petnames
  },
  gotEventSource(state) {
    state.haveEventSource.resolve()
  },
  setSecretKey(state, newKey) {
    state.key = newKey
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
  savePetName(state, {pubkey, name}) {
    state.petnames[pubkey] = name
    db.contactlist.put({pubkey, name})
  },
  receivedSetMetadata(state, {event, context}) {
    let meta = JSON.parse(event.content)
    let storeable = {
      pubkey: event.pubkey,
      time: event.created_at,
      meta
    }

    if (context === CONTEXT_REQUESTED) {
      // just someone we're viewing
      if (!state.metadata.has(event.pubkey)) {
        state.metadata.set(event.pubkey, meta)
      }
    } else if (context === CONTEXT_NOW) {
      // an update from someone we follow that happened just now
      state.metadata.set(event.pubkey, meta)
      db.cachedmetadata.put(storeable)
    } else if (context === CONTEXT_PAST) {
      // someone we follow, but an old update
      db.cachedmetadata.get(event.pubkey).then(data => {
        // only save if it's newer than what we have
        if (!data || data.time < storeable.time) {
          state.metadata.set(event.pubkey, meta)
          db.cachedmetadata.put(storeable)
        }
      })
    }
  },
  receivedTextNote(state, {event: evt, context}) {
    // all notes go to browsing
    state.browsing.set(evt.id.slice(0, 5), evt)
    state.browsing.set('from:' + evt.pubkey.slice(0, 5), evt)
    if (evt.ref && evt.ref.length) {
      state.browsing.set(
        'rel:' + evt.ref.slice(0, 5) + ':' + evt.id.slice(0, 5),
        evt
      )
    }

    // only past and happening notes go to the main feed
    if (context !== CONTEXT_REQUESTED) {
      state.home.set(evt.id + ':' + evt.created_at, evt)
    }
  },
  saveMyOwnNote() {},
  updatePublishStatus(state, {id, time, host, status}) {
    state.publishStatus = {
      ...state.publishStatus,
      [id]: {...(state.publishStatus[id] || {}), [host]: {time, status}}
    }
  }
}
