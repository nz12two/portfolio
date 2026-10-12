// Associa cada <label class="form-label"> ao campo do seu form-group.
// Antes os labels existiam mas nao tinham for=, entao o leitor de tela anunciava
// "campo de texto, sem rotulo" — o audit acusava 1 sem label e o nome do campo
// nunca chegava a quem usa teclado ou leitor de tela.
const fs = require("node:fs");
const path = require("node:path");

const p = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(p, "utf8");

// Descobre o id do campo que vem DEPOIS de cada label dentro do mesmo form-group.
// Captura ate o </div> que fecha o grupo, sem depender do que vem depois: o
// limite anterior parava antes do textarea e deixava o 4o label sem corrigir.
const GRUPOS = [...html.matchAll(/<div class="form-grupo">((?:(?!<div class="form-grupo">)[\s\S])*?)\n(\s*)<\/div>/g)];

let fixados = 0;
const semCampo = [];

for (const [, conteudo] of GRUPOS) {
  const campo = conteudo.match(/id="(ctt-[a-z-]+)"/);
  if (!campo) {
    semCampo.push(conteudo.slice(0, 40));
    continue;
  }
  const id = campo[1];
  // Sobrescreve o for= existente quando ele aponta para outro campo. Era o bug
  // do rotulo: os quatro labels apontavam para ctt-email, entao tres campos
  // anunciavam o nome errado.
  const novo = conteudo.replace(/<label class="form-label"(?:\s+for="[^"]*")?/, `<label class="form-label" for="${id}"`);
  if (novo !== conteudo) fixados++;
  html = html.replace(conteudo, novo);
}

fs.writeFileSync(p, html, "utf8");

const restantes = [...html.matchAll(/<label class="form-label"(?![^>]*\sfor=)/g)].length;
const errado = GRUPOS.length - [...html.matchAll(/<label class="form-label" for="(ctt-[a-z-]+)"[\s\S]*?id="\1"/g)].length;
console.log(`grupos: ${GRUPOS.length} | labels corrigidos: ${fixados}`);
console.log(`labels sem for: ${restantes} | label apontando para campo errado: ${errado}`);
if (semCampo.length) console.log(`grupos sem campo: ${semCampo.length}`);
if (restantes || errado) process.exit(1);