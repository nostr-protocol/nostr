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

### Il problema con SSB (Secure Scuttlebutt)

- Non ha molti problemi. Penso che sia fantastico. Stavo per usarlo come base per questo, ma
- il suo protocollo è troppo complicato perché non è stato pensato affatto come un protocollo aperto. È stato scritto in JavaScript probabilmente in modo veloce per risolvere un problema specifico e si è sviluppato da lì, quindi ha stranezze e peculiarità inutili come la firma di una stringa JSON che deve seguire rigorosamente le regole del [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify);
- Insiste sull'avere una catena di aggiornamenti da un singolo utente, il che mi sembra superfluo e qualcosa che aggiunge gonfiore e rigidità alla cosa - ogni server/utente deve memorizzare tutta la catena di post per essere sicuro che il nuovo sia valido. Perché? (Forse hanno una buona ragione);
- Non è semplice come Nostr, in quanto è stato creato principalmente per la sincronizzazione P2P, con i "pub" come un'aggiunta successiva;
- Tuttavia, potrebbe valere la pena considerare l'utilizzo di SSB invece di questo protocollo personalizzato e adattarlo semplicemente al modello client-relay server, perché riutilizzare uno standard è sempre meglio che cercare di far aderire le persone a uno nuovo.

### Il problema con altre soluzioni che richiedono a tutti di gestire il proprio server

- Richiedono a tutti di gestire il proprio server;
- A volte le persone possono comunque essere censurate in queste perché i nomi di dominio possono essere censurati.

## Come funziona Nostr?

- Ci sono due componenti: __client__ e __relay__. Ogni utente esegue un client. Chiunque può eseguire un relay.
- Ogni utente è identificato da una chiave pubblica. Ogni post è firmato. Ogni client convalida queste firme.
- I client ottengono dati dai relay a loro scelta e pubblicano dati su altri relay a loro scelta. Un relay non comunica con un altro relay, solo direttamente con gli utenti.
- Ad esempio, per "seguire" qualcuno, un utente dà semplicemente istruzioni al proprio client di interrogare i relay che conosce per i post di quella chiave pubblica.
- All'avvio, un client interroga i dati da tutti i relay che conosce per tutti gli utenti che segue (ad esempio, tutti gli aggiornamenti dell'ultimo giorno), quindi visualizza tali dati all'utente in ordine cronologico.
- Un "post" può contenere qualsiasi tipo di dati strutturati, ma quelli più utilizzati troveranno il loro posto nello standard in modo che tutti i client e i relay possano gestirli senza problemi.

## Come risolve i problemi che le reti sopra non riescono a risolvere?

- **Utenti bannati e chiusura dei server**
  - Un relay può bloccare un utente dall'inviare qualsiasi cosa lì, ma ciò non ha effetto su di loro in quanto possono ancora pubblicare su altri relay. Poiché gli utenti sono identificati da una chiave pubblica, non perdono le loro identità e la base di follower quando vengono bannati.
  - Invece di richiedere agli utenti di digitare manualmente nuovi indirizzi relay (anche se ciò dovrebbe essere supportato), ogni volta che qualcuno che segui pubblica una raccomandazione di server, il client dovrebbe aggiungere automaticamente quella alla lista dei relay che interrogherà.
  - Se qualcuno sta utilizzando un relay per pubblicare i propri dati ma desidera migrare su un altro, può pubblicare una raccomandazione del server su quel relay precedente e andarsene;
  - Se qualcuno viene bannato da molti relay in modo tale da non poter trasmettere le loro raccomandazioni di server, può comunque far sapere ad alcuni amici stretti tramite altri mezzi con quale relay sta pubblicando ora. Quindi, questi amici stretti possono pubblicare raccomandazioni di server su quel nuovo server e, lentamente, la vecchia base di follower dell'utente bannato inizierà a trovare di nuovo i loro post dal nuovo relay.
  - Tutto quanto sopra è valido anche quando un relay cessa le sue operazioni.

- **Resistenza alla censura**
  - Ogni utente può pubblicare i propri aggiornamenti su un qualsiasi numero di relay.
  - Un relay può richiedere una tariffa (la negoziazione di tale tariffa è al di fuori del protocollo per ora) agli utenti per pubblicare lì, il che garantisce la resistenza alla censura (ci sarà sempre qualche server russo disposto a prendere i tuoi soldi in cambio della pubblicazione dei tuoi post).

- **Spam**
  - Se lo spam è una preoccupazione per un relay, può richiedere un pagamento per la pubblicazione o un'altra forma di autenticazione, come un indirizzo e-mail o telefono, e associare internamente questi ad una pubkey che poi ottiene la pubblicazione su quel relay - o altre tecniche anti-spam, come hashcash o captcha. Se un relay viene utilizzato come vettore di spam, può essere facilmente eliminato dai client, che possono continuare a recuperare aggiornamenti da altri relay.

- **Archiviazione dati**
  - Perché la rete rimanga in salute, non è necessario avere centinaia di relay attivi. Infatti, può funzionare benissimo con solo una manciata, dato il fatto che nuovi relay possono essere creati e diffusi attraverso la rete facilmente nel caso in cui i relay esistenti inizino a comportarsi male. Pertanto, la quantità di archiviazione dati richiesta, in generale, è relativamente inferiore rispetto a Mastodon o software simili.
  - Oppure considerando un risultato diverso: uno in cui esistono centinaia di relay di nicchia gestiti da dilettanti, ognuno che trasmette aggiornamenti da un piccolo gruppo di utenti. L'architettura scala altrettanto bene: i dati vengono inviati dagli utenti a un singolo server e da quel server direttamente agli utenti che li consumeranno. Non deve essere memorizzato da nessun altro. In questa situazione, non è un grosso peso per un singolo server elaborare aggiornamenti da altri, e avere server amatoriali non è un problema.

- **Video e altri contenuti pesanti**
  - È facile per un relay rifiutare contenuti di grandi dimensioni o addebitare una tariffa per accettare e ospitare contenuti di grandi dimensioni. Quando le informazioni e gli incentivi sono chiari, è facile per le forze di mercato risolvere il problema.

- **Tecniche per ingannare l'utente**
  - Ogni client può decidere come mostrare al meglio i post agli utenti, quindi c'è sempre l'opzione di consumare ciò che si desidera nel modo desiderato - dall'utilizzare un'intelligenza artificiale per decidere l'ordine degli aggiornamenti che vedrai al semplice leggerli in ordine cronologico.

## FAQ

- **Questo è molto semplice. Perché nessuno l'ha fatto prima?**

  Non lo so, ma immagino che abbia a che fare con il fatto che le persone che creano reti sociali sono o aziende che vogliono fare soldi o attivisti P2P che vogliono realizzare qualcosa completamente senza server. Entrambi non riescono a vedere la specifica combinazione di entrambi i mondi che Nostr utilizza.

- **Come faccio a trovare persone da seguire?**

  Innanzitutto, devi conoscerle e ottenere in qualche modo la loro chiave pubblica, sia chiedendola sia vedendola citata da qualche parte. Una volta che sei all'interno di una rete sociale Nostr, potrai vederle interagire con altre persone e quindi potrai anche iniziare a seguire e interagire con queste altre.

- **Come faccio a trovare i relay? Cosa succede se non sono connesso agli stessi relay di qualcun altro?**

  Non sarai in grado di comunicare con quella persona. Ma ci sono suggerimenti sugli eventi che possono essere utilizzati in modo che il tuo software client (o tu, manualmente) sappia come connettersi al relay dell'altra persona e interagire con loro. Ci sono altre idee su come risolvere questo problema anche in futuro, ma non possiamo mai promettere una raggiungibilità perfetta, nessun protocollo può.

- **Posso sapere quante persone mi stanno seguendo?**

  No, ma puoi avere delle stime se i relay cooperano in un modo extra-protocollo.

- **Qual è l'incentivo per le persone a gestire i relay?**

  La domanda è fuorviante. Presuppone che i relay siano tubi stupidi gratuiti che esistono in modo che le persone possano spostare i dati attraverso di essi. In questo caso sì, gli incentivi non esisterebbero. Questo, infatti, potrebbe essere detto dei nodi DHT in tutte le altre pile di reti p2p: qual è l'incentivo per le persone a gestire i nodi DHT?

- **Nostr ti permette di spostarti tra i relay server o utilizzare più relay, ma se questi relay sono solo su AWS o Azure qual è la differenza?**

  Ci sono letteralmente migliaia di fornitori di VPS sparsi in tutto il mondo oggi, non ci sono solo AWS o Azure. AWS o Azure sono esattamente i fornitori utilizzati dai singoli fornitori di servizi centralizzati che necessitano di molta scalabilità e, anche in questo caso, non solo questi due. Per i relay server più piccoli, qualsiasi VPS farà molto bene il lavoro.

## Specifiche del protocollo

Consulta le [NIPs](https://github.com/nostr-protocol/nips) e in particolare [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) per una spiegazione ragionevolmente dettagliata delle specifiche del protocollo (suggerimento: è molto breve e semplice).

## Software

C'è una lista della maggior parte del software in costruzione usando Nostr su https://github.com/aljazceru/awesome-nostr che sembrava essere quasi completa l'ultima volta che ho guardato.

## Licenza

Pubblico dominio.
