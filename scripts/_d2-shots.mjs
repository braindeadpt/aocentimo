// screenshots D-04 — euro a 20/40/60/80/100 % do scroll pinned,
// rotas temáticas novas, nav desktop e nav mobile aberta
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync(".screenshots/d2", { recursive: true });
const b = await chromium.launch();

const dark = (p) =>
  p.evaluate(() => (document.documentElement.dataset.theme = "dark"));

const nova = async (w = 1440, h = 900) => b.newPage({ viewport: { width: w, height: h } });

// euro pinned a 20/40/60/80/100 % — 1440
for (const pct of [0.2, 0.4, 0.6, 0.8, 1.0]) {
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
  await p.waitForTimeout(1400); // scrub 0.6 assenta
  await p.screenshot({ path: `.screenshots/d2/euro-1440-${Math.round(pct * 100)}.png` });
  await p.close();
}

// rotas temáticas — 1440
for (const [rota, nome, hasText] of [
  ["/emprego", "emprego-1440", "Desemprego — Portugal e a UE27"],
  ["/habitacao", "habitacao-1440", "A casa contra o salário"],
  ["/economia", "economia-1440", "PIB — variação homóloga"],
  ["/dados", "dados-1440", null],
]) {
  const p = await nova();
  await p.goto(`http://localhost:3100${rota}`, { waitUntil: "networkidle" });
  await dark(p);
  if (hasText) {
    await p.locator("figure", { hasText }).scrollIntoViewIfNeeded();
    await p.waitForTimeout(900);
  } else {
    await p.waitForTimeout(600);
  }
  await p.screenshot({ path: `.screenshots/d2/${nome}.png` });
  await p.close();
}

// nav desktop — topo da home a 1440
{
  const p = await nova();
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(600);
  await p.screenshot({ path: ".screenshots/d2/nav-1440.png" });
  await p.close();
}

// nav mobile aberta — 375
{
  const p = await nova(375, 720);
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.locator("summary", { hasText: "Índice" }).click();
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".screenshots/d2/nav-375.png" });
  await p.close();
}

// /emprego a 375
{
  const p = await nova(375, 720);
  await p.goto("http://localhost:3100/emprego", { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(600);
  await p.screenshot({ path: ".screenshots/d2/emprego-375.png" });
  await p.close();
}

await b.close();
console.log("ok");
