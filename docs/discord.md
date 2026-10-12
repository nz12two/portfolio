# Discord — plano e sincronia com o portfólio

**Servidor criado em 2026-10-12.** Nome: **NZ Studios**. Convite:
<https://discord.gg/FwPq3hSmr>. Guild id `1559216448969248770` (confirmado pela
API — o id da barra de endereço do browser não era o mesmo).

Identidades prontas:
- Bot **`Banz`** (o bot do Banzinho) tem `Manage Channels + Manage Webhooks +
  View Channel + Read History` aqui, e é ele que lê o `#anúncios`.
- Webhook **`portfolio-push`** no `#anúncios` — é o que posta produto novo.

Canais que existem hoje: `#regras #geral #anúncios #antixray #ferramentas
#minecraft #feedback #sem-categoria` e o canal de voz `Geral`.

Falta criar: nada. Os secrets `DISCORD_WEBHOOK_URL` e `DISCORD_BOT_TOKEN` e as
variables `DISCORD_CANAL_ID` e `DISCORD_INVITE` já estão no repositório, e o
workflow foi testado ponta a ponta com um post real no `#anúncios`.

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
#anúncios        produto novo, versão nova, mudança de status. Só NZ.
                É este canal que a página lê (dados/novidades.json).
#antixray        uso, detecção, falso positivo, thresholds.
#ferramentas     api-directory, opendex: dúvida de dado e de integração.
#minecraft      Baccana's Hub, administração de servidor, plugins sob medida.
#feedback        o que está faltando. Post do NZ responde em 24h ou o issue
                vira produto — e volta pro produtos.json.
#sem-categoria   o que não coube em lugar nenhum. Fecha ou vira canal.
```

Categorias e domínios já existem como taxonomia declarada em `produtos.json`
(`tipo`, `dominio`) — o canal não é invenção nova, é a mesma taxonomia com outro
formato. Se um produto novo entra com `tipo` que não tem canal, ele cai em
`#sem-categoria` até o NZ decidir.

### Papéis

- **NZ** — dono. Vê tudo.
- **servidor** — 2 níveis de moderação, se precisar. Começar sem moderação
  automatizada: um bot de moderação em servidor de 20 pessoas é enfeite.

### Regras — três linhas, no canal de regras

1. Pergunta de produto vai no canal do produto. `geral` não existe de propósito.
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