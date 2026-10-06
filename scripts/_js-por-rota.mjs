// mede JS transferido por rota no servidor estático da porta dada —
// «inicial» = recursos .js com entrada até ao evento load (bundle de
// arranque); «total» = até networkidle (inclui imports dinâmicos que
// a página pede logo, ex.: o chunk do GSAP quando há movimento legítimo).
//
// O PESO É MEDIDO AO NÍVEL DO CDN: o servidor estático local não comprime
// nada, pelo que o `transferSize` do browser seria o tamanho *raw* — e o tecto
// do pack é em gzip (o valor vive em `_orcamentos.mjs`, não aqui). Em vez de
// somar bytes do browser,
// recolhem-se os caminhos dos ficheiros pedidos e mede-se cada um com
// `_medida-cdn.mjs`, a mesma função que o gate do HTML usa. Assim o número
// desta linha é comparável, ao byte, com o orçamento.
//
// O ORÇAMENTO não vive aqui: vem de `_orcamentos.mjs` (um sítio só, com a
// fonte do pack ao lado). O veredicto é por rota — «inicial» contra
// `jsInicialRotaGzipBytes` — e o script sai com código ≠ 0 se alguma rota o
// exceder, para poder ser gate no CI.
//
// uso: node scripts/_js-por-rota.mjs [porta] [rotas separadas por vírgula]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { kb, pesoDeUrls } from "./_medida-cdn.mjs";
import { ORCAMENTOS } from "./_orcamentos.mjs";

const LIMITE = ORCAMENTOS.jsInicialRotaGzipBytes;

const porta = process.argv[2] ?? process.env.PORTA ?? "3100";
const rotas = process.argv[3]
  ? process.argv[3].split(",")
  : [...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => !p.includes("opengraph"));

const URLS_JS = `performance.getEntriesByType("resource").filter(r => r.name.endsWith(".js")).map(r => new URL(r.name).pathname)`;

const b = await chromium.launch();
const p = await b.newPage();
const excedentes = [];
for (const r of rotas) {
  await p.goto(`http://localhost:${porta}${r}`, { waitUntil: "load" });
  const urlsIni = await p.evaluate(URLS_JS);
  await p.waitForLoadState("networkidle");
  const urlsTot = await p.evaluate(URLS_JS);
  const ini = pesoDeUrls(urlsIni);
  const tot = pesoDeUrls(urlsTot);
  const fora = ini.fora + tot.fora > 0 ? ` · ${ini.fora + tot.fora} ficheiro(s) fora do out/` : "";
  const acima = ini.bytes - LIMITE;
  const veredicto = acima > 0 ? ` · ✗ ${kb(acima)}KB acima de ${(LIMITE / 1024).toFixed(0)}KB` : "";
  if (acima > 0) excedentes.push({ rota: r, bytes: ini.bytes });
  console.log(
    `${r.padEnd(40)} JS inicial ${kb(ini.bytes).padStart(6)}KB gzip (${ini.ficheiros} ficheiros)` +
      ` · total ${kb(tot.bytes).padStart(6)}KB gzip (${tot.ficheiros})${fora}${veredicto}`
  );
}
await b.close();

console.log(
  `\norçamento de JS inicial por rota: ${(LIMITE / 1024).toFixed(0)} KB gzip (scripts/_orcamentos.mjs)`
);
if (excedentes.length) {
  const pior = excedentes.reduce((a, b) => (b.bytes > a.bytes ? b : a));
  console.error(
    `✗ ${excedentes.length}/${rotas.length} rota(s) acima do orçamento · pior: ${pior.rota} com ${kb(pior.bytes)}KB gzip`
  );
  process.exitCode = 1;
} else {
  console.log(`ok: ${rotas.length} rota(s) dentro do orçamento`);
}
