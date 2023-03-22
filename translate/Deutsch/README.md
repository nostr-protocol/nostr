# nostr - Notizen und Anderes Zeug, Übertragen durch Relais
> Notes and Other Stuff Transmitted by Relays

Das einfachste offene Protokoll, das in der Lage ist, ein zensurresistentes globales "soziales" Netzwerk ein für allemal zu erschaffen.

Es stützt sich nicht auf einen vertrauenswürdigen zentralen Server, daher ist es belastbar; es basiert auf kryptographischen Schlüsseln und Signaturen, daher ist es manipulationssicher; es verlässt sich nicht auf P2P-Techniken, und deshalb funktioniert es.

Dies ist eine laufende Arbeit. [Tritt der Telegram-Gruppe bei!](https://t.me/nostr_protocol)

## Sehr kurze Zusammenfassung, wie es funktioniert, falls du nichts anderes lesen möchtest:

Jeder führt einen Client aus. Es kann ein nativer Client, ein Web-Client usw. sein. Um etwas zu veröffentlichen, schreibst du einen Beitrag, signierst ihn mit deinem Schlüssel und sendest ihn an mehrere Relais (Server, die von jemand anderem oder dir selbst gehostet werden). Um Updates von anderen Personen zu erhalten, fragst du mehrere Relais, ob sie etwas über diese anderen Personen wissen. Jeder kann ein Relais betreiben. Ein Relais ist sehr einfach und dumm. Es macht nichts anderes, als Beiträge von einigen Personen zu akzeptieren und an andere weiterzuleiten. Relais müssen nicht vertrauenswürdig sein. Signaturen werden auf der Client-Seite überprüft.

[Wie man Nostr verwendet](https://github.com/vishalxl/nostr_console/discussions/31)

[Nostr-Client-Funktionsvergleich](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[Liste der Projekte, die auf Nostr aufbauen](https://github.com/aljazceru/awesome-nostr)

## Dies ist notwendig, weil andere Lösungen nicht funktionieren:

### Das Problem mit Twitter

- Twitter hat Werbung;
- Twitter verwendet bizarre Techniken, um dich süchtig zu halten;
- Twitter zeigt keinen tatsächlichen chronologischen Feed von Personen, denen du folgst;
- Twitter sperrt Personen;
- Twitter schattensperrt Personen;
- Twitter hat viel Spam.

### Das Problem mit Mastodon und ähnlichen Programmen

- Benutzeridentitäten sind an Domainnamen gebunden, die von Dritten kontrolliert werden;
- Serverbesitzer können dich sperren, genau wie bei Twitter; Serverbesitzer können auch andere Server blockieren;
- Die Migration zwischen Servern ist ein nachträglicher Gedanke und kann nur erreicht werden, wenn die Server zusammenarbeiten. Es funktioniert nicht in einer feindlichen Umgebung (alle Follower gehen verloren);
- Es gibt keine klaren Anreize, Server zu betreiben, daher werden sie oft von Enthusiasten und Menschen betrieben, die ihren Namen mit einer coolen Domain verbinden wollen. Dann sind die Benutzer dem Despotismus einer einzelnen Person ausgesetzt, der oft schlimmer ist als der eines großen Unternehmens wie Twitter, und sie können nicht auswandern;
- Da die Server oft laienhaft betrieben werden, werden sie nach einer Weile häufig aufgegeben - was faktisch einer Sperrung aller Benutzer gleichkommt;
- Es macht keinen Sinn, eine Unmenge von Servern zu haben, wenn Updates von jedem Server mühsam an eine Unmenge anderer Server gepusht (und gespeichert!) werden müssen. Dieser Punkt wird verschärft durch die Tatsache, dass Server in großen Mengen vorhanden sind, daher müssen mehr Daten häufiger an mehr Orte übertragen werden;
- Im speziellen Beispiel der Videofreigabe erkannten die ActivityPub-Enthusiasten, dass es völlig unmöglich wäre, Videos von Server zu Server zu übertragen, wie es bei Textnotizen der Fall ist. Daher beschlossen sie, das Video nur von der einzelnen Instanz zu hosten, auf der es veröffentlicht wurde, was dem Nostr-Ansatz ähnelt.

### Das Problem mit SSB (Secure Scuttlebutt)

- Es hat nicht viele Probleme. Ich finde es großartig. Ich wollte es als Basis dafür verwenden, aber
- das Protokoll ist zu kompliziert, weil es gar nicht als offenes Protokoll gedacht war. Es wurde einfach in JavaScript geschrieben, wahrscheinlich um schnell ein spezifisches Problem zu lösen, und wuchs von dort aus. Daher hat es seltsame und unnötige Eigenheiten wie das Signieren eines JSON-Strings, der streng den Regeln von [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify) folgen muss;
- Es besteht darauf, eine Kette von Updates von einem einzelnen Benutzer zu haben, was mir unnötig erscheint und etwas, das Aufgeblähtes und Starrheit hinzufügt - jeder Server/Benutzer muss die gesamte Kette von Beiträgen speichern, um sicherzustellen, dass der neue gültig ist. Warum? (Vielleicht haben sie einen guten Grund);
- Es ist nicht so einfach wie Nostr, da es hauptsächlich für P2P-Synchronisation entwickelt wurde, wobei "Pubs" ein nachträglicher Gedanke waren;
- Dennoch könnte es sich lohnen, SSB anstelle dieses benutzerdefinierten Protokolls zu verwenden und es einfach an das Client-Relay-Server-Modell anzupassen, weil die Wiederverwendung eines Standards immer besser ist, als zu versuchen, die Leute in einen neuen zu bringen.

### Das Problem mit anderen Lösungen, die von jedem verlangen, ihren eigenen Server zu betreiben

- Sie erfordern, dass jeder seinen eigenen Server betreibt;
- Manchmal können Menschen trotzdem zensiert werden, weil Domainnamen zensiert werden können.
