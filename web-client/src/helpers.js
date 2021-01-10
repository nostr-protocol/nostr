import {db} from './db'

export async function overwriteEvent(conditions, event) {
  let events = await db.events.where(conditions).toArray()

  for (let i = 0; i < events.length; i++) {
    // only save if it's newer than what we have
    let evt = events[i]
    if (evt.created_at > event.created_at) {
      // we found a newer one
      return true
    }

    // this is older, delete it
    db.events.delete(evt.id)
  }

  // we didn't find a newer one
  await db.events.put(event)

  return false
}

export function parsePolicy(rw) {
  var policy = {}
  if (rw.indexOf('r') !== -1) policy.read = true
  if (rw.indexOf('w') !== -1) policy.write = true
  return policy
}
