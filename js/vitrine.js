/* Vitrine da home: desenha a lista de produtos a partir de
 * catalogo/dados/catalogo.js (window.CATALOGO).
 *
 * Antes essa lista era HTML escrito a mao. Isso congelava a vitrine: entrar
 * um produto novo exigia editar index.html — numero, nome, descricao, tags —
 * e o lugar mais provavel de errar e o que se esquece. Aqui o JSON ja e a
 * fonte de verdade do catalogo, entao a home le o mesmo arquivo e cresce
 * sozinha.
 *
 * Se os dados nao chegarem, a secao diz o que houve. Uma vitrine vazia e
 * silenciosa e pior que a mensagem: parece que o NZ nao tem produto nenhum.
 */
(function () {
  "use strict";

  var grid = document.getElementById("items");
  var aviso = document.getElementById("itemsAviso");
  if (!grid) return;

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  // A vitrine mostra status so quando ele nao e o melhor caso. "estavel" em
  // tudo e o mesmo que nao mostrar status: nada de calmer o olho.
  var TAG_STATUS = {
    beta: { txt: "beta", cls: "tag--beta" },
    "em-producao": { txt: "em produção", cls: "tag--acc" },
  };
  var TAG_PRECO = {
    gratis: { txt: "grátis", cls: "tag--ok" },
    consulta: { txt: "sob consulta", cls: "tag--acc" },
    pago: { txt: "pago", cls: "" },
  };

  var card = function (it) {
    var tags = [];
    var st = TAG_STATUS[it.status];
    if (st) tags.push({ txt: st.txt, cls: st.cls });
    var pr = TAG_PRECO[it.precoChave];
    if (pr) tags.push({ txt: pr.txt, cls: pr.cls });
    (it.home && it.home.tags ? it.home.tags : []).forEach(function (t) {
      tags.push({ txt: t, cls: "" });
    });

    return (
      '<a class="item rv" href="catalogo/' + esc(it.slug) + '.html">' +
      '<span class="item__n">' + String(it.i).padStart(2, "0") + "</span>" +
      "<div>" +
      '<h3 class="item__name">' + esc(it.nome) + "</h3>" +
      '<p class="item__desc">' + esc(it.home ? it.home.descricao : it.tagline) + "</p>" +
      '<div class="item__tags">' +
      tags.map(function (t) {
        return '<span class="tag' + (t.cls ? " " + t.cls : "") + '">' + esc(t.txt) + "</span>";
      }).join("") +
      "</div></div>" +
      '<span class="item__go" aria-hidden="true">&rarr;</span>' +
      "</a>"
    );
  };

  // Hero: numeros do portfolio, lidos do catalogo. Promessa de hero nao se
  // acredita; "2085 APIs, 52 categorias" se acredita porque abre o repo. Estes
  // crescem quando entra produto novo, em vez de envelhecerem no HTML.
  //
  // "Linguagens" conta so linguagens de programacao de verdade. Contar as
  // facetas de stack dava 17 e chamava Gradle, Paper API e SQLite de
  // linguagem — numero bonito e falso. A lista e curta de proposito: e o
  // conjunto de linguagens que o NZ realmente usa, nao o que casaria por
  // substring (TypeScript casaria em "JS" e contaria duas vezes).
  var LINGUAGENS = ["Java", "JavaScript", "TypeScript", "Python", "C", "C++", "C#",
    "Go", "Rust", "PHP", "Ruby", "SQL", "Shell", "Kotlin", "Swift", "Dart"];

  var heroNums = function (dados) {
    var el = document.getElementById("heroNums");
    if (!el) return;
    var usados = {};
    dados.itens.forEach(function (i) {
      (i.stack || []).forEach(function (s) {
        var nome = String(s).split("/")[0].split(" ")[0]; // "SQLite/MySQL" -> "SQLite", "Astro 7" -> "Astro"
        if (LINGUAGENS.indexOf(nome) >= 0) usados[nome] = 1;
      });
    });
    var comRepo = dados.itens.filter(function (i) { return i.repo; }).length;
    var vals = {
      total: dados.total || dados.itens.length,
      linguagens: Object.keys(usados).length,
      repos: comRepo,
    };
    Array.prototype.forEach.call(el.querySelectorAll("[data-num]"), function (dd) {
      var v = vals[dd.getAttribute("data-num")];
      if (typeof v === "number") dd.textContent = String(v);
    });
  };

  var montar = function (dados) {
    grid.innerHTML = dados.itens.map(card).join("");

    // O reveal observa os .rv por seletor no momento em que roda. A lista nasce
    // depois disso, entao os itens novos ficariam invisiveis para sempre sem
    // entrar no observer de novo.
    if (window.__reveal) window.__reveal(grid);

    // Rodapé: o número de produtos e a data da geração. É o dado que muda
    // sozinho; a frase fixa que estava aqui antes não mudava nunca. O mesmo
    // script roda na home e no catálogo, então o texto serve aos dois.
    var ftr = document.getElementById("ftrDados");
    if (ftr) {
      var n = dados.total || dados.itens.length;
      ftr.textContent =
        n + (n === 1 ? " produto" : " produtos") +
        " · atualizado em " + String(dados.gerado_em || "").slice(0, 10);
    }

    heroNums(dados);
  };

  var falhou = function (msg) {
    aviso.hidden = false;
    aviso.textContent =
      "Não consegui montar a lista de produtos (" + msg +
      "). Rode: node tools/gerar-catalogo.js";
  };

  if (window.CATALOGO) montar(window.CATALOGO);
  else {
    // Fallback por fetch: cobre o caso do catalogo.js nao estar carregado, mas
    // a vitrine depende dele tanto que isso e rede de seguranca, nao o caminho.
    fetch("catalogo/dados/catalogo.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(montar)
      .catch(function (e) { falhou(e.message || "erro"); });
  }
})();