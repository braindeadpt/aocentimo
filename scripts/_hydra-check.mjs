// captura erros de hidratação numa rota — uso: node scripts/_hydra-check.mjs [path] [porta]
import { chromium } from "@playwright/test";

const path = process.argv[2] ?? "/irs";
const port = process.argv[3] ?? "3000";
const url = `http://localhost:${port}${path}`;

const browser = await chromium.launch();
for (const [w, h] of [
  [1440, 900],
  [375, 800],
]) {
  for (const tema of ["dark", "light"]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const logs = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning")
        logs.push(`[console.${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
    if (tema === "light")
      await page.addInitScript(() => {
        try {
          localStorage.setItem("aocentimo-theme", "light");
        } catch {}
      });
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    console.log(`=== ${path} @ ${w}x${h} ${tema} ===`);
    for (const l of logs) console.log(l.slice(0, 3000));
    if (!logs.length) console.log("(sem erros)");
    await page.close();
  }
}
await browser.close();
