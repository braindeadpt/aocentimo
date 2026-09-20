// mede JS transferido por rota no servidor estático da porta dada
// uso: node scripts/_js-por-rota.mjs [porta] [rotas separadas por vírgula]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const porta = process.argv[2] ?? "3100";
const rotas = process.argv[3]
  ? process.argv[3].split(",")
  : [...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => !p.includes("opengraph"));

const b = await chromium.launch();
const p = await b.newPage();
for (const r of rotas) {
  await p.goto(`http://localhost:${porta}${r}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  const js = await p.evaluate(
    `performance.getEntriesByType("resource").filter(r => r.name.endsWith(".js")).reduce((a,r) => a + (r.transferSize||r.encodedBodySize||0), 0)`
  );
  console.log(`${r.padEnd(40)} JS ${Math.round(js / 1024)}KB`);
}
await b.close();
