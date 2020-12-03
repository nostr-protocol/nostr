import shajs from 'sha.js'
import BigInteger from 'bigi'
import schnorr from 'bip-schnorr'

import {db} from './globals'

export function makeRandom32() {
  var array = new Uint32Array(32)
  window.crypto.getRandomValues(array)
  return Buffer.from(array)
}

export function pubkeyFromPrivate(privateHex) {
  return schnorr.convert
    .pubKeyFromPrivate(new BigInteger(privateHex, 16))
    .toString('hex')
}

export function verifySignature(evt) {
  try {
    schnorr.verify(
      Buffer.from(evt.pubkey, 'hex'),
      Buffer.from(evt.id, 'hex'),
      Buffer.from(evt.sig, 'hex')
    )
    return true
  } catch (err) {
    return false
  }
}

export async function publishEvent(evt, key, hosts) {
  let hash = shajs('sha256').update(serializeEvent(evt)).digest()
  evt.id = hash.toString('hex')

  evt.sig = schnorr
    .sign(new BigInteger(key, 16), hash, makeRandom32())
    .toString('hex')

  return await broadcastEvent(evt, hosts)
}

export function broadcastEvent(evt, hosts) {
  hosts.forEach(async host => {
    if (host.length && host[host.length - 1] === '/') host = host.slice(0, -1)

    let publishLogEntry = {
      id: evt.id,
      time: evt.created_at,
      host
    }

    try {
      let r = await window.fetch(host + '/save_event', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(evt)
      })
      if (!r.ok) throw new Error('error publishing')

      db.publishlog.put({...publishLogEntry, status: 'succeeded'})
    } catch (err) {
      console.log(`failed to publish ${evt} to ${host}`)
      db.publishlog.put({...publishLogEntry, status: 'failed'})
    }
  })

  return evt
}

export function serializeEvent(evt) {
  let version = Buffer.alloc(1)
  version.writeUInt8(0)

  let pubkey = Buffer.from(evt.pubkey, 'hex')

  let time = Buffer.alloc(4)
  time.writeUInt32BE(evt.created_at)

  let kind = Buffer.alloc(1)
  kind.writeUInt8(evt.kind)

  let reference = Buffer.alloc(0)
  if (evt.ref) {
    reference = Buffer.from(evt.ref, 'hex')
  }

  let content = Buffer.from(evt.content)

  return Buffer.concat([version, pubkey, time, kind, reference, content])
}
