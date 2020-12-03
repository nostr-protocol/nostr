import Dexie from 'dexie'

export const db = new Dexie('db')

db.version(1).stores({
  relays: 'host',
  following: 'pubkey',
  mynotes: 'id, kind, created_at',
  cachedmetadata: 'pubkey',
  publishlog: '[id+host]',
  contactlist: 'pubkey'
})

if (localStorage.getItem('deleted') < '3') {
  db.delete().then(() => {
    localStorage.setItem('deleted', '3')
    location.reload()
  })
}

window.db = db
