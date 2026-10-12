<img src="assets/avatar.jpg" alt="NZ" width="140" style="border-radius: 50%;">

# NZ

Construo software que roda: plugin de detecção para servidores Minecraft, catálogos com auto-atualização e simulação multi-agente. Código aberto, passo a passo e o número medido.

[![GitHub](https://img.shields.io/badge/GitHub-nz12two-3b82f6?style=flat-square&logo=github)](https://github.com/nz12two)

## Números

Gerados da API do GitHub por `tools/update-evidence.js` — o valor abaixo é o do último `dados/evidencia.json`.

| | |
|---|---|
| **1,91 MB** de código publicado | 5 linguagens nos 4 repositórios |
| **19+** detectores independentes | no AntiXray, com motor de risco temporal |
| **380** páginas geradas em build | OpenDex, zero erros, ~36 s |
| **122** repositórios e **247** pacotes | indexados no OpenDex |

## Produtos

O catálogo tem busca, filtro e comparação: **[nz12two.github.io/portfolio/catalogo](https://nz12two.github.io/portfolio/catalogo/)**

| Produto | O que faz | Stack |
|---|---|---|
| [AntiXray](catalogo/antixray.html) | Detecção de x-ray para Paper 1.21.4 com evidência automática no flag | Java, Gradle, SQLite/MySQL |
| [API Directory](catalogo/api-directory.html) | Catálogo de APIs públicas com latência medida de fora | Python, JavaScript |
| [OpenDex](catalogo/opendex.html) | Catálogo e docs do ecossistema OpenCode | TypeScript, Astro, React |
| [EmpresasMundo](catalogo/empresas-mundo.html) | Entregas competindo por fitness, cada uma com rede neural recorrente própria | Python, OSMnx, FastAPI |
| [Baccana's Hub](catalogo/baccanas-hub.html) | Configuração e otimização de servidores Minecraft | Next.js, TypeScript |

## Repositórios

- [`nz12two/antixray`](https://github.com/nz12two/antixray) · [`api-directory`](https://github.com/nz12two/api-directory) · [`opendex`](https://github.com/nz12two/opendex) · [`empresas-mundo`](https://github.com/nz12two/empresas-mundo)

## Como o site é construído

Sem framework e sem build step de front. `node` regenera o que muda:

```
tools/update-evidence.js   -> dados/evidencia.json      (números da API do GitHub)
tools/exportar-estado.js   -> dados/estado.json         (estado real do runtime)
tools/gerar-catalogo.js    -> catalogo/dados/catalogo.json
tools/build-catalogo.js    -> catalogo/*.html
```

Estrutura:

```
index.html          home (vitrine, lab, novidades ao vivo)
conta.html          login/cadastro — único lugar que usa js/auth.js
catalogo/           índice interativo + páginas de produto (geradas)
dados/              evidencia.json (GitHub API), estado.json (runtime),
                    novidades.json e discord-estado.json (bot do Discord)
css/                main, hero, navega, lab, viz, vitrine-prev, produto,
                    catalogo, conta, vip
js/                 main, hero, navega, lab, viz, vitrine, previews, catalogo,
                    copiar, novidades, auth-config + auth (Supabase REST)
assets/             avatar, social-preview, brand/, produtos/
tools/              geradores — nada aqui é servido
.github/workflows/  bot do Discord (aviso de mudança de produto + novidades)
```

### `dados/estado.json` é local, e isso é proposital

`exportar-estado.js` lê `~/.banzinho/{state,logs}` — o estado do runtime que roda
o agente na máquina do NZ. Um runner do GitHub Actions não tem esse diretório,
então **essa ferramenta não roda no CI**: ela roda aqui, o arquivo gerado é
commitado, e o painel do laboratório lê o arquivo. Mesmo caminho de
`evidencia.json`, com a diferença de que o número do GitHub qualquer runner
busca e este só a máquina dele tem.

O gerador também é a barreira de privacidade. Ele redige caminho absoluto,
`sessionID` e porta para `<path>`, `<ses>` e `:<porta>`, e **aborta com código 2**
se algum desses vazar para o arquivo gravado. `tool-faults.jsonl` guarda a
chamada inteira da ferramenta com o código que tentou escrever; o gerador corta
antes dos argumentos e publica só a classe do erro.

O painel declara a idade do snapshot no rodapé e marca em amarelo acima de 30
dias, para o número não parecer de hoje quando não é.

Não existe `package.json` de propósito: o site é HTML/CSS/JS sem build de
front, e as ferramentas rodam em Node só com a stdlib (`node:`). Se um dia
aparecer `require("algo")` fora de `node:`, é dependência faltando e o
`package.json` precisa existir.

## Contato

**E-mail:** [nzjr123@gmail.com](mailto:nzjr123@gmail.com) · **GitHub:** [github.com/nz12two](https://github.com/nz12two) · **Discord:** `@nz12two`

---

<sub>© 2026 NZ</sub>