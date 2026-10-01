// prova visual do PR #29 (P2a): screenshots das cenas, inicial e passo
// do gráfico, a 1440×900 e 390×844. Serve o out/ na :3100 antes.
// Uso: node scripts/_shots-cenas.mjs  →  .screenshots/cenas/
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3100";
const OUT = ".screenshots/cenas";
mkdirSync(OUT, { recursive: true });

// passos até ao gráfico, por cena (a fábrica é painel, não tem gráfico)
const PASSOS = {
  financas: [/tirar senha/i, /mais dinheiro/i, /aprender a ler o gráfico/i],
  banco: [/chamar a senha/i, /mostrar a resposta/i, /aprender a ler o gráfico/i],
  mercearia: [/mostrar a resposta/i, /aprender a ler o gráfico/i],
};

const browser = await chromium.launch();
for (const { nome, w, h } of [
  { nome: "1440", w: 1440, h: 900 },
  { nome: "390", w: 390, h: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  for (const cena of ["fabrica", "financas", "banco", "mercearia"]) {
    await page.goto(`${BASE}/#${cena}`);
    const alvo = page.locator(".b-cena, .b-painel").first();
    await alvo.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(700); // entrada CSS assenta
    await page.screenshot({ path: `${OUT}/${cena}-1-inicial-${nome}.png` });

    const passos = PASSOS[cena] ?? [];
    for (const nome_btn of passos) {
      const b = page.getByRole("button", { name: nome_btn });
      await b.click({ timeout: 8000 });
      await page.waitForTimeout(500);
    }
    if (passos.length) {
      const g = page.locator(".b-cena-texto .grafico-irs");
      await g.waitFor({ state: "visible", timeout: 8000 });
      await g.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${cena}-2-grafico-${nome}.png` });
    }
  }
  await page.close();
}
await browser.close();
console.log(`screenshots em ${OUT}/`);
