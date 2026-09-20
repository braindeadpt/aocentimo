// screenshots Fase B — /estilo (secções novas) e /dados (Linha), tema escuro
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync(".screenshots/b", { recursive: true });
const b = await chromium.launch();

for (const w of [1440, 375]) {
  const p = await b.newPage({
    viewport: { width: w, height: w === 375 ? 667 : 900 },
  });
  await p.goto("http://localhost:3100/estilo", { waitUntil: "networkidle" });
  await p.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  for (const [texto, nome] of [
    ["Motor — GSAP + d3", "estilo-motor"],
    ["Instrumentos — o motor aplicado", "estilo-instrumentos"],
    ["Lettering — a manchete que abre", "estilo-lettering"],
    ["Glifos — sinais desenhados", "estilo-glifos"],
  ]) {
    const sec = p.locator("section", { hasText: texto }).first();
    await sec.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1600); // deixa os tweens do armado assentar
    await sec.screenshot({ path: `.screenshots/b/${nome}-${w}.png` });
  }
  await p.close();
}

// rota com Linha (substitui LineChart) — /dados, gráfico Euribor
for (const w of [1440, 375]) {
  const p = await b.newPage({
    viewport: { width: w, height: w === 375 ? 667 : 900 },
  });
  await p.goto("http://localhost:3100/dados", { waitUntil: "networkidle" });
  await p.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  const fig = p.locator("figure", { hasText: "Euribor" }).first();
  await fig.scrollIntoViewIfNeeded();
  await p.waitForTimeout(1600);
  await fig.screenshot({ path: `.screenshots/b/dados-linha-${w}.png` });
  await p.screenshot({ path: `.screenshots/b/dados-${w}.png`, fullPage: false });
  await p.close();
}
await b.close();
console.log("ok");
