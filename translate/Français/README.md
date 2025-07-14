# nostr - Notes et Autres Choses Transmises par Relais
> Notes and Other Stuff Transmitted by Relays

Le protocole ouvert le plus simple capable de créer un réseau social mondial résistant à la censure une fois pour toutes.

Il ne dépend d'aucun serveur central de confiance, donc il est résilient ; il est basé sur des clés et des signatures cryptographiques, donc il est inviolable ; il ne dépend pas des techniques P2P, donc il fonctionne.

Ceci est un travail en cours. [Rejoignez le groupe Telegram !](https://t.me/nostr_protocol)

## Résumé très court du fonctionnement, si vous ne prévoyez pas de lire quoi que ce soit d'autre :

Tout le monde exécute un client. Il peut s'agir d'un client natif, d'un client web, etc. Pour publier quelque chose, vous écrivez un post, vous le signez avec votre clé et vous l'envoyez à plusieurs relais (des serveurs hébergés par quelqu'un d'autre, ou vous-même). Pour obtenir des mises à jour des autres personnes, vous demandez à plusieurs relais s'ils savent quelque chose à propos de ces autres personnes. Tout le monde peut exécuter un relais. Un relais est très simple et stupide. Il ne fait rien d'autre qu'accepter des publications de certaines personnes et les transmettre à d'autres. Les relais n'ont pas besoin d'être dignes de confiance. Les signatures sont vérifiées côté client.

[Comment commencer à utiliser Nostr](https://github.com/vishalxl/nostr_console/discussions/31)

[Comparaison des fonctionnalités des clients Nostr](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[Liste de projets construits sur Nostr](https://github.com/aljazceru/awesome-nostr)

## Ceci est nécessaire car d'autres solutions sont cassées :

### Le problème avec Twitter

- Twitter a des publicités ;
- Twitter utilise des techniques étranges pour vous rendre accro ;
- Twitter ne montre pas un flux historique réel des personnes que vous suivez ;
- Twitter interdit des personnes ;
- Twitter met des personnes en "shadowban" ;
- Twitter a beaucoup de spam.

### Le problème avec Mastodon et programmes similaires

- Les identités d'utilisateurs sont attachées à des noms de domaine contrôlés par des tiers ;
- Les propriétaires de serveurs peuvent vous interdire, tout comme Twitter ; Les propriétaires de serveurs peuvent également bloquer d'autres serveurs ;
- La migration entre serveurs est une réflexion après coup et ne peut être réalisée que si les serveurs coopèrent. Cela ne fonctionne pas dans un environnement hostile (tous les abonnés sont perdus) ;
- Il n'y a pas d'incitations claires à exploiter des serveurs, donc ils ont tendance à être exploités par des enthousiastes et des personnes qui veulent avoir leur nom attaché à un domaine cool. Ensuite, les utilisateurs sont soumis au despotisme d'une seule personne, qui est souvent pire que celui d'une grande entreprise comme Twitter, et ils ne peuvent pas migrer ;
- Comme les serveurs ont tendance à être exploités de manière amateur, ils sont souvent abandonnés après un certain temps - ce qui revient effectivement à interdire à tout le monde ;
- Il n'a pas de sens d'avoir une tonne de serveurs si les mises à jour de chaque serveur doivent être poussées (et sauvegardées !) douloureusement vers une tonne d'autres serveurs. Ce point est exacerbé par le fait que les serveurs ont tendance à exister en grand nombre, donc plus de données doivent être transmises à plus d'endroits plus souvent ;
- Pour l'exemple spécifique du partage de vidéos, les enthousiastes d'ActivityPub ont réalisé qu'il serait complètement impossible de transmettre des vidéos de serveur à serveur de la même manière que les notes textuelles, donc ils ont décidé de garder la vidéo hébergée uniquement à partir de l'instance unique où elle a été postée, ce qui est similaire à l'approche de Nostr.

### Le problème avec SSB (Secure Scuttlebutt)

- Il n'a pas beaucoup de problèmes. Je pense que c'est génial. J'allais l'utiliser comme base pour cela, mais
- son protocole est trop compliqué car il n'a pas été conçu comme un protocole ouvert du tout. Il a simplement été écrit en JavaScript probablement de manière rapide pour résoudre un problème spécifique et a grandi à partir de cela, donc il a des bizarreries étranges et inutiles comme la signature d'une chaîne JSON qui doit strictement suivre les règles de [_ECMA-262 6ème édition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify);
- Il insiste sur le fait d'avoir une chaîne de mises à jour d'un seul utilisateur, ce qui me semble inutile et quelque chose qui ajoute de l'encombrement et de la rigidité à la chose - chaque serveur/utilisateur doit stocker toute la chaîne de publications pour être sûr que la nouvelle est valide. Pourquoi ? (Peut-être ont-ils une bonne raison);
- Ce n'est pas aussi simple que Nostr, car il a été principalement conçu pour la synchronisation P2P, avec des "pubs" étant une réflexion après coup ;
- Néanmoins, il peut être intéressant de considérer l'utilisation de SSB au lieu de ce protocole personnalisé et simplement de l'adapter au modèle client-relais serveur, car la réutilisation d'une norme est toujours meilleure que d'essayer de faire adopter une nouvelle norme.

### Le problème avec d'autres solutions qui nécessitent que tout le monde exécute son propre serveur

- Ils nécessitent que tout le monde exécute son propre serveur ;
- Parfois, les gens peuvent encore être censurés dans ces solutions car les noms de domaine peuvent être censurés.

## Comment fonctionne Nostr ?

- Il y a deux composants: __clients__ et __relais__. Chaque utilisateur exécute un client. Tout le monde peut exécuter un relais.
- Chaque utilisateur est identifié par une clé publique. Chaque publication est signée. Chaque client valide ces signatures.
- Les clients récupèrent des données à partir des relais de leur choix et publient des données à d'autres relais de leur choix. Un relais ne communique pas avec un autre relais, seulement directement avec les utilisateurs.
- Par exemple, pour "suivre" quelqu'un, un utilisateur indique simplement à son client de rechercher les publications à partir de cette clé publique dans les relais qu'il connaît.
- Au démarrage, un client interroge tous les relais qu'il connaît pour tous les utilisateurs qu'il suit (par exemple, toutes les mises à jour depuis le dernier jour), puis affiche ces données à l'utilisateur de manière chronologique.
- Une "publication" peut contenir n'importe quel type de données structurées, mais les plus utilisées vont trouver leur place dans la norme de sorte que tous les clients et relais peuvent les gérer de manière transparente.

## Comment résout-il les problèmes que les réseaux ci-dessus ne peuvent pas résoudre ?

- **Utilisateurs bannis et serveurs fermés**
  - Un relais peut bloquer un utilisateur de publier quoi que ce soit là-bas, mais cela n'a aucun effet sur eux car ils peuvent toujours publier sur d'autres relais. Comme les utilisateurs sont identifiés par une clé publique, ils ne perdent pas leur identité et leur base de suiveurs lorsqu'ils sont bannis.
  - Au lieu d'exiger des utilisateurs qu'ils saisissent manuellement de nouvelles adresses de relais (bien que cela devrait également être pris en charge), chaque fois que quelqu'un que vous suivez publie une recommandation de serveur, le client devrait automatiquement l'ajouter à la liste des relais qu'il interrogera.
  - Si quelqu'un utilise un relais pour publier ses données mais veut migrer vers un autre, il peut publier une recommandation de serveur à ce relais précédent et partir ;
  - Si quelqu'un est banni de nombreux relais de sorte qu'il ne peut pas faire diffuser ses recommandations de serveur, il peut toujours informer quelques amis proches par d'autres moyens sur le relais sur lequel il publie maintenant. Ensuite, ces amis proches peuvent publier des recommandations de serveur vers ce nouveau serveur, et lentement, l'ancienne base de suiveurs de l'utilisateur banni commencera à trouver ses publications à nouveau depuis le nouveau relais.
  - Tout ce qui précède est également valable lorsque qu'un relais cesse ses opérations.

- **Résistance à la censure**
  - Chaque utilisateur peut publier ses mises à jour sur un nombre quelconque de relais.
  - Un relais peut facturer des frais (la négociation de ces frais est actuellement en dehors du protocole) aux utilisateurs pour publier sur le relais, ce qui garantit la résistance à la censure (il y aura toujours un serveur russe prêt à prendre votre argent en échange de la diffusion de vos publications).

- **Spam**
  - Si le spam est une préoccupation pour un relais, il peut exiger un paiement pour la publication ou une autre forme d'authentification, comme une adresse e-mail ou un numéro de téléphone, et les associer internement avec une clé publique qui sera autorisée à publier sur ce relais - ou d'autres techniques anti-spam, comme hashcash ou des captchas. Si un relais est utilisé comme vecteur de spam, il peut facilement être retiré de la liste des clients, qui peuvent continuer à récupérer des mises à jour à partir d'autres relais.

- **Stockage de données**
  - Pour que le réseau reste sain, il n'est pas nécessaire d'avoir des centaines de relais actifs. En fait, il peut fonctionner parfaitement avec seulement quelques-uns, étant donné que de nouveaux relais peuvent être créés et diffusés facilement dans le réseau au cas où les relais existants commenceraient à mal fonctionner. Par conséquent, la quantité de stockage de données requise, en général, est relativement moins importante que celle de Mastodon ou de logiciels similaires.
  - Ou en envisageant un résultat différent: celui où il existe des centaines de relais de niche gérés par des amateurs, chacun relayant les mises à jour d'un petit groupe d'utilisateurs. L'architecture fonctionne tout aussi bien: les données sont envoyées des utilisateurs à un seul serveur, et de ce serveur directement aux utilisateurs qui les consommeront. Elles ne doivent pas être stockées par quelqu'un d'autre. Dans cette situation, ce n'est pas un gros fardeau pour un seul serveur de traiter les mises à jour des autres, et avoir des serveurs amateurs n'est pas un problème.

- **Vidéos et autres contenus lourds**
  - Il est facile pour un relais de rejeter les contenus volumineux ou de facturer leur acceptation et leur hébergement. Lorsque les informations et les incitations sont claires, il est facile pour les forces du marché de résoudre le problème.

- **Techniques pour tromper l'utilisateur**
  - Chaque client peut décider de la meilleure façon de présenter les publications aux utilisateurs, de sorte qu'il y a toujours la possibilité de ne consommer que ce que vous voulez de la manière que vous souhaitez, que ce soit en utilisant une IA pour décider de l'ordre des mises à jour que vous verrez ou en les lisant simplement dans l'ordre chronologique.

## FAQ

- **C'est très simple. Pourquoi personne ne l'a fait auparavant ?**

  Je ne sais pas, mais j'imagine que cela a à voir avec le fait que les personnes qui créent des réseaux sociaux sont soit des entreprises qui veulent gagner de l'argent, soit des militants P2P qui veulent créer une chose complètement sans serveurs. Ils ne parviennent pas à voir le mélange spécifique des deux mondes qu'utilise Nostr.

- **Comment trouver des personnes à suivre ?**

  Tout d'abord, vous devez les connaître et obtenir leur clé publique, soit en demandant soit en la voyant quelque part. Une fois que vous êtes à l'intérieur d'un réseau social Nostr, vous pourrez les voir interagir avec d'autres personnes et vous pourrez alors commencer à suivre et à interagir avec ces autres.

- **Comment trouver des relais ? Que se passe-t-il si je ne suis pas connecté aux mêmes relais que quelqu'un d'autre ?**

  Vous ne pourrez pas communiquer avec cette personne. Mais il y a des indices sur des événements qui peuvent être utilisés pour que votre logiciel client (ou vous, manuellement) sache comment se connecter au relais de l'autre personne et interagir avec elle. Il y a d'autres idées sur la façon de résoudre cela dans le futur, mais nous ne pouvons jamais promettre une accessibilité parfaite, aucun protocole ne peut le garantir.

- **Puis-je savoir combien de personnes me suivent ?**

  Non, mais vous pouvez obtenir des estimations si les relais coopèrent d'une manière extra-protocolaire.

- **Quel est l'incitatif pour les gens de faire fonctionner des relais ?**

  La question est trompeuse. Elle suppose que les relais sont des tuyaux muets gratuits qui existent pour que les gens puissent déplacer des données à travers eux. Dans ce cas, oui, les incitations n'existeraient pas. Cela pourrait en fait être dit des nœuds DHT dans toutes les autres piles de réseaux p2p : quel est l'incitatif pour les gens de faire fonctionner des nœuds DHT ?

- **Nostr vous permet de passer d'un relais à un autre ou d'utiliser plusieurs relais, mais s'ils sont simplement sur AWS ou Azure, quelle est la différence ?**

  Il y a littéralement des milliers de fournisseurs de VPS dispersés partout dans le monde aujourd'hui, il n'y a pas seulement AWS ou Azure. AWS ou Azure sont exactement les fournisseurs utilisés par les fournisseurs de services centralisés uniques qui ont besoin d'une grande échelle, et même alors, pas seulement ces deux-là. Pour les serveurs de relais plus petits, n'importe quel VPS fera très bien l'affaire.

## Spécification du protocole

Voir les [NIPs](https://github.com/nostr-protocol/nips) et en particulier [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) pour une explication raisonnablement détaillée de la spécification du protocole (indice: elle est très courte et simple).

## Logiciel

Il y a une liste de la plupart des logiciels construits en utilisant Nostr sur https://github.com/aljazceru/awesome-nostr qui semblait être presque complète la dernière fois que j'ai regardé.

## Licence

Domaine public.
