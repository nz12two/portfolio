/* Header ganha borda ao rolar: sinaliza que há conteúdo acima.
   O reveal e a barra usam o mesmo observer — uma instância só, em vez de três
   observers disparados em separado. */
(function () {
  var hdr = document.getElementById('hdr');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('on'); });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.rv, .bar__fill').forEach(function (el) { io.observe(el); });

  var onScroll = function () { hdr.dataset.stuck = window.scrollY > 8 ? '1' : '0'; };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // Navegacao por ancora rola suave; o observer precisa reagir depois.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { setTimeout(onScroll, 120); });
  });
})();
  // Evidencia ao vivo: substitui os numeros pelo dado atual de evidencia.json,
  // gerado por tools/update-evidence.js. O HTML ja vem com um valor conhecido —
  // aqui so refresca. Se o fetch falhar o HTML permanece: ficar com o ultimo
  // numero conhecido e melhor que apagar a prova.
  fetch('dados/evidencia.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.barras) return;
      var tot = document.getElementById('proofTotal');
      var src = document.getElementById('proofSrc');
      if (tot && d.totalFormatado) tot.innerHTML = d.totalFormatado.replace(/^([\d.]+) (.+)$/, '$1<span> $2</span>');
      if (src) src.textContent = 'medido em ' + d.gerado_em.slice(0, 10) + ' · ' + d.totalFormatado + ' em ' + d.repos + ' repos';

      var bar = document.getElementById('proofBar');
      if (!bar) return;
      bar.innerHTML = d.barras.map(function (b) {
        return '<div class="bar__row">' +
          '<span class="bar__name" title="' + b.nomeCompleto + '">' + b.nome + '</span>' +
          '<span class="bar__track"><span class="bar__fill" style="--w:' + b.pct + '"></span></span>' +
          '<span class="bar__val">' + b.valor + '</span>' +
          '</div>';
      }).join('');
      bar.querySelectorAll('.bar__fill').forEach(function (el) { io.observe(el); });
    })
    .catch(function () { /* sem evidencia nova: fica o HTML */ });