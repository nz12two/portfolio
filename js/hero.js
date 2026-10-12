/* Hero interativo — constelacao reativa, parallax, ripple. */
(function () {
  'use strict';

  var REDUZ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Guarda: se nao existe .hero, sai sem erro.
  var hero = document.querySelector('.hero');
  if (!hero) return;

  // 1. Canvas transparente como fundo.
  // O <canvas class="hero__canvas"> esta no HTML. Este codigo JA criava um
  // segundo canvas e inseria antes do grid: o deaisy ficava em 300x150
  // (default), sem nunca ser dimensionado nem desenhado. Usa o que existe e
  // so cria um se a pagina nao trouxer o elemento.
  var canvas = hero.querySelector('.hero__canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'hero__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.querySelector('.hero__grid'));
  }

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // PRNG com semente fixa para layout deterministico
  function prng(s) {
    return function () {
      s = Math.sin(s * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
  }
  var rand = prng(42);

  // Configuracao de nos e conexoes
  var NODE_COUNT = 92; // entre 70 e 110
  var RADIUS = 220;    // raio de influencia do mouse
  var EDGE_MAX = 150;  // distancia maxima para aresta
  var EDGE_MAX_PER_NODE = 2; // maximo 2 arestas por no
  var LERP = 0.06;     // inercia
  var DPR = Math.min(2, window.devicePixelRatio || 1);

  // Canvas 2D nao resolve custom property: fillStyle = 'var(--acc)' e invalido
  // e o Chrome mantem o valor anterior em silencio. Le a variavel do root uma
  // vez e usa a cor resolvida.
  var COR_ACC = (getComputedStyle(document.documentElement).getPropertyValue('--acc') || '').trim() || '#f0a83c';

  // Estado
  var nodes = [];
  var mouseX = -1000, mouseY = -1000;
  var width = 0, height = 0;
  var running = false;
  var hidden = false;

  // Inicializacao dos nos
  function initNodes() {
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: rand() * width,
        y: rand() * height,
        vx: 0, vy: 0,
        baseX: rand() * width,
        baseY: rand() * height,
        r: 1.2 + rand() * 2.0,
        active: false,
      });
    }
  }

  // Construir arestas (limite por no)
  function buildEdges() {
    var edges = [];
    for (var i = 0; i < nodes.length; i++) {
      var count = 0;
      for (var j = i + 1; j < nodes.length; j++) {
        if (count >= EDGE_MAX_PER_NODE) break;
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < EDGE_MAX && d > 1) {
          edges.push({ a: i, b: j, d: d });
          count++;
        }
      }
    }
    return edges;
  }

  // Redimensionar canvas
  function resize() {
    var rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    ctx.scale(DPR, DPR);
    initNodes();
  }

  resize();

  // Mouse tracking: --mx, --my em .hero (normalizado -1..1)
  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    var nx = ((mouseX / rect.width) * 2 - 1) || 0;
    var ny = ((mouseY / rect.height) * 2 - 1) || 0;
    hero.style.setProperty('--mx', nx.toFixed(3));
    hero.style.setProperty('--my', ny.toFixed(3));
  }, { passive: true });

  hero.addEventListener('mouseleave', function () {
    mouseX = -1000;
    mouseY = -1000;
  }, { passive: true });

  // Observador para pausar rAF quando hero sai da viewport
  var heroIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting && running) {
        stop();
      } else if (e.isIntersecting && !running && !REDUZ && !hidden) {
        start();
      }
    });
  }, { threshold: 0.05 });
  heroIO.observe(hero);

  // Document hidden
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden && running) stop();
    else if (!hidden && !running && hero.getBoundingClientRect().top < window.innerHeight && hero.getBoundingClientRect().bottom > 0) start();
  });

  // ResizeObserver. Atribuir canvas.width zera o buffer e o observer dispara
  // uma vez logo apos observe(), ou seja DEPOIS do quadro estatico do modo
  // reduzido — o canvas ficava com o tamanho certo e nada pintado dentro.
  var ro = new ResizeObserver(function () {
    resize();
    if (REDUZ) drawFrame();
  });
  ro.observe(hero);

  // Renderizacao de um quadro
  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    var edges = buildEdges();
    // Desenhar arestas
    for (var k = 0; k < edges.length; k++) {
      var e = edges[k];
      var a = nodes[e.a], b = nodes[e.b];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    // Desenhar nos
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n];
      // Interacao com mouse
      var dx = node.x - mouseX;
      var dy = node.y - mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < RADIUS && mouseX > 0) {
        var force = (RADIUS - dist) / RADIUS;
        node.vx += (dx / dist) * force * 0.4;
        node.vy += (dy / dist) * force * 0.4;
        node.active = true;
      } else {
        node.active = false;
      }
      // Volta suave para posicao base
      node.vx += (node.baseX - node.x) * 0.015;
      node.vy += (node.baseY - node.y) * 0.015;
      // Atrito
      node.vx *= 0.92;
      node.vy *= 0.92;
      // Lerp para inercia
      node.x += node.vx;
      node.y += node.vy;
      // Limitar ao canvas
      if (node.x < 0) node.x = 0; if (node.x > width) node.x = width;
      if (node.y < 0) node.y = 0; if (node.y > height) node.y = height;

      var r = node.active ? node.r * 2.2 : node.r;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.active ? COR_ACC : 'rgba(255,255,255,0.35)';
      ctx.fill();
    }
  }

  // Se REDUZ: um quadro estatico so
  if (REDUZ) {
    drawFrame();
    return;
  }

  function tick() {
    if (!running || hidden) return;
    drawFrame();
    requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    tick();
  }
  function stop() {
    running = false;
  }

  // Iniciar se visivel
  if (!REDUZ) {
    var rect = hero.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0 && !document.hidden) {
      start();
    }
  }

  // 4. Microinteracao: ripple nos botoes .btn dentro de .hero
  hero.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.btn');
    if (!btn) return;
    // Criar elemento ripple. A posicao vem do retangulo do botao, nao de
    // e.offsetX: em delegacao o target pode ser um <span> dentro do botao e o
    // offset sai da borda da span.
    var rb = btn.getBoundingClientRect();
    var ripple = document.createElement('i');
    ripple.className = 'ripple';
    ripple.style.left = (e.clientX - rb.left - 60) + 'px';
    ripple.style.top = (e.clientY - rb.top - 60) + 'px';
    btn.appendChild(ripple);
    // Animar com Web Animations API
    ripple.animate([
      { transform: 'scale(0)', opacity: 0.35 },
      { transform: 'scale(2.5)', opacity: 0 }
    ], {
      duration: 500,
      easing: 'ease-out',
    }).onfinish = function () {
      ripple.remove();
    };
  }, { passive: true });
})();
