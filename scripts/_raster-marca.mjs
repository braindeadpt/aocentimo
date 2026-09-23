// Rasteriza os SVGs da marca (referencias/V4/logo) nos tamanhos de ícone.
// 1B-00 — gera src/app/icon1.png (16), icon2.png (32), apple-icon.png (180),
// public/favicon.ico (16+32), public/icon-512.png, public/apple-icon.png (180).
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REF = "referencias/V4/logo";

async function raster(browser, svgFile, size) {
  const svg = readFileSync(join(REF, svgFile), "utf8");
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<!doctype html><body style="margin:0">${svg}</body>`,
    { waitUntil: "load" }
  );
  await page.evaluate((px) => {
    const el = document.querySelector("svg");
    el.setAttribute("width", String(px));
    el.setAttribute("height", String(px));
    el.style.width = px + "px";
    el.style.height = px + "px";
  }, size);
  const buf = await page.locator("svg").screenshot({ omitBackground: true });
  await page.close();
  return buf;
}

/** ICO multi-resolução: cabeçalho ICONDIR + entradas com PNG embutido. */
function buildIco(frames) {
  // frames: [{size, png}]
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const entries = Buffer.alloc(16 * frames.length);
  let offset = 6 + 16 * frames.length;
  const parts = [];
  frames.forEach((f, i) => {
    entries.writeUInt8(f.size >= 256 ? 0 : f.size, i * 16);       // largura
    entries.writeUInt8(f.size >= 256 ? 0 : f.size, i * 16 + 1);   // altura
    entries.writeUInt8(0, i * 16 + 2);  // paleta
    entries.writeUInt8(0, i * 16 + 3);  // reservado
    entries.writeUInt16LE(1, i * 16 + 4);   // planos
    entries.writeUInt16LE(32, i * 16 + 6);  // bpp
    entries.writeUInt32LE(f.png.length, i * 16 + 8);
    entries.writeUInt32LE(offset, i * 16 + 12);
    offset += f.png.length;
    parts.push(f.png);
  });
  return Buffer.concat([header, entries, ...parts]);
}

const b = await chromium.launch();
const p16 = await raster(b, "favicon-16.svg", 16);
const p32 = await raster(b, "favicon-32.svg", 32);
const p180 = await raster(b, "simbolo-azulejo.svg", 180);
const p512 = await raster(b, "simbolo-azulejo.svg", 512);
await b.close();

writeFileSync("src/app/icon1.png", p16);
writeFileSync("src/app/icon2.png", p32);
writeFileSync("src/app/apple-icon.png", p180);
writeFileSync("public/apple-icon.png", p180);
writeFileSync("public/icon-512.png", p512);
writeFileSync("public/favicon.ico", buildIco([
  { size: 16, png: p16 },
  { size: 32, png: p32 },
]));
console.log("gerados: icon1.png(16) icon2.png(32) apple-icon.png(180) favicon.ico(16+32) icon-512.png apple-icon.png(public)");
