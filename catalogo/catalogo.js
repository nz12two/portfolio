/* Catalogo interativo: busca, filtro, ordenacao e comparacao.
 *
 * Os dados vem de catalogo/dados/catalogo.json, gerado por gerar-catalogo.js a
 * partir de produtos.json + vip.json. Esta pagina nao inventa estado: tudo que
 * aparece na tela veio do arquivo, entao o que o filtro esconde e o que existe.
 *
 * Sem framework. Sao 5 funcoes e um array; um componente de tabela paginada aqui
 * custaria mais configuracao do que o codigo. */
(function () {
  "use strict";

  var MAX_CMP = 3;

  var grid = document.getElementById("grid");
  var empty = document.getElementById("empty");
  var count = document.getElementById("count");
  var q = document.getElementById("q");
  var sort = document.getElementById("sort");
  var fCats = document.getElementById("fCats");
  var fStacks = document.getElementById("fStacks");
  var cmpSec = document.getElementById("comparar");
  var cmpBody = document.getElementById("cmpBody");

  var DADOS = null;
  var cmp = []; // slugs escolhidos para comparar

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* Marca o termo buscado. Sem isso o filtro parece nao funcionar: o item some
     e o usuario nao ve o porquê. Escapa antes, senao injeta HTML do proprio
     dado de busca. */
  function marcar(texto, termo) {
    if (!termo) return esc(texto);
    var seguro = esc(texto);
    var alvo = esc(termo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return seguro.replace(new RegExp("(" + alvo + ")", "gi"), "<mark>$1</mark>");
  }

  function normalizar(s) {
    return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // ===== FACETAS =====
  function montarFacetas() {
    fCats.innerHTML = DADOS.facetas.categoria
      .map(function (c) {
        return '<label><input type="checkbox" name="cat" value="' + esc(c) + '"><span>' + esc(c) + "</span></label>";
      })
      .join("");

    fStacks.innerHTML = DADOS.facetas.stack
      .map(function (s) {
        return '<label><input type="checkbox" name="stack" value="' + esc(s) + '"><span>' + esc(s) + "</span></label>";
      })
      .join("");
  }

  // ===== FILTRO =====
  function estado() {
    return {
      q: normalizar(q.value.trim()),
      preco: [].slice.call(document.querySelectorAll('input[name="preco"]:checked')).map(function (i) { return i.value; }),
      vip: document.querySelector('input[name="vip"]').checked,
      cat: [].slice.call(document.querySelectorAll('input[name="cat"]:checked')).map(function (i) { return i.value; }),
      stack: [].slice.call(document.querySelectorAll('input[name="stack"]:checked')).map(function (i) { return normalizar(i.value); }),
    };
  }

  function filtrar() {
    var e = estado();
    var out = DADOS.itens.filter(function (it) {
      if (e.q && it.busca.indexOf(e.q) === -1) return false;
      if (e.preco.length && e.preco.indexOf(it.precoChave) === -1) return false;
      if (e.vip && !it.temVip) return false;
      if (e.cat.length && e.cat.indexOf(it.categoria) === -1) return false;
      if (e.stack.length) {
        var bate = e.stack.some(function (s) { return it.stackChaves.indexOf(s) !== -1; });
        if (!bate) return false;
      }
      return true;
    });

    var modo = sort.value;
    out.sort(function (a, b) {
      if (modo === "categoria") return a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome);
      if (modo === "preco") {
        var ordem = { gratis: 0, consulta: 1, pago: 2 };
        return (ordem[a.precoChave] - ordem[b.precoChave]) || a.nome.localeCompare(b.nome);
      }
      if (modo === "vip") return b.nVip - a.nVip || a.nome.localeCompare(b.nome);
      return a.nome.localeCompare(b.nome);
    });
    return out;
  }

  function desenhar() {
    var lista = filtrar();
    var termo = q.value.trim();

    count.textContent = lista.length === DADOS.total
      ? DADOS.total + " produtos"
      : lista.length + " de " + DADOS.total;

    empty.hidden = lista.length > 0;
    grid.innerHTML = lista.map(function (it) {
      return '<div class="res" role="listitem">' +
        '<span class="res__n">' + String(it.i).padStart(2, "0") + "</span>" +
        "<div>" +
          '<h3 class="res__name"><a href="./' + esc(it.slug) + '.html">' + marcar(it.nome, termo) + "</a></h3>" +
          '<p class="res__desc">' + marcar(it.tagline, termo) + "</p>" +
          '<div class="res__tags">' +
            '<span class="tag tag--' + (it.status === "beta" ? "beta" : it.status === "em-producao" ? "acc" : "ok") + '">' + esc(it.statusTexto) + "</span>" +
            '<span class="tag">' + esc(it.categoria) + "</span>" +
            '<span class="tag tag--acc">' + esc(it.preco) + "</span>" +
            it.stack.slice(0, 3).map(function (s) { return '<span class="tag">' + esc(s) + "</span>"; }).join("") +
          "</div>" +
          '<button class="cmp__pick" data-cmp="' + esc(it.slug) + '" aria-pressed="' + (cmp.indexOf(it.slug) !== -1) + '">' +
            (cmp.indexOf(it.slug) !== -1 ? "no comparador ✓" : "+ comparar") +
          "</button>" +
        "</div>" +
        '<div class="res__stats">' +
          "<span>" + it.passos + " passos</span>" +
          "<span>" + it.nGratis + " grátis</span>" +
          "<span>" + it.nVip + " vip</span>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  // ===== COMPARAR =====
  var ROTULOS = [
    ["status", function (it) { return it.statusTexto; }],
    ["categoria", function (it) { return it.categoria; }],
    ["preço", function (it) { return it.preco; }],
    ["licença", function (it) { return it.licenca; }],
    ["stack", function (it) { return it.stack.join(", "); }],
    ["passos de instalação", function (it) { return String(it.passos); }],
    ["itens grátis", function (it) { return String(it.nGratis); }],
    ["itens VIP", function (it) { return String(it.nVip); }],
    ["status do repo", function (it) { return it.repo ? "aberto no GitHub" : "privado"; }],
  ];

  function desenharCmp() {
    var itens = cmp.map(function (s) { return DADOS.itens.find(function (i) { return i.slug === s; }); }).filter(Boolean);
    cmpSec.hidden = itens.length === 0;
    if (!itens.length) { cmpBody.innerHTML = ""; return; }

    // thead/tbody explicitos: sem eles o parser agrupa <tr> solto num tbody
    // implicito e o cabecalho nunca chega em thead — foi o que zerou a contagem
    // de "thead th" na medicao.
    var head = '<thead><tr><th scope="col"><span class="u-sr">produto</span></th>' + itens.map(function (it) {
      return '<th scope="col">' + esc(it.nome) + "</th>";
    }).join("") + "</tr></thead>";

    var linhas = ROTULOS.map(function (par) {
      return '<tr><th scope="row">' + esc(par[0]) + "</th>" +
        itens.map(function (it) { return "<td>" + esc(par[1](it)) + "</td>"; }).join("") +
        "</tr>";
    }).join("");

    cmpBody.innerHTML = "<table>" + head + "<tbody>" + linhas + "</tbody></table>";
  }

  function marcarBotao(b, ligado) {
    b.setAttribute("aria-pressed", ligado ? "true" : "false");
    b.textContent = ligado ? "no comparador ✓" : "+ comparar";
  }

  // Redesenar a lista inteira so para trocar o estado de um botao jogava fora o
  // foco do teclado e matava o no da tela de leitor. So o botao e a tabela
  // mudam, entao so eles sao tocados.
  function alternarCmp(slug, botao) {
    var at = cmp.indexOf(slug);
    if (at !== -1) cmp.splice(at, 1);
    else {
      // Estourou o limite: solta o mais antigo e reflete no botao dele, que
      // pode estar em outro lugar da lista.
      if (cmp.length >= MAX_CMP) {
        var saiu = cmp.shift();
        var antigo = grid.querySelector('[data-cmp="' + saiu + '"]');
        if (antigo) marcarBotao(antigo, false);
      }
      cmp.push(slug);
    }
    if (botao) marcarBotao(botao, cmp.indexOf(slug) !== -1);
    desenharCmp();
  }

  // ===== EVENTOS =====
  function ligar() {
    var t;
    q.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(desenhar, 90); // espera a digitacao em vez de filtrar por tecla
    });

    document.querySelectorAll(".ctrl input[type=checkbox]").forEach(function (i) {
      i.addEventListener("change", desenhar);
    });
    sort.addEventListener("change", desenhar);

    grid.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-cmp]");
      if (b) alternarCmp(b.getAttribute("data-cmp"), b);
    });

    document.getElementById("clear").addEventListener("click", function () {
      q.value = "";
      document.querySelectorAll(".ctrl input[type=checkbox]").forEach(function (i) { i.checked = false; });
      sort.value = "nome";
      desenhar();
      q.focus();
    });

    document.getElementById("cmpClear").addEventListener("click", function () {
      cmp = [];
      desenhar();
      desenharCmp();
    });
  }

  // ===== BOOT =====
  fetch("dados/catalogo.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (d) {
      DADOS = d;
      montarFacetas();
      ligar();
      desenhar();
    })
    .catch(function (e) {
      // Estado honesto: se os dados nao carregaram, a pagina diz por que em vez
      // de mostrar "0 produtos", que pareceria que o catalogo esta vazio.
      grid.innerHTML = "";
      empty.hidden = false;
      empty.textContent = "Não consegui carregar os dados do catálogo (" + e.message + "). Rode: node catalogo/gerar-catalogo.js";
      count.textContent = "erro";
    });
})();