/**
 * O alternate RSS do layout não é herdado quando a página define
 * alternates.canonical (o objeto substitui, não faz merge) — reaplicar
 * por página para manter a autodescoberta do feed em todo o site.
 */
export const ALT_FEED = { "application/rss+xml": "/feed.xml" } as const;

/**
 * id de série → página temática onde a série vive (D-05). Séries sem
 * página temática devolvem null — o catálogo aponta então para o JSON
 * em /api/<id>.json. Regras por prefixo para as famílias, explícitas
 * para as soltas.
 */
export function rotaDaSerie(id: string): string | null {
  if (id.startsWith("hicp-pt-")) return "/inflacao";
  if (id.startsWith("euribor-")) return "/credito";
  if (id.startsWith("pmd-")) return "/precos";
  if (id.startsWith("une-") || id === "lci-pt-homologo" || id === "desemprego-gap")
    return "/emprego";
  if (id === "hpi-pt" || id === "casa-em-salarios") return "/habitacao";
  if (
    id === "pib-pt-homologo" ||
    id === "confianca-pt" ||
    id === "elec-pt-domestico"
  )
    return "/economia";
  if (id === "ca-base") return "/poupanca";
  return null;
}
