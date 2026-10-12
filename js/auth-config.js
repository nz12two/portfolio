/* Configuracao da autenticacao.
 *
 * VAZIO de proposito no repositorio: URL e anon key sao do SEU projeto, e
 * escrever aqui um placeholder preenchido seria publicar uma chave falsa que
 * quebra o login de todo mundo.
 *
 * Como preencher:
 *   1. Crie um projeto em https://supabase.com (free, ~2 min)
 *   2. Dashboard > Project Settings > API
 *   3. Cole URL e anon public key abaixo
 *   4. Authentication > Providers > Email: DESLIGUE "Confirm email".
 *      Sem confirmacao o primeiro login cai num e-mail que nunca chega num
 *      servidor de portfolio sem MX proprio.
 *
 * A anon key e publica por desenho — e a identidade do app, nao um segredo.
 * Ela vai no navegador de todo mundo que abre o site, entao NAO vai ser
 * ignorada pelo git: o arquivo precisa estar no repositorio senao o GitHub
 * Pages responde 404 e o login some na pagina de conta. O que protege a conta
 * e a senha, e o que protege os dados e a Row Level Security do projeto, nao
 * este arquivo. Chave de servizio (service_role) NUNCA entra aqui: essa sim
 * nunca vai para o navegador nem para o git.
 */
window.NZ_AUTH_CONFIG = {
  url: "",
  anonKey: "",
};