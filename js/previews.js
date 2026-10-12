/* Preview animado por produto + painel de detalhes.
 *
 * POR QUE CADA CARD TEM UMA CENA DIFERENTE. O pedido foi "nao fazer todos os
 * cards parecerem iguais" e cada produto ter apresentacao coerente com o que
 * ele faz. A cena nao e enfeite escolhido a mao: sai do dominio e do tipo que
 * ja estao no catalogo.json.
 *
 *   minecraft            varredura    anti-xray e varredura, nao e grafico
 *   OpenStreetMap/OSMnx  mapa         dispersao de coordenadas num territorio
 *   agente               grafo        o agente e um ciclo de nos
 *   dados                fluxo        diretorio e indice sao fluxo de entrada
 *   privado              nenhum       sem repo publico nao existe o que mostrar
 *
 * As cenas sao ILUSTRATIVAS, nao dados. Nenhum numero de produto e desenhado
 * aqui: o numero que vale e o do prova.num, que fica no texto do card. Cena
 * que fingisse medir seria mentira com animacao em volta.
 */
(function () {
  "use strict";

  var REDUZ = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- cenas */

  function prng(s) {
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  // semente pelo slug: a cena do mesmo produto e sempre a mesma
  function semente(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function cenaDe(it) {
    if (it.privado) return null;
    var st = (it.stack || []).join(" ").toLowerCase();
    if (it.dominio === "minecraft") return "varredura";
    if (st.indexOf("openstreetmap") >= 0 || st.indexOf("osmnx") >= 0) return "mapa";
    if (it.tipo === "agente") return "grafo";
    if (it.dominio === "dados") return "fluxo";
    return "fluxo";
  }

  // Cada cena devolve uma funcao (ctx, t, W, H, seed) que desenha UM quadro.
  // t e o tempo em segundos. Sem estado proprio: o quadro e funcao pura do
  // tempo, o que permite desenhar estatico no modo reduzido sem desvio.
  var CENAS = {
    varredura: function (ctx, t, W, H) {
      var g = 10, cols = Math.ceil(W / g), rows = Math.ceil(H / g);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (var x = 0; x <= cols; x++) {
        ctx.beginPath(); ctx.moveTo(x * g, 0); ctx.lineTo(x * g, H); ctx.stroke();
      }
      for (var y = 0; y <= rows; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * g); ctx.lineTo(W, y * g); ctx.stroke();
      }
      var px = ((t * 0.22) % 1) * W;
      var grad = ctx.createLinearGradient(px - 60, 0, px, 0);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(255,255,255,0.10)");
      ctx.fillStyle = grad;
      ctx.fillRect(px - 60, 0, 60, H);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(px, 0, 1, H);
      // pulso de deteccao, deterministicamente posicionado no ciclo
      for (var i = 0; i < 3; i++) {
        var ciclo = (t * 0.22 + i * 0.37) % 1;
        var cy = H * (0.28 + i * 0.24);
        var rr = 3 + ciclo * 26;
        if (rr > H * 0.55) continue;
        ctx.beginPath(); ctx.arc(px, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255," + (0.34 * (1 - ciclo)).toFixed(3) + ")";
        ctx.lineWidth = 1.2; ctx.stroke();
      }
    },

    fluxo: function (ctx, t, W, H) {
      // Linha com chave e valor, nao uma barra so. A versao anterior desenhava
      // uma barra unica de ate 0,92*W: no preview do destaque (1030px) isso
      // virava uma sequencia de réguas cinzas que parecia barra de
      // carregamento quebrada. Duas pecas com Origem a 18% da largura leem
      // como lista em qualquer largura.
      var r = prng(7);
      var n = Math.max(8, Math.round(H / 9));
      var alt = H / n;
      var h = Math.max(2, alt * 0.4);
      var chave = W * 0.18;
      for (var i = 0; i < n; i++) {
        var yy = i * alt + (alt - h) / 2;
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(0, yy, W, h);
        var f1 = (t * 0.5 + r() * 3) % 1;
        var f2 = (t * 0.5 + 0.5 + r() * 3) % 1;
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(chave * 0.55, yy, chave, h);
        ctx.fillStyle = "rgba(255,255,255," + (0.14 + 0.46 * Math.sin(f1 * Math.PI)).toFixed(3) + ")";
        ctx.fillRect(W - W * 0.34 * (1 - f2 * 0.85), yy, W * 0.34 * (1 - f2 * 0.85), h);
      }
    },

    grafo: function (ctx, t, W, H) {
      var nos = [
        [0.22, 0.5], [0.45, 0.24], [0.45, 0.76], [0.7, 0.36], [0.7, 0.68], [0.9, 0.5]
      ];
      var arestas = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1;
      for (var e = 0; e < arestas.length; e++) {
        var a = nos[arestas[e][0]], b = nos[arestas[e][1]];
        ctx.beginPath();
        ctx.moveTo(a[0] * W, a[1] * H); ctx.lineTo(b[0] * W, b[1] * H);
        ctx.stroke();
      }
      for (var n = 0; n < nos.length; n++) {
        var p = nos[n];
        var ph = 0.5 + 0.5 * Math.sin(t * 1.4 - n * 0.8);
        ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, 2.4 + ph * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + (0.3 + ph * 0.55).toFixed(3) + ")";
        ctx.fill();
      }
      // um pulso percorre uma aresta
      var q = (t * 0.6) % 1;
      var pa = nos[arestas[Math.floor(t * 0.6) % arestas.length][0]];
      var pb = nos[arestas[Math.floor(t * 0.6) % arestas.length][1]];
      ctx.beginPath();
      ctx.arc((pa[0] + (pb[0] - pa[0]) * q) * W, (pa[1] + (pb[1] - pa[1]) * q) * H, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
    },

    mapa: function (ctx, t, W, H) {
      // contorno apenas suggestivo: nao e fronteira real e nao esta rotulado
      // como mapa de nenhum lugar
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      var N = 26;
      for (var i = 0; i <= N; i++) {
        var a = (i / N) * Math.PI * 2;
        var rx = W * (0.31 + 0.09 * Math.sin(a * 3 + 1.2));
        var ry = H * (0.40 + 0.14 * Math.cos(a * 2 + 0.4));
        var px = W / 2 + Math.cos(a) * rx;
        var py = H / 2 + Math.sin(a) * ry;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      var r = prng(19);
      for (var k = 0; k < 26; k++) {
        var ang = r() * Math.PI * 2, rr2 = r();
        var ex = W / 2 + Math.cos(ang) * W * 0.31 * rr2;
        var ey = H / 2 + Math.sin(ang) * H * 0.40 * rr2;
        var on = (t * 0.5 + k * 0.13) % 1.6;
        var a2 = Math.max(0, Math.min(1, on)) * 0.85;
        ctx.beginPath(); ctx.arc(ex, ey, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + a2.toFixed(3) + ")"; ctx.fill();
      }
    }
  };

  /* ------------------------------------------------------ montagem do canvas */

  function montarCena(cv, cena) {
    var desenhar = CENAS[cena];
    if (!desenhar) return;
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, vivo = false, t0 = 0;

    function size() {
      var r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    function quadro(t) {
      ctx.clearRect(0, 0, W, H);
      desenhar(ctx, t, W, H);
    }

    function laco(ts) {
      if (!vivo) return;
      quadro((ts - t0) / 1000);
      requestAnimationFrame(laco);
    }

    function para() { vivo = false; }

    function roda() {
      if (REDUZ || vivo || document.hidden) return;
      vivo = true; t0 = performance.now();
      requestAnimationFrame(laco);
    }

    size();
    // Atribuir width limpa o buffer: o quadro inicial vem depois do resize.
    if (REDUZ) requestAnimationFrame(function () { if (size()) quadro(2.1); });

    new ResizeObserver(function () {
      if (size() && REDUZ) quadro(2.1);
    }).observe(cv);

    // So anima card que esta na tela. Seis canvas animando fora de vista e o
    // jeito mais rapido de queimar bateria sem ninguem ver.
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) roda(); else para(); });
    }, { threshold: 0.15 }).observe(cv);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) para(); else roda();
    });
  }

  /* ------------------------------------------------------- painel de detalhes */

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  var ROTULO_P = { gratis: "gratuito", consulta: "sob consulta" };

  function painel(it) {
    var p = [];
    if (it.prova) {
      p.push(
        '<div class="det__prova">' +
        '<span class="det__num">' + esc(String(it.prova.num)) + "</span>" +
        "<span>" + esc(it.prova.unidade) + "</span>" +
        (it.prova.quando ? '<small>medido em ' + esc(it.prova.quando) + "</small>" : "") +
        (it.prova.como ? '<p class="det__como">' + esc(it.prova.como) + "</p>" : "") +
        "</div>"
      );
    }
    if (it.oQueFaz && it.oQueFaz.length) {
      p.push('<div class="det__bloco"><h4>O que faz</h4><ul>' +
        it.oQueFaz.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
        "</ul></div>");
    }
    var dl = [];
    if (it.licenca) dl.push(["licença", esc(it.licenca) + (it.licencaNota ? " — " + esc(it.licencaNota) : "")]);
    if (it.precoChave) dl.push(["preço", esc(ROTULO_P[it.precoChave] || it.precoChave)]);
    if (it.statusTexto) dl.push(["status", esc(it.statusTexto)]);
    if (it.categoria) dl.push(["categoria", esc(it.categoria)]);
    if (it.dominio) dl.push(["domínio", esc(it.dominio)]);
    if (dl.length) {
      p.push('<div class="det__bloco"><h4>Ficha</h4><dl class="det__dl">' +
        dl.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") +
        "</dl></div>");
    }
    if (it.stack && it.stack.length) {
      p.push('<div class="det__bloco"><h4>Stack</h4><div class="det__stack">' +
        it.stack.map(function (s) { return '<span class="tag">' + esc(s) + "</span>"; }).join("") +
        "</div></div>");
    }
    var links = ['<a class="btn btn--acc" href="catalogo/' + esc(it.slug) + '.html">Página completa</a>'];
    if (it.repo) links.push('<a class="btn" href="' + esc(it.repo) + '" target="_blank" rel="noopener">Código</a>');
    if (it.site) links.push('<a class="btn" href="' + esc(it.site) + '" target="_blank" rel="noopener">Site</a>');
    p.push('<div class="det__links">' + links.join("") + "</div>");
    return p.join("");
  }

  /* --------------------------------------------------------------- montagem */

  function iniciar(dados) {
    var porSlug = {};
    (dados.itens || []).forEach(function (it) { porSlug[it.slug] = it; });

    document.querySelectorAll(".item[data-slug], .destaque[data-slug]").forEach(function (card) {
      var it = porSlug[card.dataset.slug];
      if (!it) return;

      var slot = card.querySelector("[data-cena]");
      if (slot) {
        var nome = cenaDe(it);
        if (nome) {
          var cv = document.createElement("canvas");
          cv.className = "prev__cv";
          cv.setAttribute("aria-hidden", "true");
          cv.setAttribute("data-cena", nome);
          slot.textContent = "";
          slot.appendChild(cv);
          slot.hidden = false;
          montarCena(cv, nome);
        } else {
          // Produto privado: sem repo publico nao existe imagem honesta. Dizer
          // isso e melhor que desenhar uma cena que nao representa nada.
          slot.hidden = false;
          slot.innerHTML = '<span class="prev__vazio">sem preview público</span>';
        }
      }

      var btn = card.querySelector("[data-det]");
      var alvo = card.querySelector("[data-det-painel]");
      if (!btn || !alvo) return;
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var aberto = alvo.hidden;
        if (aberto && !alvo.dataset.pronto) {
          alvo.innerHTML = painel(it);
          alvo.dataset.pronto = "1";
        }
        alvo.hidden = !aberto;
        btn.setAttribute("aria-expanded", String(aberto));
        btn.textContent = aberto ? "fechar" : "detalhes";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      fetch("catalogo/dados/catalogo.json")
        .then(function (r) { return r.json(); })
        .then(iniciar)
        .catch(function () { /* sem preview: o card segue com texto */ });
    });
  } else {
    fetch("catalogo/dados/catalogo.json").then(function (r) { return r.json(); }).then(iniciar).catch(function () {});
  }
})();
