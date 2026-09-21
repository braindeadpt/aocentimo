/**
 * O alternate RSS do layout não é herdado quando a página define
 * alternates.canonical (o objeto substitui, não faz merge) — reaplicar
 * por página para manter a autodescoberta do feed em todo o site.
 */
export const ALT_FEED = { "application/rss+xml": "/feed.xml" } as const;
