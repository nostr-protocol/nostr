# nostr - 透過中繼傳輸的筆記和其他資訊
> Notes and Other Stuff Transmitted by Relays

最簡單的開放協議，能夠一次性創建一個抵抗審查的全球「社交」網絡。

它不依賴任何值得信賴的中央服務器，因此它具有韌性；它基於密碼學密鑰和簽名，因此它是防篡改的；它不依賴P2P技術，因此它能夠運作。

這是一個正在進行中的工作，[歡迎加入 Telegram 群組！](https://t.me/nostr_protocol)

## 如果你不打算閱讀其他內容，以下是它運作的簡短摘要：

每個人都運行客戶端。它可以是原生客戶端、Web 客戶端等。要發布內容，您需要撰寫一篇文章，用您的金鑰對其進行簽名，然後將其發送到多個轉接器（由他人或您自己託管的服務器）。要獲取其他人的更新，您可以向多個轉接器請求是否有關於這些其他人的任何信息。任何人都可以運行轉接器。轉接器非常簡單和愚笨。它除了接受某些人的文章並轉發給其他人之外什麼也不做。轉接器不需要受信任。簽名在客戶端上驗證。

[如何開始使用 Nostr](https://github.com/vishalxl/nostr_console/discussions/31)

[Nostr 客戶端功能比較](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[基於 Nostr 的項目列表](https://github.com/aljazceru/awesome-nostr)

## 需要這是因為其他解決方案出現問題：

### Twitter 的問題

- Twitter 有廣告；
- Twitter 使用奇怪的技術讓你上癮；
- Twitter 不顯示您關注的人的實際歷史動態；
- Twitter 禁止某些人；
- Twitter 隱藏某些人；
- Twitter 有很多垃圾郵件。

### Mastodon 和類似程序的問題

- 使用者身份附加在由第三方控制的域名上；
- 服務器擁有者可以像 Twitter 一樣禁止您；服務器擁有者還可以阻止其他服務器；
- 在對抗環境中，遷移之間是一個後顧之憂，只有服務器合作才能實現。在失敗的情況下，所有追蹤者都會丟失；
- 沒有明確的激勵措施來運行服務器，因此它們往往由熱心愛好者和想要將自己的名字與一個很酷的域名相關聯的人來運行。然後，用戶受到單個人的專制統治，這通常比 Twitter 等大公司更糟糕，他們無法遷移出去；
- 由於服務器往往是業餘人士運行，所以它們經常在一段時間後被廢棄——這與禁止每個人的效果相同；
- 如果每個服務器的更新必須痛苦地推送（和保存！）到許多其他服務器，那麼擁有大量服務器是毫無意義的。這一點由於服務器往往存在大量，因此需要將更多數據傳遞到更多地方更經常；
- 對於影片分享的特定示例，ActivityPub 熱衷者意識到從服務器到服務器傳輸影片是完全不可能的，所以他們決定將影片僅從發布它的單個實例中托管，這與 Nostr 方法類似。

### SSB（Secure Scuttlebutt）的問題

- 它沒有太多問題。我認為它很棒。我本來想將其用作基礎來進行此項目，但是
- 因為它沒有考慮成為一個開放協議，所以其協議過於複雜。它只是用 JavaScript 編寫，可能是為了快速解決特定問題，然後從那裡發展而來，因此它具有奇怪且不必要的怪癖，如簽署必須嚴格遵循 [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify) 規則的 JSON 字符串；
- 它堅持需要來自單個用戶的更新鏈，我認為這是不必要的，它增加了贅餘和僵硬的東西——每個服務器/用戶需要存儲所有文章鏈以確保新文章有效。為甚麼？（也許他們有一個好的理由）；
- 它不像 Nostr 那麼簡單，因為它主要是用於 P2P 同步，並且「pubs」是一個次要考慮的問題；
- 儘管如此，仍然值得考慮改用 SSB 而不是這個自定義協議，並將其適應為客戶端-中繼服務器模型，因為重複使用標准始終比嘗試讓人們使用新標准更好。

### 其他需要每個人運行自己服務器的解決方案的問題

- 它們要求每個人都運行自己的服務器；
- 有時人們仍然可能會在其中被審查，因為域名可能會受到審查。

## Nostr 如何運作？

- 有兩個組件：**客戶端** 和 **中繼服務器**。每個用戶都運行客戶端。任何人都可以運行中繼服務器。
- 每個用戶都由公共密鑰識別。每個帖子都經過簽署。每個客戶端驗證這些簽名。
- 客戶端從其選擇的中繼服務器提取數據並將數據發布到其選擇的其他中繼服務器。一個中繼服務器不與另一個中繼服務器通信，僅直接與用戶通信。
- 例如，要「關注」某人，用戶只需指示其客戶端向其所知的中繼服務器查詢來自該公共密鑰的帖子。
- 在啟動時，客戶端會從其所知道的所有中繼服務器中查詢所有其正在關注的用戶的數據（例如，從最近一天開始的所有更新），然後按時間順序向用戶顯示該數據。
- 「貼文」可以包含任何形式的結構化數據，但最常用的數據將在標準中找到其位置，因此所有客戶端和中繼服務器都可以無縫處理它們。

## How does it solve the problems the networks above can't?

- **Users getting banned and servers being closed**
  - A relay can block a user from publishing anything there, but that has no effect on them as they can still publish to other relays. Since users are identified by a public key, they don't lose their identities and their follower base when they get banned.
  - Instead of requiring users to manually type new relay addresses (although this should also be supported), whenever someone you're following posts a server recommendation, the client should automatically add that to the list of relays it will query.
  - If someone is using a relay to publish their data but wants to migrate to another one, they can publish a server recommendation to that previous relay and go;
  - If someone gets banned from many relays such that they can't get their server recommendations broadcasted, they may still let some close friends know through other means with which relay they are publishing now. Then, these close friends can publish server recommendations to that new server, and slowly, the old follower base of the banned user will begin finding their posts again from the new relay.
  - All of the above is valid too for when a relay ceases its operations.

- **Censorship-resistance**
  - Each user can publish their updates to any number of relays.
  - A relay can charge a fee (the negotiation of that fee is outside of the protocol for now) from users to publish there, which ensures censorship-resistance (there will always be some Russian server willing to take your money in exchange for serving your posts).

- **Spam**
  - If spam is a concern for a relay, it can require payment for publication or some other form of authentication, such as an email address or phone, and associate these internally with a pubkey that then gets to publish to that relay — or other anti-spam techniques, like hashcash or captchas. If a relay is being used as a spam vector, it can easily be unlisted by clients, which can continue to fetch updates from other relays.

- **Data storage**
  - For the network to stay healthy, there is no need for hundreds of active relays. In fact, it can work just fine with just a handful, given the fact that new relays can be created and spread through the network easily in case the existing relays start misbehaving. Therefore, the amount of data storage required, in general, is relatively less than Mastodon or similar software.
  - Or considering a different outcome: one in which there exist hundreds of niche relays run by amateurs, each relaying updates from a small group of users. The architecture scales just as well: data is sent from users to a single server, and from that server directly to the users who will consume that. It doesn't have to be stored by anyone else. In this situation, it is not a big burden for any single server to process updates from others, and having amateur servers is not a problem.

- **Video and other heavy content**
  - It's easy for a relay to reject large content, or to charge for accepting and hosting large content. When information and incentives are clear, it's easy for the market forces to solve the problem.

- **Techniques to trick the user**
  - Each client can decide how to best show posts to users, so there is always the option of just consuming what you want in the manner you want — from using an AI to decide the order of the updates you'll see to just reading them in chronological order.

## FAQ

- **This is very simple. Why hasn't anyone done it before?**

  I don't know, but I imagine it has to do with the fact that people making social networks are either companies wanting to make money or P2P activists who want to make a thing completely without servers. They both fail to see the specific mix of both worlds that Nostr uses.

- **How do I find people to follow?**

  First, you must know them and get their public key somehow, either by asking or by seeing it referenced somewhere. Once you're inside a Nostr social network you'll be able to see them interacting with other people and then you can also start following and interacting with these others.

- **How do I find relays? What happens if I'm not connected to the same relays someone else is?**

  You won't be able to communicate with that person. But there are hints on events that can be used so that your client software (or you, manually) knows how to connect to the other person's relay and interact with them. There are other ideas on how to solve this too in the future but we can't ever promise perfect reachability, no protocol can.

- **Can I know how many people are following me?**

  No, but you can get some estimates if relays cooperate in an extra-protocol way.

- **What incentive is there for people to run relays?**

  The question is misleading. It assumes that relays are free dumb pipes that exist such that people can move data around through them. In this case yes, the incentives would not exist. This in fact could be said of DHT nodes in all other p2p network stacks: what incentive is there for people to run DHT nodes?

- **Nostr enables you to move between server relays or use multiple relays but if these relays are just on AWS or Azure what’s the difference?**

  There are literally thousands of VPS providers scattered all around the globe today, there is not only AWS or Azure. AWS or Azure are exactly the providers used by single centralized service providers that need a lot of scale, and even then not just these two. For smaller relay servers any VPS will do the job very well.

## Protocol specification

See the [NIPs](https://github.com/nostr-protocol/nips) and especially [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) for a reasonably-detailed explanation of the protocol spec (hint: it is very short and simple).

## Software

There is a list of most software being built using Nostr on https://github.com/aljazceru/awesome-nostr that seemed to be almost complete last time I looked.

## License

Public domain.
