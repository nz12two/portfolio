#!/usr/bin/env node
/**
 * Paginas de produto com area VIP. Gera a partir de catalogo/dados/produtos.json
 * mais catalogo/dados/vip.json (o que cada nivel desbloqueia).
 *
 * O catalogo ate agora era 5 paginas estaticas iguais. Isso e um PDF, nao um
 * catalogo: nao da para filtrar, comparar nem abrir o que so existe para quem
 * paga. Aqui cada produto ganha do que e gratuito, do que e VIP, e uma secao de
 * downloads que so renderiza para quem entrou.
 *
 * A parte honesta: o "login" e local (localStorage) porque nao existe backend
 * neste repositorio estatico. Isso NAO e seguranca — e um portao de vitrine. A
 * troca por auth de verdade (Supabase/Auth0/backend) e um arquivo so, porque a
 * fronteira esta isolada em vip.js. Digo isso na pagina em vez de fingir que
 * e conta com senha.
 *
 * Rodar: node catalogo/build.js
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
// As paginas de produto vao em catalogo/. Antes este era __dirname, que era a
// propria pasta do build — com o build movido para tools/ isso passou a gerar
// HTML dentro de tools/ em vez do catalogo.
const SAIDA = path.join(RAIZ, "catalogo");
const CSS = "../css/main.css";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ESTADO = {
  estavel: { txt: "estável", cls: "ok" },
  beta: { txt: "beta", cls: "beta" },
  "em-producao": { txt: "em produção", cls: "acc" },
};
const EST = (p) => ESTADO[p.status] || ESTADO.estavel;

function read(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, "catalogo", "dados", file), "utf8"));
  } catch {
    return fallback;
  }
}

function paginaProduto(p, vip) {
  const e = EST(p);
  const v = (vip && vip.produtos && vip.produtos[p.slug]) || { gratis: [], vip: [] };
  const temVip = (v.vip || []).length > 0;

  const tags = (p.stack || []).map((s) => `<span class="tag">${esc(s)}</span>`).join("");

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

  const blocoVip = temVip
    ? `<section class="vip" data-slug="${esc(p.slug)}">
         <div class="vip__head">
           <span class="tag tag--acc">VIP</span>
           <h2>O que o nível VIP destrava</h2>
         </div>
         <ul class="vip__list">
           ${(v.vip || []).map((x) => `<li data-vip-item><svg class="vip__lock" aria-hidden="true">…</svg> ${esc(x)}</li>`).join("")}
         </ul>
         <div class="vip__gate" data-gate>
           <p class="vip__msg">Conteúdo VIP. Entre para ver o download e o material completo.</p>
           <button class="btn btn--acc" data-vip-open>Entrar como VIP</button>
           <p class="vip__note">Acesso local, sem senha real: ainda não há servidor. Serve para testar a porta.</p>
         </div>
         <div class="vip__unlocked" data-unlocked hidden>
           <p class="vip__msg vip__msg--ok">Acesso liberado nesta máquina.</p>
           <a class="btn btn--acc" href="${esc(p.repo || "#")}" target="_blank" rel="noopener">Ir para o código</a>
         </div>
       </section>`
    : "";

  const gratis = (v.gratis || []).length
    ? `<section class="psec">
         <div class="eyebrow mono">grátis</div>
         <h2>O que já está liberado</h2>
         <ul class="psec__ul">${(v.gratis || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
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
<link rel="stylesheet" href="../css/produto.css">
<link rel="stylesheet" href="../css/vip.css">
</head>
<body>

<header class="hdr">
  <div class="wrap hdr__in">
    <a href="../index.html" class="brand">NZ <small>/ ${esc(p.nome)}</small></a>
    <nav class="nav"><a href="../index.html">Produtos</a></nav>
    <button class="btn btn--acc" data-vip-open>VIP</button>
  </div>
</header>

<main class="wrap ppage">

  <a href="../index.html" class="ppage__volta">← catálogo</a>

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
  ${gratis}
  ${blocoVip}

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

<script src="../js/vip.js" defer></script>
</body>
</html>
`;
}

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(RAIZ, "catalogo", "dados", "produtos.json"), "utf8"));
  } catch (e) {
    console.error(`produtos.json inválido: ${e.message}`);
    process.exit(1);
  }
  const prods = data.produtos || [];
  if (!prods.length) {
    console.error("produtos.json sem produtos");
    process.exit(1);
  }
  const vip = read("vip.json", null);

  // So as paginas de produto sao geradas. O indice NAO e gerado: e a pagina
  // interativa, escrita a mao porque precisa dos controles de busca e filtro no
  // HTML. Ela consum catalogo.json e nao depende deste arquivo — se este
  // sobrescrevesse index.html, o catalogo voltaria a ser lista estatica.
  let n = 0;
  for (const p of prods) {
    fs.writeFileSync(path.join(SAIDA, `${p.slug}.html`), paginaProduto(p, vip));
    n++;
  }

  const comVip = vip ? prods.filter((p) => vip.produtos?.[p.slug]?.vip?.length).length : 0;
  console.log(`${n} pagina(s) de produto -> ${path.relative(RAIZ, SAIDA)}`);
  console.log(`  com area VIP: ${comVip}/${n}`);
  console.log(`  index.html nao e gerado (interativo, usa dados/catalogo.json)`);
}

main();