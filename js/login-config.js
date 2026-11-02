/* Interruptor do login.
 *
 * `ativo: false` NÃO é falha de configuração: é a posição de hoje. A conta
 * existe para guardar o material pago, e enquanto não há material pago não há
 * o que trancar. Desligado, a página de conta diz isso em letra clara e manda
 * pro Discord — em vez de mostrar um formulário que aceita e-mail e some com a
 * senha.
 *
 * Para ligar: preencha js/auth-config.js (URL + anon key do Supabase) e mude
 * `ativo` para true. Sem auth-config preenchido, a página cai no aviso
 * "autenticação não configurada" e os botões continuam desligados.
 */
window.NZ_LOGIN = {
  ativo: false,
  // texto que aparece na página de conta enquanto estiver desligado
  motivo: "A conta vai guardar o material pago do catálogo. Enquanto não existe material pago, ela fica fechada — o catálogo é aberto e o contato é o Discord.",
  discord: "https://discord.gg/ZNchMjhZQK"
};
