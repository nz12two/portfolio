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

  // Secoes inteiras entram tambem. Antes so os .rv (cards) revelavam; o texto
  // corrido — que e a maior parte da pagina — chegava pronto e sem vida.
  // O --i escalona por secao, para a entrada ter ritmo em vez de tudo junto.
  // Sem observer (ou com observer indisponivel) a secao ja nasce visivel: o
  // observer e enfeite, nunca pode ser a condicao para o texto existir.
  var temIO = 'IntersectionObserver' in window;
  var secoes = document.querySelectorAll('main > .sec, body > section.sec');
  // Observer separado, com threshold 0. O dos cards usa 0.12 porque card e
  // elemento pequeno; secao alta de 3000px precisa de 12% (360px) na tela para
  // disparar, e numa rolagem de 900px ela passa inteira entre dois quadros
  // sem nunca atingir isso — ai fica com opacity 0 para sempre. Medido: com
  // 0.12 as 5 secoes terminaram invisiveis depois de rolar o site inteiro.
  // threshold 0 dispara com 1px visivel, que basta aqui: o efeito e "comecou
  // a entrar", nao "metade entrou".
  var ioSec = temIO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');
      ioSec.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' }) : null;

  Array.prototype.forEach.call(secoes, function (s, i) {
    s.style.setProperty('--i', (i * 70) + 'ms');
    if (ioSec) { s.classList.add('sec--motion'); ioSec.observe(s); }
    else s.classList.add('on');
  });

  // Rede de seguranca do reveal. O observer so marca o que ele viu passar pela
  // tela; quem salta para uma ancora ou aperta PageDown chega depois das
  // secoes do meio, que nunca intersectaram em nenhum quadro e ficariam com
  // opacity 0 para sempre. Medido: rolando de uma vez ate o fim, 3 das 5
  // secoes nunca foram reveladas. Aqui, qualquer secao que ja esteja acima da
  // dobra e marcada na hora — a animacao e enfeite, nunca pode esconder
  // texto que o usuario pulou direto.
  var revelarPassadas = function () {
    var limite = window.innerHeight * 0.92;
    Array.prototype.forEach.call(secoes, function (s) {
      if (!s.classList.contains('sec--motion') || s.classList.contains('on')) return;
      if (s.getBoundingClientRect().top < limite) s.classList.add('on');
    });
  };

  // H1: cada linha sobe de baixo para dentro do proprio espaco. O <br> do
  // HTML ja separa as linhas, entao so embrulha cada trecho — sem isso o
  // texto subiria junto e o efeito seria um bloco subindo, nao um titulo.
  var h1 = document.querySelector('.hero h1');
  if (h1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var partes = h1.innerHTML.split(/<br\s*\/?>/i);
    h1.innerHTML = partes.map(function (p, i) {
      return '<span class="ln"><span style="--i:' + (120 + i * 130) + 'ms">' + p + '</span></span>';
    }).join('');
  }

  // Barra de progresso de leitura, ligada ao mesmo rAF do header.
  var bar = document.getElementById('progressFill');

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
      revelarPassadas();
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