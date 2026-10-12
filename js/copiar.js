/* Copiar comando com um clique.
 *
 * Comando de instalacao e o unico texto da pagina que o leitor precisa levar
 * embora — se ele tem que selecionar, acertar o inicio e o fim e dar Ctrl+C,
 * metade dos passos nao acontece. O botao fica sobre o bloco, some apos 2s e
 * respeita prefers-reduced-motion.
 *
 * clipboard.writeText precisa de contexto seguro (https ou localhost); em
 * file:// ele lanca. O try/catch cai para o metodo antigo com execCommand e,
 * se nem isso funcionar, o botao diz isso em vez de fingir que copiou.
 */
(function () {
  "use strict";

  var DURACAO = 2000;

  function textoDoBloco(botao) {
    var bloco = botao.closest(".code");
    var code = bloco && bloco.querySelector("code");
    return code ? code.textContent : "";
  }

  function dizer(botao, txt, estado) {
    var alvo = botao.querySelector(".code__txt");
    alvo.textContent = txt;
    botao.dataset.estado = estado;
    clearTimeout(botao._t);
    botao._t = setTimeout(function () {
      alvo.textContent = "copiar";
      botao.dataset.estado = "";
    }, DURACAO);
  }

  function colar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto);
    }
    // Reserva antiga: precisa de um textarea no documento e foco.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = texto;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("execCommand negado"));
    });
  }

  document.addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-copy]");
    if (!botao) return;

    var texto = textoDoBloco(botao);
    if (!texto) return;

    dizer(botao, "copiando…", "trabalhando");
    colar(texto.trim())
      .then(function () { dizer(botao, "copiado", "ok"); })
      .catch(function () {
        // Sem contexto seguro: nao e erro do visitante, e falta de permissao.
        // Dizer e melhor que mostrar "copiado" sem ter copiado.
        dizer(botao, "selecione e copie", "erro");
      });
  });
})();