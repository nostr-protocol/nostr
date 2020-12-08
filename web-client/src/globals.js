import Dexie from 'dexie'

export const db = new Dexie('db')

db.version(1).stores({
  // local personal settings and store
  relays: 'host',
  following: 'pubkey',
  mynotes: 'id, kind, created_at',
  publishlog: '[id+host]',

  // any special events from other people we may want to use later
  // like metadata or contactlists from others, for example
  // not simple notes or transient things
  events: 'id, pubkey, kind',

  // the set of local pet names and maybe other things we assign to others
  contactlist: 'pubkey'
})

if (localStorage.getItem('deleted') < '4') {
  db.delete().then(() => {
    localStorage.setItem('deleted', '4')
    location.reload()
  })
}

window.db = db
