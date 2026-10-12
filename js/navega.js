/* navegacao: scrollspy, busca global, atalho, menu movel, scroll suave */
/* Comentarios: max 2 linhas, so o nao-obvio */

(function () {
  'use strict';

  // Nao roda se o header nao tem o que precisa
  var hdrIn = document.querySelector('.hdr__in');
  var nav = document.querySelector('.nav');
  if (!hdrIn || !nav) return;

  var REDUZ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== SCROLLSPY: indicador da secao atual ===== */
  // Seção visível com maior área exposta vence
  var ids = ['sobre', 'produtos', 'novidades', 'prova', 'contato'];
  var links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  var bar = document.createElement('span');
  bar.className = 'nav__bar';
  nav.appendChild(bar);

  function atualizaBar() {
    var visivel = null;
    var maxArea = 0;
    ids.forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var rect = sec.getBoundingClientRect();
      var hjanela = window.innerHeight || 1;
      var area = Math.min(rect.bottom, hjanela) - Math.max(rect.top, 0);
      if (area > maxArea && area > 0) { maxArea = area; visivel = id; }
    });
    links.forEach(function (a) { a.classList.remove('active'); });
    if (visivel) {
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + visivel) a.classList.add('active');
      });
    }
    // Posiciona barra sob o link ativo (se houver)
    var ativo = nav.querySelector('a.active');
    if (ativo) {
      bar.style.width = ativo.offsetWidth + 'px';
      bar.style.left = ativo.offsetLeft + 'px';
      bar.style.opacity = '1';
    } else {
      bar.style.opacity = '0';
    }
  }

  var observer = new IntersectionObserver(function () { atualizaBar(); }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-68px 0px -50% 0px' });
  ids.forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) observer.observe(sec);
  });
  atualizaBar();
  window.addEventListener('scroll', atualizaBar, { passive: true });

  /* ===== BOTAO BUSCA E MENU MOVEL =====
     Os dois ja vem no HTML do header. Este codigo criava os dois tambem:
     o header ficava com DOIS botaos "Buscar" lado a lado (medido na captura,
     um em x=866 e outro em x=1208). Usa o que existe e so cria se faltar. */
  function botao(classe, rotulo, html) {
    var b = hdrIn.querySelector('.' + classe);
    if (b) return b;
    b = document.createElement('button');
    b.className = classe + ' btn';
    b.setAttribute('aria-label', rotulo);
    b.type = 'button';
    b.innerHTML = html;
    hdrIn.appendChild(b);
    return b;
  }

  /* Os botoes que este script cria quando o HTML nao os traz (outra pagina,
   * ou o header montado por outra via) usam o mesmo conjunto de icones do
   * resto. Antes aqui iam os caracteres U+2315 e U+2630: um nao e lupa e o
   * outro depende da fonte do sistema para sair desenhado. */
  function ic(nome) {
    return (window.icone && window.icone(nome)) || '';
  }

  var btnBusca = botao('btn--search', 'Buscar produtos e tecnologias', ic('busca') + '<span>Buscar</span>');

  var btnMenu = botao('btn--menu', 'Menu de navegação', ic('menu'));
  btnMenu.setAttribute('aria-expanded', 'false');

  // Painel mobile fora do fluxo quando fechado
  var painelMobile = document.createElement('div');
  painelMobile.className = 'nav-mobile-panel';
  painelMobile.setAttribute('aria-label', 'Menu');
  var mobileLinks = links.map(function (a) { return a.outerHTML; }).join('');
  // Contato e conta somem do header em < 820px; sem repeti-los aqui ficam
  // inalcancaveis no celular.
  mobileLinks += '<a href="#contato" class="btn">Contato</a>';
  mobileLinks += '<a href="conta.html" class="btn btn--acc" data-conta-open>entrar</a>';
  painelMobile.innerHTML = mobileLinks;
  document.body.appendChild(painelMobile);

  btnMenu.addEventListener('click', function () {
    var aberto = btnMenu.getAttribute('aria-expanded') === 'true';
    btnMenu.setAttribute('aria-expanded', String(!aberto));
    painelMobile.classList.toggle('open', !aberto);
  });

  painelMobile.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { btnMenu.setAttribute('aria-expanded', 'false'); painelMobile.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && painelMobile.classList.contains('open')) {
      btnMenu.setAttribute('aria-expanded', 'false'); painelMobile.classList.remove('open');
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 820) { btnMenu.setAttribute('aria-expanded', 'false'); painelMobile.classList.remove('open'); }
  });

  /* ===== PAINEL BUSCA ===== */
  // Cria se nao existir (o pai pode inserir manualmente)
  var searchModal = document.getElementById('searchModal');
  if (!searchModal) {
    searchModal = document.createElement('div');
    searchModal.id = 'searchModal'; searchModal.className = 'search-modal'; searchModal.setAttribute('role', 'dialog'); searchModal.setAttribute('aria-modal', 'true'); searchModal.setAttribute('aria-label', 'Busca');
    searchModal.innerHTML =
      '<div class="search-modal__box">' +
      '<div class="search-modal__hdr">' +
      '<input type="search" id="searchInput" placeholder="Nome, tagline, stack, tecnologia..." aria-label="Busca global" autocomplete="off">' +
      '<button type="button" class="search-modal__close" aria-label="Fechar busca">×</button>' +
      '</div>' +
      '<div class="search-modal__results" id="searchResults"></div>' +
      '</div>';
    document.body.appendChild(searchModal);
  }
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var closeSearchBtn = searchModal.querySelector('.search-modal__close');

  var focoAnterior = null;
  function abrirBusca() {
    focoAnterior = document.activeElement;
    searchModal.classList.add('open');
    setTimeout(function () { searchInput.focus(); }, 30);
    document.body.style.overflow = 'hidden';
  }
  function fecharBusca() {
    searchModal.classList.remove('open');
    document.body.style.overflow = '';
    if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus();
  }
  btnBusca.addEventListener('click', abrirBusca);
  closeSearchBtn.addEventListener('click', fecharBusca);
  searchModal.addEventListener('click', function (e) { if (e.target === searchModal) fecharBusca(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && searchModal.classList.contains('open')) { e.preventDefault(); fecharBusca(); }
  });

  /* ===== LOGICA DE BUSCA ===== */
  // Usa catalogo.json se disponivel; senão usa window.CATALOGO
  var catalogoData = null;
  function prepararDados() {
    if (catalogoData) return Promise.resolve(catalogoData);
    if (window.CATALOGO && window.CATALOGO.itens) {
      catalogoData = window.CATALOGO;
      return Promise.resolve(catalogoData);
    }
    return fetch('catalogo/dados/catalogo.json')
      .then(function (r) { return r.json(); })
      .catch(function () { return window.CATALOGO ? Promise.resolve(window.CATALOGO) : Promise.reject(); })
      .then(function (d) { catalogoData = d; return d; });
  }

  function pontuar(query, texto) {
    var q = query.toLowerCase();
    var t = (texto || '').toLowerCase();
    if (!q || !t) return 0;
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.indexOf(q) !== -1) return 40;
    return 0;
  }

  function buscar(query) {
    var resultados = [];
    var termo = (query || '').trim();
    if (!termo) return [];
    prepararDados().then(function (data) {
      if (!data || !data.itens) return;
      var itens = data.itens || [];
      itens.forEach(function (item) {
        var textoBusca = item.busca || '';
        if (!textoBusca) textoBusca = (item.nome || '') + ' ' + (item.tagline || '') + ' ' + (item.stack || []).join(' ');
        var score = Math.max(
          pontuar(termo, item.nome),
          pontuar(termo, item.tagline),
          pontuar(termo, item.tipoRotulo || item.tipo || ''),
          pontuar(termo, textoBusca)
        );
        if (item.stack) item.stack.forEach(function (s) { score = Math.max(score, pontuar(termo, s)); });
        if (score > 0) resultados.push({ tipo: 'item', item: item, score: score, texto: item.nome + ' — ' + (item.tagline || '') });
      });
      // Tecnologias de facetas como resultados proprios
      var stacksUnicos = {};
      itens.forEach(function (item) { (item.stack || []).forEach(function (s) { stacksUnicos[s] = true; }); });
      Object.keys(stacksUnicos).forEach(function (s) {
        var sc = pontuar(termo, s);
        if (sc > 0) resultados.push({ tipo: 'stack', nome: s, score: sc, texto: s });
      });
      // Ordena
      resultados.sort(function (a, b) { return b.score - a.score; });
      renderizaBusca(resultados.slice(0, 20), termo);
    }).catch(function () { renderizaBusca([], termo); });
  }

  function renderizaBusca(res, termo) {
    if (!res || res.length === 0) {
      searchResults.innerHTML = '<div class="search-modal__empty">Nenhum resultado para "' + escHTML(termo) + '". Tente nome, tagline, stack ou tecnologia.</div>';
      return;
    }
    var html = '';
    res.forEach(function (r, i) {
      var link = '';
      if (r.tipo === 'item') {
        link = 'catalogo/' + r.item.slug + '.html';
      } else {
        // Verifica se existe ancora; se nao, vai sem ancora
        link = 'catalogo/index.html';
      }
      html += '<a class="search-modal__item" href="' + link + '" data-idx="' + i + '"><b>' + escHTML(r.item ? r.item.nome : r.nome) + '</b><span>' + escHTML(r.texto) + '</span></a>';
    });
    searchResults.innerHTML = html;
  }

  function escHTML(s) {
    var d = document.createElement('div'); d.textContent = s; return d.innerHTML;
  }

  var selecionado = -1;
  function renderizarSelecao() {
    Array.from(searchResults.querySelectorAll('.search-modal__item')).forEach(function (a, i) {
      a.setAttribute('aria-selected', i === selecionado ? 'true' : 'false');
    });
  }
  searchInput.addEventListener('input', function () {
    selecionado = -1;
    buscar(searchInput.value);
  });
  searchInput.addEventListener('keydown', function (e) {
    var itens = Array.from(searchResults.querySelectorAll('.search-modal__item'));
    if (e.key === 'ArrowDown') { e.preventDefault(); selecionado = (selecionado + 1) % Math.max(itens.length, 1); renderizarSelecao(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selecionado = selecionado <= 0 ? Math.max(itens.length - 1, 0) : selecionado - 1; renderizarSelecao(); }
    else if (e.key === 'Enter') {
      if (itens[selecionado]) { itens[selecionado].click(); fecharBusca(); }
      else if (itens[0]) { itens[0].click(); fecharBusca(); }
    }
  });

  /* ===== PAINEL ATALHOS ===== */
  var shortcutsModal = document.getElementById('shortcutsModal');
  if (!shortcutsModal) {
    shortcutsModal = document.createElement('div');
    shortcutsModal.id = 'shortcutsModal'; shortcutsModal.className = 'shortcuts-modal';
    shortcutsModal.setAttribute('role', 'dialog'); shortcutsModal.setAttribute('aria-modal', 'true'); shortcutsModal.setAttribute('aria-label', 'Atalhos');
    shortcutsModal.innerHTML =
      '<div class="shortcuts-modal__box">' +
      '<h3>Atalhos</h3>' +
      '<ul>' +
      '<li><kbd>Ctrl+K</kbd> <span>Abrir busca</span></li>' +
      '<li><kbd>?</kbd> <span>Este painel</span></li>' +
      '<li><kbd>g h</kbd> <span>Hero (topo)</span></li>' +
      '<li><kbd>g s</kbd> <span>Sobre</span></li>' +
      '<li><kbd>g p</kbd> <span>Produtos</span></li>' +
      '<li><kbd>g v</kbd> <span>Prova</span></li>' +
      '<li><kbd>g c</kbd> <span>Contato</span></li>' +
      '</ul>' +
      '</div>';
    document.body.appendChild(shortcutsModal);
  }
  shortcutsModal.addEventListener('click', function (e) { if (e.target === shortcutsModal) shortcutsModal.classList.remove('open'); });

  /* ===== ATALHOS DE TECLADO ===== */
  // Protege enquanto digita
  var seq = '';
  var timer = null;
  function limpaSeq() { seq = ''; }

  document.addEventListener('keydown', function (e) {
    var focado = document.activeElement;
    var emCampo = focado && (focado.tagName === 'INPUT' || focado.tagName === 'TEXTAREA' || focado.isContentEditable);

    // ? abre atalhos (sempre, exceto se digitando em campo, mas ? pode abrir)
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      if (!emCampo) {
        e.preventDefault();
        shortcutsModal.classList.add('open');
      }
      return;
    }
    if (e.key === 'Escape') {
      if (shortcutsModal.classList.contains('open')) { shortcutsModal.classList.remove('open'); e.preventDefault(); }
      return;
    }
    // Ctrl+K / Cmd+K: sempre funciona
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      abrirBusca();
      return;
    }
    // Se esta digitando em campo, letras desligadas (mas Ctrl+K e ? continuam)
    if (emCampo) return;
    // Sequencia g + letra
    if (e.key === 'g' && seq === '') {
      seq = 'g';
      clearTimeout(timer);
      timer = setTimeout(limpaSeq, 1200);
      return;
    }
    if (seq === 'g') {
      var mapas = { h: '#topo', s: '#sobre', p: '#produtos', v: '#prova', c: '#contato' };
      if (mapas[e.key]) {
        e.preventDefault();
        document.querySelector(mapas[e.key]).scrollIntoView({ behavior: REDUZ ? 'auto' : 'smooth' });
        limpaSeq();
        clearTimeout(timer);
      } else {
        limpaSeq();
      }
      return;
    }
  });

  /* ===== SCROLL SUAVE COM OFFSET ===== */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href === '#') return;
      var alvo = document.querySelector(href);
      if (!alvo) return;
      e.preventDefault();
      var offset = 84; // altura aproximada do header + folga
      var y = alvo.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: REDUZ ? 'auto' : 'smooth' });
    });
  });
})();
