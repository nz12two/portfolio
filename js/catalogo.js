/* Catálogo completo — catalogo.js na raiz de catálogo/
   Tudo deriva de window.CATALOGO. Comportamento: busca texto, filtro por
   tipo/dominio/status/preço, ordenação (catálogo, prova, nome). Um filtro
   sem resultado mostra estado vazio com a frase honesta do catálogo. */
(function () {
  'use strict';

  var REDUZ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* barra compacta ao rolar */
  var bar = $('bar');
  addEventListener('scroll', function () { bar.classList.toggle('compacta', scrollY > 40); }, { passive: true });

  var C = window.CATALOGO;
  if (!C || !C.itens) {
    var grid0 = $('grid');
    if (grid0) grid0.innerHTML =
      '<p class="vazio">O catálogo não carregou. A fonte é <b>catalogo/dados/catalogo.js</b> — sem ele esta página fica vazia de propósito.</p>';
    var cont0 = $('contagem');
    if (cont0) cont0.textContent = '0 produtos';
    return;
  }
  var itens = C.itens;
  requestAnimationFrame(function () { document.body.classList.add('aberto'); });

  /* reveal das seções */
  var obs = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); obs.unobserve(en.target); } });
  }, { threshold: 0.2 });
  document.querySelectorAll('.rv').forEach(function (el) {
    var pai = el.parentNode, d = 0;
    if (pai) {
      for (var k = 0; k < pai.children.length; k++) {
        var c = pai.children[k];
        if (c === el) break;
        if (c.classList && c.classList.contains('rv')) d++;
      }
    }
    el.style.setProperty('--d', d);
    obs.observe(el);
  });

  /* dados auxiliares */
  var provas = {};
  var SO = (itens.find(function (i) { return i.slug === 'banzinho'; }) || {}).statusExtra || {};
  itens.forEach(function (i) {
    provas[i.slug] = i.prova && i.prova.num
      ? i.prova.num + (i.slug === 'antixray' ? '+' : '') + ' ' + i.prova.unidade
      : (i.slug === 'banzinho' && SO.verificadores ? SO.verificadores + ' verificadores de regra' : '');
  });
  var nFila = function (s) {
    s = String(s == null ? '' : s);
    return s.replace(/SQLite\/MySQL\/MariaDB\/PostgreSQL/g, 'SQL');
  };

  /* prateleira do marketplace + data em que o produto entrou no ar */
  var rotsCat = {};
  ((C && C.categoriasMkt) || []).forEach(function (c) { rotsCat[c.slug] = c.rotulo; });
  var rotCat = function (slug) { return rotsCat[slug] || ''; };
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var quando = function (iso) {
    var p = String(iso || '').split('-');
    if (p.length < 3) return '';
    return p[2] + ' ' + MESES[+p[1] - 1] + ' ' + p[0];
  };

  /* ===== 1. tipos segmentados (só tipos com item; contagem do catálogo) ===== */
  var segTipo = $('segTipo');
  var segHTML = function () {
    return '<button type="button" class="seg__bt' + (estado.tipo ? '' : ' on') + '" data-tipo="">todos <em>' + itens.length + '</em></button>' +
      C.tipos.filter(function (t) {
        return itens.some(function (i) { return i.tipo === t.slug; });
      }).map(function (t) {
        var n = itens.filter(function (i) { return i.tipo === t.slug; }).length;
        return '<button type="button" class="seg__bt' + (estado.tipo === t.slug ? ' on' : '') + '" data-tipo="' + esc(t.slug) + '">' +
          esc(t.rotulo.toLowerCase()) + ' <em>' + n + '</em></button>';
      }).join('');
  };

  /* ===== 2. painel de filtros ===== */
  var grupos = [
    { chave: 'dominio', rotulo: 'domínio' },
    { chave: 'status',  rotulo: 'status' },
    { chave: 'preco',   rotulo: 'preço' }
  ];
  var valores = {
    dominio: (C.dominios || []).map(function (d) { return [d, d]; }),
    status:  [].concat(C.facetas.status || Object.keys(itens.reduce(function (a, i) { a[i.status] = 1; return a; }, {}))),
    preco:   [].concat(C.facetas.preco || ['gratis', 'consulta'])
  };
  var rotulos = { gratis: 'grátis', consulta: 'sob consulta', estavel: 'estável', 'em-producao': 'em produção', privado: 'privado', beta: 'beta' };

  /* deep-link: ?ordem=prova&f=status&v=gratis&q=xray — filtro compartilhável */
  var qs = null;
  try { qs = new URLSearchParams(location.search); } catch (e) { qs = { get: function () { return null; } }; }
  var estado = { texto: '', cat: '', tipo: '', dominio: '', status: '', preco: '', ordem: 'catálogo' };
  if (qs.get('q')) estado.texto = qs.get('q');
  if (qs.get('cat')) estado.cat = qs.get('cat');
  if (['tipo', 'dominio', 'status', 'preco'].indexOf(qs.get('f')) !== -1) estado[qs.get('f')] = qs.get('v') || '';
  if (['catálogo', 'prova', 'nome'].indexOf(qs.get('ordem')) !== -1) estado.ordem = qs.get('ordem');

  var chipsHTML = function () {
    return grupos.map(function (g) {
      return '<span class="chipgrupo mono">' + esc(g.rotulo) + '</span>' +
        valores[g.chave].map(function (par) {
          var k = Array.isArray(par) ? par[0] : par;
          var rot = Array.isArray(par) ? (rotulos[k] || par[1]) : (rotulos[k] || k);
          var n = itens.filter(function (i) {
            if (g.chave === 'preco') return (i.precoChave || '') === k;
            return i[g.chave] === k;
          }).length;
          return '<button type="button" class="filtro' + (estado[g.chave] === k ? ' on' : '') + '" data-g="' + g.chave + '" data-k="' + esc(k) + '">'
            + esc(rot) + (n ? '<i>' + n + '</i>' : '') + '</button>';
        }).join('');
    }).join('');
  };
  var painelChips = $('painelChips');
  var pintaFiltros = function () {
    painelChips.innerHTML = chipsHTML();
    segTipo.innerHTML = segHTML();
    var ativos = ['dominio', 'status', 'preco'].filter(function (k) { return estado[k]; }).length;
    var arc = $('maisCnt');
    if (arc) arc.textContent = ativos ? '(' + ativos + ')' : '';
  };
  pintaFiltros();
  $('ordem').value = estado.ordem;

  /* ===== 2b. prateleiras: categoria primeiro, item depois =====
     Categoria sem produto continua na lista, marcada "chegando". É o que
     mostra que o catálogo tem prateleira vazia de propósito e cresce com o
     tempo — esconder a prateleira faria parecer que só existe o que já saiu. */
  var ICONE_CAT = {
    plugins: 'paper', modpacks: 'box', otimizacoes: 'bolt', automacoes: 'gear',
    ferramentas: 'wrench', apis: 'plug', agentes: 'bot', jogos: 'pad', servicos: 'briefcase'
  };
  var catsBox = $('cats');
  var contaCat = {};
  itens.forEach(function (i) { if (i.categoriaMkt) contaCat[i.categoriaMkt] = (contaCat[i.categoriaMkt] || 0) + 1; });
  var listaCat = C.categoriasMkt || [];

  var pintaCats = function () {
    if (!catsBox) return;
    catsBox.innerHTML =
      '<button type="button" class="cat' + (estado.cat ? '' : ' on') + '" data-cat="">' +
      'todos <em>' + itens.length + '</em></button>' +
      listaCat.map(function (c) {
        var n = contaCat[c.slug] || 0;
        var ic = window.NZICONE ? window.NZICONE(ICONE_CAT[c.slug] || 'box', 15) : '';
        return '<button type="button" class="cat' + (n ? '' : ' cat--vindo') + (estado.cat === c.slug ? ' on' : '') +
          '" data-cat="' + esc(c.slug) + '" title="' + esc(c.desc || '') + '">' +
          ic + esc(c.rotulo) + ' <em>' + (n ? n : 'chegando') + '</em></button>';
      }).join('');
  };
  pintaCats();
  if (catsBox) {
    catsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.cat');
      if (!b) return;
      estado.cat = (estado.cat === b.dataset.cat) ? '' : b.dataset.cat;
      pintaCats();
      aplica();
    });
  }

  /* ===== 3. card ===== */
  var card = function (i, n) {
    var stack = (i.stack || []).slice(0, 4);
    var cat = rotCat(i.categoriaMkt);
    return '<a class="proj" style="--i:' + (n || 0) + '" href="' + i.slug + '.html" data-slug="' + esc(i.slug) + '">' +
      '<span class="proj__tipo mono">' + esc(cat ? cat + ' / ' + (i.tipoRotulo || i.tipo) : (i.tipoRotulo || i.tipo)) + '</span>' +
      '<h3>' + esc(i.nome) +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></h3>' +
      '<p>' + esc((i.home && i.home.descricao) || i.tagline || '') + '</p>' +
      (provas[i.slug] ? '<span class="proj__prova">' + esc(provas[i.slug]) + ' — medido</span>' : '') +
      '<span class="proj__meta">status <b>' + esc(rotulos[i.status] || i.statusTexto || i.status) +
      '</b> · licença <b>' + esc(i.licenca || '—') +
      '</b> · ' + esc(i.preco) +
      (i.desde ? ' · no ar desde <b>' + esc(quando(i.desde)) + '</b>' : '') +
      '</span>' +
      (stack.length ? '<span class="proj__p mono">stack <b>' + esc(nFila(stack.join(' · '))) + '</b></span>' : '') +
      '</a>';
  };

  /* ===== 4. render + filtros ===== */
  var grid = $('grid');
  var contagem = $('contagem');
  var veredicto = $('veredicto');
  var limparBtn = $('limpar');

  var aplica = function () {
    var txt = estado.texto.trim().toLowerCase();
    var lista = itens.filter(function (i) {
      var chave = i.precoChave || '';
      if (estado.cat && i.categoriaMkt !== estado.cat) return false;
      if (estado.tipo && i.tipo !== estado.tipo) return false;
      if (estado.dominio && i.dominio !== estado.dominio) return false;
      if (estado.status && i.status !== estado.status) return false;
      if (estado.preco && chave !== estado.preco) return false;
      if (txt) {
        var campo = [i.nome, i.tagline, i.home && i.home.descricao, (i.stack || []).join(' '), i.tipoRotulo, provas[i.slug]]
          .join(' ').toLowerCase().replace(/sqlite\/mysql\/mariadb\/postgresql/g, 'sql');
        if (campo.indexOf(txt) === -1) return false;
      }
      return true;
    });
    if (estado.ordem === 'prova') {
      lista.sort(function (a, b) {
        var na = provas[a.slug] && a.prova && a.prova.num ? a.prova.num : 0;
        var nb = provas[b.slug] && b.prova && b.prova.num ? b.prova.num : 0;
        return nb - na;
      });
    } else if (estado.ordem === 'nome') {
      lista.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    }
    grid.innerHTML = lista.length
      ? lista.map(card).join('')
      : (estado.cat && !contaCat[estado.cat]
        ? '<p class="vazio__grande"><b>Prateleira vazia.</b> ' + esc(rotCat(estado.cat)) +
          ' ainda não tem produto publicado — a prateleira existe antes do item, de propósito. ' +
          'Entra no Discord se quiser que o primeiro seja o seu.</p>' +
          '<a class="mais mono" style="display:inline-block" href="#" id="limpaVazio">ver o catálogo inteiro ↺</a>'
        : '<p class="vazio__grande"><b>Nada aqui.</b> Não é bug: não existe produto com esse conjunto de filtros. Limpa um e tenta de novo.</p><a class="mais mono" style="display:inline-block" href="#" id="limpaVazio">limpar filtros ↺</a>');
    contagem.textContent = lista.length + (lista.length === 1 ? ' produto' : ' produtos');
    var filtrando = estado.texto || estado.cat || estado.tipo || estado.dominio || estado.status || estado.preco;
    veredicto.textContent = estado.cat
      ? (rotCat(estado.cat) + (contaCat[estado.cat] ? '' : ' — chegando'))
      : (filtrando ? 'Filtrando o catálogo' : 'Todos os produtos');
    limparBtn.hidden = !filtrando;
  };
  aplica();

  /* busca */
  var deb;
  $('q').addEventListener('input', function (e) {
    clearTimeout(deb);
    var v = e.target.value;
    deb = setTimeout(function () { estado.texto = v; aplica(); }, 140);
  });

  /* ordenação */
  $('ordem').addEventListener('change', function (e) { estado.ordem = e.target.value; aplica(); });

  /* filtros: chips dos grupos raros + segmentados de tipo */
  $('painelChips').addEventListener('click', function (e) {
    var b = e.target.closest('.filtro');
    if (!b) return;
    var g = b.dataset.g, k = b.dataset.k;
    estado[g] = (estado[g] === k) ? '' : k;
    pintaFiltros();
    aplica();
  });
  segTipo.addEventListener('click', function (e) {
    var b = e.target.closest('.seg__bt');
    if (!b) return;
    estado.tipo = (estado.tipo === b.dataset.tipo) ? '' : b.dataset.tipo;
    pintaFiltros();
    aplica();
  });

  /* tecla / foca a busca — atalho de quem lê README com mão no teclado */
  addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.altKey) return;
    var alvo = document.activeElement;
    if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'SELECT' || alvo.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    $('q').focus();
  });

  var zera = function () {
    estado.texto = ''; estado.cat = ''; estado.tipo = ''; estado.dominio = ''; estado.status = ''; estado.preco = '';
    $('q').value = '';
    pintaFiltros();
    pintaCats();
    aplica();
  };
  limparBtn.addEventListener('click', zera);
  grid.addEventListener('click', function (e) {
    if (e.target.id === 'limpaVazio') { e.preventDefault(); zera(); }
  });

  /* rodapé com a data de geração do catálogo */
  var r = $('rodapeDados');
  if (r && C.gerado_em) r.textContent = 'catálogo gerado em ' + new Date(C.gerado_em).toLocaleDateString('pt-BR') + ' — fonte única: catalogo.js';
})();
