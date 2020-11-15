# nostr - Notes and Other Stuff Transmitted by Relays

This is a prototype of the most simple open protocol that is able to create an open censorship-resistant global "social" network once and for all.

## This is needed because other solutions are broken:

### The problem with Twitter

- Twitter has ads;
- Twitter uses bizarre techniques to keep you addicted;
- Twitter doesn't show an actual historical feed from people you follow;
- Twitter bans people;
- Twitter shadowbans people.

### The problem with Mastodon and similar programs

- Server owners can ban you, just like Twitter;
- It doesn't make sense to have a ton of servers if updates from every server will have to be painfully pushed (and saved!) to a ton of other servers;
- It has no clear incentive and funding model.

### The problem with SSB (Secure Scuttlebutt)

- It doesn't have many problems, I think it's great, in fact I was going to use it as a basis for this, but
- its protocol is too complicated because it wasn't thought about being an open protocol at all, it was just written in JavaScript in probably a quick way to solve a specific problem and grew from that, therefore it has weird and unnecessary quirks like signing a JSON string which must strictly follow the rules of [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify);
- It insists on having a chain of updates from a single user, which feels unnecessary to me and something that adds bloat and rigidity to the thing (but maybe they have a good reason);
- It doesn't use `secp256k1`;
- It is not as simple as this one, as it was primarily made for p2p syncing, with "pubs" being an afterthought;
- Still, it may be worth considering using SSB instead of this custom protocol and just adapting it to the client-relay server model, just because reusing a standard is always better than trying to get people in the new one.

## How does this work?

- There are two components: __clients__ and __relays__. Each user runs a client. Anyone can run a relay.
- Every user is identified by a public key. Every post is signed. Every client validates these signatures.
- Clients fetch data from relays of their choice and publish data to other relays of their choice.
- For example, to "follow" someone a user just instructs their client to query the relays it knows for posts from that public key.
- On startup, a client queries data from all relays it knows for all users it follows (for example, all updates from the last day), then displays that data to the user chronologically.
- A relay can block one user from publishing anything there, but that has no effect on them as they can still publish to other relays. Since users are identified by a public key they don't lose their identities and their follower base when they get banned.
- A relay can charge a fee (the negotiation of that fee is outside of the protocol for now) from users to publish there, which ensures censorship-resistance (there will always be some Russian server willing to take your money in exchange for serving your posts).
- A "post" can contain any kind of data. Initially there are 3 kinds of data that can be posted:
  1. Updates to their own metadata (profile pictures, "about me" descriptions etc.), clients should try to fetch and display the latest version of these;
  2. Text notes;
  3. Server recommendations;
- Server recommendations are a way to prevent the network from shrinking to a cartel of 2 or 3 trusted relays, as these would rapidly become the new Twitter and start banning people.
  - Instead of requiring users to manually type new relay addresses (although this should also be supported), whenever someone you're following posts a server recommendation the client should automatically add that to the list of relays it will query.
  - If someone is using one relay to publish their data but wants to migrate to another one they can publish a server recommendation to that previous relay and go;
  - If someone gets banned from many relays they may let some closer friends know through other means in which relay server they are publishing now, then these closer friends publish server recommendations to that new server and slowly the old follower base of the banned user will begin finding their posts again in the new relay.

### Checklist of good things and problems solved

- [x] People can't be banned
- [x] There is incentive for running infrastructure
- [x] People can't be shadowbanned
- [x] No one will try to get you addicted or game you
- [x] It scales infinitely
- [x] The protocol is very simple simple
- [ ] It has been tested in the wild
- [ ] The protocol has a good name
- [ ] Using public keys as the primary identification method works because we have ways to alias them to readable names
- [-] The server recommendation thing works as good as envisaged
- [ ] A decent way to upload old notes to a new server that doesn't trigger date mismatch error
- [ ] A way for notes to prove themselves they existed at a certain date to clients (OpenTimestamps?)

### Expected differences from the Twitter experience

- It's not possible to know how many people are following you, although estimations can be done
- You may have to pay
- Data will always be only "eventually consistent" (or sometimes not consistent at all)
- ...

## License

Public domain.
