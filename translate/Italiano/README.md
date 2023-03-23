# nostr - Note e Altre Cose Trasmesse dai Relay
> Notes and Other Stuff Transmitted by Relays

Il protocollo aperto più semplice in grado di creare una volta per tutte una rete "sociale" globale resistente alla censura.

Non si basa su alcun server centrale di fiducia, quindi è resiliente; si basa su chiavi e firme crittografiche, quindi è a prova di manomissione; non si basa su tecniche P2P e quindi funziona.

Questo è un lavoro in corso. [Unisciti al gruppo Telegram!](https://t.me/nostr_protocol)

## Breve riassunto di come funziona, se non hai intenzione di leggere altro:

Tutti eseguono un client. Può essere un client nativo, un client web, ecc. Per pubblicare qualcosa, scrivi un post, firmalo con la tua chiave e invialo a più relay (server ospitati da qualcun altro o da te stesso). Per ricevere aggiornamenti da altre persone, chiedi a più relay se sanno qualcosa su queste altre persone. Chiunque può eseguire un relay. Un relay è molto semplice e stupido. Non fa altro che accettare post da alcune persone e inoltrarli ad altre. I relay non devono essere di fiducia. Le firme vengono verificate sul lato client.

[Cosa fare per iniziare a utilizzare Nostr](https://github.com/vishalxl/nostr_console/discussions/31)

[Confronto delle funzionalità dei client Nostr](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[Elenco dei progetti basati su Nostr](https://github.com/aljazceru/awesome-nostr)

## Questo è necessario perché altre soluzioni sono difettose:

### Il problema con Twitter

- Twitter ha pubblicità;
- Twitter utilizza tecniche bizzarre per mantenerti dipendente;
- Twitter non mostra un feed storico effettivo delle persone che segui;
- Twitter banna le persone;
- Twitter mette in shadowban le persone;
- Twitter ha molto spam.

### Il problema con Mastodon e programmi simili

- Le identità degli utenti sono legate a nomi di dominio controllati da terze parti;
- I proprietari dei server possono bannarti, proprio come Twitter; i proprietari dei server possono anche bloccare altri server;
- La migrazione tra server è un'aggiunta tardiva e può essere realizzata solo se i server cooperano. Non funziona in un ambiente ostile (tutti i follower vengono persi);
- Non ci sono incentivi chiari per gestire i server, quindi, tendono ad essere gestiti da appassionati e persone che vogliono avere il loro nome associato a un dominio interessante. Quindi, gli utenti sono soggetti al dispotismo di una singola persona, che spesso è peggiore di quello di una grande azienda come Twitter, e non possono migrare;
- Poiché i server tendono ad essere gestiti in modo dilettantesco, spesso vengono abbandonati dopo un po' - il che è effettivamente lo stesso che bannare tutti;
- Non ha senso avere un'enorme quantità di server se gli aggiornamenti da ogni server dovranno essere spinti (e salvati!) dolorosamente su un'enorme quantità di altri server. Questo punto è aggravato dal fatto che i server tendono ad esistere in grandi numeri, quindi più dati devono essere trasmessi a più luoghi più spesso;
- Per l'esempio specifico della condivisione di video, gli appassionati di ActivityPub si sono resi conto che sarebbe stato completamente impossibile trasmettere video da server a server come si fa con le note di testo, quindi hanno deciso di mantenere il video ospitato solo dall'istanza singola in cui è stato pubblicato, il che è simile all'approccio di Nostr.

