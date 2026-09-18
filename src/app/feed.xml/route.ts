import { SITE_URL } from "@/lib/site";
import mudancas from "@data/meta/mudancas.json";

export const dynamic = "force-static";

/**
 * RSS de mudanças fiscais — gerado no build a partir de
 * data/meta/mudancas.json (fonte única, curada à mão).
 *
 * Os <guid> mantêm os identificadores antigos (js.org) de propósito:
 * um guid é um identificador, não um link resolúvel. Mudá-lo faria os
 * leitores RSS tratarem as entradas antigas como novas. Só os <link>
 * seguem o domínio atual.
 */
const GUID_BASE = "https://aocentimo.js.org";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AO CÊNTIMO — mudanças fiscais</title>
    <link>${SITE_URL}</link>
    <description>Quando uma regra, taxa ou teto muda em Portugal, anotamos aqui — com fonte.</description>
    <language>pt-PT</language>
${mudancas.entradas
  .map(
    (e) => `    <item>
      <title>${esc(e.titulo)}</title>
      <link>${SITE_URL}${e.url}</link>
      <guid>${GUID_BASE}/feed.xml#${e.data}</guid>
      <pubDate>${new Date(e.data + "T12:00:00Z").toUTCString()}</pubDate>
      <description>${esc(e.descricao)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
