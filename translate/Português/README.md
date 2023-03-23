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

