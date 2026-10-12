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
    privado: { txt: "fechado", cls: "tag--priv" },
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

    // Projeto fechado precisa dizer na home, e nao so na pagina dele. A pessoa
    // le a vitrine primeiro: um cartao sem aviso que leva a uma pagina sem
    // link de repo parece quebrado, e nao parece um projeto fechado de
    // proposito.
    var fechado = it.privado
      ? '<p class="item__fechado">Código fechado, sem repo ainda. Vira distribuível quando sair do meu computador.</p>'
      : "";

    // Metrica de dentro do produto, no card. Sem ela, a vitrine contaria
    // produtos e o NZ ja reprovou essa conta.
    var prova = it.prova
      ? '<p class="item__prova"><strong>' + esc(String(it.prova.num)) + "</strong> " + esc(it.prova.unidade) + "</p>"
      : "";

    return (
      '<a class="item rv" href="catalogo/' + esc(it.slug) + '.html">' +
      '<span class="item__n">' + String(it.i).padStart(2, "0") + "</span>" +
      "<div>" +
      '<h3 class="item__name">' + esc(it.nome) + "</h3>" +
      '<p class="item__desc">' + esc(it.home ? it.home.descricao : it.tagline) + "</p>" +
      prova +
      fechado +
      '<div class="item__tags">' +
      tags.map(function (t) {
        return '<span class="tag' + (t.cls ? " " + t.cls : "") + '">' + esc(t.txt) + "</span>";
      }).join("") +
      "</div></div>" +
      '<span class="item__go" aria-hidden="true">&rarr;</span>' +
      "</a>"
    );
  };

  // Hero: prova de dentro de cada produto, lida do catalogo.
//
// A faixa anterior contava "5 produtos / 4 linguagens / 4 repos". Isso e bio do
// portfolio, nao prova de trabalho — e o NZ leu e nao acreditou em nada. Estes
// numeros sao de dentro dos produtos (2085 APIs sondadas, 19 detectores, 372
// repos e pacotes) e cada um da para conferir abrindo o repo. E o mesmo truque
// do hero da Vercel, que prova com cliente porque tem cliente: o NZ prova com
// codigo, que e o que ele tem.
//
// A faixa se monta com ate 3 provas, na ordem em que os produtos aparecem no
// catalogo — entra um produto com `prova` novo e ele ocupa a faixa, sem
// editar HTML. Sem `prova` em nenhum produto, a faixa some em vez de mostrar
// zero ou texto generico.
  var heroNums = function (dados) {
    var el = document.getElementById("heroNums");
    if (!el) return;

    var comProva = dados.itens.filter(function (i) { return i.prova && i.prova.num; });
    if (!comProva.length) {
      el.hidden = true;
      return;
    }
    el.hidden = false;

    el.innerHTML = comProva.slice(0, 3).map(function (i) {
      var pr = i.prova;
      // numero grande e unidade embaixo; o "como" fica como title para o
      // hover, senão a faixa vira um paragrafo e perde a leitura de 2s.
      return "<div title=\"" + esc(pr.como || "") + "\">" +
        "<dt>" + esc(pr.unidade) + "</dt>" +
        "<dd>" + esc(String(pr.num)) + "</dd></div>";
    }).join("");
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

    // O select de assunto do formulario vem da MESMA taxonomia do marketplace.
    // Uma lista de opcoes aqui e outra no catalogo iam divergir na primeira
    // edicao — e o que divergiu antes: o formulario ofereceva tres coisas
    // (plugin, catalogo, automacao) que eram os tres produtos do dia, e nao
    // os tipos de trabalho que o NZ faz.
    var sel = document.getElementById("v2-assunto");
    var tipos = dados.tipos || [];
    if (sel && tipos.length) {
      sel.innerHTML =
        tipos.map(function (t) {
          return '<option value="' + esc(t.slug) + '">' + esc(t.rotulo) + "</option>";
        }).join("") +
        '<option value="outro">Outro — descreva abaixo</option>';
    }
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