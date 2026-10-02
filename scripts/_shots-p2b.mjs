// prova visual do PR P2b: screenshots das cenas Correios, Bomba e
// Segurança Social — passo inicial e passo final, a 1440×900 e 390×844.
// Serve o out/ na :3106 antes (PORTA=3106 npm run serve:out).
// Uso: node scripts/_shots-p2b.mjs  →  C:\tmp\p2b\
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const PORTA = process.env.PORTA ?? "3106";
const BASE = `http://localhost:${PORTA}`;
const OUT = "C:/tmp/p2b";
mkdirSync(OUT, { recursive: true });

// os passos até ao fim, por cena
const PASSOS = {
  correios: [/chamar a senha/i, /mostrar a resposta/i, /certificados/i, /aprender a ler o gráfico/i],
  bomba: [/atestar e ver a resposta/i, /aprender a ler o gráfico/i],
  segsocial: [/chamar a senha/i, /mostrar a resposta/i, /recibos verdes/i],
};

const browser = await chromium.launch();
for (const { nome, w, h } of [
  { nome: "1440", w: 1440, h: 900 },
  { nome: "375", w: 390, h: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  for (const cena of ["correios", "bomba", "segsocial"]) {
    await page.goto(`${BASE}/#${cena}`);
    await page.locator(".b-cena").waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${cena}-1-inicial-${nome}.png` });
    for (const nome_btn of PASSOS[cena]) {
      await page.getByRole("button", { name: nome_btn }).first().click({ timeout: 8000 });
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(2600); // as animações do último passo assentam
    await page.screenshot({ path: `${OUT}/${cena}-2-final-${nome}.png` });
  }
  await page.close();
}
await browser.close();
console.log(`screenshots em ${OUT}/`);
