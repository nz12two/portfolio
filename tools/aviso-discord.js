#!/usr/bin/env node
/**
 * Anuncia no Discord as MUDANCAS de catalogo/dados/produtos.json.
 *
 * Por que: o catalogo ja tem um gerador (tools/gerar-catalogo.js) que leva o
 * JSON ate a pagina. Faltava a outra metade: quando um produto muda de status,
 * de preco, ou entra novo, ninguem e avisado — e um canal que so recebe
 * anuncio manual envelhece mais rapido que a pagina. Aqui o Discord e
 * consumidor do mesmo JSON, entao nao existe segundo lugar onde o produto
 * muda por tras do catalogo.
 *
 * O que posta: so a diferenca contra dados/discord-estado.json. Republicar o
 * catalogo inteiro a cada push e o caminho para o canal virar ruido e ninguem
 * desligar as notificacoes — que e o estado final de qualquer comunidade.
 *
 * O que NAO faz: nao inventa. Se nao houver mudanca, nao ha post. Se o webhook
 * faltar, o script imprime o que enviaria e sai sem erro de rede: rodar local
 * sem credencial tem de ser seguro por padrao, nao por separar o ambiente.
 *
 * Dry-run e o padrao. `--enviar` grava de verdade.
 *
 * Rodar:  node tools/aviso-discord.js [--enviar]
 * Env:    DISCORD_WEBHOOK_URL   (secret do repo)
 * Saida:  dados/discord-estado.json
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const PRODUTOS = path.join(RAIZ, "catalogo", "dados", "produtos.json");
const ESTADO = path.join(RAIZ, "dados", "discord-estado.json");

const SITE = "https://nz12two.github.io/portfolio";
const ENVIAR = process.argv.includes("--enviar");

// Um campo so quando ele muda e a pessoa ve. `stack` foi deixado de fora de
// proposito: acrescentar uma dependencia e' mudanca de ruido, e ruido treina o
// canal a ser ignorado.
const CAMPOS = [
  { chave: "status", rotulo: "status" },
  { chave: "preco", rotulo: "preço" },
  { chave: "tagline", rotulo: "descrição" },
  { chave: "licenca", rotulo: "licença" },
  { chave: "prova", rotulo: "prova", deriva: (p) => (p.prova ? String(p.prova.num) + " " + p.prova.unidade : null) },
];

const COR = {
  novo: 0x3ba55c,
  mudou: 0xd8a24a,
  saiu: 0x9aa0a6,
};

const esc = (s) => String(s == null ? "" : s);
const ler = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

function diferencas(antes, agora) {
  const lista = [];

  for (const p of agora) {
    const velho = antes.find((x) => x.slug === p.slug);
    if (!velho) {
      lista.push({
        kind: "novo",
        slug: p.slug,
        titulo: p.nome,
        linhas: [
          esc(p.tagline),
          p.tipo ? "tipo: " + esc(p.tipo) : null,
          p.dominio ? "domínio: " + esc(p.dominio) : null,
        ].filter(Boolean),
      });
      continue;
    }
    const linhas = CAMPOS.map((c) => {
      const novo = c.deriva ? c.deriva(p) : esc(p[c.chave]);
      const velho_ = c.deriva ? c.deriva(velho) : esc(velho[c.chave]);
      if (novo === velho_ || (!novo && !velho_)) return null;
      return "**" + c.rotulo + ":** " + (velho_ || "—") + " → " + (novo || "—");
    }).filter(Boolean);
    if (linhas.length) lista.push({ kind: "mudou", slug: p.slug, titulo: p.nome, linhas });
  }

  for (const v of antes) {
    if (!agora.find((p) => p.slug === v.slug)) {
      lista.push({ kind: "saiu", slug: v.slug, titulo: v.nome, linhas: ["saiu do catálogo"] });
    }
  }

  return lista;
}

async function enviar(mudancas) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;

  for (const m of mudancas) {
    const res = await fetch(url + "?wait=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "catalogo",
        embeds: [{
          title: m.titulo + " — " + m.kind,
          description: m.linhas.join("\n"),
          url: SITE + "/catalogo/" + m.slug + ".html",
          color: COR[m.kind],
          footer: { text: "nz12two.github.io/portfolio · fonte: catalogo/dados/produtos.json" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    if (!res.ok) {
      throw new Error("webhook respondeu HTTP " + res.status + ": " + (await res.text()).slice(0, 200));
    }
    // Webhook tem rate limit (~5 por 2s). Mandar tudo de uma vez devolve 429
    // no meio da leva e perde metade dos anuncios; 250ms nao é lentidao que se
    // sinta e nao derruba post nenhum.
    await new Promise((r) => setTimeout(r, 250));
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
    console.log("sem dados/discord-estado.json — registro o catalogo atual sem anunciar");
    fs.writeFileSync(
      ESTADO,
      JSON.stringify({ gerado_em: new Date().toISOString(), produtos: agora }, null, 2),
      "utf8"
    );
    return;
  }

  const mudancas = diferencas(antes, agora);

  if (!mudancas.length) {
    console.log("nenhuma mudanca no catalogo — nada a anunciar");
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
    console.error("\nsem DISCORD_WEBHOOK_URL — nada foi enviado e o estado NAO foi avancado");
    process.exit(1);
  }

  // O estado so avanca depois do post. Falhou o envio, volta a comparar no
  // proximo push: e o comportamento correto para mudanca de produto — melhor
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