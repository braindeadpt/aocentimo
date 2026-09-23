// probe — clica no «a pergunta seguinte» da demo Pagina em /estilo e
// regista os pseudo-elementos de view-transition durante a navegação.
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3100";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

await p.goto(`${BASE}/estilo`, { waitUntil: "networkidle" });

const lnk = p.locator(".pg-seguinte-lnk").first();
await lnk.scrollIntoViewIfNeeded();
await p.waitForTimeout(300);

// colector — amostra os pseudo-elementos animados a cada frame durante ~3 s
await p.evaluate(() => {
  (window).__vt = new Set();
  const fim = performance.now() + 3200;
  const loop = () => {
    for (const a of document.getAnimations({ subtree: true })) {
      const pe = a.effect?.pseudoElement;
      if (pe) (window).__vt.add(pe);
    }
    if (performance.now() < fim) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
// espião — regista os types que o React entrega ao startViewTransition
await p.evaluate(() => {
  window.__tipos = [];
  const orig = document.startViewTransition.bind(document);
  document.startViewTransition = (opts) => {
    window.__tipos.push(opts && opts.types ? [...opts.types] : "sem-types");
    return orig(opts);
  };
});
await lnk.click();
await p.waitForURL("**/salario**", { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(1800);

const vts = await p.evaluate(() => [...(window).__vt]);
console.log("URL:", p.url());
console.log("pseudos vistos:", JSON.stringify(vts, null, 2));
console.log("types VT:", JSON.stringify(await p.evaluate(() => window.__tipos)));

// negativo — volta à /estilo e navega pela nav para /salario
await p.goto(`${BASE}/estilo`, { waitUntil: "networkidle" });
// abre o grupo «O que ganhas» e clica /salario — next/link normal,
// sem o tipo pg-voo: não pode haver morph
await p.locator('nav button').first().hover();
await p.waitForTimeout(400);
await p.evaluate(() => {
  (window).__vt2 = new Set();
  const fim = performance.now() + 3200;
  const loop = () => {
    for (const a of document.getAnimations({ subtree: true })) {
      const pe = a.effect?.pseudoElement;
      if (pe) (window).__vt2.add(pe);
    }
    if (performance.now() < fim) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await p.locator('nav a[href="/salario"]').first().click();
await p.waitForURL("**/salario**", { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(2000);
console.log("URL nav:", p.url());
console.log("pseudos nav:", JSON.stringify(await p.evaluate(() => [...(window).__vt2]), null, 2));

await b.close();
