// mede LCP da home a 1440 e 375 — antes/depois do M-10
import { chromium } from "playwright";

const url = process.env.LCP_URL ?? "http://localhost:3100";
const browser = await chromium.launch();
for (const vp of [
  { width: 1440, height: 900 },
  { width: 375, height: 667 },
]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(`${url}/`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const lcp = await page.evaluate(
    () =>
      new Promise((res) => {
        let v = 0;
        new PerformanceObserver((l) => {
          const e = l.getEntries();
          if (e.length) v = e[e.length - 1].startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => res(v), 1800);
      })
  );
  const visivel = await page.evaluate(() => {
    const vh = window.innerHeight;
    const num = document.querySelector(".num-read");
    const fonte = document.querySelector(".fonte, cite, a[href*='eurostat'], .footnote");
    const quadro = document.getElementById("quadro-mes");
    return {
      vh,
      quadroTop: quadro?.getBoundingClientRect().top ?? -1,
      primeiroNum: num?.getBoundingClientRect().bottom ?? -1,
      primeiraFonte: fonte?.getBoundingClientRect().bottom ?? -1,
    };
  });
  console.log(
    `${vp.width}px → LCP ${Math.round(lcp)}ms | quadro topo ${Math.round(visivel.quadroTop)} | num até ${Math.round(visivel.primeiroNum)} | fonte até ${Math.round(visivel.primeiraFonte)} (vh ${visivel.vh})`
  );
  await page.close();
}
await browser.close();
