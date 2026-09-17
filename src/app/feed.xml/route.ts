import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * RSS de mudanças fiscais — gerado no build para seguir SITE_URL sozinho.
 *
 * Os <guid> mantêm os identificadores antigos (js.org) de propósito:
 * um guid é um identificador, não um link resolúvel. Mudá-lo faria os
 * leitores RSS tratarem as entradas antigas como novas. Só os <link>
 * seguem o domínio atual.
 */
const ITENS = [
  {
    titulo: "Taxas máximas de crédito ao consumo — 4.º trimestre de 2026",
    rota: "/dados",
    guid: "https://aocentimo.js.org/feed.xml#2026-09-16",
    pubDate: "Wed, 16 Sep 2026 12:00:00 GMT",
    descricao:
      "O Banco de Portugal publicou os tetos de TAEG para outubro–dezembro: crédito pessoal educação/saúde desce para 8,2 %, cartões e descobertos mantêm-se em 18,5 %.",
  },
  {
    titulo: "Taxa base dos CA Série F no teto — 2,500 % em setembro",
    rota: "/poupanca",
    guid: "https://aocentimo.js.org/feed.xml#2026-09-01",
    pubDate: "Tue, 01 Sep 2026 12:00:00 GMT",
    descricao:
      "A média da Euribor 3M ultrapassou o limite legal de 2,50 %; a taxa base fica fixada no cap pelo segundo mês consecutivo.",
  },
  {
    titulo: "Tabelas de retenção na fonte 2026",
    rota: "/salario",
    guid: "https://aocentimo.js.org/feed.xml#2026-01-06",
    pubDate: "Tue, 06 Jan 2026 12:00:00 GMT",
    descricao:
      "Despacho n.º 233-A/2026 publica as novas tabelas mensais de retenção de IRS — já aplicadas no simulador de salário.",
  },
];

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AO CÊNTIMO — mudanças fiscais</title>
    <link>${SITE_URL}</link>
    <description>Quando uma regra, taxa ou teto muda em Portugal, anotamos aqui — com fonte.</description>
    <language>pt-PT</language>
${ITENS.map(
  (i) => `    <item>
      <title>${i.titulo}</title>
      <link>${SITE_URL}${i.rota}</link>
      <guid>${i.guid}</guid>
      <pubDate>${i.pubDate}</pubDate>
      <description>${i.descricao}</description>
    </item>`
).join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
