/* Lab — grafo de stack real, medidor de prova e particulas de demonstracao.
   Dados unicos reais: window.CATALOGO. Nada inventado. */
(function() {
  'use strict';

  var REDUZ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Espera CATALOGO; se nao existir, aborta silenciosamente. */
  function quandoCatalogo(cb) {
    if (window.CATALOGO && window.CATALOGO.itens) { cb(window.CATALOGO); return; }
    var t = setInterval(function() {
      if (window.CATALOGO && window.CATALOGO.itens) { clearInterval(t); cb(window.CATALOGO); }
    }, 80);
  }

  quandoCatalogo(function(C) {
    var itens = C.itens || [];

    /* ============================================================
       1. GRAFO DE STACK COMPARTILHADA — DADO REAL
       ============================================================ */
    var stackFac = (C.facetas && C.facetas.stack) ? C.facetas.stack : [];
    // Se facetas.stack vazio, extrai de itens[].stack unicos
    var techs = stackFac.slice();
    if (!techs.length) {
      var s = {};
      itens.forEach(function(it) {
        (it.stack || []).forEach(function(t) { s[t] = true; });
      });
      techs = Object.keys(s);
    }
    // Frequencia de uso por tech
    var freq = {};
    techs.forEach(function(t) { freq[t] = 0; });
    itens.forEach(function(it) {
      (it.stack || []).forEach(function(t) {
        if (freq[t] !== undefined) freq[t] += 1;
      });
    });

    // Matriz de co-ocorrencia (quantos produtos usam ambas)
    var co = {};
    techs.forEach(function(a) {
      co[a] = {};
      techs.forEach(function(b) {
        co[a][b] = 0;
      });
    });
    itens.forEach(function(it) {
      var st = (it.stack || []).filter(function(t) { return freq[t] !== undefined; });
      for (var i = 0; i < st.length; i++) {
        for (var j = i + 1; j < st.length; j++) {
          co[st[i]][st[j]] = (co[st[i]][st[j]] || 0) + 1;
          co[st[j]][st[i]] = (co[st[j]][st[i]] || 0) + 1;
        }
      }
    });

    // Arestas: ordena por peso, corta em ~60
    var arestas = [];
    techs.forEach(function(a) {
      techs.forEach(function(b) {
        if (a >= b) return; // so uma vez
        var w = co[a][b] || 0;
        if (w > 0) arestas.push({a: a, b: b, w: w});
      });
    });
    arestas.sort(function(x, y) { return y.w - x.w; });
    if (arestas.length > 60) arestas = arestas.slice(0, 60);

    // Nos
    var nos = techs.map(function(t) {
      return {
        id: t,
        label: t,
        freq: freq[t] || 0,
        x: Math.random() * 800,
        y: Math.random() * 360
      };
    });

    // Canvas do grafo
    var canvas = document.getElementById('grafoCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var tooltip = document.getElementById('grafoTooltip');
    var wrap = canvas.parentElement;
    var W = 0, H = 0;

    function resize() {
      var r = wrap.getBoundingClientRect();
      W = r.width; H = 420;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    resize();
    // Atribuir canvas.width ZERA o buffer. O ResizeObserver dispara uma vez
    // logo apos observe(), ou seja DEPOIS do desenho sincrono abaixo — e o
    // grafo sumia inteiro. Com movimento ligado o rAF redivia e nobody via;
    // com prefers-reduced-motion so desenha uma vez, entao ficava vazio para
    // sempre. Redesenha no resize.
    new ResizeObserver(function () {
      resize();
      if (REDUZ) { passoForca(); desenha(); }
    }).observe(wrap);

    // Forca simples
    var ITER = 300;
    var cool = 1.0;
    function passoForca() {
      for (var it = 0; it < ITER; it++) {
        var c = cool / ITER;
        // Repulsao entre todos os nos
        for (var i = 0; i < nos.length; i++) {
          var a = nos[i];
          for (var j = i + 1; j < nos.length; j++) {
            var b = nos[j];
            var dx = a.x - b.x, dy = a.y - b.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            var f = 80 / (dist * dist + 5);
            if (f > 10) f = 10;
            var nx = dx / dist, ny = dy / dist;
            a.x += nx * f * c;
            a.y += ny * f * c;
            b.x -= nx * f * c;
            b.y -= ny * f * c;
          }
        }
        // Atracao nas arestas
        arestas.forEach(function(ar) {
          var a = nos.find(function(n) { return n.id === ar.a; });
          var b = nos.find(function(n) { return n.id === ar.b; });
          if (!a || !b) return;
          var dx = b.x - a.x, dy = b.y - a.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          var f = dist * 0.008;
          var nx = dx / dist, ny = dy / dist;
          a.x += nx * f * c;
          a.y += ny * f * c;
          b.x -= nx * f * c;
          b.y -= ny * f * c;
        });
        // Limita ao container
        nos.forEach(function(n) {
          var r = Math.sqrt(Math.max(1, n.freq)) * 6 + 10;
          n.x = Math.max(r, Math.min(W - r, n.x));
          n.y = Math.max(r, Math.min(H - r, n.y));
        });
        cool *= 0.97;
      }
    }

    // Se reduzido, desenha uma vez estaticamente
    if (!REDUZ) {
      var frame = 0;
      function anima() {
        if (document.hidden) { requestAnimationFrame(anima); return; }
        passoForca();
        desenha();
        frame++;
        if (frame < 300) requestAnimationFrame(anima);
      }
      requestAnimationFrame(anima);
    } else {
      passoForca();
      desenha();
    }

    function desenha() {
      ctx.clearRect(0, 0, W, H);
      // Arestas
      ctx.lineWidth = 1.5;
      arestas.forEach(function(ar) {
        var a = nos.find(function(n) { return n.id === ar.a; });
        var b = nos.find(function(n) { return n.id === ar.b; });
        if (!a || !b) return;
        var alpha = Math.min(0.6, 0.08 + ar.w * 0.08);
        ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      // Nos
      nos.forEach(function(n) {
        var raio = Math.sqrt(Math.max(1, n.freq)) * 6 + 10;
        ctx.beginPath();
        ctx.arc(n.x, n.y, raio, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();
        // Label interno
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Quebra se muito longo
        var label = n.id.length > 14 ? n.id.slice(0, 13) + '…' : n.id;
        ctx.fillText(label, n.x, n.y);
      });
    }

    // Interacao: hover no no acende vizinhos
    var hovered = null;
    canvas.addEventListener('mousemove', function(e) {
      if (!tooltip) return;
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var hit = nos.find(function(n) {
        var r = Math.sqrt(Math.max(1, n.freq)) * 6 + 10;
        return Math.sqrt((mx - n.x) * (mx - n.x) + (my - n.y) * (my - n.y)) <= r;
      });
      if (hit) {
        hovered = hit.id;
        // Tooltip
        var vizinhos = arestas.filter(function(ar) { return ar.a === hit.id || ar.b === hit.id; }).map(function(ar) { return ar.a === hit.id ? ar.b : ar.a; });
        var unicos = [];
        vizinhos.forEach(function(v) { if (unicos.indexOf(v) === -1) unicos.push(v); });
        var produtos = unicos.map(function(t) {
          return itens.filter(function(it) { return (it.stack || []).indexOf(t) > -1; }).map(function(it) { return it.nome; });
        }).reduce(function(acc, arr) { return acc.concat(arr); }, []);
        var prodUnicos = produtos.filter(function(p, i, a) { return a.indexOf(p) === i; });
        tooltip.style.left = (e.clientX - rect.left + 14) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 8) + 'px';
        tooltip.innerHTML = '<strong>' + hit.id + '</strong> &mdash; usada em ' + hit.freq + ' produto(s)<br>Produtos vizinhos: ' + (prodUnicos.length ? prodUnicos.join(', ') : '—');
        tooltip.classList.add('visible');
        desenha();
      } else {
        hovered = null;
        tooltip.classList.remove('visible');
        desenha();
      }
    });
    canvas.addEventListener('mouseleave', function() {
      hovered = null;
      tooltip.classList.remove('visible');
      desenha();
    });

    // Clique no no: lista produtos abaixo
    var lista = document.getElementById('grafoLista');
    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var hit = nos.find(function(n) {
        var r = Math.sqrt(Math.max(1, n.freq)) * 6 + 10;
        return Math.sqrt((mx - n.x) * (mx - n.x) + (my - n.y) * (my - n.y)) <= r;
      });
      if (!hit || !lista) return;
      var prods = itens.filter(function(it) { return (it.stack || []).indexOf(hit.id) > -1; });
      lista.innerHTML = '';
      if (!prods.length) {
        lista.innerHTML = '<p style="color:var(--tx-3);font-size:var(--t-sm)">Nenhum produto usa esta tecnologia.</p>';
        return;
      }
      prods.forEach(function(it) {
        var a = document.createElement('a');
        a.href = 'catalogo/' + it.slug + '.html';
        a.textContent = it.nome + (it.prova ? ' — prova: ' + it.prova.num + ' ' + it.prova.unidade : '');
        a.style.display = 'inline-block';
        a.style.margin = '4px 8px';
        a.style.padding = '6px 12px';
        a.style.background = 'var(--surf-2)';
        a.style.border = '1px solid var(--line)';
        a.style.borderRadius = '999px';
        a.style.fontSize = 'var(--t-xs)';
        a.style.color = 'var(--tx)';
        a.style.textDecoration = 'none';
        lista.appendChild(a);
      });
    });

    /* ============================================================
       2. EXPLORADOR DE MEDICAO — DADO REAL
       ============================================================ */
    var medPainel = document.getElementById('medidorPainel');
    if (medPainel) {
      // Item com maior prova.num numericamente
      var comProva = itens.filter(function(it) { return it.prova && typeof it.prova.num === 'number'; });
      var maior = null;
      if (comProva.length) {
        maior = comProva.slice().sort(function(a, b) { return b.prova.num - a.prova.num; })[0];
      }

      var numEl = document.getElementById('medidorNum');
      var metaEl = document.getElementById('medidorMeta');
      var btns = document.getElementById('medidorBtns');

      function mostrarMedidor(it) {
        if (!it || !it.prova) return;
        if (numEl) {
          if (REDUZ) {
            numEl.textContent = it.prova.num;
          } else {
            numEl.textContent = '0';
            var dur = 1200;
            var ini = 0;
            var t0 = performance.now();
            function tick(now) {
              var p = Math.min(1, (now - t0) / dur);
              var v = Math.round(ini + (it.prova.num - ini) * (1 - Math.pow(1 - p, 3)));
              numEl.textContent = v;
              if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }
        }
        if (metaEl) {
          metaEl.innerHTML = '<span class="data">' + (it.prova.unidade || '') + '</span> — medido em ' + (it.prova.quando || '') + '<br><span style="font-size:var(--t-xs);color:var(--tx-3);">' + (it.prova.como ? it.prova.como : '') + '</span>';
        }
      }

      if (maior) mostrarMedidor(maior);

      if (btns) {
        comProva.sort(function(a, b) { return b.prova.num - a.prova.num; }).forEach(function(it) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'medidor__btn';
          btn.textContent = it.nome + ' (' + it.prova.num + ' ' + (it.prova.unidade || '') + ')';
          btn.addEventListener('click', function() {
            mostrarMedidor(it);
            btns.querySelectorAll('.medidor__btn').forEach(function(b) { b.classList.remove('ativo'); });
            btn.classList.add('ativo');
          });
          btns.appendChild(btn);
        });
      }
    }

    /* ============================================================
       3. CAMPO DE PARTICULAS — DEMONSTRACAO (NAO DADO REAL)
       ============================================================ */
    var partCanvas = document.getElementById('particulasCanvas');
    if (partCanvas) {
      var pctx = partCanvas.getContext('2d');
      var pW = 0, pH = 0;
      var particulas = [];
      var mouse = { x: -1000, y: -1000 };
      var onda = { x: 0, y: 0, t: 0 };

      function desenhaParticulas() {
        pctx.clearRect(0, 0, pW, pH);
        particulas.forEach(function(p) {
          pctx.beginPath();
          pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          pctx.fillStyle = 'rgba(255,255,255,0.35)';
          pctx.fill();
        });
      }

      function resizePart() {
        var r = partCanvas.getBoundingClientRect();
        pW = r.width; pH = r.height;
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        partCanvas.width = pW * dpr; partCanvas.height = pH * dpr;
        partCanvas.style.width = pW + 'px'; partCanvas.style.height = pH + 'px';
        pctx.setTransform(1, 0, 0, 1, 0, 0);
        pctx.scale(dpr, dpr);
      }
      resizePart();
      // Mesmo motivo do grafo: atribuir width limpa o buffer e o observer
      // dispara depois do quadro unico do modo reduzido.
      new ResizeObserver(function () {
        resizePart();
        if (REDUZ) { pctx.clearRect(0, 0, pW, pH); desenhaParticulas(); }
      }).observe(partCanvas);

      for (var k = 0; k < 120; k++) {
        particulas.push({
          x: Math.random() * 800,
          y: Math.random() * 300,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          r: 1.5 + Math.random() * 2
        });
      }

      partCanvas.addEventListener('mousemove', function(e) {
        var rect = partCanvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      partCanvas.addEventListener('mouseleave', function() {
        mouse.x = -1000; mouse.y = -1000;
      });
      partCanvas.addEventListener('click', function(e) {
        var rect = partCanvas.getBoundingClientRect();
        onda.x = e.clientX - rect.left;
        onda.y = e.clientY - rect.top;
        onda.t = 30;
      });

      function animaPart() {
        if (document.hidden) { requestAnimationFrame(animaPart); return; }
        if (!REDUZ) {
          pctx.clearRect(0, 0, pW, pH);
          particulas.forEach(function(p) {
            // Repulsao do cursor
            var dx = p.x - mouse.x, dy = p.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 1) {
              var f = (120 - dist) / 120 * 2.5;
              p.vx += (dx / dist) * f * 0.08;
              p.vy += (dy / dist) * f * 0.08;
            }
            p.x += p.vx;
            p.y += p.vy;
            // Atrito
            p.vx *= 0.96; p.vy *= 0.96;
            // Limites
            if (p.x < 0 || p.x > pW) p.vx *= -1;
            if (p.y < 0 || p.y > pH) p.vy *= -1;
            p.x = Math.max(0, Math.min(pW, p.x));
            p.y = Math.max(0, Math.min(pH, p.y));
          });
          // Onda do clique
          if (onda.t > 0) {
            pctx.strokeStyle = 'rgba(255,255,255,0.15)';
            pctx.lineWidth = 2;
            pctx.beginPath();
            var rOnda = (30 - onda.t) * 3;
            pctx.arc(onda.x, onda.y, rOnda, 0, Math.PI * 2);
            pctx.stroke();
            onda.t--;
          }
          // Desenhar particulas
          desenhaParticulas();
          requestAnimationFrame(animaPart);
        } else {
          // Reduzido: um quadro estatico
          desenhaParticulas();
        }
      }
      if (!REDUZ) requestAnimationFrame(animaPart);
      else animaPart();
    }
  });
})();
