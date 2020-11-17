import Dexie from 'dexie'

export const db = new Dexie('db')

db.version(1).stores({
  settings: 'key', // as in key => value
  relays: 'host',
  following: 'pubkey',
  mynotes: 'id, kind, created_at',
  cachedmetadata: 'pubkey'
})
