// Mede a capitular do logótipo (cabeçalho + rodapé) — antes/depois do 1B-00.
// Uso: node scripts/_mede-logo.mjs [etiqueta]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const TAG = process.argv[2] ?? "mede";
mkdirSync(".ref", { recursive: true });
const b = await chromium.launch();

for (const w of [1440, 375]) {
  for (const tema of ["dark", "light"]) {
    const page = await b.newPage({ viewport: { width: w, height: 900 } });
    await page.addInitScript((t) => localStorage.setItem("aocentimo-theme", t), tema);
    await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const med = await page.evaluate(() => {
      const out = {};
      const logo = document.querySelector("header").querySelector(".logo, .logo-word");
      if (logo) {
        const r = logo.getBoundingClientRect();
        out.logoRect = { w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
      }
      // capitular por canvas — ascent real de «A» na fonte do wordmark
      const el = document.querySelector("header").querySelector(".logo-word") ?? logo;
      const cs = el ? getComputedStyle(el) : null;
      const cv = document.createElement("canvas");
      const ctx = cv.getContext("2d");
      if (cs) {
        try { ctx.fontVariationSettings = cs.fontVariationSettings || "normal"; } catch {}
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily.split(",")[0]}`;
        const mA = ctx.measureText("A");
        out.capCanvas = +(mA.actualBoundingBoxAscent + mA.actualBoundingBoxDescent).toFixed(2);
        out.fontPx = parseFloat(cs.fontSize);
      }
      // capitular do SVG novo: altura do svg × razão (687.54/1075.15)
      if (out.logoRect) out.capSvg = +(out.logoRect.h * (687.54 / 1075.15)).toFixed(2);
      const fLogo = document.querySelector("footer").querySelector(".logo, .logo-word");
      if (fLogo) {
        const r = fLogo.getBoundingClientRect();
        out.footerRect = { w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
        out.footerCapSvg = +(r.height * (687.54 / 1075.15)).toFixed(2);
        const fcs = getComputedStyle(fLogo);
        try { ctx.fontVariationSettings = fcs.fontVariationSettings || "normal"; } catch {}
        ctx.font = `${fcs.fontWeight} ${fcs.fontSize} ${fcs.fontFamily.split(",")[0]}`;
        const mA2 = ctx.measureText("A");
        out.footerCapCanvas = +(mA2.actualBoundingBoxAscent + mA2.actualBoundingBoxDescent).toFixed(2);
      }
      return out;
    });
    const head = page.locator("header").first();
    await head.screenshot({ path: `.ref/logo-${TAG}-${w}-${tema}.png` });
    console.log(`${w} ${tema}:`, JSON.stringify(med));
    await page.close();
  }
}
await b.close();
