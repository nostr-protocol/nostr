NIP-nn
======
Web App creation, deployment and retrieval
------------------------------------------

`draft` `optional`

This proposal specifies necessary kinds and tags for hosting web applications on the nostr network.  Currently nostr is designed for content, but taking advantage of its flexibility, it could be possible to make a truly distributed web3.0 a reality.  A current web app lives on servers owned by a single central entity.  nostr being a global data store with client side publishing, the additional usage as a global host opens up new possibilities.

Two new kinds, xx, and yy are specified to represent a `webapp_register`, and `webapp_deploy`.  Creating a `webapp` is a two step process.

### Step 1 - register the app

event type: `webapp_register`

Registering an app will provide a unique id allowing future deployments(step 2) to be referenced by the fixed id.

```
{
  id, pubkey, created_at, sig: <per NIP-01>,
  kind: xx TBD,
  tags: [TBD]
  content: <app name and/or description>,
}
 ```

### Step 2 - deploy the app

event type: `webapp_deploy`


```
{
  id, pubkey, created_at, sig: <per NIP-01>,
  kind: yy TBD,
  tags: [
    ["c", "<id from step 1>", "<code to deploy>"]
  ]
  content: <N/A>,
}
```

`c` tag stands for code.  The code is full inline HTML that can be loaded into a client with web capabilities ex. browser, electron etc.

Similar to `set_metadata`, a relay should return the most recent `webapp_deploy`.  A relay may delete previous `webapp_deploy` events when a new on is received.

A relay should only accept a `webapp_deploy` event from the `pubkey` from the `webapp_register` event.

### Retrieving a webapp

A `webapp` client would be a "nostr browser" that would handle the loading and running of apps by `id` similar to how a web browser does this by `url`.  Any `webapp` client can retrieve the app with the standard `req-event` message providing the `id` from step 1.  Since the response to the client will include the related `webapp_deploy` event, the client can grab and execute the code from this ignoring the `webapp_register` event.  Client to app interoperability would need to be specified in a future NIP.

### Caveats

* Restricting deployment to a single `pubkey` could lead to a single point of disruption, the app would live on but updates would be halted.  It may be beneficial to create another NIP that would allow the app owner to assign maintainers that can also deploy.
* Further research is needed to determine how well this will scale
* Inline HTML seems to work in initial small scale hand coded tests, not sure if any current tooling has this as an option.
* A relay could be offline and miss a `webapp_deploy` event and serve stale data in addition to a relay with current data, requiring additional burden on client developers to determine the most recent.