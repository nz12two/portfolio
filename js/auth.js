/* Autenticacao real — cadastro, login, sessao e logout.
 *
 * POR QUE ISSO EXISTE. Antes havia js/vip.js, que "entrava" gravando
 * {vip:true} no localStorage: sem senha, sem servidor, sem ninguem verificando
 * nada. Qualquer pessoa abria o DevTools e destravava. Pior que nao ter login —
 * era um botao que fingia ser uma porta. Este arquivo substitui a farsa por
 * verificacao de verdade.
 *
 * POR QUE SEM SDK. A REST do Supabase e um par de fetch. Trazer @supabase/
 * supabase-js seria ~40KB de dependencia para dois verbos que a REST ja faz.
 * Regra do projeto: stdlib antes de dependencia.
 *
 * A FRONTEIRA continua no mesmo lugar do vip.js: as paginas so conhecem
 * data-gate / data-unlocked / data-conta. Trocar Supabase por Auth0 ou Clerk
 * e reescrever ESTE arquivo, e nada mais.
 *
 * SEM CONFIGURACAO, O QUE ACONTECE. Nada de login falso. Sem url/anonKey o
 * modulo entra em estado "nao configurado": os botoes dizem isso e apontam a
 * pagina de conta, que explica o que falta. Um login que aceita qualquer senha
 * seria pior que nenhum — seria mentira com formulario em volta.
 */
(function () {
  "use strict";

  var CFG = window.NZ_AUTH_CONFIG || {};
  var SESSAO = "nz_sessao";
  var USUARIO = "nz_usuario";

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  // Estado do modulo: 'desconhecido' | 'anonimo' | 'autenticado' | 'sem-config'
  var estado = "desconhecido";
  var usuarioAtual = null;
  var ouvintes = [];

  function configurado() {
    return !!(CFG.url && CFG.anonKey);
  }

  // ---------------------------------------------------------------- REST

  function pedir(caminho, opcoes) {
    var o = opcoes || {};
    var cabec = {
      "content-type": "application/json",
      apikey: CFG.anonKey,
      authorization: "Bearer " + CFG.anonKey,
    };
    if (o.token) cabec.Authorization = "Bearer " + o.token;

    return fetch(CFG.url.replace(/\/$/, "") + caminho, {
      method: o.method || "POST",
      headers: cabec,
      body: o.body ? JSON.stringify(o.body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          // A REST devolve msg em varias chaves dependendo do caso; a mais
          // especifica primeiro, porque "Invalid login credentials" e mais
          // util que "Auth session missing".
          var msg = j.msg || j.error_description || j.error || j.message || "Falhou (" + r.status + ")";
          throw new Error(msg);
        }
        return j;
      });
    });
  }

  // -------------------------------------------------------------- sessao

  function guardar(j) {
    try {
      if (j && j.access_token) localStorage.setItem(SESSAO, JSON.stringify({
        token: j.access_token,
        refresh: j.refresh_token,
        expira: j.expires_at || j.expires_in,
        salvoEm: Date.now(),
      }));
      if (j && j.user) localStorage.setItem(USUARIO, JSON.stringify(j.user));
    } catch (e) { /* modo privado: segue sem persistir */ }
  }

  function lerSessao() {
    try { return JSON.parse(localStorage.getItem(SESSAO) || "null"); } catch (e) { return null; }
  }

  function limpar() {
    try {
      localStorage.removeItem(SESSAO);
      localStorage.removeItem(USUARIO);
    } catch (e) {}
    usuarioAtual = null;
    estado = "anonimo";
  }

  // O access_token do Supabase vive 1h. Sem renovar, a sessao morre sozinha
  // no meio da visita e a pessoa e ejetada sem ter feito nada. O refresh usa o
  // refresh_token e devolve um par novo.
  function renovar() {
    var s = lerSessao();
    if (!s || !s.refresh || !configurado()) return Promise.resolve(null);
    return pedir("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: s.refresh },
      token: s.refresh,
    }).then(function (j) {
      guardar(j);
      return j;
    }).catch(function () {
      // Refresh falhou = sessao morta de verdade. Limpar eAnonimo e honesto;
      // manter um token invalido deixaria a pessoapresa numa tela quebrada.
      limpar();
      return null;
    });
  }

  function definirEstado(novo, usuario) {
    estado = novo;
    usuarioAtual = usuario || null;
    ouvintes.forEach(function (f) { try { f(estado, usuarioAtual); } catch (e) {} });
  }

  // --------------------------------------------------------------- acoes

  function cadastrar(email, senha) {
    if (!configurado()) return Promise.reject(new Error("Autenticação não configurada."));
    return pedir("/auth/v1/signup", { body: { email: email, password: senha } })
      .then(function (j) {
        guardar(j);
        definirEstado("autenticado", j.user);
        return j.user;
      });
  }

  function entrar(email, senha) {
    if (!configurado()) return Promise.reject(new Error("Autenticação não configurada."));
    return pedir("/auth/v1/token?grant_type=password", {
      body: { email: email, password: senha },
    }).then(function (j) {
      guardar(j);
      definirEstado("autenticado", j.user);
      return j.user;
    });
  }

  function sair() {
    var s = lerSessao();
    limpar();
    definirEstado("anonimo", null);
    // O logout do servidor e melhor-esforço: se a chamada falhar, a sessao
    // local ja foi limpa, que e o que importa para quem esta no navegador.
    if (s && s.token && configurado()) {
      return pedir("/auth/v1/logout", { body: {}, token: s.token }).catch(function () {});
    }
    return Promise.resolve();
  }

  // Recupera quem esta logado ao abrir a pagina. Busca o usuario no servidor
  // (o localStorage pode estar com dado editado a mao) e cai em anonimo se
  // nao confirmar.
  function restaurar() {
    if (!configurado()) { definirEstado("sem-config", null); return Promise.resolve(null); }
    var s = lerSessao();
    if (!s || !s.token) { definirEstado("anonimo", null); return Promise.resolve(null); }
    return pedir("/auth/v1/user", { method: "GET", token: s.token })
      .then(function (u) { definirEstado("autenticado", u); return u; })
      .catch(function () { return renovar().then(function () { return null; }); });
  }

  // --------------------------------------------------- pintura da pagina

  function aplicar() {
    var ativo = estado === "autenticado";

    document.querySelectorAll("[data-gate]").forEach(function (g) { g.hidden = ativo; });
    document.querySelectorAll("[data-unlocked]").forEach(function (g) { g.hidden = !ativo; });

    // Botao do header: vira "sair" com sessao, e ganha o nome quando estah
    // logado, para nao ser um botao sem dono.
    document.querySelectorAll("[data-conta-open]").forEach(function (b) {
      if (estado === "sem-config") {
        b.textContent = "conta";
        b.setAttribute("aria-label", "Entrar — autenticação não configurada neste deploy");
        return;
      }
      b.textContent = ativo ? (usuarioAtual && usuarioAtual.email ? usuarioAtual.email.split("@")[0] : "sair") : "entrar";
    });

    // Nome e email em qualquer lugar que peça.
    document.querySelectorAll("[data-conta-email]").forEach(function (el) {
      el.textContent = usuarioAtual && usuarioAtual.email ? usuarioAtual.email : "";
    });
  }

  document.addEventListener("click", function (ev) {
    var sairBtn = ev.target.closest("[data-conta-sair]");
    if (sairBtn) { ev.preventDefault(); sair(); return; }
  });

  // API publica. `data-*` continua sendo a fronteira; isso e para quem
  // precisar de mais (a pagina de conta, por exemplo).
  window.NZAuth = {
    estado: function () { return estado; },
    usuario: function () { return usuarioAtual; },
    configurado: configurado,
    entrar: entrar,
    cadastrar: cadastrar,
    sair: sair,
    restaurar: restaurar,
    aoMudar: function (f) { ouvintes.push(f); f(estado, usuarioAtual); },
    aplicar: aplicar,
    esc: esc,
  };

  restaurar().then(aplicar);
})();