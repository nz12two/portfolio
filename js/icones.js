/* Icones — um conjunto so, desenhado em SVG, com fonte unica.
 *
 * POR QUE ISTO SUBSTITUI O QUE ESTAVA LA: o botao de busca mostrava duas
 * lupas — a do `::before` em CSS (navega.css) e o caractere U+2315 dentro do
 * botao. O caractere Unicode nao e um icone: o desenho depende da fonte do
 * sistema, e U+2315 e "telephone recorder", nao lupa. Em outra maquina sairia
 * quadrado. Medido: 3 caracteres usados como icone na home (index.html:64,
 * index.html:69 e o botao criado em navega.js:76) contra 4 SVGs ja
 * espalhados pelo codigo, cada um com seu proprio desenho.
 *
 * Um sprite com <symbol> e uma classe .ico. Quem chama:
 *   - HTML:  <a href="#lab" data-ico="lab">Lab</a>   (o icone entra sozinho)
 *   - JS:    window.icone('terminal')                (devolve a marca)
 * Tudo sai do MESMO dicionario abaixo. Icono novo entra em um lugar so.
 */
(function () {
  'use strict';

  // Traco, cantos e cor vêm do CSS (`.ico`), entao os simbolos guardam so a
  // geometria. viewBox 24x24 como no Feather, de onde vem o desenho.
  var ICONES = {
    // --- navegacao -----------------------------------------------------
    sobre: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    produtos:
      '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    marketplace:
      '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    lab: '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>',
    dados:
      '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    prova:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',

    // --- acoes ---------------------------------------------------------
    busca: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    conta:
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',

    // --- medidas: o que cada numero mede ------------------------------
    // As unidades vem do catalogo.json, nao do HTML: o icone acompanha a
    // unidade medida, e nao a posicao na tela.
    scan:
      '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    pacotes:
      '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    verificador:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    ferramenta:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    erro:
      '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    achado:
      '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  };

  // Unidade de medida -> icone. A chave e o texto que ja aparece na tela, e
  // nao a posicao: se o catalogo trocar a ordem dos produtos, o icone continua
  // do lado do numero certo sem ninguem editar nada.
  var ICONE_DA_UNIDADE = {
    'detectores de x-ray': 'scan',
    'apis sondadas': 'globe',
    'repos e pacotes no índice': 'pacotes',
    'verificadores de regra': 'verificador',
    'chamadas medidas': 'terminal',
    'ferramentas distintas': 'ferramenta',
    'taxa de erro': 'erro',
    'achados abertos': 'achado',
  };

  var ID = function (nome) { return 'i-' + nome; };

  /** Marca do icone. Devolve '' quando o nome nao existe no dicionario —
   *  um typo vira texto faltando, nao um desenho quebrado na tela. */
  window.icone = function (nome, classe) {
    if (!nome || !ICONES[nome]) return '';
    return (
      '<svg class="ico' + (classe ? ' ' + classe : '') + '" aria-hidden="true" focusable="false">' +
      '<use href="#' + ID(nome) + '"></use></svg>'
    );
  };

  /** Icone de uma unidade medida, pelo proprio texto dela. */
  window.iconeDaUnidade = function (unidade) {
    return window.icone(ICONE_DA_UNIDADE[String(unidade).toLowerCase().trim()]);
  };

  window.temIcone = function (nome) { return !!(nome && ICONES[nome]); };

  /** Injeta o sprite uma vez. `<use>` so acha `<symbol>` que esteja no
   *  documento — por isso o sprite vai no DOM, e nao num comentario de
   *  template. largura/altura zero em vez de display:none, que em alguns
   *  navegadores impede o `<use>` de desenhar. */
  function põeSprite() {
    if (document.getElementById('sprite-icones')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'sprite-icones');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    Object.keys(ICONES).forEach(function (nome) {
      var sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
      sym.setAttribute('id', ID(nome));
      sym.setAttribute('viewBox', '0 0 24 24');
      sym.innerHTML = ICONES[nome];
      svg.appendChild(sym);
    });
    document.body.appendChild(svg);
  }

  /** Todo elemento com `data-ico` ganha o icone na frente do texto. */
  function aplicaNosElementos() {
    var marcados = document.querySelectorAll('[data-ico]');
    Array.prototype.forEach.call(marcados, function (el) {
      if (el.querySelector('.ico')) return; // ja aplicado
      var svg = window.icone(el.getAttribute('data-ico'));
      if (!svg) return;                      // nome fora do dicionario
      el.insertAdjacentHTML('afterbegin', svg);
      el.setAttribute('data-ico-feito', 'sim');
    });
  }

  function inicia() {
    põeSprite();
    aplicaNosElementos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();