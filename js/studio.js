/* NZ Studios — studio.js
   Tudo deriva de catalogo/dados/catalogo.js (window.CATALOGO): hero-num do
   campo prova.num, vitrine de itens, contagem de stack. Sem dado no arquivo,
   mostra estado vazio — nunca inventa número. */
(function () {
  'use strict';

  var REDUZ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var fmt = function (n) { return n.toLocaleString('pt-BR'); };

  /* barra de topo compacta + progresso de leitura */
  var bar = document.getElementById('bar');
  var fill = document.getElementById('progressFill');
  var onScroll = function () {
    bar && bar.classList.toggle('compacta', scrollY > 40);
    if (fill) {
      var max = document.documentElement.scrollHeight - innerHeight;
      fill.style.transform = 'scaleX(' + (max > 0 ? Math.min(scrollY / max, 1) : 0) + ')';
    }
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* barra de topo compacta + progresso de leitura */

  /* montagem do hero no load */
  requestAnimationFrame(function () { document.body.classList.add('aberto'); });

  /* contagem animada dos números */
  var conta = function (el) {
    var fim = +(el.dataset.n || 0), suf = el.dataset.suf || '';
    if (fim === 0) { el.textContent = '—'; return; }
    if (REDUZ) { el.textContent = fmt(fim) + suf; return; }
    var t0 = performance.now(), dur = 1100;
    var tick = function (t) {
      var p = Math.min((t - t0) / dur, 1);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(fim * p)) + suf;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(fim) + suf;
    };
    requestAnimationFrame(tick);
  };

  /* reveal de seção */
  var obs = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); obs.unobserve(en.target); } });
  }, { threshold: 0.25 });
  document.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });

  /* tilt + glow nos cards */
  document.querySelectorAll('.proj').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--px', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--py', (py * 100).toFixed(1) + '%');
      if (!REDUZ) {
        card.style.setProperty('--rx', ((py - 0.5) * -4).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
      }
    });
    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  /* ===== conteúdo derivado do catálogo ===== */
  var C = window.CATALOGO;
  var itens = C && C.itens;

  /* 1. linha de provas do hero (números saem do campo prova.num, não de prosa) */
  var comProva = itens ? itens.filter(function (i) { return i.prova && i.prova.num; })
    .sort(function (a, b) { return b.prova.num - a.prova.num; }) : [];
  var provaLinha = document.getElementById('provaLinha');
  if (provaLinha) {
    if (comProva.length) {
      provaLinha.innerHTML = '<em>' + fmt(itens.length) + ' produtos</em> ' +
        comProva.slice(0, 4).map(function (i) {
          var suf = i.slug === 'antixray' ? '+' : '';
          return '<span>' + fmt(i.prova.num) + suf + ' ' + esc(i.prova.unidade) + '</span>';
        }).join('<i> · </i>');
    } else {
      provaLinha.textContent = 'catálogo no repositório — os números moram lá';
    }
  }

  /* 1b. terminal do hero: comandos digitados, provas impressas */
  var termBody = document.getElementById('termBody');
  if (termBody && itens) {
    var linhaProva = comProva.slice(0, 4).map(function (i) {
      return fmt(i.prova.num) + (i.slug === 'antixray' ? '+' : '') + ' ' + i.prova.unidade;
    }).join(' · ');
    var roteiro = [
      { cm: 'nz-studios --vitrine', out: [fmt(itens.length) + ' produtos publicados — todos com repo aberto'] },
      { cm: 'nz-studios --prova', out: ['medido no dado real:'] },
      { cm: 'nz-studios catalogo --filtros', out: ['tipo · stack · status · preço — em /portfolio/catalogo/'] }
    ];
    if (comProva.length) roteiro[1].out.push(linhaProva);

    var passoLinha = function (classe, texto) {
      var d = document.createElement('div');
      d.className = classe;
      d.textContent = texto;
      termBody.appendChild(d);
      return d;
    };
    var passos = [];
    roteiro.forEach(function (r) {
      passos.push({ tipo: 'cm', texto: r.cm });
      r.out.forEach(function (o) { passos.push({ tipo: 'out', texto: o }); });
    });

    if (REDUZ) {
      termBody.innerHTML = passos.map(function (s) { return s.texto; }).join('');
      passoLinha('cm', '');
    } else {
      var pi = 0, ci = 0, elLinha = null;
      var digit = function () {
        if (pi >= passos.length || !termBody.isConnected) {
          passoLinha('cm', '');
          var bc = document.createElement('span');
          bc.className = 'caret';
          termBody.appendChild(bc);
          return;
        }
        var st = passos[pi];
        if (st.tipo === 'cm') {
          var texto = st.texto;
          if (ci === 0) elLinha = passoLinha('cm', '');
          ci += 2;
          elLinha.textContent = texto.slice(0, ci);
          if (ci >= texto.length) { pi++; ci = 0; setTimeout(digit, 220); return; }
          setTimeout(digit, 42);
          return;
        }
        // saída: terminal imprime de uma vez
        passoLinha('out', ' ' + st.texto);
        pi++;
        setTimeout(digit, 210);
      };
      setTimeout(digit, 450);
    }
  }

  /* 2. vitrine: featured = antixray (vitrine do plugin-flagship); resto na ordem do catálogo */
  var grid = document.getElementById('grid');
  var filtroBox = document.getElementById('filtros');
  if (grid && itens) {
    var venha = function (i) {
      var prova = i.prova && i.prova.num
        ? ' — medida <b>' + fmt(i.prova.num) + (i.slug === 'antixray' ? '+' : '') + ' ' + esc(i.prova.unidade) + '</b>' : '';
      return '<a class="proj' + (i.slug === 'antixray' ? ' proj--destaque' : '') + '" href="catalogo/' + esc(i.slug) + '.html" data-tipo="' + esc(i.tipo) + '">' +
        '<span class="proj__tipo mono">' + esc(i.tipoRotulo || i.tipo || '') + '</span>' +
        '<h3>' + esc(i.nome) +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></h3>' +
        '<p>' + esc((i.home && i.home.descricao) || i.tagline || '') + '</p>' +
        '<span class="proj__p">stack <b>' + esc((i.stack || []).slice(0, 4).join(' · ').replace(/SQLite\/MySQL\/MariaDB\/PostgreSQL/g, 'SQL')) + '</b>' + prova + '</span></a>';
    };
    var destaque = itens.find(function (i) { return i.slug === 'antixray'; }) || itens[0];
    grid.innerHTML = [destaque].concat(itens.filter(function (i) { return i !== destaque; })).map(venha).join('');

    if (filtroBox && C.tipos) {
      var usados = {};
      itens.forEach(function (i) { usados[i.tipo] = (usados[i.tipo] || 0) + 1; });
      filtroBox.innerHTML = ['<button class="filtro on" data-f="">todos</button>'].concat(
        C.tipos.filter(function (t) { return usados[t.slug]; }).map(function (t) {
          return '<button class="filtro" data-f="' + esc(t.slug) + '">' + esc(t.rotulo.toLowerCase()) + '</button>';
        })
      ).join('');
    }
  } else if (grid) {
    grid.innerHTML = '<p class="vazio">O catálogo não carregou a lista de projetos. Verifique o arquivo: catalogo/dados/catalogo.js.</p>';
    if (filtroBox) filtroBox.style.display = 'none';
  }

  /* 3. filtro da vitrine */
  document.getElementById('filtros') && document.getElementById('filtros').addEventListener('click', function (e) {
    var b = e.target.closest('.filtro');
    if (!b) return;
    document.querySelectorAll('.filtro').forEach(function (f) { f.classList.remove('on'); });
    b.classList.add('on');
    var f = b.dataset.f;
    document.querySelectorAll('.proj').forEach(function (c) {
      var mostre = !f || c.dataset.tipo === f;
      c.style.display = mostre ? '' : 'none';
      if (mostre) {
        c.style.animation = 'none';
        void c.offsetHeight;
        c.style.animation = '';
      }
    });
  });

  /* 4. stack: contagem real — em quantos produtos cada tecnologia aparece */
  var stackBox = document.getElementById('stackLista');
  if (stackBox && itens) {
    var conta_m = {};
    itens.forEach(function (i) {
      var keys = {};
      (i.stack || []).forEach(function (s) { keys[s.toLowerCase()] = s; });
      Object.keys(keys).forEach(function (k) { (conta_m[k] = conta_m[k] || { nome: keys[k], n: 0 }).n++; });
    });
    var lista = Object.values(conta_m).sort(function (a, b) { return b.n - a.n || a.nome.localeCompare(b.nome); });
    var maxN = lista.length ? lista[0].n : 1;
    stackBox.innerHTML = lista.map(function (s) {
      return '<div class="stk"><b>' + esc(s.nome) + '</b><span class="barra"><i style="--v:' + (s.n / maxN).toFixed(3) + '"></i></span><span class="n">' + s.n + '×</span></div>';
    }).join('') +
    '<p class="stk__nota">Contagem real do catálogo publicado (' + fmt(itens.length) + ' produtos). Fonte: catalogo/dados/catalogo.js — aberto para conferir.</p>';
  } else if (stackBox) {
    stackBox.innerHTML = '<p class="vazio">O catálogo não carregou — a contagem de stack vive no catálogo.</p>';
  }
})();
