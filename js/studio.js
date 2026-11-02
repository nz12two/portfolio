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
  document.querySelectorAll('.rv').forEach(function (el) {
    // escalonamento: cada bloco .rv entra 90ms depois do irmão anterior
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

  /* tilt + glow nos cards — chamado também depois de cada render, porque os
     cards da vitrine nascem do catálogo, não do HTML */
  var ligaTilt = function (escopo) {
    (escopo || document).querySelectorAll('.proj').forEach(function (card) {
      if (card.dataset.tilt) return;
      card.dataset.tilt = '1';
      card.addEventListener('mousemove', function (e) {
        if (REDUZ) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', ((py - 0.5) * -4).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  };
  ligaTilt();

  /* ===== conteúdo derivado do catálogo ===== */
  var C = window.CATALOGO;
  var itens = C && C.itens;
  // prateleira do marketplace: slug -> rotulo legivel
  var rotuloCat = function (slug) {
    var l = (C && C.categoriasMkt) || [];
    for (var k = 0; k < l.length; k++) if (l[k].slug === slug) return l[k].rotulo;
    return '';
  };

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
    var docs = comProva.slice(0, 4);
    var roteiro = [
      { cm: 'nz-studios status', out: [
        '<em>ok</em> ' + fmt(itens.length) + ' produtos publicados · todos com repositório aberto'
      ] },
      { cm: 'nz-studios prova --resumo', out: ['medido no dado real, não estimado:'] },
      { cm: 'nz-studios catalogo --filtros', out: ['tipo · stack · status · preço → /portfolio/catalogo/'] }
    ];
    docs.forEach(function (i) {
      roteiro[1].out.push('<b>' + fmt(i.prova.num) + (i.slug === 'antixray' ? '+' : '') + '</b> ' + esc(i.prova.unidade));
    });

    var passoLinha = function (classe, html) {
      var d = document.createElement('div');
      d.className = classe;
      d.innerHTML = html === undefined ? '' : html;
      termBody.appendChild(d);
      return d;
    };
    var passos = [];
    roteiro.forEach(function (r) {
      passos.push({ tipo: 'cm', texto: r.cm });
      r.out.forEach(function (o) { passos.push({ tipo: 'out', texto: o }); });
    });

    if (REDUZ) {
      passos.forEach(function (s) {
        if (s.tipo === 'cm') passoLinha('cm', esc(s.texto));
        else passoLinha('out', '<i>→</i> ' + s.texto);
      });
    } else {
      var pi = 0, ci = 0, elLinha = null;
      var digit = function () {
        if (pi >= passos.length || !termBody.isConnected) {
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
          if (ci >= texto.length) { pi++; ci = 0; setTimeout(digit, 240); return; }
          setTimeout(digit, 42);
          return;
        }
        // saída: terminal imprime de uma vez
        passoLinha('out', '<i>→</i> ' + st.texto);
        pi++;
        setTimeout(digit, 220);
      };
      setTimeout(digit, 450);
    }
  }

  /* 2. vitrine: featured = antixray (vitrine do plugin-flagship); resto na ordem do catálogo */
  var grid = document.getElementById('grid');
  var filtroBox = document.getElementById('filtros');
  if (grid && itens) {
    var venha = function (i, idx) {
      var prova = i.prova && i.prova.num
        ? ' — medida <b>' + fmt(i.prova.num) + (i.slug === 'antixray' ? '+' : '') + ' ' + esc(i.prova.unidade) + '</b>' : '';
      var cat = rotuloCat(i.categoriaMkt);
      return '<a class="proj' + (i.slug === 'antixray' ? ' proj--destaque' : '') + '" style="--i:' + idx + '" href="catalogo/' + esc(i.slug) + '.html" data-tipo="' + esc(i.tipo) + '">' +
        '<span class="proj__tipo mono">' + esc(cat + ' / ' + (i.tipoRotulo || i.tipo || '')) + '</span>' +
        '<h3>' + esc(i.nome) +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></h3>' +
        '<p>' + esc((i.home && i.home.descricao) || i.tagline || '') + '</p>' +
        '<span class="proj__p">stack <b>' + esc((i.stack || []).slice(0, 4).join(' · ').replace(/SQLite\/MySQL\/MariaDB\/PostgreSQL/g, 'SQL')) + '</b>' + prova + '</span></a>';
    };
    var destaque = itens.find(function (i) { return i.slug === 'antixray'; }) || itens[0];
    grid.innerHTML = [destaque].concat(itens.filter(function (i) { return i !== destaque; }))
      .map(function (i, n) { return venha(i, n); }).join('');
    ligaTilt(grid);

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
    stackBox.innerHTML = lista.map(function (s, idx) {
      var ic = window.NZICONE ? window.NZICONE(s.nome, 20) : '';
      return '<div class="stk" style="--i:' + idx + '">' +
        '<span class="stk__ic">' + ic + '</span>' +
        '<b>' + esc(s.nome) + '</b>' +
        '<span class="n">' + s.n + '×</span>' +
        '<span class="barra"><i style="--v:' + (s.n / maxN).toFixed(3) + '"></i></span></div>';
    }).join('') +
    '<p class="stk__nota">Contagem real do catálogo publicado (' + fmt(itens.length) + ' produtos). Fonte: catalogo/dados/catalogo.js — aberto para conferir.</p>';

    // a barra só cresce quando a pessoa chega na seção: parada no zero, ela some
    var barras = stackBox.querySelectorAll('.barra i');
    barras.forEach(function (b) { b.style.setProperty('--vm', b.style.getPropertyValue('--v')); b.style.setProperty('--v', '0'); });
    var solta = function () {
      barras.forEach(function (b, n) {
        setTimeout(function () { b.style.setProperty('--v', b.style.getPropertyValue('--vm')); }, n * 45);
      });
      stackBox.classList.add('vivo');
    };
    if ('IntersectionObserver' in window) {
      var ob = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { solta(); ob.disconnect(); } });
      }, { threshold: 0.25 });
      ob.observe(stackBox);
    } else { solta(); }
  } else if (stackBox) {
    stackBox.innerHTML = '<p class="vazio">O catálogo não carregou — a contagem de stack vive no catálogo.</p>';
  }

  /* 5. faixa que corre: o que cada produto prova, em uma linha */
  var mq = document.getElementById('marquee');
  if (mq && itens) {
    var chips = itens.map(function (i) {
      var p = i.prova && i.prova.num
        ? '<b>' + fmt(i.prova.num) + (i.slug === 'antixray' ? '+' : '') + '</b> ' + esc(i.prova.unidade)
        : '<b>' + esc(rotuloCat(i.categoriaMkt) || i.tipoRotulo || 'produto') + '</b>';
      return '<span>' + esc(i.nome.toUpperCase()) + ' ' + p + '</span>';
    });
    mq.innerHTML = chips.join('') + chips.join('');
  }

  /* 6. prateleiras do marketplace: a categoria antes do item */
  var pr = document.getElementById('prateleiras');
  if (pr && C && C.categoriasMkt) {
    var ICONE_CAT = {
      plugins: 'paper', modpacks: 'box', otimizacoes: 'bolt', automacoes: 'gear',
      ferramentas: 'wrench', apis: 'plug', agentes: 'bot', jogos: 'pad', servicos: 'briefcase'
    };
    var contagem = {};
    itens.forEach(function (i) { if (i.categoriaMkt) contagem[i.categoriaMkt] = (contagem[i.categoriaMkt] || 0) + 1; });
    pr.innerHTML = C.categoriasMkt.map(function (c, idx) {
      var n = contagem[c.slug] || 0;
      var ic = window.NZICONE ? window.NZICONE(ICONE_CAT[c.slug] || 'box', 19) : '';
      return '<a class="prateleira' + (n ? '' : ' prateleira--vazio') + '" style="--i:' + idx + '" ' +
        'href="catalogo/index.html?cat=' + encodeURIComponent(c.slug) + '" title="' + esc(c.desc) + '">' +
        '<span class="prateleira__ic">' + ic + '</span>' +
        '<span class="prateleira__txt"><b>' + esc(c.rotulo) + '</b>' +
        '<span class="mono">' + (n ? n + (n > 1 ? ' produtos' : ' produto') : 'chegando') + '</span></span></a>';
    }).join('');
  }

  /* 7. linha do tempo: a ordem em que os produtos entraram no ar */
  var lt = document.getElementById('linhaTempo');
  if (lt && itens) {
    var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    var quando = function (iso) {
      var p = String(iso || '').split('-');
      if (p.length < 3) return '';
      return p[2] + ' ' + MES[+p[1] - 1] + ' ' + p[0];
    };
    var ordem = itens.slice().sort(function (a, b) {
      return String(b.desde || '').localeCompare(String(a.desde || ''));
    });
    lt.innerHTML = ordem.map(function (i, idx) {
      return '<li style="--i:' + idx + '">' +
        '<time class="mono" datetime="' + esc(i.desde || '') + '">' + esc(quando(i.desde)) + '</time>' +
        '<a href="catalogo/' + esc(i.slug) + '.html"><b>' + esc(i.nome) + '</b>' +
        '<span class="mono">' + esc(rotuloCat(i.categoriaMkt)) + '</span></a>' +
        '<p>' + esc(i.tagline || '') + '</p></li>';
    }).join('');
  }
})();
