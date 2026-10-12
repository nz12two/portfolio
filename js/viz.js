/* viz — dados de catalogo.json, so DOM/SVG, sem canvas, sem CDN. */
(function () {
  'use strict';
  const REDUZ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEC = document.getElementById('dados');
  if (!SEC) return; // pai insere, nao edita HTML existente

  fetch('catalogo/dados/catalogo.json')
    .then(r => r.json())
    .then(d => render(d))
    .catch(e => { console.error('viz: erro ao ler catalogo.json', e); SEC.innerHTML = '<p>Dados nao disponiveis.</p>'; });

  function render(c) {
    // 1. Timeline
    const itensComProva = c.itens.filter(i => i.prova && i.prova.quando);
    const datas = itensComProva.map(i => i.prova.quando);
    const unicas = new Set(datas);
    if (unicas.size <= 1) console.warn('viz: eixo degenerado — todas as datas de prova sao a mesma:', Array.from(unicas)[0] || 'nenhuma');

    const tlWrap = document.createElement('div');
    tlWrap.className = 'timeline';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 140');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Linha do tempo das medicoes de prova do portfólio');

    // Eixo simples: linha horizontal, circulos para cada item com prova
    const cxBase = 60, cxEnd = 940, y = 50, rCirc = 7;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${cxBase} ${y} L ${cxEnd} ${y}`);
    path.setAttribute('class', 'timeline-line');
    svg.appendChild(path);

    itensComProva.forEach((item, idx) => {
      const cx = cxBase + ((cxEnd - cxBase) * (idx / Math.max(1, itensComProva.length - 1)));
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', item.nome + ' — prova ' + item.prova.num + ' ' + item.prova.unidade);
      btn.setAttribute('aria-describedby', 'viz-detail-' + item.slug);
      btn.style.cssText = 'background:none;border:none;padding:0;cursor:pointer;';
      btn.addEventListener('click', () => showDetail(item));
      btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', rCirc);
      circle.setAttribute('class', 'timeline-circle');

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', cx);
      label.setAttribute('y', y + 28);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'timeline-label');
      label.textContent = item.nome;

      const numText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      numText.setAttribute('x', cx);
      numText.setAttribute('y', y - 10);
      numText.setAttribute('text-anchor', 'middle');
      numText.setAttribute('class', 'timeline-num');
      numText.textContent = item.prova.num + ' ' + item.prova.unidade;

      btn.appendChild(circle);
      btn.appendChild(label);
      btn.appendChild(numText);
      g.appendChild(btn);
      svg.appendChild(g);
    });
    tlWrap.appendChild(svg);

    // Area de detalhe (aparece abaixo ao clicar na marca)
    const detailWrap = document.createElement('div');
    detailWrap.id = 'timeline-detail-area';
    tlWrap.appendChild(detailWrap);
    SEC.appendChild(tlWrap);

    function showDetail(item) {
      const area = document.getElementById('timeline-detail-area');
      area.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'detail-box';
      box.id = 'viz-detail-' + item.slug;
      box.innerHTML = '<strong>' + item.nome + '</strong> — prova de ' + item.prova.quando + '<br>Como foi medido: ' + (item.prova.como || 'Texto nao informado.');
      area.appendChild(box);
    }

    // 2. Distribuicao
    // Campo do item por faceta. 'preco' nao serve: a faceta usa as chaves
      // (gratis, consulta) e o item carrega o TEXTO (gratuito, sob-consulta).
      // Contando i.preco, os dois vocabularios nunca se cruzam e o bloco
      // inteiro sai com zero — medido: gratis 0 com 4 produtos gratuitos.
      const facetas = [['tipo', 'tipo'], ['status', 'status'], ['preco', 'precoChave']];
    const distWrap = document.createElement('div');
    distWrap.style.marginTop = '2.5rem';
    distWrap.innerHTML = '<h3>Distribuição</h3><p style="font-size:.8rem;color:var(--tx-3);">Contagens reais dos itens do catalogo. Sem filtro.</p>';
    facetas.forEach(par => {
      const f = par[0], campo = par[1];
      const valores = c.facetas[f] || [];
      const contagens = {};
      valores.forEach(v => contagens[v] = 0);
      c.itens.forEach(i => { if (i[campo]) contagens[i[campo]] = (contagens[i[campo]] || 0) + 1; });
      const maxC = Math.max(...Object.values(contagens), 1);
      const block = document.createElement('div');
      block.style.marginBottom = '1rem';
      block.innerHTML = '<h4 style="font-size:.9rem;margin-bottom:.4rem;color:var(--tx-2);">Por ' + f + '</h4>';
      valores.forEach(v => {
        const count = contagens[v] || 0;
        const pct = (count / maxC) * 100;
        const row = document.createElement('div');
        row.className = 'dist-row';
        row.innerHTML = '<div class="dist-label">' + v + '</div>' +
          '<div class="dist-bar-wrap"><div class="dist-bar" style="width:' + pct + '%"></div></div>' +
          '<div class="dist-count">' + count + '</div>';
        block.appendChild(row);
      });
      distWrap.appendChild(block);
    });
    SEC.appendChild(distWrap);

    // 3. Estatisticas
    const statsWrap = document.createElement('div');
    statsWrap.className = 'stats-grid';
    const numeros = [
      { num: Math.max(...itensComProva.map(i => Number(i.prova.num) || 0)).toString(), desc: 'Maior número medido no catálogo', tooltip: 'Derivado de prova.num em cada item com prova; máximo encontrado.' },
      { num: c.total.toString(), desc: 'Total de itens no catalogo', tooltip: 'Campo catalogo.total.' },
      { num: c.itens.filter(i => i.repo).length.toString(), desc: 'Itens com repo publico', tooltip: 'Contagem de itens onde o campo repo existe e nao esta vazio.' },
      { num: c.itens.filter(i => i.status === 'privado').length.toString(), desc: 'Itens privados', tooltip: 'Contagem de itens com status == "privado".' },
      { num: new Set(c.itens.flatMap(i => (i.stack || []))).size.toString(), desc: 'Tecnologias distintas', tooltip: 'Quantidade de valores unicos em facetas.stack somados aos stacks de todos os itens.' }
    ];
    numeros.forEach((st, idx) => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-describedby', 'stat-tip-' + idx);
      const tip = document.createElement('span');
      tip.className = 'stat-tooltip';
      tip.id = 'stat-tip-' + idx;
      tip.textContent = st.tooltip;
      card.innerHTML = '<div class="stat-num" data-value="' + st.num + '">' + (REDUZ ? st.num : '0') + '</div><div class="stat-desc">' + st.desc + '</div>';
      card.appendChild(tip);
      statsWrap.appendChild(card);
      // Animacao do numero apenas se nao reduzido
      if (!REDUZ) {
        const numEl = card.querySelector('.stat-num');
        const finalVal = parseInt(st.num, 10);
        const dur = 800;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3); // ease out
          const cur = Math.round(eased * finalVal);
          numEl.textContent = cur.toString();
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    });
    SEC.appendChild(statsWrap);

    // Teclado: fecha tooltip com Esc
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.stat-tooltip').forEach(t => { t.style.opacity = '0'; });
      }
    });
  }
})();
