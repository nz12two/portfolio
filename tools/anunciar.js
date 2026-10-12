#!/usr/bin/env node
/**
 * Caminho unico de saida para o Discord.
 *
 * Por que este arquivo existe: ate aqui cada coisa que quisesse falar no
 * Discord abria seu proprio jeito de postar -- `aviso-discord.js` usava
 * webhook, e o bot so lia. Dois caminhos de saida sao duas credenciais e dois
 * lugares onde o bot precisa ter permissao, e o segundo quase sempre quebra
 * depois do primeiro funcionar sem ninguem ver.
 *
 * Aqui o bot e a boca, nao o cerebro: resolve o canal pelo NOME (nao por id,
 * para renomear canal nao quebrar nada), formata pelo TIPO e posta. O que
 * merece virar anuncio e decidido fora daqui -- pelo CI quando o fato vem de um
 * push, pelo Banzinho quando a decisao e dele. Aqui so entrega.
 *
 * Por que o bot e nao o webhook: webhook so posta em UM canal. Um caminho que
 * serve de tudo precisa alcada de todos, e isso e o token, nao a URL de um canal.
 *
 * Dry-run e o padrao. `--enviar` grava de verdade.
 *
 *   node tools/anunciar.js --tipo apresentacao --todos
 *   node tools/anunciar.js --tipo numero --produto api-directory --antes 2085 --depois 2140
 *   node tools/anunciar.js --tipo post --canal "packs" --titulo "Lead" --corpo "..."
 *
 * Env: DISCORD_BOT_TOKEN (obrigatorio com --enviar)
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const PRODUTOS = JSON.parse(
  fs.readFileSync(path.join(RAIZ, "catalogo", "dados", "produtos.json"), "utf8")
).produtos;
const API = "https://discord.com/api/v10";
const GID = process.env.DISCORD_GUILD_ID || "1559216448969248770";
const TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const ENVIAR = process.argv.includes("--enviar");

// Destino por tipo. O canal e achado pelo NOME: guardar id num arquivo e um
// convite para recriar o canal sem o bot notar.
const CANAIS = {
  // `mudou` e `saiu` sao o mesmo caminho de destino: uma mudanca de produto
  // chega no canal de anuncios como "o que mudou", e o valor novo fica no
  // corpo. Nao ha um canal "saiu" — um produto que sai do catalogo nao tem
  // shelf onde ficar.
  produto_novo: "anuncios",
  mudou: "anuncios",
  saiu: "anuncios",
  versao: "anuncios",
  status: "anuncios",
  numero: "atualizacoes",
  lead: "packs",
};

const COR = {
  produto_novo: 0x3ba55c,
  mudou: 0xd8a24a,
  saiu: 0x9aa0a6,
  versao: 0x7c6cff,
  status: 0x95a5a6,
  numero: 0xeb8b2a,
  apresentacao: 0x5865f2,
  post: 0x95a5a6,
  lead: 0xf47b20,
};

const ROTULO = {
  produto_novo: "Produto novo",
  mudou: "Mudou",
  saiu: "Saiu do catálogo",
  versao: "Versão nova",
  status: "Status",
  numero: "Número mudou",
  lead: "Lead",
};

function arg(nome, padrao) {
  const i = process.argv.indexOf("--" + nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}
const temFlag = (n) => process.argv.includes("--" + n);

const bruto = arg("json", null);
// --json aceita UM payload ou uma LISTA deles. Lote importa porque a mudanca de
// catalogo chega com varias de uma vez, e o rate limit do Discord (~5 por 2s)
// e' por envio: dois canais viram um, um script so roda uma vez.
const CRU = bruto
  ? JSON.parse(fs.readFileSync(bruto, "utf8"))
  : [
      {
        tipo: arg("tipo", "post"),
        produto: arg("produto", null),
        canal: arg("canal", null),
        titulo: arg("titulo", null),
        corpo: arg("corpo", null),
        linha: temFlag("linha") ? process.argv.slice(process.argv.indexOf("--linha") + 1) : [],
        antes: arg("antes", null),
        depois: arg("depois", null),
        todos: temFlag("todos"),
      },
    ];
const P = Array.isArray(CRU) ? CRU[0] : CRU;


const produto = (slug) => PRODUTOS.find((x) => x.slug === slug) || null;

// O canal do produto carrega emoji, e o Discord insere hifen e apaga acento.
// Casar pelo slug normalizado sobrevive a renomear o canal.
function canalDoProduto(slug) {
  const n = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n.includes("banzinho")) return "banzinho";
  return slug;
}

function montar(x) {
  const prod = x.produto ? produto(x.produto) : null;

  if (x.tipo === "apresentacao") {
    if (!prod) throw new Error("produto desconhecido: " + x.produto);
    return {
      username: "NZ Portfolio",
      embeds: [{
        title: prod.nome,
        description: prod.tagline,
        url: prod.site || prod.repo || "https://nz12two.github.io/portfolio/",
        color: COR.apresentacao,
        fields: [
          prod.prova ? { name: "Prova", value: prod.prova.num + " " + prod.prova.unidade, inline: true } : null,
          { name: "Tipo", value: prod.categoria || prod.tipo || "-", inline: true },
          { name: "Licença", value: prod.licenca || "-", inline: true },
        ].filter(Boolean),
        footer: { text: "NZ Studios · o número vem do repositório aberto" },
      }],
      allowed_mentions: { parse: [] },
    };
  }

  if (x.tipo === "numero") {
    return {
      username: "NZ Portfolio",
      embeds: [{
        title: prod ? prod.nome : "Número",
        description: x.antes != null && x.depois != null
          ? "**" + x.antes + "** → **" + x.depois + "**"
          : (x.corpo || ""),
        color: COR.numero,
        footer: { text: "medido no repositório aberto · " + new Date().toISOString().slice(0, 10) },
      }],
      allowed_mentions: { parse: [] },
    };
  }

  return {
    username: "NZ Portfolio",
    embeds: [{
      title: x.titulo || ROTULO[x.tipo] || "Anúncio",
      description: [x.corpo, ...(Array.isArray(x.linha) ? x.linha : [])].filter(Boolean).join("\n"),
      url: x.link || undefined,
      color: COR[x.tipo] ?? COR.post,
      footer: { text: prod ? prod.nome : "NZ Portfolio" },
    }],
    allowed_mentions: { parse: [] },
  };
}

async function canaisDoServidor() {
  const r = await fetch(API + "/guilds/" + GID + "/channels", {
    headers: { Authorization: "Bot " + TOKEN },
  });
  if (!r.ok) throw new Error("GET channels -> HTTP " + r.status);
  return r.json();
}

const norm = (s) =>
  String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function acharCanal(cs, nome) {
  const alvo = norm(nome);
  const cands = cs.filter((c) => norm(c.name).includes(alvo));
  return cands.find((c) => c.type === 0) || cands.find((c) => c.type === 15) || cands[0] || null;
}

async function postar(canal, payload) {
  if (!ENVIAR) {
    console.log("   [dry-run] " + (canal.type === 15 ? "topico em " : "#") + canal.name);
    const e = payload.embeds[0];
    console.log("     " + e.title + "\n     " + String(e.description || "").slice(0, 80));
    return null;
  }

  // Forum nao aceita mensagem: 50008 "Cannot send messages in a non-text channel".
  // A apresentacao de um fórum e um TOPICO, que e onde a conversa acontece
  // mesmo -- e o post inicial do tópico é a apresentacao do produto.
  if (canal.type === 15) {
    const r = await fetch(API + "/channels/" + canal.id + "/threads", {
      method: "POST",
      headers: { Authorization: "Bot " + TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.embeds[0].title,
        message: { embeds: payload.embeds },
        applied_tags: [],
      }),
    });
    if (!r.ok) throw new Error("POST thread em " + canal.name + " -> HTTP " + r.status + " " + (await r.text()).slice(0, 140));
    const th = await r.json();
    await fetch(API + "/channels/" + th.id + "/pins/" + th.id, {
      method: "PUT", headers: { Authorization: "Bot " + TOKEN },
    });
    console.log("   topico criado em " + canal.name + "  (" + th.id + ")");
    return th;
  }

  const r = await fetch(API + "/channels/" + canal.id + "/messages", {
    method: "POST",
    headers: { Authorization: "Bot " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("POST #" + canal.name + " -> HTTP " + r.status + " " + (await r.text()).slice(0, 140));
  const m = await r.json();
  console.log("   postado em #" + canal.name + "  (" + m.id + ")");
  return m;
}

async function main() {
  if (ENVIAR && !TOKEN) throw new Error("DISCORD_BOT_TOKEN vazio: não há quem poste");
  const cs = await canaisDoServidor();

  if (P.tipo === "apresentacao" && P.todos) {
    console.log("apresentação dos produtos existentes:");
    for (const prod of PRODUTOS) {
      const c = await acharCanal(cs, canalDoProduto(prod.slug));
      if (!c) { console.log("   #" + prod.slug + "   sem canal correspondente — pulado"); continue; }
      await postar(c, montar({ tipo: "apresentacao", produto: prod.slug }));
    }
    return;
  }

  // Lote: um payload por mudanca, com pausa entre eles. Rate limit do Discord
  // e' ~5 envios por 2s por alvo, e perder metade do lote no 429 e' pior que
  // levar 250ms por item.
  const payloads = Array.isArray(CRU) ? CRU : [CRU];
  for (let i = 0; i < payloads.length; i++) {
    const x = payloads[i];

    // `--produto` tem duas leituras e misturar as duas manda mudanca de
    // catalogo para o canal do produto em vez do canal de anuncios. Medido:
    // "antiXray mudou de preco" foi para #antixray e nao chegou em #anuncios,
    // enquanto o script dizia "1 anuncio enviado" — sucesso sem efeito.
    //   - tipo tem destino canonico -> o produto so rotula o embed
    //   - tipo NAO tem (apresentacao) -> o produto escolhe o canal
    const canonico = CANAIS[x.tipo];
    const nome = x.canal || (canonico ? canonico : x.produto ? canalDoProduto(x.produto) : null);
    if (!nome) throw new Error("não sei onde postar: tipo " + x.tipo + " sem --canal e sem --produto");
    const canal = await acharCanal(cs, nome);
    if (!canal) throw new Error("canal não encontrado: " + nome);
    await postar(canal, montar(x));
    if (i < payloads.length - 1) await new Promise((r) => setTimeout(r, 250));
  }
}

main().catch((e) => {
  console.error("falhou: " + e.message);
  process.exit(1);
});

