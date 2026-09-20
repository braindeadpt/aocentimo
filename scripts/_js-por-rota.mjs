// mede JS transferido por rota no servidor estático da porta dada —
// «inicial» = recursos .js com entrada até ao evento load (bundle de
// arranque); «total» = até networkidle (inclui imports dinâmicos que
// a página pede logo, ex.: o chunk do GSAP quando há movimento legítimo).
// uso: node scripts/_js-por-rota.mjs [porta] [rotas separadas por vírgula]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const porta = process.argv[2] ?? "3100";
const rotas = process.argv[3]
  ? process.argv[3].split(",")
  : [...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => !p.includes("opengraph"));

const SOMA_JS = `performance.getEntriesByType("resource").filter(r => r.name.endsWith(".js")).reduce((a,r) => a + (r.transferSize||r.encodedBodySize||0), 0)`;

const b = await chromium.launch();
const p = await b.newPage();
for (const r of rotas) {
  await p.goto(`http://localhost:${porta}${r}`, { waitUntil: "load" });
  const ini = await p.evaluate(SOMA_JS);
  await p.waitForLoadState("networkidle");
  const tot = await p.evaluate(SOMA_JS);
  console.log(
    `${r.padEnd(40)} JS inicial ${Math.round(ini / 1024)}KB · total ${Math.round(tot / 1024)}KB`
  );
}
await b.close();
