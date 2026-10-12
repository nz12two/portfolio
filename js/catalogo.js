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
  // O id no HTML passou de "fCats" (categoria) para "fTipos" quando a taxonomia
  // virou declarada. A variavel ficou com o nome antigo e `fTipos` daria
  // ReferenceError — a pagina inteira pararia em `montarFacetas`.
  var fTipos = document.getElementById("fTipos");
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
  // O filtro de tipo usa a taxonomia DECLARADA, nao os tipos que existem no
  // catalogo. Derivar mostraria so "os tipos que tem item", que e a pagina
  // voltando a dizer que o NZ so faz o que ja publicou.
  function montarFacetas() {
    var tipos = DADOS.tipos && DADOS.tipos.length ? DADOS.tipos : [];

    fTipos.innerHTML = tipos
      .map(function (t) {
        var n = DADOS.itens.filter(function (i) { return i.tipo === t.slug; }).length;
        return '<label' + (n ? "" : ' class="fset__vazio"') + '>' +
          '<input type="checkbox" name="tipo" value="' + esc(t.slug) + '"' + (n ? "" : " disabled") + ">" +
          "<span>" + esc(t.rotulo) + ' <i>' + n + "</i></span></label>";
      })
      .join("");

    // Marketplace: um card por tipo declarado, com a contagem real. Tipo vazio
    // entra apagado e NAO some — a pratica existe e isso e informacao.
    var mkt = document.getElementById("mktGrid");
    if (mkt) {
      mkt.innerHTML = tipos
        .map(function (t) {
          var n = DADOS.itens.filter(function (i) { return i.tipo === t.slug; }).length;
          return '<button type="button" class="mkt__card' + (n ? "" : " mkt__card--vazio") + '"' +
            ' data-tipo="' + esc(t.slug) + '"' + (n ? "" : " disabled") +
            ' aria-pressed="false">' +
            '<span class="mkt__n">' + n + "</span>" +
            '<span class="mkt__rotulo">' + esc(t.rotulo) + "</span>" +
            '<span class="mkt__desc">' + esc(t.desc) + "</span>" +
            "</button>";
        })
        .join("");

      // Um clique no card marca o checkbox do mesmo tipo, e os dois ficam em
      // sincronia porque os dois escrevem no mesmo estado.
      mkt.addEventListener("click", function (e) {
        var b = e.target.closest(".mkt__card");
        if (!b || b.disabled) return;
        var box = fTipos.querySelector('input[value="' + b.getAttribute("data-tipo") + '"]');
        if (!box) return;
        box.checked = !box.checked;
        atualizarEVoltarAoTopo();
      });
    }

    fStacks.innerHTML = DADOS.facetas.stack
      .map(function (s) {
        return '<label><input type="checkbox" name="stack" value="' + esc(s) + '"><span>' + esc(s) + "</span></label>";
      })
      .join("");
  }

  // ===== FILTRO =====

  // Filtra e reaplica o estado visual do marketplace. O card e o checkbox sao
  // o mesmo filtro visto de dois lugares: marcar um tem que acender o outro.
  function sincronizarMarketplace() {
    var marcados = [].slice.call(document.querySelectorAll('input[name="tipo"]:checked'))
      .map(function (i) { return i.value; });
    Array.prototype.forEach.call(document.querySelectorAll(".mkt__card"), function (b) {
      b.setAttribute("aria-pressed", marcados.indexOf(b.getAttribute("data-tipo")) !== -1 ? "true" : "false");
    });
  }

  function atualizarEVoltarAoTopo() {
    desenhar();
    sincronizarMarketplace();
  }

  function estado() {
    return {
      q: normalizar(q.value.trim()),
      preco: [].slice.call(document.querySelectorAll('input[name="preco"]:checked')).map(function (i) { return i.value; }),
      vip: document.querySelector('input[name="vip"]').checked,
      cat: [].slice.call(document.querySelectorAll('input[name="tipo"]:checked')).map(function (i) { return i.value; }),
      stack: [].slice.call(document.querySelectorAll('input[name="stack"]:checked')).map(function (i) { return normalizar(i.value); }),
    };
  }

  function filtrar() {
    var e = estado();
    var out = DADOS.itens.filter(function (it) {
      if (e.q && it.busca.indexOf(e.q) === -1) return false;
      if (e.preco.length && e.preco.indexOf(it.precoChave) === -1) return false;
      if (e.vip && !it.temVip) return false;
      // O checkbox carrega o SLUG do tipo ("ferramenta"); `it.categoria` e o ROTULO
// ("Ferramenta"). Comparar os dois nunca casava, e o filtro de tipo nao
// filtrava nada — marcava "ferramenta" e devolvia 6 de 6, parecendo quebrado.
      // Casing aside, e o mesmo criterio: o slug do tipo contra o slug do item.
      if (e.cat.length && e.cat.indexOf(it.tipo) === -1) return false;
      // Itens sem tipo (devem ser raros, mas nao impossiveis) somem quando ha
      // filtro de tipo: manter um item sem classificacao numa lista que diz
      // "so ferramentas" seria pior que nao mostrar.
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
      // Foto so quando existe captura real. Sem imagem entra o motivo, em vez
      // de um retangulo cinza que parece falha de carregamento.
      var foto = it.imagem
        ? '<figure class="res__foto"><img src="' + esc(it.imagem) + '" alt="' + esc(it.imagemAlt || "") + '" loading="lazy" decoding="async" width="1100" height="739"></figure>'
        : '<p class="res__semfoto">' + esc(it.imagemMotivo || "Sem imagem.") + "</p>";

      // Metrica dentro do card, nao contagem ao lado. A pesquisa dos
      // portfolios reais mostrou o padrao: Dejan Markovic poe "1M+ downloads",
      // "13M+ users" DENTRO do item do projeto. O que a vitrine mostrava era
      // "5 passos / 2 gratis / 1 vip" — contagem de formulario, que nao prova
      // trabalho nenhum e so ocupa espaco. Quando o produto tem `prova`, ela
      // entra aqui com a unidade; sem prova, cai para os numeros uteis.
      var metricas = it.prova
        ? ["<strong>" + esc(String(it.prova.num)) + "</strong> " + esc(it.prova.unidade)]
        : [it.passos + " passos", it.nGratis + " grátis", it.nVip + " vip"];

      // Projeto fechado: o repo nao existe ainda, e link para repo ausente e
      // link quebrado. O cartao diz que e fechado e por que, em vez de
      // oferecer um 404.
      var fechado = it.privado
        ? '<p class="res__fechado"><span class="tag tag--priv">fechado</span> ' +
          esc(it.distribuicao || "Código privado. Vira distribuível depois.") + "</p>"
        : "";

      return '<div class="res" role="listitem">' +
        '<span class="res__n">' + String(it.i).padStart(2, "0") + "</span>" +
        "<div>" +
          '<h3 class="res__name"><a href="./' + esc(it.slug) + '.html">' + marcar(it.nome, termo) + "</a></h3>" +
          '<p class="res__desc">' + marcar(it.tagline, termo) + "</p>" +
          foto +
          fechado +
          '<div class="res__tags">' +
            '<span class="tag tag--' + (it.status === "beta" ? "beta" : it.status === "em-producao" || it.privado ? "acc" : "ok") + '">' + esc(it.statusTexto) + "</span>" +
            '<span class="tag">' + esc(it.categoria) + "</span>" +
            '<span class="tag tag--acc">' + esc(it.preco) + "</span>" +
            it.stack.slice(0, 3).map(function (s) { return '<span class="tag">' + esc(s) + "</span>"; }).join("") +
          "</div>" +
          '<button class="cmp__pick" data-cmp="' + esc(it.slug) + '" aria-pressed="' + (cmp.indexOf(it.slug) !== -1) + '">' +
            (cmp.indexOf(it.slug) !== -1 ? "no comparador ✓" : "+ comparar") +
          "</button>" +
        "</div>" +
        '<div class="res__stats">' +
          metricas.map(function (m) { return "<span>" + m + "</span>"; }).join("") +
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
    // Busca, checkbox e ordenacao passam todos por `atualizarEVoltarAoTopo`, e nao
    // por `desenhar` cru: sem a sincronia, digitar na busca ou marcar um
    // checkbox atualizava a lista mas deixava o card do marketplace com o
    // estado velho — dois controles mostrando verdades diferentes.
    q.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(atualizarEVoltarAoTopo, 90); // espera a digitacao em vez de filtrar por tecla
    });

    document.querySelectorAll(".ctrl input[type=checkbox]").forEach(function (i) {
      i.addEventListener("change", atualizarEVoltarAoTopo);
    });
    sort.addEventListener("change", atualizarEVoltarAoTopo);

    grid.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-cmp]");
      if (b) alternarCmp(b.getAttribute("data-cmp"), b);
    });

    document.getElementById("clear").addEventListener("click", function () {
      q.value = "";
      // O seletor antigo era ".ctrl input" — os checkboxes de tipo estao dentro de
      // .ctrl, mas os cards do marketplace estao ACIMA de .ctrl. Sem soltar
      // os cards aqui, "limpar" limpava os dois e deixava o marketplace
      // marcando um tipo que nao estava filtrando nada.
      document.querySelectorAll(".ctrl input[type=checkbox]").forEach(function (i) { i.checked = false; });
      sort.value = "nome";
      desenhar();
      sincronizarMarketplace();
      q.focus();
    });

    document.getElementById("cmpClear").addEventListener("click", function () {
      cmp = [];
      desenhar();
      desenharCmp();
    });
  }

  /* ===== BOOT =====
     Os dados vem de dados/catalogo.js, que e window.CATALOGO. Antes vinha por
     fetch do .json e abria direto do disco a pagina ficava vazia com
     "Failed to fetch" — o catalogo inteiro sumia por causa de como o arquivo foi
     aberto. JS carregado por <script> nao depende de contexto.
     O fetch do .json so fica como reserva se o .js nao vier. */
  function comDados(d) {
    DADOS = d;
    montarFacetas();
    ligar();
    desenhar();

    // Rodapé com o dado que muda: quantos produtos e quando o catálogo foi
    // gerado. Substitui uma frase fixa que não dizia nada.
    var ftr = document.getElementById('ftrDados');
    if (ftr) {
      var n = DADOS.total || DADOS.itens.length;
      ftr.textContent = n + (n === 1 ? ' produto' : ' produtos') +
        ' · atualizado em ' + String(DADOS.gerado_em || '').slice(0, 10);
    }
  }

  function falha(e) {
    // Estado honesto: se os dados nao carregaram, a pagina diz por que em vez
    // de mostrar "0 produtos", que pareceria que o catalogo esta vazio.
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent =
      "Não consegui carregar os dados do catálogo (" + (e && e.message ? e.message : "erro") +
      "). Rode: node tools/gerar-catalogo.js";
    count.textContent = "erro";
  }

  if (window.CATALOGO) {
    comDados(window.CATALOGO);
  } else {
    fetch("dados/catalogo.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(comDados)
      .catch(falha);
  }
})();