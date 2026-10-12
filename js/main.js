/* Header ganha borda ao rolar: sinaliza que há conteúdo acima. A barra de
   leitura usa o mesmo evento de scroll — um listener só, não dois. */
(function () {
  var hdr = document.getElementById('hdr');
  var fill = document.getElementById('progressFill');

  // Quem ainda não apareceu ganha .rv--wait; o observer troca por .on. Marcar
  // na inicialização — e não no callback — evita o flash de "tudo visível"
  // antes do observer assumir.
  var rv = document.querySelectorAll('.rv');
  Array.prototype.forEach.call(rv, function (el) { el.classList.add('rv--wait'); });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');
      e.target.classList.remove('rv--wait');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  Array.prototype.forEach.call(rv, function (el) { io.observe(el); });
  document.querySelectorAll('.bar__fill').forEach(function (el) { io.observe(el); });

  // A vitrine da home desenha os produtos depois deste script rodar, e esses
  // .rv nascem invisiveis (a regra .rv--wait e o que segura). Sem uma funcao
  // que os registre no observer, a lista inteira ficaria apagada. Passa o
  // io em vez de recriar um: dois observers no mesmo elemento e o que faz o
  // reveal falhar sem erro nenhum no console.
  window.__reveal = function (raiz) {
    var alvos = (raiz || document).querySelectorAll('.rv:not(.on)');
    Array.prototype.forEach.call(alvos, function (el) {
      el.classList.add('rv--wait');
      io.observe(el);
    });
  };

  var altura = function () {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  };

  // rAF: num listener de scroll puro, o layout é lido a cada evento — e o
  // scroll dispara muito mais vezes do que a tela precisa repintar.
  var pendente = false;
  var aoRolar = function () {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(function () {
      pendente = false;
      var y = window.scrollY;
      hdr.dataset.stuck = y > 8 ? '1' : '0';
      if (fill) fill.style.transform = 'scaleX(' + Math.min(1, y / altura()) + ')';
    });
  };

  aoRolar();
  addEventListener('scroll', aoRolar, { passive: true });
  addEventListener('resize', aoRolar, { passive: true });

  // Navegacao por ancora rola suave; o handler de scroll precisa rodar depois.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { setTimeout(aoRolar, 140); });
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