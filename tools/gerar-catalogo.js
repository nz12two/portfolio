#!/usr/bin/env node
/**
 * Achata produtos.json + vip.json em catalogo/dados/catalogo.json, que e o que
 * o catalogo interativo consome.
 *
 * Por que um arquivo a parte: o build.js gera HTML estatico por produto, e isso
 * nao serve para filtrar — filtrar exige os dados no cliente. Um catalogo com
 * 5 itens e sem filtro e um PDF. Com 30 vira outra coisa, e ja nasce preparado.
 *
 * Deriva campos que a vitrine precisa e que ninguem digita a mao:
 * - inicial: letra do menu, para o indice alfabetico
 * - stackKeys: stack em minusculo, para casar filtro sem acento e sem caixa
 * - temGratis/temVip: o filtro de preco nao pode depender de ler o texto
 *
 * Rodar: node catalogo/gerar-catalogo.js
 */

const fs = require("node:fs");
const path = require("node:path");

const DADOS = path.join(__dirname, "..", "catalogo", "dados");

const ler = (f) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DADOS, f), "utf8"));
  } catch (e) {
    console.error(`nao li ${f}: ${e.message}`);
    process.exit(1);
  }
};

// Acento fora e minuscula: "JavaScript" e "javascript" sao o mesmo filtro.
const chave = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const produtos = ler("produtos.json").produtos || [];
const vip = (ler("vip.json").produtos || {});

const itens = produtos.map((p, i) => {
  const v = vip[p.slug] || { gratis: [], vip: [] };
  const haystack = [p.nome, p.tagline, p.categoria, (p.stack || []).join(" "), (p.para_quem || []).join(" ")]
    .join(" ")
    .toLowerCase();

  return {
    i: i + 1,
    slug: p.slug,
    nome: p.nome,
    tagline: p.tagline,
    categoria: p.categoria,
    status: p.status,
    statusTexto: { estavel: "estável", beta: "beta", "em-producao": "em produção" }[p.status] || p.status,
    preco: p.preco,
    // O valor real e "gratuito", nao "gratis": testar por "gratis" nao casava e
    // todo mundo caia em "pago". Casar a palavra que existe no dado.
    precoChave: chave(p.preco).startsWith("gratuit") ? "gratis" : chave(p.preco).startsWith("sob") ? "consulta" : "pago",
    licenca: p.licenca,
    stack: p.stack || [],
    stackChaves: (p.stack || []).map(chave),
    repo: p.repo,
    site: p.site,
    inicial: (p.nome[0] || "#").toUpperCase(),
    imagem: p.imagem || null,
    imagemAlt: p.imagem_alt || null,
    capturadoEm: p.capturado_em || null,
    imagemMotivo: p.imagem_motivo || null,
    temGratis: (v.gratis || []).length > 0,
    temVip: (v.vip || []).length > 0,
    nGratis: (v.gratis || []).length,
    nVip: (v.vip || []).length,
    passos: (p.instalacao || []).length,
    // Bloco da vitrine da home. Vai junto porque a home e gerada a partir
    // daqui: manter a descricao editorial no HTML obrigaria a duplicar cada
    // texto em dois lugares, e o primeiro lugar a ser atualizado seria o
    // errado. Sem `home`, o produto aparece na home so com a tagline.
    home: p.home || { descricao: p.tagline, tags: (p.stack || []).slice(0, 2) },
    busca: haystack,
  };
});

const saida = {
  gerado_em: new Date().toISOString(),
  total: itens.length,
  facetas: {
    categoria: [...new Set(itens.map((i) => i.categoria))].sort(),
    preco: [...new Set(itens.map((i) => i.precoChave))],
    stack: [...new Set(itens.flatMap((i) => i.stack))].sort(),
  },
  itens,
};

fs.writeFileSync(path.join(DADOS, "catalogo.json"), JSON.stringify(saida, null, 2), "utf8");

// Os MESMOS dados, tambem como .js. A pagina carrega este, nao o JSON por fetch:
// abrir o HTML direto do disco (file://) ou por caminho diferente quebra o
// fetch com "Failed to fetch", e o catalogo inteiro some. JS atribuido em
// window funciona em qualquer contexto, inclusive sem servidor.
const js = "/* Gerado por tools/gerar-catalogo.js — nao editar a mao. */\n" +
  "window.CATALOGO = " + JSON.stringify(saida) + ";\n";
fs.writeFileSync(path.join(DADOS, "catalogo.js"), js, "utf8");

console.log(`${itens.length} itens -> catalogo/dados/catalogo.json + .js`);
console.log(`  categorias: ${saida.facetas.categoria.join(", ")}`);
console.log(`  precos: ${saida.facetas.preco.join(", ")}`);
console.log(`  stacks: ${saida.facetas.stack.length} distintas`);
console.log(`  com VIP: ${itens.filter((i) => i.temVip).length}`);
// Sinaliza o que cai no padrao: sem `home` no JSON, a home mostra a tagline
// curta. Silencioso, porque produto novo sem bloco home e o caminho normal.
const semHome = itens.filter((i) => i.home.descricao === i.tagline && i.home.tags.length === 2 && !produtos.find((p) => p.slug === i.slug).home);
if (semHome.length) console.log(`  usando tagline como descricao: ${semHome.map((i) => i.slug).join(", ")}`);