import pt from "../../messages/pt.json";

/**
 * Strings do site — PT-PT europeu, fonte única em messages/pt.json.
 * Regra de casa: nunca "usuário/você/portfólio"; segunda pessoa plural
 * ("o teu", "pagas"). Site monolíngue: acesso directo via `m`.
 */
export const m = pt;

export type Messages = typeof pt;

/** Substituição simples de placeholders {chave}. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
