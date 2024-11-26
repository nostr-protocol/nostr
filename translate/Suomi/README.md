# nostr – Viestit ja muuta välittäjien kautta lähetettyä tavaraa
> Notes and Other Stuff Transmitted by Relays

Yksinkertaisin avoin protokolla, joka kykenee viimeinkin luomaan sensuroimattoman globaalin ”sosiaalisen” verkoston.

Sietokykyinen, koska se ei ole riippuvainen luotetusta keskuspalvelimesta. Salausavaimiin ja allekirjoituksiin perustuva, mikä estää väärentämisen. P2P-tekniikoista riippumaton ja siksi toimiva.

Työn alla. [Liity Telegram-ryhmään](https://t.me/nostr_protocol)!

## Lyhyt yhteenveto ellet lue muuta:

Kaikki käyttävät asiakasta. Se voi olla natiivi, nettipohjainen tai vastaava. Jos haluat julkaista jotain, kirjoita viesti, allekirjoita se salausavaimellasi ja lähetä useisiin välittäjiin (omiin tai muiden ylläpitämiin palvelimiin). Kysy usealta välittäjiltä tietävätkö ne mitään käyttäjistä, joiden päivityksiä haluat saada. Kuka tahansa voi ylläpitää välittäjää. Välittäjä on hyvin yksinkertainen. Se ei tee muuta kuin vastaanottaa muiden viestejä ja lähettää ne eteenpäin toisille. Välittäjiin ei tarvitse luottaa. Asiakkaat todentavat allekirjoitukset.

[Nostrin käytön aloittaminen](https://github.com/vishalxl/nostr_console/discussions/31)

[Nostr-asiakkaiden vertailu](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[Luettelo Nostr hankkeista](https://github.com/aljazceru/awesome-nostr)

## Nostr on tarpeellinen, koska muut ratkaisut ovat vajaavaisia:

### Twitterin ongelmat

- Twitterissä on mainoksia;
- Twitter käyttää epämääräisiä keinoja käyttäjien koukuttamiseen;
- Twitter ei näytä todellista syötehistoriaa seurattavista käyttäjistä;
- Twitter antaa porttikieltoja käyttäjille;
- Twitter piilottaa käyttäjiä;
- Twitterissä on paljon roskapostia.

### Mastodonin ja vastaavien ohjelmien ongelmat

- Käyttäjätunnukset liitetään kolmansien osapuolten hallitsemiin verkkotunnuksiin;
- Palvelimien omistajat voivat antaa käyttäjälle porttikiellon Twitterin tavoin; Palvelimen omistajat voivat myös estää pääsyn toisille palvelimille;
- Siirtyminen palvelimelta toiselle on huonosti rakennettu ja se voidaan toteuttaa vain, jos palvelimet tekevät yhteistyötä. Tämä ei toimi vihamielisessä ympäristössä (kaikki seuraajat menetetään);
- Palvelimien hallinnoimiselle ei ole selkeitä kannustimia, joten niitä yleensä ylläpitävät harrastelijat ja tahot, jotka haluavat liittää nimensä tiettyyn verkkotunnukseen. Näin käyttäjät joutuvat yksittäisen henkilön mielivallan alle, mikä on usein pahempi vaihtoehto kuin suuren yrityksen, kuten Twitterin, tapauksessa ja heillä ei ole keinoa siirtyä muualle;
- Koska palvelimia ylläpidetään yleensä vapaaehtoispohjalta, ne usein hylätään jonkin ajan kuluttua - käytännössä tämä vastaa samaa kuin porttikiellon antaminen kaikille;
- Suuressa määrässä palvelimia ei ole järkeä, jos jokaisen palvelimen päivitykset on työnnettävä (ja tallennettava!) tuskallisesti monille muille palvelimille. Tätä pahentaa seikka, että palvelimia tuppaa olemaan valtava määrä, minkä vuoksi tietoa on siirrettävä enemmän ja useammin muualle;
- ActivityPub-kannattajat oivalsivat, että videoiden välittäminen palvelinten kesken tekstiä sisältävien viestien tapaan on täysin mahdotonta. He päättivät, että videokyselyt osoitetaan ainostaan palvelimelle, johon sisältö alkuperäisesti julkaistiin. Tämä on yhtenevä Nostrin toimintamallin kanssa.

###  SSB:n (Secure Scuttlebutt) ongelmat

- Siinä ei ole paljon ongelmia, mikä on hienoa. Aioin käyttää sitä pohjana tälle, mutta:
- Sen protokolla on liian monimutkainen. Sitä ei ole lainkaan ajateltu avoimena protokollana. Se kirjoitettiin pikaisesti JavaScriptillä luultavasti tietyn ongelman ratkaisemiseksi ja se kasvoi siitä. Siinä on outoja ja tarpeettomia piirteitä, kuten JSON-merkkijonon allekirjoittaminen, jonka on noudatettava tiukasti [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify) -sääntöjä;
- Se vaatii päivitysketjua yksittäiseltä käyttäjältä, mikä tuntuu minusta tarpeettomalta ja lisää pöhöä ja jäykkyyttä  - jokaisen palvelimen/käyttäjän on tallennettava kaikki viestiketjut varmistaakseen, että uusi on kelvollinen. Miksi? (Ehkä heillä on hyvä syy);
- Se ei ole niin yksinkertainen kuin Nostr, koska se tehtiin ensisijaisesti P2P-synkronointiin, "pubit" tulivat jälkikäteen;
- Silti voi olla syytä harkita SSB:n käyttöä tämän mukautetun protokollan sijaan ja vain mukauttaa se asiakas-välittäjä -palvelinmalliin, koska standardin uudelleenkäyttö on aina parempi vaihtoehto kuin saada ihmiset mukaan uuteen.

### Ongelma muissa ratkaisuissa, jotka edellyttävät jokaisen käyttävän omaa palvelinta

- Ne edellyttävät, että jokainen käyttää omaa palvelinta;
- Käyttäjiä voidaan joskus näissä edelleen sensuroida, koska verkkotunnuksia on mahdollista sensuroida.

## Miten Nostr toimii?

- Siinä on kaksi osaa: __asiakas__ ja __välittäjä__. Joka käyttäjällä on asiakas. Kuka tahansa voi ylläpitää välittäjää.
- Jokainen käyttäjä tunnistetaan julkisella avaimella. Jokainen viesti on allekirjoitettu. Jokainen asiakas vahvistaa nämä allekirjoitukset.
- Asiakkaat hakevat tietoja valitsemistaan välittäjistä ja julkaisevat tiedot muille valitsemilleen välittäjille. Välittäjä ei puhu toiselle välittäjälle, vain suoraan käyttäjille.
- Esimerkiksi "seuratakseen" jotakuta käyttäjä ohjeistaa asiakasta kyselemään tuntemiltaan välittäjiltä viestejä kyseisestä julkisesta avaimesta.
- Käynnistettäessä asiakas kysyy tietoja kaikilta tietämiltään välittäjiltä kaikista käyttäjistä, joita se seuraa (esimerkiksi kaikki päivitykset viimeiseltä päivältä), ja näyttää sitten käyttäjälle tiedot aikajärjestyksessä.
- "Viesti" voi sisältää mitä tahansa jäsenneltyä tietoa, mutta eniten käytetyt löytävät tiensä standardiin, jotta kaikki asiakkaat ja välittäjät voivat käsitellä niitä saumattomasti.

## Miten Nostr ratkaisee ongelmat, joihin yllä olevat verkot eivät kykene?

- **Käyttäjien porttikiellot ja palvelimien sulkemiset**
  - Välittäjä voi estää käyttäjää julkaisemasta siihen, mutta sillä ei ole merkitystä käyttäjälle, koska hän voi silti julkaista muihin välittäjiin. Koska käyttäjät tunnistetaan julkisella avaimella, he eivät menetä identiteettiään ja seuraajiansa, kun heille annetaan porttikielto.
  - Sen sijaan, että käyttäjiltä vaadittaisiin uusien välittäjäosoitteiden käsin kirjoittamista  (vaikka tätäkin pitäisi tukea) aina kun joku seurattu henkilö lähettää palvelinsuosituksen, asiakkaan tulisi automaattisesti lisätä se tiedusteltujen välittäjien luetteloon.
  - Jos joku käyttää tiettyä välittäjää tietojensa julkaisemiseen, mutta haluaa siirtyä toiseen, hän voi julkaista palvelinsuosituksen aikaisemmalle välittäjälle ja lähteä;
  - Jos joku saa porttikiellon useista välittäjistä niin, että hän ei saa palvelinsuosituksiaan lähetettyä, hän saattaa silti ilmoittaa läheisille ystävilleen muilla keinoin mille välittäjälle hän  nyt julkaisee. Sitten nämä läheiset ystävät voivat julkaista palvelinsuosituksia tälle uudelle palvelimelle, ja hitaasti kielletyn käyttäjän vanha seuraajakunta alkaa löytää uudelleen viestejä uudelta välittäjältä.
  - Kaikki yllä oleva pätee myös silloin, kun välittäjä lopettaa toimintansa.
- **Sensuurin vastustus**
  - Jokainen käyttäjä voi julkaista päivityksensä mihin tahansa määrään välittäjiä.
  - Välittäjä voi veloittaa käyttäjiltä maksun (maksusta neuvotellaan toistaiseksi protokollan ulkopuolella), mikä varmistaa sensuurin vastustuksen (aina löytyy joku venäläinen palvelin, joka on valmis rahaa vastaan välittämään viestejä).

- **Roskaposti**
  - Jos välittäjä on huolissaan roskapostista, se voi vaatia julkaisusta maksun tai muun todennuksen, kuten sähköpostiosoitteen tai puhelinnumeron, ja liittää nämä sisäisesti  julkiseen avaimeen, joka sen jälkeen saa julkaista kyseiselle välittäjälle – tai muita roskapostin vastaisia keinoja, kuten hashcash tai captcha haaste. Jos välittäjää käytetään roskapostivektorina, asiakkaat voivat helposti poistaa sen luettelosta, ja ne voivat jatkaa päivitysten hakemista muilta välittäjiltä.

- **Tietovarasto**
  - Jotta verkko pysyisi terveenä, ei tarvita satoja aktiivisia välittäjiä. Itse asiassa se voi toimia hienosti vain kourallisella, koska uusia välittäjiä voidaan luoda ja levittää verkossa helposti, jos olemassa olevat välittäjät alkavat toimia väärin. Siksi vaadittu tiedon tallennusmäärä on yleensä suhteellisesti pienempi kuin Mastodonissa tai vastaavissa ohjelmistoissa.
  - Tai jos otetaan huomioon erilainen lopputulema: sellainen, jossa on satoja harrastelijoiden ylläpitämiä erityis-välittäjiä, joista jokainen välittää päivityksiä pieneltä käyttäjäryhmältä. Arkkitehtuuri skaalautuu yhtä hyvin: tiedot lähetetään käyttäjiltä yhdelle palvelimelle ja tältä palvelimelta suoraan käyttäjille, jotka niitä käyttävät. Kenenkään muun ei tarvitse tallentaa tietoja. Tässä tilanteessa ei ole iso kuorma millekään yksittäiselle palvelimelle käsitellä muiden päivityksiä, eikä harrastelijapalvelimet tuota ongelma.

- **Video ja muu raskas sisältö**
  - Välittäjä voi helposti hylätä suuren sisällön tai veloittaa suuren sisällön vastaanottamisesta ja isännöimisestä. Kun tieto ja kannustimet ovat selkeitä, markkinavoimien on helppo ratkaista ongelma.

- **Tekniikat käyttäjän huijaamiseksi**
  - Jokainen asiakas voi päättää, kuinka parhaiten näyttää viestit käyttäjille, joten aina on mahdollista kuluttaa vain haluttu sisältö halutulla tavalla – tekoälyllä järjestetyistä päivityksistä niiden lukemiseen aikajärjestyksessä.

## UKK

- **Tämä on hyvin yksinkertaista. Miksei kukaan ei ole tehnyt tätä aiemmin?**

  En tiedä, mutta luulen sen liittyvän siihen, että sosiaalisia verkostoja tekevät ovat joko yrityksiä, jotka haluavat ansaita rahaa, tai P2P-aktivisteja, jotka haluavat tehdä jotain täysin ilman palvelimia. Näistä kummatkaan eivät näe molempien maailmojen yhdistelmää, jota Nostr käyttää.

- **Kuinka löydän seurattavia ihmisiä?**

  Ensin sinun täytyy tuntea heidät ja jollain lailla saada heidän julkinen avaimensa, joko kysymällä tai löytämällä viittaus siihen muualta. Kun olet Nostr-sosiaalisessa verkostossa, voit nähdä vuorovaikutusta muiden käyttäjien kanssa ja sitten voit myös alkaa seurata ja kommunikoimaan heidän kanssaan.

- **Kuinka löydän välittäjät? Mitä tapahtuu, jos en ole yhteydessä samoihin välittäjiin kuin joku toinen**

  Et pysty kommunikoimaan kyseisen henkilön kanssa. Mutta on mahdollista löytää vihjeitä tapahtumista niin, että asiakasohjelmisto (tai käyttäjä manuaalisesti) pystyy muodostamaan yhteyden toisen henkilön välittäjään ja vuorovaikuttamaan heidän kanssaan. Tulevaisuudessa tämä voidaan toteuttaa muullakin tavalla, mutta täyttä tavoitettavuutta ei ole mahdollista koskaan luvata. Yksikään protokolla ei pysty siihen.

- **Voinko tietää kuinka monta seuraajaa minulla on?**

  Et, mutta voit saada joitain arvioita, jos välittäjät toimivat yhteistyössä protokollan ulkopuolisesti.

- **Mitä kannustimia on välittäjien ylläpitämiseen?**

  Kysymys on harhaanjohtava. Se olettaa, että välittäjät ovat yksinkertaisia ilmaisia putkia, joiden kautta käyttäjät voivat siirtää tietoja. Tällöin kannustimia ei ole. Sama koskee myös jaettuja hajautustaulu-solmuja kaikissa muissa p2p-verkkopinoissa: mikä kannustaa niiden ylläpitämiseen?

- **Nostrin avulla voi siirtyä palvelinvälittäjästä toiseen tai käyttää useita välittäjiä, mutta jos nämä välittäjät ovat AWS:ssä tai Azuressa, onko mitään todellista eroa?**

  Nykyään on kirjaimellisesti tuhansia VPS-palveluntarjoajia ympäri maailmaa AWS ja Azuren lisäksi. AWS tai Azure ovat juuri niitä palveluntarjoajia, joita käyttävät suurta skaalautuvuutta tarvitsevat keskitetyt palveluntarjoajat, ja silloinkin niitä on näitä kahta enemmän. Pienemmille välityspalvelimille sopii mikä tahansa VPS riittävän hyvin.

## Protokollan määrittely

Katso [NIPit](https://github.com/nostr-protocol/nips) ja erityisesti [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) riittävän yksityiskohtaiseksi protokollamääritykseksi (vinkki: se on hyvin lyhyt ja yksinkertainen).

## Ohjelmisto

Osoitteessa https://github.com/aljazceru/awesome-nostr on luettelo useimmista Nostria hyödyntävistä ohjelmistoista, jotka näyttivät olevan lähes valmiita viime katsomalla.

## Lisenssi

Julkinen (Public domain).
