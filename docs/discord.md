# Discord — plano e sincronia com o portfólio

**Servidor criado em 2026-10-12.** Nome: **NZ Studios**. Convite:
<https://discord.gg/FwPq3hSmr>. Guild id `1559216448969248770` (confirmado pela
API — o id da barra de endereço do browser não era o mesmo).

Identidades prontas:
- Bot **`Banz`** (o bot do Banzinho) tem `Manage Channels + Manage Webhooks +
  View Channel + Read History` aqui, e é ele que lê o `#anúncios`.
- Webhook **`portfolio-push`** no `#anúncios` — é o que posta produto novo.

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
| Jogo / simulação | 🎮 Jogos |
| Agente | 🤖 Agentes |

Duas traduções merecem justificativa: `Serviço` virou **Otimizações** porque a
tagline do Baccana's Hub é otimização de servidor Paper, e `Ferramenta` virou
**Sites** porque as duas ferramentas do catálogo são catálogos web já no ar. O
rótulo do produto não muda — muda o nome da prateleira onde ele fica.

```
Info
   📢 anúncios        texto, somente leitura — o webhook é o único que escreve
   🎨 regras          texto, mensagem fixada
   📌 informações     texto — o mapa do servidor, sem pergunta e sem bug
   🗣️ geral           texto — apresentação; dúvida de produto vai no fórum

🔌 Plugins
   🛡️ antixray        fórum — Bug, Dúvida, Configuração, Falso positivo

⚙️ Otimizações
   🔧 baccanas-hub    fórum — Orçamento, Suporte, Dúvida

🌐 Sites
   📚 api-directory   fórum — API fora do ar, Dúvida, Item faltando
   📦 opendex         fórum — Dúvida, Item faltando, Erro

🤖 Agentes
   🤖 banzinho        fórum — Dúvida, Sugestão

🎮 Jogos
   🏙️ empresas-mundo  fórum — Dúvida, Modelo, Erro

💬 Comunidade
   📣 feedback        fórum — Funcionalidade, Bug, Outro
   🛠️ solicitar       fórum — Serviço, Parceria
   💡 sugestões       fórum — Sugestão, Melhoria
   🗂️ sem-categoria  texto

🔊 Voz
   🔊 Geral
```

**Por que fórum e não texto.** Em canal de texto, o bug de janeiro e o de
outubro ficam na mesma pilha e ninguém acha o antigo. Em fórum, cada assunto é
uma página com título próprio, tag e status de respondida — e o canal mostra
quantas há sem ninguém precisar ler. Foi a decisão que mudou o servidor de
"lista de canais" para estrutura.

Cada fórum de produto tem **tópico igual à tagline** que o cartão da vitrine
mostra, mais a prova e o link. Canal e página contam a mesma coisa: mesma fonte,
dois lugares, nenhuma versão para manter em dia.

`#anúncios` está com `@everyone` sem permissão de enviar. O aviso entra por
webhook, que tem permissão própria — se o canal aceitasse escrita humana, ele
seria mais um lugar onde atualização envelhece.

**Onboarding** gravado e **desligado**: uma pergunta ("O que te trouxe aqui?")
com os nove fóruns como opção, entrada por `#regras` e `#informações`, e uma
etapa explicando as regras. O Discord recusa ligar sozinho com `350000
requirements are not met` — a checagem é dele, não é campo inválido, e insistir
no mesmo `PUT` não muda a resposta. Ligar é um interruptor em
`Configurações do servidor → Ativação`, e ele já está com tudo preenchido.

Papel `membro`: o Discord exige que cada opção de onboarding aponte para um
papel que exista, e `@everyone` responde `UNKNOWN_ROLE` para o bot. Um papel só
serve para as nove opções — ele marca "passou pelo onboarding" e não cria nove
cargos para depois não saber o que fazer com eles.

Falta criar: nada. Os secrets `DISCORD_WEBHOOK_URL` e `DISCORD_BOT_TOKEN` e as
variables `DISCORD_CANAL_ID` e `DISCORD_INVITE` já estão no repositório, e o
circuito webhook → post → leitura pelo bot foi medido ponta a ponta.

Por que este documento: o portfólio é estático e o `catalogo/dados/produtos.json`
é a fonte de verdade dos produtos. Um Discord separado disso vira o segundo lugar
onde o produto muda — e o primeiro lugar a divergir. Aqui o Discord é **destino
das mudanças de verdade**, não um segundo catálogo.

Duas direções, deliberadamente separadas porque têm custos e credenciais
diferentes:

| direção | quem manda | custo | credencial | script |
|---|---|---|---|---|
| produto → Discord | `produtos.json` | webhook, sem bot | `DISCORD_WEBHOOK_URL` | `tools/aviso-discord.js` |
| Discord → página | canal `#anuncios` | bot REST, sem gateway | `DISCORD_BOT_TOKEN` | `tools/puxar-novidades.js` |

Nenhuma das duas exige o bot ligado 24h. A segunda usa só REST
(`GET /channels/{id}/messages`) — sem gateway, sem message content intent, sem
processo vivo. Roda no CI por cron e grava `dados/novidades.json`.

---

## Estrutura do servidor

O servidor tem **um produto cada canal**. Um canal `#geral` com seis produtos é
onde atualização morre: ninguém abre, e o dado envelhece sem ninguém perceber. O
canal é o produto; o canal genérico é onde o assunto vai morrer.

```
#regras          as três regras abaixo, fixadas.
#anúncios        produto novo, versão nova, mudança de status. Só o webhook
                escreve. É este canal que a página lê (dados/novidades.json).
#geral           apresentação e conversa solta, não suporte.

fórum por produto, um assunto por postagem:
  antixray        uso, detecção, falso positivo, thresholds.
  baccanas-hub    orçamento, suporte, otimização de servidor.
  api-directory   API fora do ar, dúvida de dado.
  opendex         item faltando, erro, dúvida de integração.
  empresas-mundo  modelo, grafo, simulação.
  banzinho        dúvida e sugestão sobre o agente.
  feedback        o que está faltando. Post do NZ responde em 24h ou o issue
                  vira produto — e volta pro produtos.json.
```

Categorias e domínios já existem como taxonomia declarada em `produtos.json`
(`tipo`, `categoria`, `dominio`) — o canal não é invenção nova, é a mesma
taxonomia com outro formato. A categoria usa **`categoria`** (o tipo de
trabalho), não `dominio` (onde o produto roda): `minecraft` e `dados` são o
assunto, e assunto é assunto de fórum, não de prateleira. Produto novo cujo
`categoria` ainda não tem prateleira cai em `#sem-categoria` até o NZ decidir.

A lista com categoria e tópico de cada canal é o **estado** e fica no topo deste
documento; esta seção é a **regra** que justifica o estado.

### Papéis

- **NZ** — dono. Vê tudo.
- **servidor** — 2 níveis de moderação, se precisar. Começar sem moderação
  automatizada: um bot de moderação em servidor de 20 pessoas é enfeite.

### Regras — três linhas, no canal de regras

1. Pergunta de produto vai no fórum do produto. `#geral` existe para apresentação
   e conversa solta, não para suporte — a diferença é que ninguém com a resposta
   está lendo `#geral`.
2. Bug: o que você fez, o que esperava, o log. Sem log eu não consigo responder.
3. Nada de link de servidor de terceiros. Um spam em servidor pequeno mata o
   sinal e o NZ para de olhar.

---

## Como cada canal recebe conteúdo

| evento no repositório | vai para |
|---|---|
| produto novo em `produtos.json` | `#anúncios` + canal do produto |
| `status` muda (beta → estável) | `#anúncios` + canal do produto |
| `preco` muda | `#anúncios` + canal do produto |
| `prova.num` muda | `#anúncios` + canal do produto |
| release no GitHub (tag) | canal do produto |

As quatro primeiras saem sozinhas, pelo `tools/aviso-discord.js` — que só posta
o que **mudou**, comparando com `dados/discord-estado.json`. Release no GitHub
fica manual por enquanto: um workflow que lê tag e formata embed é a mesma
mecânica, entra quando existir a primeira tag.

---

## Configuração — feito em 2026-10-12

Servidor, canais e webhook saíram pela API depois que o bot entrou; o que ficou
gravado no repositório:

| onde | valor |
|---|---|
| secret `DISCORD_WEBHOOK_URL` | webhook `portfolio-push` do `#anúncios` |
| secret `DISCORD_BOT_TOKEN` | token do bot `Banz` (`BANZ_TOKEN`) |
| variable `DISCORD_CANAL_ID` | `1559216733506764821` (id do `#anúncios`) |
| variable `DISCORD_INVITE` | <https://discord.gg/FwPq3hSmr> |

Reutilizar o token do `Banzinho` em vez de criar um aplicativo "NZ Studios" é
uma troca deliberada: mesmo token, um lugar a menos para vazar credencial. O
custo é que o bot que lê o feed também é o que atende o NZ no servidor — se
ele cair, o feed cai junto. Quando der, trocar por token dedicado no
Developer Portal é uma variável nova, não uma mudança de desenho.

Para reautorizar o bot depois de trocar o token:

```
https://discord.com/oauth2/authorize?client_id=1503083764178227342&scope=bot&permissions=74756
```

---

## Estado no repositório

```
dados/discord-estado.json   o que já foi anunciado (snapshot, evita post duplo)
dados/novidades.json         últimas de #anúncios, lido pela home
```

`novidades.json` é gerado, nunca editado à mão — igual `evidencia.json`. A home
lê esse arquivo e, se ele não existir ou estiver velho, **a seção não aparece**.
Feed de atualização quebrado na home é pior que feed ausente: a pessoa vê um
card de 3 semanas e pensa que o produto parou.

O botão "Entrar no Discord" tem o convite no `index.html`, porque o servidor
existe e o link é válido — esperar o bot para publicar o link deixaria a home sem
botão por causa de uma credencial. Quando `novidades.json` trouxer um `convite`,
ele sobrescreve o `href`; nunca esconde um botão que já funciona.

---

## Rodar local

```
node tools/aviso-discord.js            # mostra o que seria enviado, não envia
node tools/aviso-discord.js --enviar   # envia de verdade
node tools/puxar-novidades.js          # precisa de DISCORD_BOT_TOKEN no env
```

Dry-run é o padrão de propósito: rodar o script errado em cima do canal certo é
um post que ninguém consegue apagar direito.