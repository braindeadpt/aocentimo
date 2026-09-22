// varre as rotas principais no dev server à procura de pageerror/hidratação
import { chromium } from "@playwright/test";

const rotas = ["/", "/salario", "/irs", "/impostos", "/poupanca", "/credito", "/casa", "/inflacao", "/precos", "/trabalho", "/dados", "/aprender", "/metodologia", "/estilo", "/sobre"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
for (const r of rotas) {
  const logs = [];
  const onErr = (e) => logs.push(`[pageerror] ${e.message}`);
  const onCon = (m) => { if (m.type() === "error") logs.push(`[console.error] ${m.text().slice(0, 300)}`); };
  page.on("pageerror", onErr); page.on("console", onCon);
  try {
    await page.goto(`http://localhost:3000${r}`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1200);
  } catch (e) { logs.push(`[goto] ${e.message}`); }
  page.off("pageerror", onErr); page.off("console", onCon);
  console.log(`${r} → ${logs.length ? "" : "OK"}${logs.map((l) => "\n   " + l).join("")}`);
}
await browser.close();
