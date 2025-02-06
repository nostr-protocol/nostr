# nostr - Notas e Outras Coisas Transmitidas por Revezamento
> Notes and Other Stuff Transmitted by Relays

O protocolo aberto mais simples capaz de criar uma rede "social" global resistente à censura de uma vez por todas.

Ele não depende de nenhum servidor central confiável, portanto é resiliente; é baseado em chaves criptográficas e assinaturas, tornando-se à prova de adulteração; ele não depende de técnicas P2P e, por isso, funciona.

Este é um trabalho em andamento. [Participe do grupo do Telegram!](https://t.me/nostr_protocol)

## Resumo bem curto de como funciona, caso você não planeje ler mais nada:

Todo mundo executa um cliente. Pode ser um cliente nativo, um cliente web, etc. Para publicar algo, você escreve uma postagem, assina-a com sua chave e envia para vários servidores de revezamento (hospedados por outras pessoas ou por você mesmo). Para receber atualizações de outras pessoas, você pergunta a vários servidores de revezamento se eles sabem algo sobre essas outras pessoas. Qualquer um pode executar um servidor de revezamento. Um servidor de revezamento é muito simples e limitado. Ele não faz nada além de aceitar postagens de algumas pessoas e encaminhar para outras. Os servidores de revezamento não precisam ser confiáveis. As assinaturas são verificadas no lado do cliente.

[Como começar a usar o Nostr](https://github.com/vishalxl/nostr_console/discussions/31)

[Comparação de recursos do cliente Nostr](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[Lista de projetos baseados no Nostr](https://github.com/aljazceru/awesome-nostr)

## Isso é necessário porque outras soluções estão quebradas:

### O problema com o Twitter

- O Twitter tem anúncios;
- O Twitter usa técnicas bizarras para mantê-lo viciado;
- O Twitter não mostra um feed histórico real das pessoas que você segue;
- O Twitter bane pessoas;
- O Twitter faz shadowban de pessoas;
- O Twitter tem muito spam.

### O problema com o Mastodon e programas similares

- As identidades dos usuários estão vinculadas a nomes de domínio controlados por terceiros;
- Os proprietários dos servidores podem bani-lo, assim como o Twitter; os proprietários dos servidores também podem bloquear outros servidores;
- A migração entre servidores é uma reflexão tardia e só pode ser realizada se os servidores cooperarem. Não funciona em um ambiente adversarial (todos os seguidores são perdidos);
- Não há incentivos claros para executar servidores, portanto, eles tendem a ser executados por entusiastas e pessoas que desejam ter seu nome vinculado a um domínio legal. Assim, os usuários estão sujeitos ao despotismo de uma única pessoa, que muitas vezes é pior do que o de uma grande empresa como o Twitter, e eles não podem migrar para fora;
- Como os servidores tendem a ser executados de maneira amadora, muitas vezes são abandonados após um tempo - o que é efetivamente o mesmo que banir todos;
- Não faz sentido ter uma tonelada de servidores se as atualizações de todos os servidores tiverem que ser dolorosamente enviadas (e salvas!) para uma tonelada de outros servidores. Este ponto é exacerbado pelo fato de que os servidores tendem a existir em grande número, portanto, mais dados precisam ser repassados para mais lugares com mais frequência;
- Para o exemplo específico de compartilhamento de vídeo, os entusiastas do ActivityPub perceberam que seria completamente impossível transmitir vídeo de servidor para servidor da mesma forma que as notas de texto, então decidiram manter o vídeo hospedado apenas na instância única em que foi postado, o que é semelhante à abordagem do Nostr.

## Como funciona o Nostr?

- Existem dois componentes: __clientes__ e __retransmissores__. Cada usuário executa um cliente. Qualquer um pode executar um retransmissor.
- Cada usuário é identificado por uma chave pública. Cada postagem é assinada. Cada cliente valida essas assinaturas.
- Os clientes buscam dados dos retransmissores de sua escolha e publicam dados em outros retransmissores de sua escolha. Um retransmissor não se comunica com outro retransmissor, apenas diretamente com os usuários.
- Por exemplo, para "seguir" alguém, um usuário simplesmente instrui seu cliente a consultar os retransmissores que conhece em busca de postagens dessa chave pública.
- Na inicialização, um cliente consulta dados de todos os retransmissores que conhece para todos os usuários que segue (por exemplo, todas as atualizações do último dia) e, em seguida, exibe esses dados para o usuário em ordem cronológica.
- Uma "postagem" pode conter qualquer tipo de dado estruturado, mas os mais usados encontrarão seu caminho no padrão para que todos os clientes e retransmissores possam lidar com eles de forma contínua.

## Como isso resolve os problemas que as redes acima não conseguem?

- **Usuários sendo banidos e servidores sendo fechados**
  - Um retransmissor pode bloquear um usuário para evitar que ele publique qualquer coisa lá, mas isso não afeta o usuário, já que ele ainda pode publicar em outros retransmissores. Como os usuários são identificados por uma chave pública, eles não perdem suas identidades e sua base de seguidores quando são banidos.
  - Em vez de exigir que os usuários digitem manualmente os novos endereços de retransmissores (embora isso também deva ser suportado), sempre que alguém que você está seguindo postar uma recomendação de servidor, o cliente deve adicionar automaticamente essa recomendação à lista de retransmissores que ele consultará.
  - Se alguém estiver usando um retransmissor para publicar seus dados, mas desejar migrar para outro, pode publicar uma recomendação de servidor no retransmissor anterior e ir embora;
  - Se alguém for banido de muitos retransmissores a ponto de não conseguir transmitir suas recomendações de servidores, ainda poderá avisar alguns amigos próximos por outros meios em qual retransmissor está publicando agora. Então, esses amigos próximos podem publicar recomendações de servidores para esse novo servidor, e aos poucos, a antiga base de seguidores do usuário banido começará a encontrar suas postagens novamente no novo retransmissor.
  - Tudo o que foi mencionado acima também é válido para quando um retransmissor encerra suas operações.

- **Resistência à censura**
  - Cada usuário pode publicar suas atualizações em qualquer número de retransmissores.
  - Um retransmissor pode cobrar uma taxa (a negociação dessa taxa está fora do protocolo por enquanto) dos usuários para publicar lá, o que garante resistência à censura (sempre haverá algum servidor russo disposto a receber seu dinheiro em troca de veicular suas postagens).

- **Spam**
  - Se o spam for uma preocupação para um retransmissor, ele pode exigir pagamento pela publicação ou alguma outra forma de autenticação, como um endereço de e-mail ou telefone, e associar internamente esses dados a uma chave pública que pode publicar nesse retransmissor - ou outras técnicas anti-spam, como hashcash ou captchas. Se um retransmissor estiver sendo usado como vetor de spam, ele pode ser facilmente retirado da lista pelos clientes, que podem continuar a buscar atualizações de outros retransmissores.

- **Armazenamento de dados**
  - Para que a rede permaneça saudável, não há necessidade de centenas de retransmissores ativos. Na verdade, pode funcionar muito bem com apenas alguns, dado o fato de que novos retransmissores podem ser criados e espalhados pela rede facilmente, caso os retransmissores existentes comecem a se comportar mal. Portanto, a quantidade de armazenamento de dados necessário, em geral, é relativamente menor do que Mastodon ou software similar.
  - Ou considerando um resultado diferente: um em que existam centenas de retransmissores de nicho administrados por amadores, cada um retransmitindo atualizações de um pequeno grupo de usuários. A arquitetura escala igualmente bem: os dados são enviados dos usuários para um único servidor e, desse servidor, diretamente para os usuários que consumirão isso. Não precisa ser armazenado por mais ninguém. Nessa situação, não é um grande fardo para um único servidor processar atualizações de outros, e ter servidores amadores não é um problema.

- **Vídeo e outros conteúdos pesados**
  - É fácil para um retransmissor rejeitar conteúdo grande ou cobrar por aceitar e hospedar conteúdo grande. Quando as informações e incentivos são claros, é fácil para as forças do mercado resolverem o problema.

- **Técnicas para enganar o usuário**
  - Cada cliente pode decidir como melhor mostrar as postagens aos usuários, então sempre há a opção de apenas consumir o que você deseja da maneira que desejar - desde usar uma IA para decidir a ordem das atualizações que você verá até lê-las em ordem cronológica.

## FAQ

- **Isso é muito simples. Por que ninguém fez isso antes?**

  Eu não sei, mas imagino que isso tenha a ver com o fato de que as pessoas que criam redes sociais são ou empresas querendo ganhar dinheiro ou ativistas P2P que desejam criar algo completamente sem servidores. Ambos falham em perceber a mistura específica de ambos os mundos que o Nostr utiliza.

- **Como encontro pessoas para seguir?**

  Primeiro, você deve conhecê-las e obter a chave pública delas de alguma forma, seja perguntando ou vendo-a referenciada em algum lugar. Uma vez que você esteja dentro de uma rede social Nostr, você poderá vê-las interagindo com outras pessoas e então também poderá começar a seguir e interagir com esses outros.

- **Como encontro retransmissores? O que acontece se eu não estiver conectado aos mesmos retransmissores que outra pessoa?**

  Você não conseguirá se comunicar com essa pessoa. Mas há dicas em eventos que podem ser usadas para que seu software cliente (ou você, manualmente) saiba como se conectar ao retransmissor da outra pessoa e interagir com ela. Há outras ideias sobre como resolver isso também no futuro, mas nunca podemos prometer alcançabilidade perfeita, nenhum protocolo pode.

- **Posso saber quantas pessoas estão me seguindo?**

  Não, mas você pode obter algumas estimativas se os retransmissores cooperarem de forma extra-protocolar.

- **Qual incentivo existe para as pessoas executarem retransmissores?**

  A pergunta é enganosa. Ela pressupõe que os retransmissores são tubos burros e gratuitos que existem para que as pessoas possam movimentar dados através deles. Nesse caso, sim, os incentivos não existiriam. Isso, de fato, poderia ser dito sobre os nós DHT em todas as outras pilhas de redes p2p: qual incentivo existe para as pessoas executarem nós DHT?

- **Nostr permite que você se mova entre retransmissores de servidores ou use vários retransmissores, mas se esses retransmissores estiverem apenas na AWS ou Azure, qual é a diferença?**

  Existem literalmente milhares de provedores de VPS espalhados por todo o mundo hoje, não existem apenas AWS ou Azure. AWS ou Azure são exatamente os provedores usados ​​por provedores de serviços centralizados que precisam de muita escala e, mesmo assim, não apenas esses dois. Para servidores de retransmissão menores, qualquer VPS fará o trabalho muito bem.

## Especificação do protocolo

Consulte os [NIPs](https://github.com/nostr-protocol/nips) e especialmente o [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) para uma explicação razoavelmente detalhada da especificação do protocolo (dica: é muito curto e simples).

## Software

Há uma lista da maioria dos softwares sendo construídos usando Nostr em https://github.com/aljazceru/awesome-nostr que parecia estar quase completa na última vez que olhei.

## Licença

Domínio público.
