import shajs from 'sha.js'

import {ec} from './globals'

export function verifySignature(evt) {
  return true // TODO
}

export function publishEvent(evt, key, hosts) {
  let hash = shajs('sha256').update(serializeEvent(evt)).digest()
  evt.id = hash.toString('hex')

  evt.sig = ec
    .keyFromPrivate(key, 'hex')
    .sign(hash, {canonical: true})
    .toDER('hex')

  for (let i = 0; i < hosts.length; i++) {
    let host = hosts[i]
    if (host.length && host[host.length - 1] === '/') host = host.slice(0, -1)
    window
      .fetch(host + '/save_update', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(evt)
      })
      .then(r => {
        if (!r.ok) console.log(`failed to publish ${evt} to ${host}`)
      })
  }

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
