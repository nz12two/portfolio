# Discord — plano e sincronia com o portfólio

**Servidor criado em 2026-10-12.** Nome: **NZ Studios**. Convite:
<https://discord.gg/FwPq3hSmr>. Guild id `1559216448969248770` (confirmado pela
API — o id da barra de endereço do browser não era o mesmo).

Identidades prontas:
- Bot **`Banz`** (o bot do Banzinho) tem `MANAGE_GUILD` (`permissions=8`) no
  cargo integrado, e é ele que **posta e lê** no servidor inteiro. Todo anúncio
  sai por aqui — ver [Como o Discord é avisado](#como-o-discord-é-avisado).

O webhook `portfolio-push` existiu entre 2026-10-12 e o fim do mesmo dia, e foi
apagado.

## Ícone do servidor: só pelo dono

O cargo integrado do bot tem `permissions=8` (`MANAGE_GUILD`), então falta de
permissão não é a explicação — e foi o que a medição descartou:

| tentativa | resultado |
|---|---|
| `PATCH /guilds/{id}` com `icon` = base64 do PNG do kit | HTTP 200, `icon` volta com o hash antigo |
| o mesmo com outro PNG do próprio repo (`opendex.png`, 1100×739) | HTTP 200, `icon` volta com o hash antigo |
| `GET /guilds/{id}/members/{bot}` sem `with_counts` | `permissions` **ausente** — BigInt(undefined) vira `0x0`, negativo falso |
| `GET /guilds/{id}/roles` | cargo integrado `Banzinho` com `permissions: "8"` |

Ou seja: o endpoint aceita o `PATCH` e descarta o campo. O `description` do
mesmo `PATCH` entra, então não é o PUT que está falhando. Trocar ícone de guild
é ação do dono: `Configurações do servidor → Ícone do servidor`, arrastando
`C:\Users\Lucas\Desktop\nz-studio-icone-512.png` (o `app-icon-512.png` do kit,
512×512, PNG válido).

Antes de concluir isso, dois falsos-negativos que custaram três chamadas e
viram outros três: ler permissão sem `with_counts`, e comparar o `hash` do
`icon` logo depois do `PATCH` sem esperar o estado propagar.

## Estrutura que existe hoje

A **categoria** de cada canal vem do campo `categoria` de `produtos.json` — o
tipo de trabalho, não o assunto. `🌐 Sites` junta api-directory e opendex porque
os dois são o mesmo tipo de entrega; canal separado para cada um seria o mesmo
assunto em dois lugares. `🔌 Plugins` e `🤖 Agentes` são tipos que ninguém
confundiria mesmo em canais distintos.

Tradução do rótulo declarado para o nome da categoria:

| `categoria` no JSON | categoria no Discord |
|---|---|
| Plugin | 🔌 Plugins |
| Ferramenta | 🌐 Sites |
| Serviço | ⚙️ Otimizações |
| Jogo / simulação | 🧩 scripts |
| Agente | 🤖 Agentes |

Duas traduções merecem justificativa: `Serviço` virou **Otimizações** porque a
tagline do Baccana's Hub é otimização de servidor Paper, e `Ferramenta` virou
**Sites** porque as duas ferramentas do catálogo são catálogos web já no ar. O
rótulo do produto não muda — muda o nome da prateleira onde ele fica.

```
🏠 início
   📌 informações      o mapa do servidor, sem pergunta e sem bug
   🎨 regras          as três regras, fixadas
   📢 anúncios        canal de anúncio do Discord (tipo 5), somente leitura
   📢 atualizações     o que mudou dentro de um produto que já existe

🔌 Plugins
   🛡️ antixray        fórum — Bug, Dúvida, Configuração, Falso positivo

⚙️ Otimizações
   📦 packs           pacotes de otimização de servidor Paper, com número

🌐 Sites
   🔧 baccanas-hub    vitrine dos serviços e dos packs
   📚 api-directory   diretório de APIs sondadas
   📦 opendex         catálogo do ecossistema OpenCode

🤖 Agentes
   🤖 banzinho_os     o agente: versão, o que faz, o que ainda não faz
   📄 fórum-ia        conversa sobre IA — produto, ferramenta, método

🧩 scripts
   🏙️ empresas-mundo  simulação de empresas de entrega

💬 Comunidade
   🗣️ geral           conversa que não é sobre produto
   📣 feedback        fórum — Funcionalidade, Bug, Outro
   🛠️ solicitar       fórum — Serviço, Parceria
   💡 sugestões       fórum — Sugestão, Melhoria
   🗂️ sem-categoria  o que não coube

🎧 suporte
   ticket             problema aberto: o que fez, o que esperava, o log
   apel              contestação de decisão ou bloqueio

🔊 Voz
   🔊 Geral
```

**Esta estrutura é do NZ**, montada pela interface em 2026-10-12 — a divisão por
tipo (`Plugins`, `Otimizações`, `Sites`, `Agentes`, `scripts`) veio dele, e o
que entrou aqui foi o acabamento: nome com emoji em tudo, tópico em cada canal e
os cargos. A categoria continua acompanhando o campo `categoria` do catálogo,
com `Serviço` traduzido para `Otimizações` e `Ferramenta` para `Sites`.

Três coisas que o rascunho deixou abertas e continuam assim, por serem decisão
dele e não defeito: `🔧 baccanas-hub` está em `🌐 Sites` e não em `Otimizações`;
`🏙️ empresas-mundo` está em `🧩 scripts`; e `#apel` continua sem emoji.

**Por que fórum e não texto nos canais de comunidade.** Em canal de texto o bug
de janeiro e o de outubro ficam na mesma pilha e ninguém acha o antigo. Em
fórum, cada assunto é uma página com título, tag e status de respondida — e o
canal mostra quantas há sem ninguém precisar ler. Nos canais de produto o NZ
escolheu texto: com um produto por canal e pouca gente a pilha curta é legível,
e fórum só paga o custo quando o canal enche.

Cada canal de produto tem **tópico igual à tagline** que o cartão da vitrine
mostra, mais a prova e o link. Canal e página contam a mesma coisa: mesma fonte,
dois lugares, nenhuma versão para manter em dia. Canal de voz é a exceção — o
Discord não tem tópico nele e responde `CHANNEL_TOPIC_INVALID` para qualquer
texto.

`#anúncios` virou **canal de anúncio do Discord** (tipo 5), que é o que aparece
no Server Discovery, e está com `@everyone` sem permissão de enviar. Só o bot
posta — se o canal aceitasse escrita humana, ele seria mais um lugar onde
atualização envelhece.

## Cargos

Um cargo por produto, e a pergunta do onboarding atribui o cargo correspondente.
É por isso que o cargo não é enfeite: ele é o registro do que a pessoa veio fazer
aqui. Cargo de categoria seriam oito cores que ninguém conseguiria escolher entre
si.

| cargo | cor | vem de |
|---|---|---|
| AntiXray | azul | `🔌 Plugins` |
| Otimizações | laranja | `⚙️ Otimizações` |
| Baccana's Hub | laranja | `🌐 Sites` |
| API Directory | verde | `🌐 Sites` |
| OpenDex | verde escuro | `🌐 Sites` |
| Agente Banzinho | roxo | `🤖 Agentes` |
| Fórum IA | ciano | `🤖 Agentes` |
| EmpresasMundo | amarelo | `🧩 scripts` |
| Suporte | vermelho, destacado, mencionável | `🎧 suporte` |
| Desenvolvedor | cinza, destacado, mencionável | — |

Só `Suporte` e `Desenvolvedor` são destacados: cargo de produto separado na
lista de membros vira uma parede de nove cores sem conteúdo. O cargo integrado
do bot se chama `Banzinho` e o produto chama `Agente Banzinho` para não
parecerem o mesmo — cargo integrado o Discord recusa alteração.

**Onboarding** gravado com oito opções (uma por canal de produto), entrada por
`#regras` e `#informações`, cada opção atribuindo o cargo do produto. O
Discord recusa ligar sozinho com `350000 requirements are not met` — a checagem
é dele, não é campo inválido, e insistir no mesmo `PUT` não muda a resposta.
Ligar é um interruptor em `Configurações do servidor → Ativação`, e ele já está
com tudo preenchido.

O papel `membro` continua para quem entra sem escolher produto. O Discord exige
que cada opção do onboarding aponte para um cargo que exista, e `@everyone`
responde `UNKNOWN_ROLE` para o bot.

## Como o Discord e avisado

Um caminho só. `tools/anunciar.js` e a saida: o bot e a boca, resolve o canal
pelo **nome** (nao por id, para renomear canal nao quebrar nada), formata pelo
**tipo** e entrega. O que merece virar anuncio e decidido fora — pelo CI quando
o fato vem de um push, pelo Banzinho quando a decisao e dele.

`tools/aviso-discord.js` so descobre o que mudou no catalogo e delega para
ele. Descobrir a diferenca e entregar no canal certo sao trabalhos diferentes, e
juntar os dois e o que faz um script crescer ate ter credencial propria.

| tipo | canal | cor |
|---|---|---|
| `produto_novo` | 📢 anúncios | verde |
| `mudou` | 📢 anúncios | laranja |
| `saiu` | 📢 anúncios | cinza |
| `versao` | 📢 anúncios | roxo |
| `status` | 📢 anúncios | cinza |
| `numero` | 📢 atualizações | laranja |
| `apresentacao` | o canal do produto | azul |
| `lead` | 📦 packs | laranja |

`--produto` tem duas leituras e elas nao se misturam: quando o tipo tem destino
canonico, o produto **rotula o embed** e o canal vem do mapa; quando o tipo nao
tem (apresentacao), o produto escolhe o canal. Medido: com `--produto` decidindo
sempre o destino, "AntiXray mudou de preço" foi para `#antixray` em vez de
`#anúncios` — e o script imprimia "1 anúncio enviado", que e o pior tipo de
mentira: sucesso sem efeito.

**Fórum não aceita mensagem.** `POST` direto em canal tipo 15 devolve `50008
Cannot send messages in a non-text channel`. A apresentacao de um fórum e um
**tópico** (criado em `POST /channels/{id}/threads`), que e onde a conversa
acontece mesmo. Os outros cinco produtos receberam mensagem direta.

Tres medidas que valem mais que a resposta `200`:

- `message_count` do tópico vem velho logo após criar — a mensagem estava lá e o
  contador dizia 0. Prova de thread e **ler as mensagens**.
- `username` do payload é **ignorado** quando se posta com token de bot: só vale
  para webhook. Com token de bot o autor e o próprio bot. Por isso a busca e pelo
  embed, nao pelo autor.
- Pin de post de fórum e `PUT /channels/{threadId}/pins/{messageId}`. Com o id
  do fórum no lugar do tópico o `PUT` devolve **204 e não fixa nada**.

O webhook `portfolio-push` e o secret `DISCORD_WEBHOOK_URL` foram apagados em
2026-10-12. Webhook so posta em **um** canal e era a segunda credencial do mesmo
servidor; dois caminhos de saída sao duas coisas para quebrar, e a segunda quase
sempre quebra depois da primeira funcionar sem ninguem ver. O token do bot e o que
da alcada de todos os canais.

`DISCORD_CANAL_ID` continua existindo porque `puxar-novidades.js` o usa para
ler de volta o que foi anunciado e alimentar a vitrine.

Dry-run e o padrao (`--enviar` grava). **Dry-run precisa de token**: resolver o
canal por nome e uma chamada de rede, e sem token o script falha 401 antes de
imprimir o que enviaria.
