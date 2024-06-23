# Nostr - Notes and Other Stuff Transmitted by Relays

The simplest open protocol that is able to create a censorship-resistant global "social" network once and for all.

It doesn't rely on any trusted central server, hence it is resilient; it is based on cryptographic keys and signatures, so it is tamperproof; it does not rely on P2P techniques, and therefore it works.

The initial description of the idea can be found at https://fiatjaf.com/nostr.html.

There are multiple websites, articles and video explanations about Nostr around the internet. You can find some of them linked from https://nostr.com/, https://njump.me/ or https://nostr.how.

## How it works

It's a very simple idea: each person can publish their notes to multiple relays (which are just simple servers), and people who follow them can connect to these relays and fetch the notes. The protocol just defines the messages that can be sent between clients and relays in order to publish and fetch the content they want.

![](https://the-nostr.org/diagram.jpg)

These relays can be hosted by anyone and have any rule or internal policy they want. The fact that the protocol is open makes it so that, as long as there is any relay willing to host someone, they can still publish their stuff for their followers, and the followers can find their stuff in that relay.

Relays can also lie about data published by others, but to ensure that isn't a problem, public-key cryptography is used and every note is signed. When you follow someone you're actually following their public key and clients will check notes received from relays to ensure they were properly signed.

The hardest part is how to find in which relay you will find notes of each people you follow, since they can be anywhere, but it's not an unsolvable problem. There are multiple heuristics currently being used to approach this by different clients and new ones can always be added.

## Protocol specification

See the [NIPs](https://github.com/nostr-protocol/nips) and especially [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) for a reasonably-detailed explanation of the protocol spec, it's very small.

## Software

A very big and daunting list of clients and libraries for all platforms and languages imaginable can be found at https://nostr.net/.

## License

Public domain.
