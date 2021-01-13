# nostr - Notes and Other Stuff Transmitted by Relays

The most simple open protocol that is able to create a censorship-resistant global "social" network once and for all.

It doesn't rely on any trusted central server, hence it is resilient; it is based on cryptographic keys and signatures, so it is tamperproof; it does not rely on P2P techniques, therefore it works.

This is all a work-in-progress. [Join the Telegram group!](https://t.me/nostr_protocol)

## Very short summary of how this works, if you don't plan to read anything else:

Everybody runs a client, it can be a native client, a web client etc. To publish something you write a post, sign it with your key and send it to multiple relays (servers hosted by someone else, or you). To get updates from other people, you ask multiple relays if they know anything about these other people. Anyone can run a relay. A relay is very simple and dumb, it does nothing besides accepting posts from some people and forwarding to others. Relays don't have to be trusted, signatures are verified in the client side.

## This is needed because other solutions are broken:

### The problem with Twitter

- Twitter has ads;
- Twitter uses bizarre techniques to keep you addicted;
- Twitter doesn't show an actual historical feed from people you follow;
- Twitter bans people;
- Twitter shadowbans people.
- Twitter has a lot of spam.

### The problem with Mastodon and similar programs

- User identities are attached to domain names controlled by third-parties;
- Server owners can ban you, just like Twitter;
- Migration between servers is an afterthought and can only be accomplished if servers cooperate, doesn't work in an adversarial environment, all followers are lost;
- There's no clear incentive to run servers, therefore these tend to be run by enthusiasts and people who want to have their name attached by a cool domain, and then users are subject to the despotism of a single person, which is often worse than that of a big company like Twitter, and they can't migrate out;
- Since servers tend to be run amateurishly, they are often abandoned after a while -- which is effectively the same as banning everybody;
- It doesn't make sense to have a ton of servers if updates from every server will have to be painfully pushed (and saved!) to a ton of other servers, this point is exacerbated by the fact that servers tend to exist in huge numbers, therefore more data has to be passed to more places more times;
- For the specific example of video sharing, ActivityPub enthusiasts realized it would be completely impossible to transmit video from server to server the way text notes are, so they decided to keep the video hosted only from the single instance where it was posted to, which is similar to the Nostr approach.

### The problem with SSB (Secure Scuttlebutt)

- It doesn't have many problems, I think it's great, in fact I was going to use it as a basis for this, but
- its protocol is too complicated because it wasn't thought about being an open protocol at all, it was just written in JavaScript in probably a quick way to solve a specific problem and grew from that, therefore it has weird and unnecessary quirks like signing a JSON string which must strictly follow the rules of [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify);
- It insists on having a chain of updates from a single user, which feels unnecessary to me and something that adds bloat and rigidity to the thing -- each server/user needs to store all the chain of posts to be sure the new one is valid, why? (Maybe they have a good reason);
- It is not as simple as this one, as it was primarily made for p2p syncing, with "pubs" being an afterthought;
- Still, it may be worth considering using SSB instead of this custom protocol and just adapting it to the client-relay server model, just because reusing a standard is always better than trying to get people in the new one.

## How does Nostr work?

- There are two components: __clients__ and __relays__. Each user runs a client. Anyone can run a relay.
- Every user is identified by a public key. Every post is signed. Every client validates these signatures.
- Clients fetch data from relays of their choice and publish data to other relays of their choice. A relay doesn't talk to another relay, only directly to users.
- For example, to "follow" someone a user just instructs their client to query the relays it knows for posts from that public key.
- On startup, a client queries data from all relays it knows for all users it follows (for example, all updates from the last day), then displays that data to the user chronologically.
- A "post" can contain any kind of structured data, but the most used ones are going to find their way into the standard so all clients and relays can handle them seamlessly.

## How does it solve the problems the networks above can't?

- **Users getting banned and servers being closed**
  - A relay can block one user from publishing anything there, but that has no effect on them as they can still publish to other relays. Since users are identified by a public key they don't lose their identities and their follower base when they get banned.
  - Instead of requiring users to manually type new relay addresses (although this should also be supported), whenever someone you're following posts a server recommendation the client should automatically add that to the list of relays it will query.
  - If someone is using one relay to publish their data but wants to migrate to another one they can publish a server recommendation to that previous relay and go;
  - If someone gets banned from many relays such that they can't get their server recommendations broadcasted they may still let some closer friends know through other means in which relay they are publishing now, then these closer friends publish server recommendations to that new server and slowly the old follower base of the banned user will begin finding their posts again in the new relay.
  - All of the above is valid too for when a relay ceases its operations.

- **Censorship-resistance**
  - Each user can publish their updates to any number of relays.
  - A relay can charge a fee (the negotiation of that fee is outside of the protocol for now) from users to publish there, which ensures censorship-resistance (there will always be some Russian server willing to take your money in exchange for serving your posts).

- **Spam**
  - If spam is a concern for one relay, it can require payment for publication or some other form of authentication, such as an email address or phone, and associate these internally with a pubkey that then gets to publish to that relay -- or other antispam techniques, like hashcash or captchas. If one relay is being used as a spam vector it can be easily unlisted by clients, which can continue to fetch updates from other relays.

- **Data storage**
  - For the network to stay healthy there is no need for hundreds of active relays. In fact it can work just fine with just a handful, given the fact that new relays can be created and spreaded through the network easily in case the existing relays start misbehaving. Therefore the amount of data storage required in general is relatively smaller than in Mastodon and similar software.
  - Or considering a different outcome: one in which there exist hundreds of niche relays run by amateurs, each relaying updates from a small group of users, the architecture scales just as well: data is sent from users to a single server, and from that server directly to the users who will consume that. It doesn't have to be stored by anyone else. In this situation it is not a big burden for any single server to process updates from others and having amateur servers is not a problem.

- **Video and other heavy content**
  - It's easy for a relay to just reject large content, or to charge for accepting and hosting large content. When information and incentives are clear like this it's easy for the market forces to solve the problem.

- **Techniques to trick the user**
  - Each client can decide how to best show posts to users, so there is always the option of just consuming what you want in the manner you want -- from using an AI to decide the order of the updates you'll see to just reading them in chronological order.

## FAQ

- **This is very simple, why haven't anyone done it before?**

  I don't know, but I imagine it has to do with the fact that people making social networks are either companies wanting to make money or p2p activists who want to make a thing completely without servers, so they both fail to see the specific mix of both worlds Nostr uses.

- **Can I know how many people are following me?**

  No, but you can get some estimates if relays cooperate in an extra-protocol way.

### Checklist of good things and problems solved

- [x] The protocol is very simple
- [x] The basis of the protocol are fully specified
- [x] There are relay and client prototypes:
  - Web-based client: https://nostr-client.netlify.app/
  - Relays: `https://nostr-relay.bigsun.xyz`, `https://nostr.coinos.io`
- [ ] The system is being used in the wild
- [ ] The client prototype looks good
- [ ] Alternative implementations of client and relay exist
- [ ] A way for notes to prove themselves they existed at a certain date to clients (OpenTimestamps?)
- [ ] A way to do key revocation?
- [ ] A way to use pubkey aliases based on DNS names?
- [x] A way to use pubkey aliases based on petnames inside the protocol?

## Protocol specification

See the [NIPs](nips) and specially [NIP-01](nips/01.md) for a reasonably-detailed explanation of the protocol spec (hint: it is very small and simple).

## License

Public domain.
