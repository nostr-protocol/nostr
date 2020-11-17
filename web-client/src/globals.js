import Dexie from 'dexie'

export const db = new Dexie('db')

db.version(1).stores({
  settings: 'key', // as in key => value
  relays: 'host',
  following: 'pubkey',
  mynotes: 'id, kind, created_at',
  cachedmetadata: 'pubkey',
  publishlog: '++index, id'
})

if (!localStorage.getItem('deleted')) {
  db.delete().then(() => {
    localStorage.setItem('deleted', '1')
    location.reload()
  })
}
