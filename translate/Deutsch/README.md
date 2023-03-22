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

## Wie funktioniert Nostr?

- Es gibt zwei Komponenten: __Clients__ und __Relais__. Jeder Benutzer führt einen Client aus. Jeder kann ein Relais betreiben.
- Jeder Benutzer wird durch einen öffentlichen Schlüssel identifiziert. Jeder Beitrag ist signiert. Jeder Client validiert diese Signaturen.
- Clients holen Daten von Relais ihrer Wahl und veröffentlichen Daten auf anderen Relais ihrer Wahl. Ein Relais kommuniziert nicht mit einem anderen Relais, sondern nur direkt mit Benutzern.
- Um zum Beispiel jemandem zu "folgen", weist ein Benutzer seinen Client einfach an, die ihm bekannten Relais nach Beiträgen von diesem öffentlichen Schlüssel zu durchsuchen.
- Beim Start fragt ein Client Daten von allen Relais ab, die er kennt, für alle Benutzer, denen er folgt (zum Beispiel alle Updates vom letzten Tag), und zeigt diese Daten dem Benutzer chronologisch an.
- Ein "Beitrag" kann jede Art von strukturierten Daten enthalten, aber die am häufigsten verwendeten werden in den Standard aufgenommen, damit alle Clients und Relais sie nahtlos verarbeiten können.

## Wie löst es die Probleme, die die oben genannten Netzwerke nicht lösen können?

- **Benutzer werden gesperrt und Server geschlossen**
  - Ein Relais kann einen Benutzer daran hindern, dort etwas zu veröffentlichen, aber das hat keine Auswirkungen auf ihn, da er immer noch auf anderen Relais veröffentlichen kann. Da Benutzer durch einen öffentlichen Schlüssel identifiziert werden, verlieren sie nicht ihre Identität und ihre Follower-Basis, wenn sie gesperrt werden.
  - Anstatt von Benutzern zu verlangen, manuell neue Relaisadressen einzugeben (obwohl dies auch unterstützt werden sollte), sollte der Client automatisch eine Serverempfehlung zur Liste der abzufragenden Relais hinzufügen, wenn jemand, dem Sie folgen, eine Serverempfehlung veröffentlicht.
  - Wenn jemand ein Relais zum Veröffentlichen seiner Daten verwendet, aber zu einem anderen wechseln möchte, kann er eine Serverempfehlung an das vorherige Relais veröffentlichen und gehen;
  - Wenn jemand von so vielen Relais gesperrt wird, dass er seine Serverempfehlungen nicht mehr verbreiten kann, kann er trotzdem einige enge Freunde auf anderem Wege darüber informieren, auf welchem Relais er jetzt veröffentlicht. Diese engen Freunde können dann Serverempfehlungen zu diesem neuen Server veröffentlichen, und langsam wird die alte Follower-Basis des gesperrten Benutzers wieder Beiträge von dem neuen Relais finden.
  - All dies gilt auch, wenn ein Relais seinen Betrieb einstellt.

- **Zensurresistenz**
  - Jeder Benutzer kann seine Updates auf beliebig vielen Relais veröffentlichen.
  - Ein Relais kann eine Gebühr verlangen (die Verhandlung dieser Gebühr liegt vorerst außerhalb des Protokolls) von Benutzern, um dort zu veröffentlichen, was die Zensurresistenz sicherstellt (es wird immer einen russischen Server geben, der bereit ist, Ihr Geld im Austausch für das Bereitstellen Ihrer Beiträge zu nehmen).

- **Spam**
  - Wenn Spam für ein Relais ein Problem ist, kann es eine Zahlung für die Veröffentlichung oder eine andere Form der Authentifizierung verlangen, wie zum Beispiel eine E-Mail-Adresse oder Telefonnummer, und diese intern mit einem Pubkey verknüpfen, der dann auf diesem Relais veröffentlichen darf – oder andere Anti-Spam-Techniken wie Hashcash oder Captchas. Wenn ein Relais als Spam-Vektor verwendet wird, kann es leicht von Clients von der Liste genommen werden, die weiterhin Updates von anderen Relais abrufen können.

- **Datenspeicherung**
  - Damit das Netzwerk gesund bleibt, ist es nicht notwendig, Hunderte von aktiven Relais zu haben. Tatsächlich kann es auch mit nur einer Handvoll funktionieren, da neue Relais leicht erstellt und im Netzwerk verbreitet werden können, falls die vorhandenen Relais anfangen, sich schlecht zu verhalten. Daher ist der allgemeine Bedarf an Datenspeicherung im Vergleich zu Mastodon oder ähnlicher Software relativ gering.
  - Oder betrachten wir ein anderes Szenario: eines, in dem es Hunderte von Nischenrelais gibt, die von Amateuren betrieben werden und jeweils Updates von einer kleinen Gruppe von Benutzern weiterleiten. Die Architektur skaliert genauso gut: Daten werden von Benutzern an einen einzelnen Server gesendet und von diesem Server direkt an die Benutzer, die diese Daten konsumieren werden. Es muss von niemand anderem gespeichert werden. In dieser Situation ist es für keinen einzelnen Server eine große Belastung, Updates von anderen zu verarbeiten, und das Vorhandensein von Amateurservern ist kein Problem.

