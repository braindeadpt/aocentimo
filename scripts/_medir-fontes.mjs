// Mede que ficheiros de fonte o browser pede de facto, e com que peso
// transferido. Usa o Playwright que o repo já tem.
//   node /tmp/medir-fontes.mjs <rotas> <raiz-do-out>
import { chromium } from "playwright";
import { servirEstatico, urlBase } from "./_estatico.mjs";

const raiz = process.argv[3] || "out";
const rotas = process.argv[2] ? process.argv[2].split(",") : ["/", "/estilo"];

const srv = await servirEstatico(raiz);
const base = urlBase(srv);

const browser = await chromium.launch();
const relatorio = [];

for (const rota of rotas) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const fontes = [];
  page.on("response", async (r) => {
    const u = r.url();
    if (!u.includes(".woff2")) return;
    let tam = 0;
    try {
      tam = (await r.body()).length;
    } catch {
      const len = (await r.allHeaders())["content-length"];
      if (len) tam = Number(len);
    }
    fontes.push({ ficheiro: u.split("/").pop(), bytes: tam });
  });
  await page.goto(base + rota, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const todas = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((e) => ({
      nome: e.name.split("/").pop(),
      bytes: e.encodedBodySize || e.transferSize || 0,
    }))
  );
  const totalTodos = todas.reduce((a, b) => a + b.bytes, 0);
  const totalFontes = fontes.reduce((a, b) => a + b.bytes, 0);

  relatorio.push({
    rota,
    fontes,
    kbs: {
      fontes: (totalFontes / 1024).toFixed(1),
      tudo: (totalTodos / 1024).toFixed(1),
      pct: ((totalFontes / totalTodos) * 100).toFixed(1) + " %",
    },
  });
  await ctx.close();
}

await browser.close();
srv.close();

for (const r of relatorio) {
  console.log(`\n=== ${r.rota} ===`);
  const visto = new Set();
  for (const f of r.fontes) {
    if (visto.has(f.ficheiro)) continue;
    visto.add(f.ficheiro);
    console.log(`  ${(f.bytes / 1024).toFixed(1).padStart(7)} KB  ${f.ficheiro}`);
  }
  console.log(
    `  ${"".padStart(7)} ------\n  ${r.kbs.fontes} KB de fontes · ${r.kbs.tudo} KB no total · ${r.kbs.pct} da rota`
  );
}