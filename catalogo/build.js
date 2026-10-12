#!/usr/bin/env node
/**
 * Gera as páginas de produto a partir de catalogo/dados/produtos.json usando o
 * MESMO sistema visual da home v2.
 *
 * Antes estas páginas tinham CSS próprio (catalogo.css), o que produzia a pior
 * quebra possível: home nova abrindo página antiga. Duas direções visuais no
 * mesmo produto lê como site remontado. Agora existe uma fonte de estilo só,
 * v2/v2.css, e as classes daqui são desse sistema.
 *
 * Sem dependencia, sem framework — o mesmo esquema do portfolio.
 * Rodar: node catalogo/build.js
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const SAIDA = __dirname; // gera direto em catalogo/, linkado como ../catalogo/x.html
const CSS = "../v2/v2.css";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Estado -> cor e rotulo. Mesma semantica da home v2.
const ESTADO = {
  estavel: { txt: "estável", cls: "ok", cor: "var(--ok)" },
  beta: { txt: "beta", cls: "beta", cor: "var(--warn)" },
  "em-producao": { txt: "em produção", cls: "acc", cor: "var(--acc)" },
};
const EST = (p) => ESTADO[p.status] || ESTADO.estavel;

function paginaProduto(p) {
  const e = EST(p);

  const tags = (p.stack || [])
    .map((s) => `<span class="tag">${esc(s)}</span>`)
    .join("");

  const passos = (p.instalacao || [])
    .map(
      (i) => `
      <div class="step">
        <div class="step__n">${esc(i.passo)}</div>
        <div>
          <h3 class="step__t">${esc(i.titulo)}</h3>
          <pre class="step__code"><code>${esc(i.comando)}</code></pre>
          ${i.saida ? `<p class="step__out">saída: <code>${esc(i.saida)}</code></p>` : ""}
          ${i.nota ? `<p class="step__note">${esc(i.nota)}</p>` : ""}
        </div>
      </div>`
    )
    .join("");

  const quem = (p.para_quem || []).map((x) => `<li>${esc(x)}</li>`).join("");

  const tuto = p.tutorial
    ? `<section class="psec">
         <div class="eyebrow mono">tutorial</div>
         <h2>${esc(p.tutorial.titulo)}</h2>
         ${(p.tutorial.corpo || []).map((c) => `<p class="psec__p">${esc(c)}</p>`).join("")}
       </section>`
    : "";

  const links = [
    p.repo ? `<a class="btn btn--acc" href="${esc(p.repo)}" target="_blank" rel="noopener">Ver código</a>` : "",
    p.site ? `<a class="btn" href="${esc(p.site)}" target="_blank" rel="noopener">Abrir</a>` : "",
  ].join("\n        ");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.nome)} — NZ</title>
<meta name="description" content="${esc(p.tagline)}">
<link rel="stylesheet" href="${CSS}">
<link rel="stylesheet" href="pagina.css">
</head>
<body>

<header class="hdr">
  <div class="wrap hdr__in">
    <a href="../v2/index.html" class="brand">NZ <small>/ ${esc(p.nome)}</small></a>
    <nav class="nav"><a href="../v2/index.html">Produtos</a></nav>
    <a href="../v2/index.html#contato" class="btn btn--acc">Contato</a>
  </div>
</header>

<main class="wrap ppage">

  <a href="../v2/index.html" class="ppage__volta">← catálogo</a>

  <div class="eyebrow mono">${esc(p.categoria)}</div>
  <h1>${esc(p.nome)}</h1>
  <p class="ppage__tag">${esc(p.tagline)}</p>

  <div class="item__tags">
    <span class="tag tag--${e.cls}">${esc(e.txt)}</span>
    <span class="tag tag--acc">${esc(p.preco)}</span>
    <span class="tag">${esc(p.licenca)}</span>
    ${tags}
  </div>

  <p class="ppage__aviso">${esc(p.status_nota)}</p>

  <section class="psec psec--acc">
    <h2>Preço e licença</h2>
    <p class="psec__big">${esc(p.preco)}</p>
    <p class="psec__p">${esc(p.preco_nota)}</p>
  </section>

  <section class="psec">
    <h2>Para quem é</h2>
    <ul class="psec__ul">${quem}</ul>
  </section>

  <section class="psec">
    <div class="eyebrow mono">instalação</div>
    <h2>Passo a passo</h2>
    <div class="steps">
      ${passos}
    </div>
  </section>

  ${tuto}

  <div class="ppage__links">
        ${links}
  </div>
</main>

<footer class="ftr">
  <div class="wrap ftr__in">
    <span class="mono">NZ — construído à mão, sem template</span>
    <span class="mono"><a href="https://github.com/nz12two" style="color:var(--tx-2)">github.com/nz12two</a></span>
  </div>
</footer>

</body>
</html>
`;
}

function paginaIndice(prods) {
  const linhas = prods
    .map((p) => {
      const e = EST(p);
      return `      <a class="item" href="./${esc(p.slug)}.html">
        <span class="item__n">${String(prods.indexOf(p) + 1).padStart(2, "0")}</span>
        <div>
          <h3 class="item__name">${esc(p.nome)}</h3>
          <p class="item__desc">${esc(p.tagline)}</p>
          <div class="item__tags">
            <span class="tag tag--${e.cls}">${esc(e.txt)}</span>
            <span class="tag">${esc(p.categoria)}</span>
            <span class="tag tag--acc">${esc(p.preco)}</span>
          </div>
        </div>
        <span class="item__go" aria-hidden="true">&rarr;</span>
      </a>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Catálogo — NZ</title>
<meta name="description" content="Produtos que eu construo, com o que fazem, para quem são e como instalar.">
<link rel="stylesheet" href="${CSS}">
<link rel="stylesheet" href="pagina.css">
</head>
<body>

<header class="hdr">
  <div class="wrap hdr__in">
    <a href="../v2/index.html" class="brand">NZ <small>/ catálogo</small></a>
    <nav class="nav"><a href="../v2/index.html">Voltar</a></nav>
    <a href="../v2/index.html#contato" class="btn btn--acc">Contato</a>
  </div>
</header>

<main class="wrap ppage">
  <div class="eyebrow mono">catálogo</div>
  <h1 style="max-width:18ch">O que está pronto para você usar hoje</h1>
  <p class="ppage__tag" style="max-width:52ch">Cada produto tem o que faz, para quem é, quanto custa e como instalar. Sem waitlist.</p>
  <div class="items">
${linhas}
  </div>
</main>

</body>
</html>
`;
}

function main() {
  const src = path.join(__dirname, "dados", "produtos.json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(src, "utf8"));
  } catch (e) {
    console.error(`produtos.json inválido: ${e.message}`);
    process.exit(1);
  }
  const prods = data.produtos || [];
  if (!prods.length) {
    console.error("produtos.json sem produtos");
    process.exit(1);
  }

  let n = 0;
  for (const p of prods) {
    fs.writeFileSync(path.join(SAIDA, `${p.slug}.html`), paginaProduto(p));
    n++;
  }
  fs.writeFileSync(path.join(SAIDA, "index.html"), paginaIndice(prods));

  const semPreco = prods.filter((p) => !p.preco).length;
  const semTutorial = prods.filter((p) => !p.tutorial || !(p.tutorial.corpo || []).length).length;
  const semInstalacao = prods.filter((p) => !(p.instalacao || []).length).length;

  console.log(`${n} produto(s) -> ${path.relative(RAIZ, SAIDA)} (css: ${CSS})`);
  console.log(`  sem preco: ${semPreco} | sem tutorial: ${semTutorial} | sem instalacao: ${semInstalacao}`);
  if (semPreco || semTutorial || semInstalacao) {
    console.log("  aviso: produto incompleto ainda não está pronto para vender.");
  }
}

main();