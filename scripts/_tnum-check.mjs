// verifica se a Archivo instalada tem dígitos tabulares (tnum)
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "load" });
await page.waitForTimeout(1200);
const r = await page.evaluate(() => {
  const mk = (txt, ff, extra = "") => {
    const s = document.createElement("span");
    s.textContent = txt;
    s.style.cssText = `font-family:${ff};font-size:64px;position:absolute;visibility:hidden;${extra}`;
    document.body.appendChild(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return w;
  };
  const arch = 'var(--font-archivo),"Arial Black",sans-serif';
  const mono = 'var(--font-space),"Courier New",monospace';
  return {
    archivoProp_1: mk("11111.11", arch),
    archivoProp_8: mk("88888.88", arch),
    archivoTnum_1: mk("11111.11", arch, "font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1"),
    archivoTnum_8: mk("88888.88", arch, "font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1"),
    mono_1: mk("11111.11", mono),
    mono_8: mk("88888.88", mono),
    archivoVirgula: mk("3,55", arch),
    monoVirgula: mk("3,55", mono),
    families: document.fonts ? [...document.fonts].map((f) => f.family) : [],
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
