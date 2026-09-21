// screenshots Fase D — euro a 35 %/75 % do scroll pinned, painel
// expandido (Euribor), /inflacao, declive de /casa, calendário de
// /precos a 1440 + 375 das rotas novas
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync(".screenshots/d", { recursive: true });
const b = await chromium.launch();

const dark = (p) =>
  p.evaluate(() => (document.documentElement.dataset.theme = "dark"));

const nova = async (w = 1440, h = 900) => {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  return p;
};

// euro pinned a 35 % e 75 % — 1440
for (const pct of [0.35, 0.75]) {
  const p = await nova();
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(1400); // ScrollTrigger + refresh
  const y = await p.evaluate((alvo) => {
    const sp = document.querySelector(".pin-spacer");
    if (!sp) return -1;
    const top = sp.getBoundingClientRect().top + window.scrollY;
    return top + (sp.offsetHeight - window.innerHeight) * alvo;
  }, pct);
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await p.waitForTimeout(1200); // scrub 0.6 assenta
  await p.screenshot({ path: `.screenshots/d/euro-1440-${Math.round(pct * 100)}.png` });
  await p.close();
}

// painel com a Euribor expandida — 1440
{
  const p = await nova();
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.getByRole("button", { name: /Euribor 12M/ }).click();
  await p.waitForTimeout(900); // Flip assenta
  await p.screenshot({ path: ".screenshots/d/expandido-1440.png" });
  await p.close();
}

// /inflacao — múltiplos ECOICOP
{
  const p = await nova();
  await p.goto("http://localhost:3100/inflacao", { waitUntil: "networkidle" });
  await dark(p);
  await p.locator("figure", { hasText: "12 divisões" }).scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  await p.screenshot({ path: ".screenshots/d/inflacao-1440.png" });
  await p.close();
}

// /casa — declive «a casa contra o salário»
{
  const p = await nova();
  await p.goto("http://localhost:3100/casa", { waitUntil: "networkidle" });
  await dark(p);
  await p.locator("figure", { hasText: "contra o salário" }).scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  await p.screenshot({ path: ".screenshots/d/casa-declive-1440.png" });
  await p.close();
}

// /precos — calendário do gasóleo
{
  const p = await nova();
  await p.goto("http://localhost:3100/precos", { waitUntil: "networkidle" });
  await dark(p);
  await p.locator("figure", { hasText: "Gasóleo, dia a dia" }).scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  await p.screenshot({ path: ".screenshots/d/precos-calendario-1440.png" });
  await p.close();
}

// 375 — /inflacao e /precos
for (const [rota, nome] of [["/inflacao", "inflacao-375"], ["/precos", "precos-375"]]) {
  const p = await nova(375, 720);
  await p.goto(`http://localhost:3100${rota}`, { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `.screenshots/d/${nome}.png`, fullPage: false });
  await p.close();
}

await b.close();
console.log("ok");
