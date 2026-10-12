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
       1. ONDE A STACK SE REPETE

       Substitui o grafo de forca. Motivo medido: das 44 arestas que
       o grafo desenhava, 42 se apoiavam num unico produto -- ou seja,
       a linha existia porque os dois itens estavam no mesmo projeto, e
       o painel a chamava de "stack compartilhada". Das 20 tecnologias,
       15 aparecem num projeto so e so 1 aparece em tres ou mais. Com
       seis projetos o desenho nao tinha o que dizer, e os rotulos se
       cobriam ("GitHub Actions" sobre "Node.js", "SQLite" sobre
       "MySQL"). Virou lista ordenada: quantos produtos usam cada
       tecnologia, e quais, abrindo a linha.
       ============================================================ */
    var listaStack = document.getElementById('stackLista');
    if (listaStack) {
      quandoCatalogo(function (C) {
        var itens = C.itens || [];
        var uso = new Map();
        for (var i = 0; i < itens.length; i++) {
          var st = itens[i].stack || [];
          for (var k = 0; k < st.length; k++) {
            if (!uso.has(st[k])) uso.set(st[k], []);
            uso.get(st[k]).push(itens[i]);
          }
        }
        var linhas = Array.from(uso.entries()).sort(function (a, b) {
          return b[1].length - a[1].length || a[0].localeCompare(b[0]);
        });
        var repetem = 0, tresOuMais = 0;
        listaStack.textContent = '';
        for (var n = 0; n < linhas.length; n++) {
          (function (nome, ps) {
            var ul = document.createElement('ul');
            ul.className = 'stack__prods';
            ul.hidden = true;
            for (var m = 0; m < ps.length; m++) {
              var pl = document.createElement('li');
              var link = document.createElement('a');
              link.href = 'catalogo/' + ps[m].slug + '.html';
              link.textContent = ps[m].nome;
              pl.appendChild(link);
              ul.appendChild(pl);
            }

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'stack__b';
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', 'stack-' + nome.replace(/[^\w-]/g, ''));
            ul.id = btn.getAttribute('aria-controls');

            var rot = document.createElement('span');
            rot.className = 'stack__nome';
            rot.textContent = nome;

            var cont = document.createElement('span');
            cont.className = ps.length === 1 ? 'stack__n stack__n--so' : 'stack__n';
            cont.textContent = ps.length + (ps.length === 1 ? ' projeto' : ' projetos');

            // Um so listener: aria-expanded, a classe e a lista saem juntos.
            btn.addEventListener('click', function () {
              var aberto = btn.getAttribute('aria-expanded') === 'true';
              btn.setAttribute('aria-expanded', aberto ? 'false' : 'true');
              ul.hidden = aberto;
            });

            var li = document.createElement('li');
            li.className = 'stack__it';
            btn.appendChild(rot);
            btn.appendChild(cont);
            li.appendChild(btn);
            li.appendChild(ul);
            listaStack.appendChild(li);
          })(linhas[n][0], linhas[n][1]);
        }
        for (var r = 0; r < linhas.length; r++) {
          if (linhas[r][1].length >= 2) repetem++;
          if (linhas[r][1].length >= 3) tresOuMais++;
        }
        var resumo = document.createElement('li');
        resumo.className = 'stack__resumo';
        resumo.textContent = repetem + ' das ' + linhas.length +
          ' tecnologias aparecem em dois ou mais projetos; ' + tresOuMais + ' em três ou mais.';
        listaStack.insertBefore(resumo, listaStack.firstChild);
      });
    }

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
  });

    /* ============================================================
       0. ESTADO REAL DO RUNTIME
       Le dados/estado.json, gerado por tools/exportar-estado.js a
       partir de ~/.banzinho/{state,logs}. Substitui o grafo de forca:
       aquele desenhava 44 arestas das quais 42 eram "os dois itens no
       mesmo produto" e chamava isso de stack compartilhada. Aqui cada
       numero sai de uma chamada que aconteceu.
       ============================================================ */
    var painelEstado = document.getElementById('estadoPainel');
    if (painelEstado) {
      var tiles = document.getElementById('estadoTiles');
      var listaFalhas = document.getElementById('estadoFalhas');
      var listaAchados = document.getElementById('estadoAchados');
      var notaEstado = document.getElementById('estadoNota');

      fetch('dados/estado.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !d.execucao) {
            if (notaEstado) notaEstado.textContent = 'Sem snapshot em dados/estado.json — rode node tools/exportar-estado.js.';
            return;
          }
          var ex = d.execucao;
          var dc = d.auto_auditoria || {};
          var sev = dc.por_severidade || {};
          var nAlta = (sev.high || 0) + (sev.critical || 0);

          // tiles: numero medido, rotulo curto. Sem "MB de codigo" e sem
          // numero que nao responda pergunta. O quarto item e o nome do icone:
          // o desenho acompanha o que foi medido, e sai do mesmo conjunto do
          // nav — antes o tile era numero e palavra, sem nenhuma marca.
          var nums = [
            [ex.chamadas_medidas, 'chamadas medidas', '', 'terminal'],
            [ex.ferramentas.length, 'ferramentas distintas', '', 'ferramenta'],
            [(ex.taxa_erro_global * 100).toFixed(1) + '%', 'taxa de erro', ex.taxa_erro_global > 0.05 ? 'tile--ruim' : '', 'erro'],
            [dc.total || 0, 'achados abertos', nAlta > 0 ? 'tile--ruim' : '', 'achado'],
          ];
          for (var i = 0; i < nums.length; i++) {
            // div, nao dt/dd: num <dl> de 4 colunas cada dt e cada dd ocupa uma
            // celula, e o numero acabava na linha ao lado do proprio rotulo.
            var box = document.createElement('div');
            box.className = 'tile' + (nums[i][2] ? ' ' + nums[i][2] : '');
            box.innerHTML = (window.icone ? window.icone(nums[i][3]) : '');
            var dt = document.createElement('span');
            dt.className = 'tile__n';
            dt.textContent = String(nums[i][0]);
            var dd = document.createElement('span');
            dd.className = 'tile__r';
            dd.textContent = nums[i][1];
            box.appendChild(dt);
            box.appendChild(dd);
            tiles.appendChild(box);
          }

          // falhas por classe, ja agrupadas pelo gerador
          var fal = (d.falhas || []).slice(0, 10);
          var max = fal.length ? fal[0].ocorrencias : 1;
          for (var f2 = 0; f2 < fal.length; f2++) {
            var li = document.createElement('li');
            li.className = 'falha';
            var cab = document.createElement('div');
            cab.className = 'falha__cab';
            var tool = document.createElement('span');
            tool.className = 'falha__tool mono';
            tool.textContent = fal[f2].tool;
            var classe = document.createElement('span');
            classe.className = 'falha__classe';
            classe.textContent = fal[f2].classe;
            var n = document.createElement('span');
            n.className = 'falha__n';
            n.textContent = fal[f2].ocorrencias;
            cab.appendChild(tool);
            cab.appendChild(classe);
            cab.appendChild(n);
            var trilha = document.createElement('span');
            trilha.className = 'falha__trilha';
            var barra = document.createElement('span');
            barra.className = 'falha__barra';
            barra.style.width = Math.max(2, Math.round((fal[f2].ocorrencias / max) * 100)) + '%';
            trilha.appendChild(barra);
            li.appendChild(cab);
            li.appendChild(trilha);
            listaFalhas.appendChild(li);
          }
          if (!fal.length) {
            var vazio = document.createElement('li');
            vazio.className = 'falha__vazio';
            vazio.textContent = 'Nenhuma falha registrada na janela.';
            listaFalhas.appendChild(vazio);
          }

          // achados da auto-auditoria: o que o proprio runtime acusa nele mesmo.
// Deduplica por mensagem — o doctor emite o mesmo achado uma vez por
// instancia, e quatro linhas iguais na tela leem como quatro problemas.
          var vistos = new Set();
          var unicos = [];
          for (var q = 0; q < (dc.achados || []).length; q++) {
            var m = dc.achados[q].mensagem;
            if (vistos.has(m)) continue;
            vistos.add(m);
            unicos.push(dc.achados[q]);
          }
          var ach = unicos.slice(0, 8);
          for (var a2 = 0; a2 < ach.length; a2++) {
            var li2 = document.createElement('li');
            li2.className = 'achado achado--' + ach[a2].severidade;
            var selo = document.createElement('span');
            selo.className = 'achado__sev mono';
            selo.textContent = ach[a2].severidade;
            var txt = document.createElement('span');
            txt.className = 'achado__msg';
            txt.textContent = ach[a2].mensagem;
            li2.appendChild(selo);
            li2.appendChild(txt);
            listaAchados.appendChild(li2);
          }
          if (!ach.length) {
            var v2 = document.createElement('li');
            v2.className = 'falha__vazio';
            v2.textContent = 'Auto-auditoria sem achado aberto.';
            listaAchados.appendChild(v2);
          }

          var j = ex.janela;
          // O snapshot e um arquivo commitado, nao um feed: ele envelhece sem
          // ninguem mexer. A data vai no rodape sempre, e acima de 30 dias o
          // painel avisa em vez de deixar o numero parecer de agora.
          var gerado = d.gerado_em ? Date.parse(d.gerado_em) : 0;
          var idadeDias = gerado ? Math.floor((Date.now() - gerado) / 86400000) : null;
          if (idadeDias === null) {
            painelEstado.classList.add('estado--velho');
          } else if (idadeDias > 30) {
            painelEstado.classList.add('estado--velho');
          }
          if (notaEstado) {
            notaEstado.textContent =
              (idadeDias === null ? 'Snapshot sem data.' : idadeDias === 0 ? 'Snapshot de hoje.' :
               idadeDias === 1 ? 'Snapshot de ontem.' : 'Snapshot de ' + idadeDias + ' dias atrás.') +
              ' Janela ' + (j ? j.de.slice(0, 10) + ' a ' + j.ate.slice(0, 10) : '?') +
              ' · ' + ex.eventos_lidos + ' eventos lidos · ' +
              (d.portoes ? d.portoes.registros + ' pedidos de portão registrados' : '') +
              ' · caminho, sessão e comando são redigidos no gerador';
          }
        })
        .catch(function () {
          if (notaEstado) notaEstado.textContent = 'Nao foi possivel ler dados/estado.json.';
        });
    }

})();