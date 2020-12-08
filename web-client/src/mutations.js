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
  savePetName(state, payload) {
    state.petnames[payload.pubkey] = state.petnames[payload.pubkey] || []
    // maybe stop here if we already have enough names for <payload.pubkey>?
    if (state.petnames[payload.pubkey].length > 4) {
      return
    }

    if (payload.name.length === 2) {
      // this is a hierarchy of type [<name>, <author-pubkey>]
      if (payload.name[1] in state.petnames) {
        // if we have any names for <author-pubkey>, replace them here
        state.petnames[payload.name[1]].forEach(supername => {
          state.petnames[payload.pubkey].push([payload.name[0], ...supername])
        })

        // and keep all references to [<name>, <replaced-hierarchy>]?
        // maybe keeping just some is better?
        state.petnames[payload.pubkey].sort((a, b) => a.length - b.length)
        state.petnames = state.petnames.slice(0, 5)
      } else {
        // otherwise save this in raw form
        state.petnames[payload.pubkey].push(payload.name)
      }
    } else if (payload.name.length === 1) {
      // also save this in raw form if it's a single thing
      state.petnames[payload.pubkey].push(payload.name)
    }

    // now search all our other names for any that uses <payload.pubkey>
    for (let pubkey in state.petnames) {
      if (pubkey === payload.pubkey) continue

      let names = state.petnames[pubkey]
      for (let i = 0; i < names.length; i++) {
        let name = names[i]
        if (name[name.length - 1] === payload.pubkey) {
          // found one, replace it with the name we just got
          names[i] = name.slice(0, -1).concat(payload.name)
        }
      }
    }

    // print this mess
    console.log(state.petnames)
  },
  receivedSetMetadata(state, {event, context}) {
    try {
      let meta = JSON.parse(event.content)
      state.metadata.set(event.pubkey, meta)
    } catch (err) {}
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
