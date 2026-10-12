#!/usr/bin/env node
/**
 * Anuncia no Discord as MUDANCAS de catalogo/dados/produtos.json.
 *
 * Por que: o catalogo ja tem um gerador (tools/gerar-catalogo.js) que leva o
 * JSON ate a pagina. Faltava a outra metade: quando um produto muda de status,
 * de preco, ou entra novo, ninguem e avisado â€” e um canal que so recebe
 * anuncio manual envelhece mais rapido que a pagina. Aqui o Discord e
 * consumidor do mesmo JSON, entao nao existe segundo lugar onde o produto
 * muda por tras do catalogo.
 *
 * O que posta: so a diferenca contra dados/discord-estado.json. Republicar o
 * catalogo inteiro a cada push e o caminho para o canal virar ruido e ninguem
 * desligar as notificacoes â€” que e o estado final de qualquer comunidade.
 *
 * Quem entrega: este arquivo descobre a mudanca e delega a `anunciar.js`, que
 * e o caminho unico de saida. Antes cada coisa que falasse no Discord abria o
 * seu proprio jeito de postar â€” este por webhook, outro pelo token do bot â€” e
 * dois caminhos sao duas credenciais, das quais a segunda quase sempre quebra
 * depois da primeira funcionar sem ninguem ver. Aqui a logica e o envio estao
 * em arquivos separados: decidir o que mudou nao e o mesmo trabalho que
 * entregar no canal certo.
 *
 * O que NAO faz: nao inventa. Se nao houver mudanca, nao ha post. Sem token,
 * imprime o que enviaria e sai com erro: rodar local sem credencial e seguro
 * por padrao, nao por separar o ambiente.
 *
 * Dry-run e o padrao. `--enviar` grava de verdade.
 *
 * Rodar:  node tools/aviso-discord.js [--enviar]
 * Env:    DISCORD_BOT_TOKEN   (secret do repo)
 * Saida:  dados/discord-estado.json
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const PRODUTOS = path.join(RAIZ, "catalogo", "dados", "produtos.json");
const ESTADO = path.join(RAIZ, "dados", "discord-estado.json");
const ANUNCIAR = path.join(__dirname, "anunciar.js");

const SITE = "https://nz12two.github.io/portfolio";
const ENVIAR = process.argv.includes("--enviar");

// Um campo so quando ele muda e a pessoa ve. `stack` foi deixado de fora de
// proposito: acrescentar uma dependencia e' mudanca de ruido, e ruido treina o
// canal a ser ignorado.
const CAMPOS = [
  { chave: "status", rotulo: "status" },
  { chave: "preco", rotulo: "preÃ§o" },
  { chave: "tagline", rotulo: "descriÃ§Ã£o" },
  { chave: "licenca", rotulo: "licenÃ§a" },
  { chave: "prova", rotulo: "prova", deriva: (p) => (p.prova ? String(p.prova.num) + " " + p.prova.unidade : null) },
];

const esc = (s) => String(s == null ? "" : s);
const ler = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

function diferencas(antes, agora) {
  const lista = [];

  for (const p of agora) {
    const velho = antes.find((x) => x.slug === p.slug);
    if (!velho) {
      lista.push({
        kind: "produto_novo",
        slug: p.slug,
        titulo: p.nome,
        linhas: [
          esc(p.tagline),
          p.tipo ? "tipo: " + esc(p.tipo) : null,
          p.dominio ? "domÃ­nio: " + esc(p.dominio) : null,
        ].filter(Boolean),
      });
      continue;
    }
    const linhas = CAMPOS.map((c) => {
      const novo = c.deriva ? c.deriva(p) : esc(p[c.chave]);
      const velho_ = c.deriva ? c.deriva(velho) : esc(velho[c.chave]);
      if (novo === velho_ || (!novo && !velho_)) return null;
      return "**" + c.rotulo + ":** " + (velho_ || "â€”") + " â†’ " + (novo || "â€”");
    }).filter(Boolean);
    if (linhas.length) lista.push({ kind: "mudou", slug: p.slug, titulo: p.nome, linhas });
  }

  for (const v of antes) {
    if (!agora.find((p) => p.slug === v.slug)) {
      lista.push({ kind: "saiu", slug: v.slug, titulo: v.nome, linhas: ["saiu do catÃ¡logo"] });
    }
  }

  return lista;
}

/* Entrega cada mudanca pelo caminho unico. Chamar o outro script como
 * processo â€” e nao importar o modulo â€” porque o ciclo de vida dele (token,
 * canal por nome, dry-run) e o de um comando, nao o de uma funcao. */
async function enviar(mudancas) {
  if (!process.env.DISCORD_BOT_TOKEN) return false;

  const { execFile } = require("node:child_process");
  const { promisify } = require("node:util");
  const rodar = promisify(execFile);

  const payload = mudancas.map((m) => ({
    tipo: m.kind,
    produto: m.slug,
    titulo: m.titulo + " â€” " + (m.kind === "saiu" ? "saiu" : m.kind === "produto_novo" ? "novo" : "mudou"),
    linha: m.linhas,
    link: SITE + "/catalogo/" + m.slug + ".html",
  }));

  const arquivo = path.join(RAIZ, "dados", "discord-anuncio.json");
  fs.writeFileSync(arquivo, JSON.stringify(payload), "utf8");
  try {
    // 250ms entre envios: rate limit de ~5 por 2s. Mandar tudo de uma vez
    // devolve 429 no meio da leva e perde metade dos anuncios.
    await rodar(process.execPath, [ANUNCIAR, "--json", arquivo, ...(ENVIAR ? ["--enviar"] : [])], {
      cwd: RAIZ,
      env: process.env,
    });
  } finally {
    try { fs.unlinkSync(arquivo); } catch {}
  }
  return true;
}

async function main() {
  const doc = ler(PRODUTOS);
  const agora = doc.produtos || [];

  let antes = [];
  try {
    antes = (JSON.parse(fs.readFileSync(ESTADO, "utf8")).produtos) || [];
  } catch {
    // Primeira execucao: e uma primeira listagem, nao uma mudanca. Sem estado
    // anterior, comparar tudo contra vazio anunciaria os 6 produtos de hoje
    // como se fossem lancamentos.
    console.log("sem dados/discord-estado.json â€” registro o catalogo atual sem anunciar");
    fs.writeFileSync(
      ESTADO,
      JSON.stringify({ gerado_em: new Date().toISOString(), produtos: agora }, null, 2),
      "utf8"
    );
    return;
  }

  const mudancas = diferencas(antes, agora);

  if (!mudancas.length) {
    console.log("nenhuma mudanca no catalogo â€” nada a anunciar");
    return;
  }

  for (const m of mudancas) {
    console.log("\n[" + m.kind + "] " + m.titulo);
    for (const l of m.linhas) console.log("  " + l);
  }

  if (!ENVIAR) {
    console.log("\ndry-run: nada enviado. Use --enviar para postar.");
    return;
  }

  const ok = await enviar(mudancas);
  if (!ok) {
    console.error("\nsem DISCORD_BOT_TOKEN â€” nada foi enviado e o estado NAO foi avancado");
    process.exit(1);
  }

  // O estado so avanca depois do post. Falhou o envio, volta a comparar no
  // proximo push: e o comportamento correto para mudanca de produto â€” melhor
  // anunciar duas vezes do que perder uma.
  fs.writeFileSync(
    ESTADO,
    JSON.stringify({ gerado_em: new Date().toISOString(), produtos: agora }, null, 2),
    "utf8"
  );
  console.log("\n" + mudancas.length + " anuncio(s) enviado(s) -> dados/discord-estado.json");
}

main().catch((e) => {
  console.error("falhou, arquivo NAO foi alterado: " + e.message);
  process.exit(1);
});
