/* Hero — spotlight que segue o cursor e feedback de clique. Sem canvas. */
(function () {
  'use strict';

  var REDUZ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hero = document.querySelector('.hero');
  if (!hero) return;

  /* 1. Spotlight: o cursor move o --mx/--my, que main.css:505 usa num
     radial-gradient. Este listener fica ACIMA de qualquer saida antecipada:
    seguir o cursor nao e movimento, e e informacao de onde o ponteiro esta. */
  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    var nx = ((e.clientX - rect.left) / rect.width) * 100;
    var ny = ((e.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty('--mx', nx.toFixed(2) + '%');
    hero.style.setProperty('--my', ny.toFixed(2) + '%');
  }, { passive: true });

  /* 2. Ripple nos botoes do hero.
     POR QUE ESTE BLOCO ESTA AQUI E NAO DEPOIS DE UM `if (REDUZ) return`:
     o codigo antigo desenhava a constelacao de particulas e, no fim do arquivo,
     devolvia cedo quando o sistema pede movimento reduzido — DEPOIS de criar o
     canvas e ANTES de registrar este listener. Resultado medido: com
     `prefers-reduced-motion: reduce` (o estado desta maquina) o botao nao
     recebia NENHUM feedback de clique, em carga normal e depois de reload.
     `node medir-ripple.mjs` reproduz: com movimento 1 ripple, sem movimento 0.

     Quem pede menos movimento continua recebe confirmacao do clique — so sem
     a animacao de escala, que e o que incomoda. Um clique sem retorno nenhum e
     o oposto de respeitar a preferencia. */
  hero.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest ? e.target.closest('.btn') : null;
    if (!btn) return;

    var rb = btn.getBoundingClientRect();
    var ripple = document.createElement('i');
    ripple.className = 'ripple';
    // A posicao vem do retangulo do botao e nao de e.offsetX: em delegacao o
    // alvo pode ser um <span> dentro do botao e o offset sai da borda da span.
    ripple.style.left = (e.clientX - rb.left - 60) + 'px';
    ripple.style.top = (e.clientY - rb.top - 60) + 'px';
    btn.appendChild(ripple);

    if (REDUZ) {
      // Sem escala e sem Web Animations: um circulo que simplesmente some.
      ripple.classList.add('ripple--estatico');
      setTimeout(function () { ripple.remove(); }, 180);
      return;
    }

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