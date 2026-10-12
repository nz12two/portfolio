// Verificador do sprite: cada symbol precisa de viewBox e de pelo menos um
// shape, e todo href usado no HTML precisa existir como symbol. Sem isso um
// <use> quebrado passa silenciosamente e some um icone da pagina.
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const sprite = fs.readFileSync(path.join(RAIZ, "assets", "icons.svg"), "utf8");
const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");

const symbols = [...sprite.matchAll(/<symbol id="([^"]+)"\s+viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)];

let bad = 0;
for (const [, id, vb, inner] of symbols) {
  const temShape = /<(path|circle|ellipse|rect)\b/.test(inner);
  const vbOk = vb === "0 0 24 24";
  if (!temShape || !vbOk) {
    bad++;
    console.log(`ERRO ${id} viewBox=${vb} shape=${temShape}`);
  }
}

const usados = [...new Set([...html.matchAll(/icons\.svg#([a-z0-9-]+)/g)].map((m) => m[1]))];
const ids = new Set(symbols.map((m) => m[1]));
const orfaos = usados.filter((u) => !ids.has(u));
const semUso = [...ids].filter((i) => !usados.includes(i));

console.log(`${symbols.length} symbols | ${bad} invalidos`);
console.log(`href usados: ${usados.length} | orfaos: ${orfaos.length ? orfaos.join(",") : "nenhum"}`);
console.log(`symbols sem uso: ${semUso.length ? semUso.join(",") : "nenhum"}`);

if (bad || orfaos.length) process.exit(1);