/* Snapshot do estado real do agente, para a vitrine do portfolio.
 *
 * POR QUE ISTO EXISTE. O portfolio tem uma regra: nada de numero de vitrine,
 * nada de demonstracao que nao seja dado real. A pagina de laboratorio mostrava
 * um grafo de forca que nao representava nada — 42 das 44 arestas eram
 * "os dois itens estao no mesmo produto", e o painel chamava aquilo de stack
 * compartilhada. Este gerador existe para o laboratorio ter o que um grafo de
 * forca nao tinha: numero que sai de uma execucao de verdade.
 *
 * DE ONDE LE. ~/.banzinho/state e ~/.banzinho/logs — o estado vivo do runtime
 * que roda esta sessao. Nada inventado: cada campo aqui e contagem, media ou
 * severidade medida sobre arquivo do runtime.
 *
 * O QUE NAO SAI. Os erros do tool-faults carregam caminho absoluto
 * (C:\Users\Lucas\runtime\...), e o run.jsonl carrega sessionID e porta HTTP.
 * Isso nao vai para repo publico. Aqui o caminho vira <path>, o id vira
 * <id>, e nenhuma linha de comando, rota ou sessao sai. Se alguem precisar do
 * detalhe, ele le o arquivo local — o portfolio mostra a forma, nao o
 * endereco.
 *
 * USO.   node tools/exportar-estado.js            # escreve dados/estado.json
 *         node tools/exportar-estado.js --stdout   # so mostra, nao grava
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ESTADO = path.join(os.homedir(), ".banzinho", "state");
const LOGS = path.join(os.homedir(), ".banzinho", "logs");
const SAIDA = path.join(RAIZ, "dados", "estado.json");

// ---------------------------------------------------------------- redacao
const RUIM = [
  // caminho absoluto com pelo menos 2 segmentos -> <path>
  { re: /[A-Za-z]:\\[^\s"',;)]+/g, para: "<path>" },
  // caminho unix
  { re: /(?<![\w<])\/(?:[\w.-]+\/){2,}[\w.-]+/g, para: "<path>" },
  // id de sessao / chamada do opencode
  { re: /\bses_[\w]{8,}\b/g, para: "<ses>" },
  { re: /\boc\.call_[\w]+\b/g, para: "<call>" },
  { re: /\breq-[\w]+\b/g, para: "<req>" },
  // porta local
  { re: /:\d{4,5}\b/g, para: ":<porta>" },
  // home
  { re: new RegExp(os.homedir().replace(/\\/g, "\\\\"), "gi"), para: "<home>" },
];
const limpa = (s) => RUIM.reduce((t, r) => t.replace(r.re, r.para), String(s == null ? "" : s));

const ler = (p, padrao = null) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return padrao; }
};
const linhas = (p) => {
  try {
    return fs.readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
};

// ------------------------------------------------------------- execucao
// O que o agente realmente chamou, quanto tempo levou e quantas vezes falhou.
function execucao() {
  const arqs = ["run.jsonl", "run.jsonl.1", "run.jsonl.2", "run.jsonl.3"];
  const dur = new Map();   // tool -> duracoes em ms
  const err = new Map();   // tool -> contagem de erro
  let total = 0, falhou = 0, fake = 0, janela = null, eventos = 0;

  for (const n of arqs) {
    for (const e of linhas(path.join(LOGS, n))) {
      eventos++;
      const f = e.fields || {};
      if (e.event === "boot.start" && f.provider === "fake") fake++;
      if (!janela) janela = { de: e.ts, ate: e.ts };
      if (e.ts < janela.de) janela.de = e.ts;
      if (e.ts > janela.ate) janela.ate = e.ts;

      if (e.event === "action.end" || e.event === "action.error") {
        const tool = f.tool || f.target || "?";
        if (!dur.has(tool)) dur.set(tool, []);
        if (typeof f.duration_ms === "number") dur.get(tool).push(f.duration_ms);
        total++;
        if (e.event === "action.error") { err.set(tool, (err.get(tool) || 0) + 1); falhou++; }
      }
    }
  }

  const pct = (a, p) => {
    if (!a.length) return null;
    const s = a.slice().sort((x, y) => x - y);
    return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
  };

  const ferramentas = [...dur.entries()]
    .map(([tool, ms]) => {
      const n = ms.length, erros = err.get(tool) || 0;
      return {
        tool,
        chamadas: n,
        erros,
        taxa_erro: n ? +(erros / n).toFixed(3) : 0,
        mediana_ms: pct(ms, 50),
        p95_ms: pct(ms, 95),
        mais_lenta_ms: Math.max(...ms),
      };
    })
    .sort((a, b) => b.chamadas - a.chamadas);

  return {
    eventos_lidos: eventos,
    janela,
    chamadas_medidas: total,
    com_erro: falhou,
    taxa_erro_global: total ? +(falhou / total).toFixed(3) : 0,
    boots_de_teste_fake: fake,
    ferramentas,
  };
}

// ---------------------------------------------------------------- falhas
// tool-faults.jsonl ja vem agregado por assinatura de erro, mas a assinatura
// carrega a CHAMADA INTEIRA: "Arguments provided: {"newString": "<codigo
// fonte>..."}". Dumpar isso no repo publico vazaria codigo e nao diria nada —
// 224 assinaturas eram 224 payloads, nao 224 tipos de falha. Aqui a falha vira
// CLASSE: a primeira linha do erro, sem os argumentos, com caminho redigido.
const CLASSES = [
  [/^Subagent depth limit reached/i, "limite de profundidade de subagente"],
  [/^No tool named/i, "ferramenta pedida não existe no catálogo"],
  [/^Tool execution interrupted/i, "execução interrompida"],
  [/^No changes to apply/i, "edição sem mudança real — oldString e newString iguais"],
  [/^Teto de \d+ passos por subagente/i, "teto de passos do subagente estourado"],
  [/^Explore primeiro/i, "edição sem leitura prévia — o guarda pediu grep/read antes"],
  [/^Fora do escopo declarado/i, "recorte tentou sair do escopo declarado"],
  [/^Could not find oldString/i, "oldString não encontrado — o texto procurado não bateu"],
  [/^Invalid arguments for tool/i, "argumento inválido na chamada da ferramenta"],
  [/^File has been modified|modified since/i, "arquivo mudou entre ler e escrever"],
  [/^ENOENT|no such file/i, "arquivo inexistente no caminho informado"],
  [/^EACCES|Permission denied/i, "permissão negada"],
  [/^ETIMEDOUT|timed? ?out/i, "tempo esgotado"],
  [/^string to replace not found|not found in string/i, "trecho não encontrado no conteúdo"],
  [/^SyntaxError|Unexpected token/i, "erro de sintaxe no código enviado"],
  [/^Timeout .*exceeded/i, "tempo limite da ferramenta excedido"],
  [/^\S+ is not a function/i, "chamada de função inexistente"],
  [/^Unknown tool/i, "ferramenta desconhecida"],
  [/^.+ is not defined/i, "símbolo não definido"],
  [/^AbortedError|aborted/i, "chamada abortada"],
];

function classifica(erro) {
  const bruto = String(erro == null ? "" : erro);
  // A chamada vem anexada ao erro. Corta antes dos argumentos: e payload de
  // edicao, nao descricao de falha.
  const cabeca = bruto.split(/\n\s*(?:Arguments provided|Update the arguments)/)[0].trim();
  for (const [re, nome] of CLASSES) if (re.test(cabeca)) return nome;
  const limpo = limpa(cabeca).replace(/\s+/g, " ");
  if (!limpo) return "erro sem mensagem";
  return limpo.length > 110 ? limpo.slice(0, 107) + "..." : limpo;
}

function falhas() {
  const br = linhas(path.join(ESTADO, "tool-faults.jsonl"));
  // Agrupa DEPOIS de classificar: a chave e a classe, nao o payload. Duas
  // edicoes com codigo diferente e o mesmo erro sao uma linha so.
  const por = new Map();
  for (const f of br) {
    const classe = classifica(f.erro);
    const k = `${f.tool}|${classe}`;
    if (!por.has(k)) {
      por.set(k, { tool: f.tool, classe, ocorrencias: 0, sessoes: new Set(), primeira: f.primeira_ts, ultima: f.ultima_ts });
    }
    const cur = por.get(k);
    cur.ocorrencias += typeof f.n === "number" ? f.n : 1;
    for (const _ of f.sessions || []) cur.sessoes.add(1);
    if (f.ultima_ts && f.ultima_ts > cur.ultima) cur.ultima = f.ultima_ts;
    if (f.primeira_ts && (!cur.primeira || f.primeira_ts < cur.primeira)) cur.primeira = f.primeira_ts;
  }
  return [...por.values()]
    .map((x) => ({
      tool: x.tool,
      classe: x.classe,
      ocorrencias: x.ocorrencias,
      sessoes_distintas: x.sessoes.size,
      primeira: x.primeira,
      ultima: x.ultima,
    }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);
}

// ------------------------------------------------------------ auto-auditoria
function doctor() {
  const d = ler(path.join(ESTADO, "_doctor_last.json"));
  if (!d || !Array.isArray(d.findings)) return null;
  const porSeveridade = {};
  const porCheck = new Map();
  for (const f of d.findings) {
    porSeveridade[f.severity] = (porSeveridade[f.severity] || 0) + 1;
    const cur = porCheck.get(f.check_id) || { check_id: f.check_id, n: 0, severidade: f.severity };
    cur.n++;
    porCheck.set(f.check_id, cur);
  }
  return {
    ok: !!d.summary?.ok,
    total: d.findings.length,
    por_severidade: porSeveridade,
    checks: [...porCheck.values()].sort((a, b) => b.n - a.n),
    // a mensagem do achado e o texto que o leitor precisa; limpo de caminho.
    achados: d.findings.map((f) => ({
      check_id: f.check_id,
      severidade: f.severity,
      mensagem: limpa(f.message),
      confianca: f.confianca ?? f.confidence ?? null,
    })),
  };
}

// ------------------------------------------------------------- portoes
// Quantas vezes o pedido parou numa decisao humana, e quantas fois o pedido
// passou sem perguntar. O campo `action` e uma categoria ("shell", "browser"),
// nunca o comando.
function portoes() {
  const ap = linhas(path.join(ESTADO, "approvals.jsonl"));
  const decisao = {};
  let expirados = 0;
  for (const a of ap) {
    const d = a.decision || a.status || "?";
    decisao[d] = (decisao[d] || 0) + 1;
    if (a.expires_at && a.resolved_at === null) expirados++;
  }
  return { registros: ap.length, por_decisao: decisao, sem_resolucao: expirados };
}

// ------------------------------------------------------------------ main
const ex = execucao();
const fl = falhas();
const dc = doctor();
const po = portoes();

if (!ex.chamadas_medidas && !fl.length && !dc) {
  console.error("nenhuma fonte produziu dado.");
  console.error("  procurou:", ESTADO);
  console.error("  procurou:", LOGS);
  console.error("");
  console.error("  Esta ferramenta e LOCAL por desenho: o runner do GitHub Actions");
  console.error("  nao tem ~/.banzinho, entao ela nao vai no CI. Ela roda aqui, o");
  console.error("  arquivo gerado e commitado, e a pagina le o arquivo. Se voce esta");
  console.error("  no CI e viu isso, o caminho certo e commitar dados/estado.json,");
  console.error("  nao tentar ler o runtime de la.");
  process.exit(1);
}

const saida = {
  schema: "portfolio.estado.v1",
  gerado_em: new Date().toISOString(),
  fonte: "~/.banzinho/{state,logs} — estado vivo do runtime, agregado",
  execucao: ex,
  falhas: fl,
  auto_auditoria: dc,
  portoes: po,
};

const texto = JSON.stringify(saida, null, 2) + "\n";
if (process.argv.includes("--stdout")) {
  console.log(texto);
} else {
  fs.writeFileSync(SAIDA, texto, "utf8");
  console.log("dados/estado.json:", Buffer.byteLength(texto), "bytes");
  console.log("  execucao :", ex.chamadas_medidas, "chamadas |", ex.ferramentas.length, "ferramentas | taxa de erro", (ex.taxa_erro_global * 100).toFixed(1) + "%");
  console.log("  falhas   :", fl.length, "assinaturas distintas");
  console.log("  achados  :", dc ? dc.total : 0, "| severidade", dc ? JSON.stringify(dc.por_severidade) : "-");
  console.log("  portoes  :", po.registros, "registros |", JSON.stringify(po.por_decisao));
}

// rede de seguranca: o arquivo nao pode ter caminho do usuario nem id de sessao
if (!process.argv.includes("--stdout")) {
  const br = fs.readFileSync(SAIDA, "utf8");
  const problemas = [];
  if (br.includes(os.homedir())) problemas.push("home do usuario no arquivo");
  if (/\bses_[\w]{8,}\b/.test(br)) problemas.push("session id no arquivo");
  if (/\boc\.call_[\w]+\b/.test(br)) problemas.push("call id no arquivo");
  if (/[A-Za-z]:\\/.test(br)) problemas.push("caminho com letra de drive no arquivo");
  if (problemas.length) {
    console.error("ABORTADO — vazamento no arquivo gerado:");
    for (const p of problemas) console.error("  " + p);
    process.exit(2);
  }
  console.log("  vazamento : nenhum (home, session id, call id, caminho absoluto)");
}