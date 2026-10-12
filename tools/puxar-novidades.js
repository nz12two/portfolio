#!/usr/bin/env node
/**
 * Le as ultimas mensagens de #anuncios no Discord e grava dados/novidades.json,
 * que e o que a home mostra na secao "novidades".
 *
 * Por que: o produto vai para o Discord e o visitante do site tem que ver que o
 * projeto esta vivo sem abrir o Discord. Sem isso, quem chega pela vitrine ve um
 * produto com data de build e nenhuma novidade — e conclui que parou.
 *
 * Por que REST e nao bot com gateway: GET /channels/{id}/messages le as ultimas
 * mensagens com um token de bot e nada mais. Nada de gateway, nada de message
 * content intent, nada de processo ligado. Roda por cron no CI e desliga.
 *
 * O que NAO faz: nao inventa. Sem token, sem canal, ou erro da API, o arquivo
 * NAO e reescrito — a ultima versao boa continua no ar. Um feed apagado por erro
 * silencioso parece "o NZ parou", que e a pior leitura possivel.
 *
 * Env: DISCORD_BOT_TOKEN (secret), DISCORD_CANAL_ID, DISCORD_INVITE
 * Saida: dados/novidades.json
 */

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const SAIDA = path.join(RAIZ, "dados", "novidades.json");
const API = "https://discord.com/api/v10";
/* Linha de auditoria que o aviso-discord.js gera: "**campo:** antes → depois".
   * Nao e novidade de produto — e o diff do catalogo, que ja tem pagina propria
   * em catalogo/<slug>.html. Passar isso para o feed gasta as tres posicoes com
   * "MIT (no README) -> MIT (só no README)", que e o mesmo valor duas vezes. */
const AUDITORIA = /^\*\*(status|preço|descrição|licença|prova):\*\*/i;
const LIMITE = 12;

// Discord limita o corpo da mensagem em 2000; o card da home nao quer o texto
// inteiro de um post longo, quer a ideia. 320 e o que cabe em duas linhas.
const RECORTE = 320;

function limpar(t) {
  return String(t || "")
    // links markdown: [texto](url) -> texto — o card ja tem botao pro link
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // <@123> <#456> @everyone -> texto puro
    .replace(/<[@#][^>]+>/g, "")
    // tres acentos de codigo sao o realce de codigo do Discord
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function api(caminho, token) {
  const res = await fetch(API + caminho, {
    headers: { Authorization: "Bot " + token, "User-Agent": "nz12two-portfolio (github.com/nz12two)" },
  });
  if (!res.ok) throw new Error("API " + caminho.split("?")[0] + " -> HTTP " + res.status);
  return res.json();
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const canalId = process.env.DISCORD_CANAL_ID;
  if (!token || !canalId) {
    console.log("sem DISCORD_BOT_TOKEN ou DISCORD_CANAL_ID — mantem o dados/novidades.json atual");
    return;
  }

  const canal = await api("/channels/" + encodeURIComponent(canalId), token);
  const msgs = await api(
    "/channels/" + encodeURIComponent(canalId) + "/messages?limit=" + LIMITE,
    token
  );

  const itens = msgs
    .map((m) => {
      const texto = limpar(m.content || (m.embeds && m.embeds[0] && m.embeds[0].description) || "");
      if (!texto) return null;
      if (AUDITORIA.test(texto)) return null;
      return {
        id: m.id,
        ts: m.timestamp,
        // Link de mensagem precisa do guild id. O canal devolve o proprio, o
        // que evita pedir mais uma variavel de ambiente so para montar a URL.
        url: "https://discord.com/channels/" + canal.guild_id + "/" + m.channel_id + "/" + m.id,
        // Bot/webhook tem id; pessoa tem username. Os dois campos bastam para o
        // card dizer quem falou sem depender de id no HTML.
        autor: m.author && (m.author.global_name || m.author.username),
        bot: Boolean(m.webhook_id || (m.author && m.author.bot)),
        texto: texto.length > RECORTE ? texto.slice(0, RECORTE - 1).trimEnd() + "…" : texto,
      };
    })
    .filter(Boolean);

  const saida = {
    gerado_em: new Date().toISOString(),
    convite: process.env.DISCORD_INVITE || null,
    canal: canal.name,
    total: itens.length,
    itens,
  };

  // Só reescreve se o conteudo mudou. O CI commita o arquivo: reescrever com
  // timestamp novo a cada cron gera commit a cada 6 horas sem nenhuma mudanca
  // real, e o historico do repo fica inutil.
  try {
    const velho = JSON.parse(fs.readFileSync(SAIDA, "utf8"));
    const chave = (d) => JSON.stringify([d.itens, d.convite]);
    if (chave(velho) === chave(saida)) {
      console.log(itens.length + " mensagens — nada mudou, arquivo intacto");
      return;
    }
  } catch {
    // Primeira execucao: grava.
  }

  fs.writeFileSync(SAIDA, JSON.stringify(saida, null, 2), "utf8");
  console.log(itens.length + " mensagens -> dados/novidades.json");
}

main().catch((e) => {
  console.error("falhou, arquivo NAO foi alterado: " + e.message);
  process.exit(1);
});