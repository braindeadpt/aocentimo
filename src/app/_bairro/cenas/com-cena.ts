/**
 * Os edifícios COM cena (P2a) — e SÓ isto.
 *
 * Um módulo sem um único import, porque é usado dos DOIS lados da
 * fronteira: o servidor precisa dele para o cartão dizer «entrar» em
 * vez de «em breve», e o `<Bairro>` (cliente) usa o mesmo conjunto ao
 * decidir se abre a cena. Se vivesse em `dados.ts`, arrastava o `fs`
 * dos loaders para o browser — o build não deixa mentir disto.
 */
export const EDIFICIOS_COM_CENA = new Set(["fabrica", "financas", "banco", "mercearia",
  "correios", "bomba", "segsocial", "casa", "pastelaria", "quiosque", "escola"]);

/** Quem tem cena (o cartão deixa de dizer «em breve»). */
export function temCena(id: string): boolean {
  return EDIFICIOS_COM_CENA.has(id);
}
