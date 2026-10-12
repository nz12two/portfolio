#!/usr/bin/env node
/**
 * Atualiza os numeros do painel de evidencia com dado real da API do GitHub.
 *
 * Por que: o painel promete "código publicado" com bytes por linguagem. Numero
 * congelado no HTML envelhece e vira mentira — foi o defeito dos "5 clientes
 * satisfeitos". Buscando da API, o painel continua verdadeiro sem ninguem mexer.
 *
 * O que NAO faz: nao inventa fallback. Se a API falhar, o script avisa e sai com
 * erro, em vez de gravar um numero de Borrowing.
 *
 * Rodar: node tools/update-evidence.js
 * saida: v2/evidencia.json (lido por v2/index.html no fetch)
 */

const fs = require("node:fs");
const path = require("node:path");

const REPOS = ["antixray", "empresas-mundo", "api-directory", "opendex"];
const SAIDA = path.join(__dirname, "..", "v2", "evidencia.json");
const UA = { "User-Agent": "nz12two-portfolio", Accept: "application/vnd.github+json" };

const MB = 1024 * 1024;
const fmt = (b) => (b >= MB ? (b / MB).toFixed(2) + " MB" : Math.round(b / 1024) + " KB");

async function main() {
  const porRepo = {};
  const langs = {};

  for (const r of REPOS) {
    const repo = await (await fetch(`https://api.github.com/repos/nz12two/${r}`, { headers: UA })).json();
    if (!repo || repo.message) throw new Error(`repo ${r}: ${repo?.message || "sem resposta"}`);

    const l = await (await fetch(`https://api.github.com/repos/nz12two/${r}/languages`, { headers: UA })).json();
    if (!l || l.message) throw new Error(`linguagens ${r}: ${l?.message || "sem resposta"}`);

    const soma = Object.values(l).reduce((a, b) => a + b, 0);
    porRepo[r] = { nome: repo.name, desc: repo.description, bytes: repo.size * 1024, langs: l, soma, push: repo.pushed_at };

    for (const [k, v] of Object.entries(l)) langs[k] = (langs[k] || 0) + v;
  }

  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  const ordenado = Object.entries(langs).sort((a, b) => b[1] - a[1]);

  // As 4 maiores linguagens viram barras; o resto soma como "outros".
  const top = ordenado.slice(0, 4);
  const resto = ordenado.slice(4).reduce((a, [, v]) => a + v, 0);
  // Rótulo curto para a coluna estreita: 7 caracteres cabem sem cortar o nome.
  // Antes era 6 e "TypeScript" virava "TypeSc", que parece nome de linguagem.
  const curto = (nome) => {
    if (nome.length <= 7) return nome;
    return {
      TypeScript: "TypeScr",
      JavaScript: "JavaScr",
      "C++": "C++",
    }[nome] || nome.slice(0, 7);
  };

  const barras = top.map(([nome, b]) => ({
    nome: curto(nome),
    nomeCompleto: nome,
    bytes: b,
    pct: +(b / total).toFixed(3),
    valor: fmt(b),
  }));
  if (resto > 0) barras.push({ nome: "outros", nomeCompleto: `${ordenado.length - 4} linguagens`, bytes: resto, pct: +(resto / total).toFixed(3), valor: fmt(resto) });

  const saida = {
    gerado_em: new Date().toISOString(),
    totalBytes: total,
    totalFormatado: fmt(total),
    repos: Object.keys(porRepo).length,
    barras,
    porRepo,
  };

  fs.writeFileSync(SAIDA, JSON.stringify(saida, null, 2), "utf8");

  console.log(`${Object.keys(porRepo).length} repos | total ${saida.totalFormatado}`);
  for (const b of barras) console.log(`  ${b.nomeCompleto.padEnd(12)} ${b.valor.padStart(9)}  ${(b.pct * 100).toFixed(1)}%`);
  console.log(`-> ${path.relative(path.join(__dirname, ".."), SAIDA)}`);
}

main().catch((e) => {
  console.error(`falhou, arquivo NAO foi alterado: ${e.message}`);
  process.exit(1);
});