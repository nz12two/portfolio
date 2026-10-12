/* Novidades: as ultimas mensagens de #anuncios no Discord, lidas de
 * dados/novidades.json (gerado por tools/puxar-novidades.js).
 *
 * Por que existir: a vitrine mostra produto pronto, e produto pronto parece
 * projeto parado. A unica prova de que o trabalho continua e o registro do que
 * mudou — que por acaso e o que o Discord ja guarda.
 *
 * Por que sumir quando nao ha dado: secao com tres semanas de atualizacao e
 * data parada e pior que secao nenhuma — a pessoa le "ultima atualizacao" e
 * conclui que o NZ parou. Sem arquivo, sem itens ou com erro, a secao fica
 * oculta e o resto do site continua igual. O aviso nunca vira texto de erro: quem
 * visita o portfolio nao tem por que ler o log do pipeline.
 */
(function () {
  "use strict";

  var sec = document.getElementById("novidades");
  var btn = document.getElementById("discordBtn");
  var btnTxt = document.getElementById("discordBtnTxt");
  var aguardo = document.getElementById("discordAguardando");

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  // Discord manda ISO; a home fala em dia. Mes curto porque e linha de feed, nao
  // data de assinatura.
  var MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var data = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.getDate() + " " + MES[d.getMonth()];
  };

  var card = function (n) {
    return (
      '<li class="news__item">' +
      '<a class="news__link" href="' + esc(n.url) + '" rel="noopener">' +
      '<span class="news__meta mono">' + esc(data(n.ts)) + (n.bot ? " · automático" : "") + "</span>" +
      '<span class="news__txt">' + esc(n.texto) + "</span>" +
      '<span class="news__go" aria-hidden="true">&rarr;</span>' +
      "</a></li>"
    );
  };

  var montar = function (d) {
    var itens = d.itens || [];
    if (!itens.length) return;

    if (sec) {
      sec.hidden = false;
      sec.innerHTML =
        '<div class="wrap">' +
        '<div class="eyebrow mono">novidades</div>' +
        "<h2 style=\"font-size:var(--t-2xl);max-width:24ch\">O que mudou depois do último deploy</h2>" +
        '<ul class="news">' + itens.slice(0, 6).map(card).join("") + "</ul>" +
        '<p class="news__src mono">de #' + esc(d.canal || "anuncios") + " no Discord · lido " + esc(String(d.gerado_em || "").slice(0, 10)) + "</p>" +
        "</div>";
    }

    // O convite vem do mesmo arquivo. Enquanto nao existir, o botao fica
    // escondido em vez de apontar para discord.gg/SEU-LINK — link de convite
    // invalido e pior que link nenhum, porque parece convite pronto.
    if (btn) {
      if (d.convite) {
        btn.href = d.convite;
        if (btnTxt) btnTxt.textContent = "Entrar no Discord";
      } else {
        btn.hidden = true;
        if (aguardo) aguardo.hidden = false;
      }
    }
  };

  fetch("dados/novidades.json")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d) montar(d); })
    .catch(function () { /* sem dado novo: o site fica como esta */ });
})();
