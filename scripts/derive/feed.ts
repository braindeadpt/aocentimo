import path from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

interface Entrada {
  data: string;
  titulo: string;
  descricao: string;
  url: string;
}

/**
 * RSS de mudanças fiscais — lê data/meta/mudancas.json (curado) e gera
 * public/feed.xml, ficheiro estático servido pelo build.
 */
export function runFeed(rootDir: string) {
  const src = path.join(rootDir, "data", "meta", "mudancas.json");
  if (!existsSync(src)) return;
  const { entradas } = JSON.parse(readFileSync(src, "utf8")) as { entradas: Entrada[] };

  const base = "https://bruto.pt";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const items = entradas
    .map(
      (e) => `    <item>
      <title>${esc(e.titulo)}</title>
      <link>${base}${e.url}</link>
      <guid>${base}/feed.xml#${e.data}</guid>
      <pubDate>${new Date(e.data + "T12:00:00Z").toUTCString()}</pubDate>
      <description>${esc(e.descricao)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BRUTO — mudanças fiscais</title>
    <link>${base}</link>
    <description>Quando uma regra, taxa ou teto muda em Portugal, anotamos aqui — com fonte.</description>
    <language>pt-PT</language>
${items}
  </channel>
</rss>
`;

  const outDir = path.join(rootDir, "public");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "feed.xml"), xml);
  console.log(`✓ feed.xml: ${entradas.length} entradas`);
}
