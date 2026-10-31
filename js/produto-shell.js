/* Shell comum das páginas de detalhe do catálogo.
   /produto.css* marca os blocos: montagem, glow, barra, reveal.
   Gates de conta continuam com auth.js (data-gate / data-unlocked). */
(function () {
  'use strict';
  var REDUZ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* barra compacta ao rolar */
  var bar = document.getElementById('bar');
  var oS = function () { bar && bar.classList.toggle('compacta', scrollY > 40); };
  addEventListener('scroll', oS, { passive: true }); oS();

  /* montagem do cabeçalho */
  requestAnimationFrame(function () { document.body.classList.add('aberto'); });

  /* reveal das seções */
  var obs = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); obs.unobserve(en.target); } });
  }, { threshold: 0.2 });
  document.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
})();
