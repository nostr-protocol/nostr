import {createStore, createLogger} from 'vuex'
import BoxCrate from 'boxcrate'
import elliptic from 'elliptic'
import shajs from 'sha.js'

const boxcrate = new BoxCrate({
  expiredCheckType: 'active',
  expiredCheckInterval: 60000
})
const ec = new elliptic.ec('secp256k1')

export default createStore({
  plugins: process.env.NODE_ENV !== 'production' ? [createLogger()] : [],
  state() {
    var relays = {
      'http://0.0.0.0:7447': 'rw'
    }

    var key = null
    let following = []

    relays = boxcrate.storage.getItem('relays') || relays
    key = boxcrate.storage.getItem('key') || key
    following = boxcrate.storage.getItem('following') || following

    // generate key if doesn't exist
    if (key) key = ec.keyFromPrivate(key, 'hex')
    else {
      key = ec.genKeyPair()
      boxcrate.storage.setItem('key', key.getPrivate('hex'))
    }

    return {
      relays,
      key,
      following
    }
  },
  getters: {
    privKeyHex: state => state.key.getPrivate('hex'),
    pubKeyHex: state => state.key.getPublic(true, 'hex'),
    writeServers: state =>
      Object.keys(state.relays).filter(
        host => state.relays[host].indexOf('w') !== -1
      ),
    readServers: state =>
      Object.keys(state.relays).filter(
        host => state.relays[host].indexOf('r') !== -1
      )
  },
  mutations: {},
  actions: {
    publishNote(store, text) {
      let evt = {
        pubkey: store.getters.pubKeyHex,
        time: Math.round(new Date().getTime() / 1000),
        kind: 1,
        content: text
      }

      let hash = shajs('sha256').update(serializeEvent(evt)).digest()
      evt.id = hash.toString('hex')
      evt.signature = store.state.key.sign(hash).toDER('hex')

      for (let i = 0; i < store.getters.writeServers.length; i++) {
        let host = store.getters.writeServers[i]
        window.fetch(host + '/save_update', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify(evt)
        })
      }
    }
  }
})

function serializeEvent(evt) {
  let version = Buffer.alloc(1)
  version.writeUInt8(0)

  let pubkey = Buffer.from(evt.pubkey, 'hex')

  let time = Buffer.alloc(4)
  time.writeUInt32BE(evt.time)

  let kind = Buffer.alloc(1)
  kind.writeUInt8(kind)

  let reference = Buffer.alloc(0)
  if (evt.reference) {
    reference = Buffer.from(evt.reference, 'hex')
  }

  let content = Buffer.from(evt.content)

  return Buffer.concat([version, pubkey, time, kind, reference, content])
}
