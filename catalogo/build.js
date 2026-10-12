#!/usr/bin/env node
/**
 * Gera o catalogo estatico a partir de catalogo/dados/produtos.json.
 *
 * Por que existe: a vitrine e a fonte de verdade sao coisas separadas. O JSON
 * guarda o que cada produto E (preco, para quem, tutorial); este script so
 * escreve o HTML. Editar a vitrine na mao era o que fazia o catalogo divergir
 * do repo.
 *
 * Sem dependencia, sem framework: e o mesmo esquema do api-directory e do
 * portfolio. Rodar: node catalogo/build.js
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
// Saida direto em catalogo/: a home linka "catalogo/antixray.html", e um
// diretorio intermediario "paginas" transformava todo link em caminho errado.
const SAIDA = __dirname;
const BASE = process.env.BASE_URL || "https://nz12two.github.io/portfolio";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BADGE = {
  estavel: { txt: "estavel", cor: "#3fb950" },
  beta: { txt: "beta", cor: "#d29922" },
  "em-producao": { txt: "em producao", cor: "#58a6ff" },
};

const STATUS_TXT = { estavel: "Estavel", beta: "Beta", "em-producao": "Em producao" };

function paginaProduto(p) {
  const badge = BADGE[p.status] || BADGE.estavel;
  const h1 = `<h1>${esc(p.nome)}</h1>`;
  const tag = `<p class="tagline">${esc(p.tagline)}</p>`;
  const meta = `<div class="meta">
      <span class="badge" style="--c:${badge.cor}">${esc(STATUS_TXT[p.status] || p.status)}</span>
      <span class="badge neutro">${esc(p.categoria)}</span>
      <span class="badge neutro">${esc(p.preco)}</span>
      <span class="badge neutro">${esc(p.licenca)}</span>
    </div>`;
  const aviso = `<p class="aviso">${esc(p.status_nota)}</p>`;

  const quem = `<section><h2>Para quem e</h2><ul>${(p.para_quem || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>`;

  const stack = `<section><h2>Stack</h2><p class="chips">${(p.stack || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</p></section>`;

  const passos = `<section><h2>Instalacao</h2><ol class="passos">${(p.instalacao || [])
    .map(
      (i) => `<li>
        <h3><span class="num">${esc(i.passo)}</span>${esc(i.titulo)}</h3>
        <pre><code>${esc(i.comando)}</code></pre>
        ${i.saida ? `<p class="saida">saida: <code>${esc(i.saida)}</code></p>` : ""}
        ${i.nota ? `<p class="nota">${esc(i.nota)}</p>` : ""}
      </li>`
    )
    .join("")}</ol></section>`;

  const tuto = p.tutorial
    ? `<section><h2>${esc(p.tutorial.titulo)}</h2>${(p.tutorial.corpo || [])
        .map((c) => `<p>${esc(c)}</p>`)
        .join("")}</section>`
    : "";

  const preco = `<section class="preco"><h2>Preco e licenca</h2><p><strong>${esc(p.preco)}</strong></p><p class="nota">${esc(p.preco_nota)}</p></section>`;

  const links = [
    p.repo ? `<a class="btn" href="${esc(p.repo)}" target="_blank" rel="noopener">Ver codigo</a>` : "",
    p.site ? `<a class="btn" href="${esc(p.site)}" target="_blank" rel="noopener">Abrir</a>` : "",
  ].join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.nome)} — Catalogo NZ</title>
<meta name="description" content="${esc(p.tagline)}">
<link rel="stylesheet" href="./catalogo.css">
</head>
<body>
<main>
  <a class="volta" href="./index.html">&larr; Catalogo</a>
  ${h1}${tag}${meta}${aviso}
  ${preco}${quem}${passos}${tuto}${stack}
  <p class="links">${links}</p>
</main>
</body>
</html>`;
}

function paginaIndice(prods) {
  const cards = prods
    .map((p) => {
      const badge = BADGE[p.status] || BADGE.estavel;
      return `<a class="card" href="./${esc(p.slug)}.html">
        <span class="badge" style="--c:${badge.cor}">${esc(STATUS_TXT[p.status] || p.status)}</span>
        <h2>${esc(p.nome)}</h2>
        <p>${esc(p.tagline)}</p>
        <span class="card-meta">${esc(p.categoria)} · ${esc(p.preco)} · ${esc(p.licenca)}</span>
      </a>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Catalogo — NZ</title>
<meta name="description" content="Produtos que eu faco: plugin Paper, catalogos de API, simulacao multi-agente e servicos para servidor Minecraft.">
<link rel="stylesheet" href="./catalogo.css">
</head>
<body>
<main>
  <h1>Catalogo</h1>
  <p class="tagline">Produtos que eu construo, com o que eles fazem, para quem sao e como instalar.</p>
  <div class="grid">
${cards}
  </div>
</main>
</body>
</html>`;
}

const CSS = `:root{--bg:#0d1117;--fg:#e6edf3;--dim:#8b949e;--line:#30363d;--acc:#58a6ff}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 ui-sans-serif,system-ui,"Segoe UI",sans-serif}
main{max-width:860px;margin:0 auto;padding:48px 20px 80px}
h1{font-size:2.1rem;margin:0 0 .3em;letter-spacing:-.02em}
h2{font-size:1.25rem;margin:2.2em 0 .6em;letter-spacing:-.01em}
h3{font-size:1.02rem;margin:0 0 .5em}
a{color:var(--acc)}
.volta{display:inline-block;margin-bottom:1.5em;text-decoration:none;font-size:.9rem}
.tagline{color:var(--dim);font-size:1.08rem;margin:0 0 1.2em}
.meta{display:flex;flex-wrap:wrap;gap:.5em;margin:0 0 1.4em}
.badge{font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;padding:.24em .7em;border-radius:999px;border:1px solid var(--c,var(--line));color:var(--c,var(--dim))}
.badge.neutro{--c:var(--line)}
.aviso{border-left:3px solid #d29922;padding:.1em 0 .1em 1em;color:var(--dim);font-size:.94rem}
ul,ol{padding-left:1.3em}
li{margin:.45em 0}
.chips{display:flex;flex-wrap:wrap;gap:.5em}
.chip{font-size:.85rem;border:1px solid var(--line);border-radius:6px;padding:.15em .6em;color:var(--dim)}
.passos{list-style:none;padding:0}
.passos>li{border:1px solid var(--line);border-radius:10px;padding:1em 1.2em;margin:.8em 0}
.num{display:inline-block;width:1.6em;height:1.6em;line-height:1.6em;text-align:center;border-radius:50%;background:var(--acc);color:#0d1117;font-size:.8rem;font-weight:700;margin-right:.6em}
pre{background:#161b22;border:1px solid var(--line);border-radius:8px;padding:.8em 1em;overflow-x:auto}
code{font-family:ui-monospace,"JetBrains Mono",Consolas,monospace;font-size:.9em}
.saida,.nota{color:var(--dim);font-size:.92rem}
.preco{background:#161b22;border:1px solid var(--line);border-radius:10px;padding:1em 1.3em}
.preco h2{margin-top:0}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));margin-top:2em}
.card{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:12px;padding:1.2em;background:#161b22;transition:border-color .15s,transform .15s}
.card:hover{border-color:var(--acc);transform:translateY(-2px)}
.card h2{font-size:1.2rem;margin:.5em 0 .3em}
.card p{color:var(--dim);font-size:.94rem;margin:0 0 .8em}
.card-meta{font-size:.8rem;color:var(--dim);font-family:ui-monospace,monospace}
.links{display:flex;gap:.7em;margin-top:2.5em}
.btn{border:1px solid var(--acc);border-radius:8px;padding:.5em 1.1em;text-decoration:none;font-size:.94rem}
@media (prefers-color-scheme:light){:root{--bg:#fff;--fg:#1f2328;--dim:#59636e;--line:#d1d9e0;--acc:#0969da}pre,.card,.preco{background:#f6f8fa}}
`;

function main() {
  const src = path.join(RAIZ, "catalogo", "dados", "produtos.json");
  const raw = fs.readFileSync(src, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`produtos.json invalido: ${e.message}`);
    process.exit(1);
  }
  const prods = data.produtos || [];
  if (!prods.length) {
    console.error("produtos.json sem produtos");
    process.exit(1);
  }

  fs.mkdirSync(SAIDA, { recursive: true });
  fs.writeFileSync(path.join(SAIDA, "catalogo.css"), CSS);

  let n = 0;
  for (const p of prods) {
    const file = path.join(SAIDA, `${p.slug}.html`);
    fs.writeFileSync(file, paginaProduto(p));
    n++;
  }
  fs.writeFileSync(path.join(SAIDA, "index.html"), paginaIndice(prods));

  const slugs = prods.map((p) => p.slug);
  const semPreco = prods.filter((p) => !p.preco).length;
  const semTutorial = prods.filter((p) => !p.tutorial || !(p.tutorial.corpo || []).length).length;
  const semInstalacao = prods.filter((p) => !(p.instalacao || []).length).length;

  console.log(`${n} produto(s) -> ${path.relative(RAIZ, SAIDA)}`);
  console.log(`  sem preco: ${semPreco} | sem tutorial: ${semTutorial} | sem instalacao: ${semInstalacao}`);
  console.log(`  slugs: ${slugs.join(", ")}`);
  if (semPreco || semTutorial || semInstalacao) {
    console.log("  aviso: produto sem preco/tutorial/instalacao nao esta pronto para vender.");
  }
}

main();