import { readdirSync, readFileSync } from "fs";

/**
 * Lista de rotas derivada, nunca escrita à mão: o sitemap é gerado do
 * conteúdo (expande rotas dinâmicas como /aprender/[slug]) e os .html
 * exportados cobrem as páginas fora do sitemap (ex.: /estilo). Qualquer
 * rota nova nasce coberta por todos os testes que a usam.
 */
export function rotasDoSite(): string[] {
  const deSitemap = [
    ...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((m) => new URL(m[1]).pathname);
  const deHtml = readdirSync("out", { recursive: true })
    .filter((f): f is string => typeof f === "string" && f.endsWith(".html"))
    .map((f) => f.replace(/\\/g, "/").replace(/\.html$/, ""))
    .filter((f) => !f.startsWith("_") && f !== "404")
    .map((p) => (p === "index" ? "/" : `/${p}`));
  return [...new Set([...deSitemap, ...deHtml])].sort();
}
