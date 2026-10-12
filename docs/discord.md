# Discord — plano e sincronia com o portfólio

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

## Configuração (NZ faz uma vez)

1. Criar o servidor, criar os canais acima.
2. `Servidor → Configurações → Integrações → Webhooks → Novo Webhook`, colar em
   `#anúncios`. Guardar a URL como secret `DISCORD_WEBHOOK_URL`.
3. Criar um bot em <https://discord.com/developers/applications>, convidar no
   servidor com permissão `View Channels` + `Read Message History` em
   `#anúncios` **e nada mais**. Token como secret `DISCORD_BOT_TOKEN`.
4. Convidar de convite (`/convite`), gravar a URL como `DISCORD_INVITE` no
   `tools/puxar-novidades.js` (ou variable do repo).
5. Subir o workflow.

Credencial que só o NZ tem: token e webhook. É o caso 5 de parada — eu deixo o
código pronto e ele roda quando colar os dois valores. Nada mais fica bloqueado.

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

O botão "Entrar no Discord" sai do `convite` que vem no mesmo arquivo. Enquanto
não houver convite publicado, o botão some e a frase diz que está em breve — e
não fica um `discord.gg/SEU-LINK` clicável apontando para invite inválido.

---

## Rodar local

```
node tools/aviso-discord.js            # mostra o que seria enviado, não envia
node tools/aviso-discord.js --enviar   # envia de verdade
node tools/puxar-novidades.js          # precisa de DISCORD_BOT_TOKEN no env
```

Dry-run é o padrão de propósito: rodar o script errado em cima do canal certo é
um post que ninguém consegue apagar direito.