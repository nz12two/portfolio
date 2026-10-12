#!/usr/bin/env node
/**
 * Troca os <i class="fa..."> do Font Awesome por <svg><use href="assets/icons.svg#id">
 * e remove a tag <link> do CDN.
 *
 * Por que: o Font Awesome por CDN custava 99,6 KB render-blocking e 2 requests
 * de terceiro para 31 icones. Um sprite SVG inline no repo custa 0 KB de rede
 * alem do proprio arquivo, funciona offline e herda currentColor.
 *
 * O mapeamento nao e automatizavel com seguranca: o nome da classe FA e o id do
 * symbol divergem em varios casos (fa-shield-alt -> shield, fa-node-js -> node).
 * A tabela abaixo e a fonte; um id ausente quebra o build em vez de gerar um
 * icone vazio silencioso.
 *
 * Rodar: node tools/icons-inline.js
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const ALVOS = ["index.html", "Readme.md"];

// classe FA -> id do <symbol> em assets/icons.svg
const MAPA = {
  "fa-globe": "globe",
  "fa-robot": "robot",
  "fa-server": "server",
  "fa-code": "code",
  "fa-cogs": "cogs",
  "fa-chart-line": "chart-line",
  "fa-bolt": "bolt",
  "fa-bullseye": "bullseye",
  "fa-chevron-down": "chevron-down",
  "fa-chevron-up": "chevron-up",
  "fa-cloud": "cloud",
  "fa-comment": "comment",
  "fa-database": "database",
  "fa-envelope": "envelope",
  "fa-headset": "headset",
  "fa-info-circle": "info-circle",
  "fa-paper-plane": "paper-plane",
  "fa-quote-left": "quote-left",
  "fa-rocket": "rocket",
  "fa-shield-alt": "shield",
  "fa-user": "user",
  "fa-code-branch": "code-branch",
  "fa-github": "github",
  "fa-discord": "discord",
  "fa-whatsapp": "whatsapp",
  "fa-js": "js",
  "fa-python": "python",
  "fa-react": "react",
  "fa-node-js": "node",
  "fa-plus": "plus",
  "fa-arrow-right": "arrow-right",
};

const SPRITE = path.join(RAIZ, "assets", "icons.svg");
const spriteIds = new Set(
  [...fs.readFileSync(SPRITE, "utf8").matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1])
);

// <i class="QUALQUER fa-classe"></i>  ->  <svg class="i ..." aria-hidden="true"><use href="..."></use></svg>
const RE = /<i\s+class="([^"]*\bfa-[a-z0-9-]+\b[^"]*)"\s*(?:aria-hidden="true")?\s*><\/i>/g;

function converter(classe) {
  const partes = classe.split(/\s+/);
  const faClasse = partes.find((c) => /^fa-[a-z0-9-]+$/.test(c));
  if (!faClasse) return null;
  const id = MAPA[faClasse];
  if (!id) return { erro: `sem mapeamento para ${faClasse}` };

  // Preserva as classes de estilo que nao sao do FA (ex: "auto-icon", "servico-icon")
  const manter = partes.filter((c) => !/^(fa[bsrl]?|fas|far|fab)$/.test(c) && !/^fa-[a-z0-9-]+$/.test(c));
  const cls = ["i", ...manter].join(" ");

  // aria-hidden: o icone e decorativo ao lado de um texto; em botao so de icone
  // o aria-label do <button> ja carrega o nome, entao duplicar seria ruido.
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${id}"></use></svg>`;
}

let totalTroca = 0;
const problemas = [];

for (const rel of ALVOS) {
  const p = path.join(RAIZ, rel);
  if (!fs.existsSync(p)) continue;
  const antes = fs.readFileSync(p, "utf8");
  const depois = antes.replace(RE, (todo, classe) => {
    const r = converter(classe);
    if (!r) return todo;
    if (r.erro) {
      problemas.push(`${rel}: ${r.erro}`);
      return todo;
    }
    totalTroca++;
    return r;
  });

  // remove a tag do CDN
  const limpo = depois.replace(/\s*<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com[^>]*>\s*/, "\n");

  if (limpo !== antes) fs.writeFileSync(p, limpo, "utf8");
}

const restantes = [];
for (const rel of ALVOS) {
  const p = path.join(RAIZ, rel);
  if (!fs.existsSync(p)) continue;
  const txt = fs.readFileSync(p, "utf8");
  for (const m of txt.matchAll(/fa-[a-z0-9-]+/g)) restantes.push(m[0]);
}
const usados = [...new Set(restantes)];

const semSprite = usados.filter((c) => MAPA[c] && !spriteIds.has(MAPA[c]));

console.log(`icones trocados: ${totalTroca}`);
console.log(`simbolos no sprite: ${spriteIds.size}`);
console.log(`classes FA restantes: ${usados.length}${usados.length ? " -> " + usados.join(", ") : ""}`);
if (semSprite.length) console.log(`SEM SYMBOL no sprite: ${semSprite.join(", ")}`);
if (problemas.length) {
  console.log("problemas:");
  problemas.forEach((x) => console.log("  " + x));
  process.exit(1);
}