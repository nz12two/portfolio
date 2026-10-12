# Discord — plano e sincronia com o portfólio

**Servidor criado em 2026-10-12.** Nome: **NZ Studios**. Convite:
<https://discord.gg/FwPq3hSmr>. Guild id `1559216448969248770` (confirmado pela
API — o id da barra de endereço do browser não era o mesmo).

## Identidades

| bot | id | de quem é | o que faz |
|---|---|---|---|
| **`Banz`** | `1503083764178227342` | meu agente — o Banzinho, que roda na máquina do NZ | **posta e lê** em todo o servidor. Todo anúncio do portfólio sai por aqui: ver [Como o Discord é avisado](#como-o-discord-é-avisado) |
| **`BOB`** | `1503517297854251130` | **do servidor** | dono da estrutura: mede, decide se age, e audita o que fez. Ver [BOB](#bob-o-bot-do-servidor) |

`Banz` tem `MANAGE_GUILD` (`permissions=8`) no cargo integrado. Os dois estão no
servidor desde 2026-10-12 e **não compartilham token** — o Discord aceita uma
sessão `Identify` por token, e a segunda derruba a primeira em silêncio.

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
   apeel             contestação de decisão ou bloqueio

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
`🏙️ empresas-mundo` está em `🧩 scripts`; e `#apeel` continua sem emoji.

**Por que fórum e não texto nos canais de comunidade.** Em canal de texto o bug
de janeiro e o de outubro ficam na mesma pilha e ninguém acha o antigo. Em
fórum, cada assunto é uma página com título, tag e status de respondida — e o
canal mostra quantas há sem ninguém precisar ler. Nos canais de produto o NZ
escolheu texto: com um produto por canal e pouca gente a pilha curta é legível,
e fórum só paga o custo quando o canal enche.

Cada canal de produto tem **tópico igual à tagline** que o cartão da vitrine
mostra. A tagline está nos nove; **o link está em um só** — `#🛡️-antixray`.
Medido em 2026-10-12: dos nove canais que `config.json` declara obrigatórios,
**8 têm tópico sem link**. É o achado `topico_sem_link` que o BOB reporta, e é a
divergência que sobra entre "canal e página contam a mesma coisa" e o que está lá.

Canal e página contam a mesma coisa: mesma fonte, dois lugares, nenhuma versão
para manter em dia — **desde que os dois tenham o conteúdo inteiro**. Canal de
voz é a exceção estrutural: o Discord não tem tópico nele e responde
`CHANNEL_TOPIC_INVALID` para qualquer texto.

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

São **14 cargos** no total: os 10 da tabela, mais `@everyone`, `membro`, e dois
integrados que o Discord cria sozinho — `Banzinho` (do `Banz`) e `BOB | UTILS`
(do `BOB`, criado quando ele foi adicionado ao servidor em 2026-10-12). Cargo
integrado é do Discord: o bot não renomeia, não pinta e não apaga.

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

## BOB, o bot do servidor

Código em `C:\Users\Lucas\Documents\A_Nzfiles\bots\discord\BOB\`. Roda com
`python bob.py <comando>`, sem gateway e sem dependência fora da biblioteca
padrão — `urllib`, `json`, `sqlite3`.

**Por que ele existe separado do Banzinho.** O `Banz` é meu agente e roda na
máquina do NZ. Servidor cujas dependências passam por um PC que liga e desliga
tem aviso que chega atrasado. O dono de um servidor tem que viver com o
servidor.

**Por que ele não sobe gateway.** O Discord aceita **uma** sessão `Identify` por
token; a segunda derruba a primeira em silêncio. Manutenção de servidor lê,
compara e escreve — não precisa de presença online, e roda em cron. Gateway só
entra no dia que existir slash command, e aí com token próprio.

### O portão: quem decide se o bot age

| classe | o que é | o que acontece |
|---|---|---|
| `executar` | rotina reversível dentro de configuração | o bot faz e avisa |
| `aprovar` | consequential: remove, bane, mexe em estrutura | grava a fila e **para**; só roda com `aprovar <id>` |
| `humano` | ambíguo, com conflito | escala e para |

Três regras que não são preferência:

- **Fail-closed.** Ação sem classe declarada cai em `aprovar`. Tipo novo no
  código começa bloqueado. Medido: 4 tipos inventados, **0** passaram a executar.
- **Aprovação vale para uma ação**, com alvo e prazo. Aprovar "tirar o canal
  vazio" não autoriza "tirar o próximo também" — sem isso a aprovação deixa de
  ser do NZ e vira do bot.
- **Trava de 180 s do dono**, herdada do WhatsApp (`whatsapp/inbound.py:354`,
  `_dono_falou_ha`). O bot não fala por cima de quem está no servidor. Vale para
  **falar**: ler, gravar e auditar não passam por ela.

Remoção e concessão de poder estão em `SEMPRE_APROVAR` e não saem de lá por
configuração — é o tipo de erro que o usuário percebe semanas depois.

Quem decide e quem executa são módulos separados (`portao.py` e
`executor.py`) de propósito: se fossem a mesma função, provar a decisão custaria
o efeito.

### Memória: por que banco e não IA lembrando

`memoria.py`, SQLite em `dados/bob.db`. Quatro tabelas porque cada uma responde
a uma pergunta diferente, e o painel pergunta as quatro ao mesmo tempo.

| tabela | a pergunta |
|---|---|
| `eventos` | o que aconteceu |
| `acoes` | o que o bot tentou fazer, em que classe, e o que deu |
| `auditoria` | quem fez o que, quando e **por que** |
| `conhecimento` | o que se sabe, com a fonte |

A coluna `porque` da auditoria é a que importa: sem ela o histórico serve para
listar, não para entender. Isso responde *"isso já aconteceu antes?"* com quem
gravou e em que data, em vez de uma resposta inventada com muita confiança.

### Comandos

```powershell
cd C:\Users\Lucas\Documents\A_Nzfiles\bots\discord\BOB

python bob.py observe --falha-alta    # 0 rodou · 1 achado de severidade alta
python bob.py painel                  # estado real, sem gráfico
python bob.py trilha                  # quem fez o que e por que
python bob.py saber <termo>           # consulta a base de conhecimento
python bob.py acao <tipo> --motivo …  # simulação por padrão
python bob.py acao <tipo> --motivo … --enviar
python bob.py aprovar <id>
```

`2` = configuração pendente (bot fora do servidor) e `3` = o portão recusou. São
separados do `1` de propósito: um é o dono ter que agir, o outro é o bot dizer
que não vai agir.

### O que ele não faz

Não dá poder de apagar canal nem editar cargo por conta própria. Não sobe
gateway. Não tem slash command. Cada um desses é decisão pendente do NZ, e
escrita sem freio é acidente com agendador.

## Armadilhas do API que custaram uma tentativa cada

Estão no código porque a segunda vez que o Discord devolve erro, a resposta tem
que ser óbvia:

- **`GET /guilds/{id}` e `/guilds/{id}/channels` dão códigos diferentes para o
  mesmo problema**: `10004 Unknown Guild` e `50001 Missing Access`. Casar num só
  deixa metade da falha virar traceback.
- **`HTTPError.read()` só funciona uma vez.** Ler o corpo na checagem de `429` e
  de novo na checagem de erro devolve string vazia na segunda — e o `if` que
  casava o código nunca disparava.
- **Timestamp vem `2026-10-12T18:43:34.606000+00:00`.** `strptime` com
  `%Y-%m-%dT%H:%M:%S%z` quebra nos microssegundos.
- **`parent_id` na criação de canal tem que ser uma categoria.** Passar canal de
  texto devolve `400 CHANNEL_PARENT_INVALID_TYPE "Not a category"`.
- **`/channels/{id}/threads/search` devolveu lista vazia para um tópico que
  existia**, enquanto `/guilds/{id}/threads/active` devolveu. Quase se conclui
  que a ação não tinha surtido efeito: **quando o efeito não aparece, a
  verificação pode ser a coisa errada.**
- **Bot novo tem 403 que parece token ruim.** Medir endpoint por endpoint antes
  de trocar o token: token inválido, bot fora do servidor e sem permissão naquele
  recurso chegam todos como 403.