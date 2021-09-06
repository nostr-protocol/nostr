NIP-XX
======

Proof of account protocol
-------------------------------

`draft` `mandatory`

1. Users can prove they own some accounts by publishing an event to the relays
`proof:<{pubkey}, {type}, {url}>`
- `{pubkey}` is a pubkey, as a hex string
- `{type}` is a string with a single letter, which can be:
  - "t" : for twitter
  - "g" : for github
- `{url}` is the url of the proof 

Example :
`proof:{"pubkey":"19f....5dg", "type":"t", "url":"https://twitter.com/xxx/status/xxxxxxx"}`

2. Relay store the proof. 

3. Relay send back the result to the client. Client has to validate the proof.

Proof content :
TODO
