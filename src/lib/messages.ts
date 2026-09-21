import pt from "../../messages/pt.json";

/**
 * Strings do site — PT-PT europeu, fonte única em messages/pt.json.
 * Regra de casa: nunca "usuário/você/portfólio"; segunda pessoa plural
 * ("o teu", "pagas"). Site monolíngue: acesso directo via `m`.
 */
export const m = pt;

export type Messages = typeof pt;

/** re-export por compat — clientes devem importar `t` de "./t" para
 *  não arrastar o JSON para o chunk do browser */
export { t } from "./t";
