export function verifySignature(evt) {
  return true // TODO
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
