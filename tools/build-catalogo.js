#!/usr/bin/env node
/**
 * Gera as paginas de produto a partir de catalogo/dados/produtos.json.
 *
 * Este arquivo NAO gera o indice. O indice e a pagina interativa, escrita a
 * mao porque os controles de busca e filtro precisam estar no HTML; ela le
 * dados/catalogo.js. Se este sobrescrevesse index.html, o catalogo voltaria a
 * ser lista estatica — o que ja aconteceu uma vez.
 *
 * Sem dependencia e sem framework. Rodar: node tools/build-catalogo.js
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
// As paginas vao em catalogo/. Antes este era __dirname, que era a propria
// pasta do build — quando o build se moveu para tools/ passou a gerar HTML
// dentro de tools/ em vez do catalogo.
const SAIDA = path.join(RAIZ, "catalogo");
const CSS = "../css/main.css";
// Origem publica. Canonical e og:image exigem URL absoluta; deriving do remote
// do git mantem os dois corretos se o repo mudar de dono ou de conta.
const SITE = "https://nz12two.github.io/portfolio";
const DADOS = path.join(RAIZ, "catalogo", "dados");

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ESTADO = {
  estavel: { txt: "estável", cls: "ok" },
  beta: { txt: "beta", cls: "beta" },
  "em-producao": { txt: "em produção", cls: "acc" },
  // "privado" entrou com o agente. Sem ele aqui, EST() cairia em estavel e o
  // rodape afirmaria que um projeto fechado e "estável".
  privado: { txt: "fechado", cls: "acc" },
};
const EST = (p) => ESTADO[p.status] || ESTADO.estavel;

function read(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DADOS, file), "utf8"));
  } catch {
    return fallback;
  }
}

// Preco zero e "gratis" no sentido do site, seja escrito R$ 0, gratuito ou
// free. Tudo o mais e plano pago.
const E_GRATIS = (preco) => /^(r\$\s*0|gratuito|gratis|free)$/i.test(String(preco).trim());

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
          <div class="code">
            <button type="button" class="code__copy" data-copy aria-label="Copiar comando">
              <span class="code__ico" aria-hidden="true"></span><span class="code__txt">copiar</span>
            </button>
            <pre class="step__code"><code>${esc(i.comando)}</code></pre>
          </div>
          ${i.saida ? `<p class="step__out">saída: <code>${esc(i.saida)}</code></p>` : ""}
          ${i.nota ? `<p class="step__note">${esc(i.nota)}</p>` : ""}
        </div>
      </div>`
    )
    .join("");

  const quem = (p.para_quem || []).map((x) => `<li>${esc(x)}</li>`).join("");

  // Numero medido de dentro do projeto, em bloco proprio. No cartao do
  // catalogo a metrica entra numa linha; aqui ela vira painel, porque e a
  // pagina do produto e o numero e a unica prova que ela tem. Os rotulos sao
  // humanizados a mao (o JSON guarda a chave crua para o JS do catalogo).
  const ROTULO_NUM = {
    subsistemas: "subsistemas",
    linhas: "linhas de código",
    verificadores: "verificadores de regra",
    commits: "commits",
    primeira_data: "primeiro commit",
    sessoes_medidas: "sessões medidas",
    tools: "tools no catálogo",
    tools_com_contrato: "tools com contrato",
  };
  const numeros = p.status_extra || null;
  const blocoNumeros = numeros
    ? `<section class="psec">
         <div class="eyebrow mono">medido no código</div>
         <h2>O tamanho real, não o redigido</h2>
         <dl class="pnums">
           ${Object.entries(numeros)
             .map(([k, v]) => `<div><dt>${esc(ROTULO_NUM[k] || k)}</dt><dd>${esc(String(v))}</dd></div>`)
             .join("")}
         </dl>
       </section>`
    : "";

  // Projeto fechado. Aparece na pagina E no cartao: o NZ pediu para deixar
  // claro que o codigo nao esta no GitHub e vai ser distribuido depois. O
  // compromisso vai sem data — prazo aqui seria numero falso.
  const blocoFechado = p.status === "privado"
    ? `<section class="psec psec--priv">
         <div class="eyebrow mono">projeto fechado</div>
         <h2>Roda fechado, e isso é uma escolha</h2>
         <p class="psec__p">${esc(p.distribuicao || "")}</p>
         <p class="psec__p psec__p--fraco">${esc(p.preco_nota || "")}</p>
       </section>`
    : "";

  const seccaoDiferenca = p.diferenca
    ? `<section class="psec">
         <div class="eyebrow mono">o diferencial</div>
         <h2>O que este projeto faz diferente</h2>
         <p class="psec__p">${esc(p.diferenca)}</p>
       </section>`
    : "";

  const seccaoFaz = (p.o_que_faz || []).length
    ? `<section class="psec">
         <h2>O que ele faz</h2>
         <ul class="psec__ul">${(p.o_que_faz || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
       </section>`
    : "";

  const tuto = p.tutorial
    ? `<section class="psec">
         <div class="eyebrow mono">tutorial</div>
         <h2>${esc(p.tutorial.titulo)}</h2>
         ${(p.tutorial.corpo || []).map((c) => `<p class="psec__p">${esc(c)}</p>`).join("")}
       </section>`
    : "";

  // Captura real do produto, ou o motivo de nao existir. Nada de imagem gerada
  // por codigo: fingir captura e pior que nao ter imagem.
  const foto = p.imagem
    ? `<figure class="shot">
         <img src="${esc(p.imagem)}" alt="${esc(p.imagem_alt)}" width="1100" height="739" decoding="async">
         <figcaption>
           Captura real${p.capturado_em ? ` em ${esc(p.capturado_em)}` : ""}${p.captura_origem ? ` · <a href="${esc(p.captura_origem)}" target="_blank" rel="noopener">ver no ar</a>` : ""}
         </figcaption>
       </figure>`
    : `<p class="shot shot--vazio">${esc(p.imagem_motivo || "Sem imagem.")}</p>`;

  // Planos. Substituem a antiga secao "VIP": a pergunta real e "custa quanto e
  // o que muda", e "o que o nivel destrava" nao respondia nenhuma das duas.
  const todosPlanos = v.planos || [];
  const gratisPlanos = todosPlanos.filter((x) => E_GRATIS(x.preco));
  const pagosPlanos = todosPlanos.filter((x) => !E_GRATIS(x.preco));

  const cardPlano = (pl, itens, gratis) => `
        <article class="plano"${gratis ? ' data-gratis="1"' : ""}>
          <header class="plano__hd">
            <h3 class="plano__nome">${esc(pl.nome)}</h3>
            <p class="plano__preco${gratis ? " plano__preco--zero" : ""}">${esc(pl.preco)}</p>
          </header>
          <p class="plano__resumo">${esc(pl.resumo)}</p>
          <ul class="plano__list">
            ${itens.map((x) => `<li><span class="plano__pip" aria-hidden="true"></span>${esc(x)}</li>`).join("")}
          </ul>
          ${pl.diferenca ? `<p class="plano__dif">${esc(pl.diferenca)}</p>` : ""}
        </article>`;

  const blocoPlanos = todosPlanos.length
    ? `<section class="planos" data-slug="${esc(p.slug)}">
         <div class="eyebrow mono">planos</div>
         <h2>O que é grátis, e o que a versão paga acrescenta</h2>
         <p class="planos__lead">
           O que está no GitHub continua gratuito, com a mesma licença e sem
           conta. A versão paga não é o código trancado — é o mesmo código
           calibrado para o seu caso, com alguém olhando junto.
         </p>
         <div class="planos__grid">
           ${gratisPlanos.map((pl) => cardPlano(pl, v.gratis || [], true)).join("")}
           ${pagosPlanos.map((pl) => cardPlano(pl, v.vip || [], false)).join("")}
         </div>
         ${
           temVip
             ? `<div class="planos__acesso">
           <div class="vip__gate" data-gate>
             <p class="vip__msg">Quer ver o material do nível pago?</p>
             <a class="btn btn--acc" href="../conta.html">Entrar na conta</a>
             <p class="vip__note">O material pago fica atrás da sua conta. Sem conta, o que está aqui é o nível grátis.</p>
           </div>
           <div class="vip__unlocked" data-unlocked hidden>
             <p class="vip__msg vip__msg--ok">Sessão ativa.</p>
             <a class="btn btn--acc" href="${esc(p.repo || "#")}" target="_blank" rel="noopener">Ir para o código</a>
           </div>
         </div>`
             : ""
         }
         <p class="planos__aviso">
           Preço é sugestão, e nada aqui está cobrando ninguém ainda. Preferi
           deixar o valor visível antes de a cobrança funcionar do que montar um
           checkout que não entrega.
         </p>
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
<!-- Canonical e OG por produto. A URL precisa ser absoluta: e o valor que o
     WhatsApp e o Telegram guardam quando alguem compartilha, e o caminho
     relativo so funciona enquanto a pagina estiver na mesma pasta. A imagem
     preferida e a captura real do produto; sem ela cai na previa do site. -->
<link rel="canonical" href="${SITE}/catalogo/${esc(p.slug)}.html">
<meta property="og:type" content="article">
<meta property="og:site_name" content="NZ">
<meta property="og:title" content="${esc(p.nome)} — NZ">
<meta property="og:description" content="${esc(p.tagline)}">
<meta property="og:url" content="${SITE}/catalogo/${esc(p.slug)}.html">
<meta property="og:image" content="${p.imagem ? SITE + "/" + p.imagem.replace(/^(\.\.\/)+/, "") : SITE + "/assets/social-preview.png"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="${CSS}">
<link rel="stylesheet" href="../css/produto.css">
<link rel="stylesheet" href="../css/vip.css">
<!-- Sem isto o navegador pede /favicon.ico e leva 404 nas seis paginas de
     produto (medido na varredura das nove paginas do site). -->
<link rel="icon" href="../assets/brand/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="../assets/brand/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="../assets/brand/app-icon-512.png">
</head>
<body>

<header class="hdr">
  <div class="wrap hdr__in">
    <a href="../index.html" class="brand">NZ <small>/ ${esc(p.nome)}</small></a>
    <nav class="nav"><a href="../index.html">Produtos</a></nav>
    <a class="btn btn--acc" href="../conta.html" data-conta-open>VIP</a>
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

  ${blocoFechado}
  ${blocoNumeros}
  ${foto}

  ${seccaoDiferenca}
  ${seccaoFaz}

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
  ${blocoPlanos}

  <div class="ppage__links">
        ${links}
  </div>
</main>

<footer class="ftr">
  <div class="wrap ftr__in">
    <!-- Rodapé com o dado do produto, nao com elogio genérico. "Construído à
         mão, sem template" não mudava nunca e não dizia nada. -->
    <!-- O rodape repete o status com o MESMO mapa que a vitrine usa. Antes
         caia num ternario que so conhecia beta e em-producao, e todo produto
         novo virava "estavel" — foi o que aconteceu com o agente, que e
         fechado, e o rodape afirmava que era estavel. -->
    <span class="mono">${esc(p.nome)} · ${esc(EST(p).txt)} · ${esc(p.licenca)}</span>
    <span class="mono"><a href="https://github.com/nz12two" style="color:var(--tx-2)">github.com/nz12two</a></span>
  </div>
</footer>

<script src="../js/auth-config.js"></script>
<script src="../js/auth.js" defer></script>
<script src="../js/copiar.js" defer></script>
</body>
</html>
`;
}

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(DADOS, "produtos.json"), "utf8"));
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

  let n = 0;
  for (const p of prods) {
    fs.writeFileSync(path.join(SAIDA, `${p.slug}.html`), paginaProduto(p, vip));
    n++;
  }

  const comPlanos = vip ? prods.filter((p) => (vip.produtos?.[p.slug]?.planos || []).length).length : 0;
  const comPagos = vip
    ? prods.filter((p) => (vip.produtos?.[p.slug]?.planos || []).some((x) => !E_GRATIS(x.preco))).length
    : 0;
  console.log(`${n} pagina(s) de produto -> ${path.relative(RAIZ, SAIDA)}`);
  console.log(`  com planos: ${comPlanos}/${n} | com plano pago: ${comPagos}/${n}`);
  console.log(`  index.html nao e gerado (interativo, usa dados/catalogo.js)`);
}

main();