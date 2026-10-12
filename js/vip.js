/* Porta VIP — local, sem servidor.
 *
 * Isto NAO e autenticacao. Nao ha senha, nao ha servidor, nao ha quem verifique
 * nada: o estado vive em localStorage e qualquer pessoa abre o DevTools e
 * destrava. E um portao de vitrine, montado para testar a jornada antes de
 * existir back-end.
 *
 * A fronteira esta isolada aqui de proposito: as paginas so conhecem
 * data-locked / data-unlocked. Trocar por Supabase, Auth0 ou um backend proprio
 * significa reescrever este arquivo e nada mais. */
(function () {
  "use strict";

  var CHAVE = "nz_vip";

  // Interface única: o resto do site fala com estas duas funções.
  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) || "null");
    } catch (e) {
      return null;
    }
  }
  function gravar(v) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(v));
    } catch (e) {
      /* modo privado: segue sem persistir */
    }
  }
  function sair() {
    try {
      localStorage.removeItem(CHAVE);
    } catch (e) {}
  }

  function aplicar() {
    var sessao = ler();
    var ativo = !!(sessao && sessao.vip);

    document.querySelectorAll("[data-vip-item]").forEach(function (el) {
      el.style.opacity = ativo ? "1" : "0.75";
    });

    document.querySelectorAll(".vip").forEach(function (sec) {
      sec.dataset.locked = ativo ? "0" : "1";
      sec.dataset.unlocked = ativo ? "1" : "0";
    });

    document.querySelectorAll("[data-gate]").forEach(function (g) {
      g.hidden = ativo;
    });
    document.querySelectorAll("[data-unlocked]").forEach(function (g) {
      g.hidden = !ativo;
    });

    // Botao do header: vira "sair" quando ja ha sessao.
    document.querySelectorAll(".hdr [data-vip-open]").forEach(function (b) {
      b.textContent = ativo ? "sair" : "VIP";
      b.classList.toggle("btn--acc", !ativo);
    });
  }

  function entrar() {
    // Sem credencial: registra apenas que ha sessao local.
    gravar({ vip: true, desde: new Date().toISOString() });
    aplicar();
  }

  document.addEventListener("click", function (ev) {
    var abrir = ev.target.closest("[data-vip-open]");
    if (abrir) {
      if (ler() && ler().vip) {
        sair();
        aplicar();
      } else {
        entrar();
      }
      return;
    }
  });

  aplicar();
})();