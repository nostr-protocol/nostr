import Dexie from 'dexie'

export const db = new Dexie('db')

db.version(1).stores({
  settings: 'key', // as in key => value
  relays: 'host',
  following: 'pubkey',
  mynotes: 'id, kind, created_at',
  cachedmetadata: 'pubkey',
  publishlog: '++index, id',
  contactlist: 'pubkey'
})

if (localStorage.getItem('deleted') < '2') {
  db.delete().then(() => {
    localStorage.setItem('deleted', '2')
    location.reload()
  })
}
