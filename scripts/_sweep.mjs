// M-20 varrimento: AA nos dois temas em todas as rotas, LCP/CLS/JS por
// rota, e cada gráfico com exactamente um equivalente textual.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const rotas = [...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .filter((p) => !p.includes("opengraph") && p !== "/");

const AA_EVAL = `(() => {
  const srgb = (v) => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const lum = (rgb) => 0.2126*srgb(rgb[0]) + 0.7152*srgb(rgb[1]) + 0.0722*srgb(rgb[2]);
  const parse = (s) => {
    s = s.trim();
    if (s.startsWith("#")) { const h = s.slice(1); return [0,2,4].map(i => parseInt(h.substr(i,2), 16)); }
    const m = (s.match(/[\\d.]+/g) ?? []).slice(0,3).map(Number);
    // color(srgb …) devolve componentes 0–1 — escala para 0–255
    return s.startsWith("color(") ? m.map(v => v * 255) : m;
  };
  const fundoDe = (el) => {
    // texto SVG: o papel é um <path> com pointer-events:none — invisível
    // a elementsFromPoint. isPointInFill testa a geometria real, em
    // coordenadas de utilizador do SVG (getScreenCTM traduz o ponto).
    if (el.namespaceURI?.includes("svg")) {
      const r = el.getBoundingClientRect();
      const svg = el.ownerSVGElement;
      const ctm = svg?.getScreenCTM();
      if (svg && ctm) {
        const pt = new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(ctm.inverse());
        for (const s of svg.querySelectorAll("path,rect,circle,polygon")) {
          if (s.closest("defs,mask,clipPath")) continue;
          const f = getComputedStyle(s).fill;
          if (!f || f === "none" || f.startsWith("url(")) continue;
          const am = f.match(/[\\d.]+/g);
          if (am && am.length >= 4 && Number(am[3]) < 0.5) continue;
          try {
            if (s.isPointInFill(pt)) return parse(f);
          } catch {}
        }
      }
    }
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n).backgroundColor;
      const m = cs.match(/[\\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) === 1)) return parse(cs);
    }
    return parse(getComputedStyle(document.body).backgroundColor);
  };
  const falhas = [];
  for (const el of document.body.querySelectorAll("*")) {
    const temTexto = [...el.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? "").trim());
    if (!temTexto) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const frente = parse(el.namespaceURI?.includes("svg") ? cs.fill : cs.color);
    const fundo = fundoDe(el);
    const L1 = lum(frente), L2 = lum(fundo);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
    const min = grande ? 3 : 4.5;
    if (ratio < min) falhas.push(el.tagName.toLowerCase()+" \\""+(el.textContent??"").trim().slice(0,44)+"\\" fg="+JSON.stringify(frente)+" bg="+JSON.stringify(fundo)+" → "+ratio.toFixed(2)+":1");
  }
  return falhas;
})()`;

const PERF_EVAL = `(async () => {
  const nav = performance.getEntriesByType("navigation")[0];
  let lcp = 0, cls = 0;
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.entryType === "largest-contentful-paint") lcp = e.startTime;
      if (e.entryType === "layout-shift" && !e.hadRecentInput) cls += e.value;
    }
  });
  po.observe({ type: "largest-contentful-paint", buffered: true });
  po.observe({ type: "layout-shift", buffered: true });
  await new Promise((r) => setTimeout(r, 400));
  po.disconnect();
  const js = performance.getEntriesByType("resource").filter(r => r.name.endsWith(".js")).reduce((a,r) => a + (r.transferSize||r.encodedBodySize||0), 0);
  return { lcp: Math.round(lcp), cls: +cls.toFixed(3), jsKB: Math.round(js/1024), domKB: Math.round((nav?.encodedBodySize||0)/1024) };
})()`;

const b = await chromium.launch();
const res = [];
const aaFalhas = {};

for (const rota of rotas) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.goto(`http://localhost:${process.env.PORTA ?? 3100}${rota}`, {
    waitUntil: "networkidle",
  });
  await p.waitForTimeout(400);
  const perf = await p.evaluate(PERF_EVAL);
  // gráficos: svg aria-hidden + exactamente um equivalente alcançável
  const graf = await p.evaluate(`(() => {
    const wraps = [...document.querySelectorAll("figure, .lc-wrap, [class*='chart']")].filter(w => w.querySelector("svg"));
    const problemas = [];
    document.querySelectorAll("svg").forEach(s => {
      if (s.getAttribute("aria-hidden") !== "true" && !s.closest("[aria-hidden='true']") && s.getAttribute("role") !== "img")
        problemas.push("svg exposto: " + (s.className.baseVal || s.outerHTML.slice(0,60)));
    });
    return problemas;
  })()`);
  res.push({ rota, ...perf, graf });
  // AA nos dois temas
  for (const tema of ["dark", "light"]) {
    await p.evaluate((t) => (document.documentElement.dataset.theme = t), tema);
    await p.waitForTimeout(60);
    const falhas = await p.evaluate(AA_EVAL);
    if (falhas.length) aaFalhas[`${rota} [${tema}]`] = falhas.slice(0, 4);
  }
  await p.close();
  console.log(rota.padEnd(38), `LCP ${perf.lcp}ms CLS ${perf.cls} JS ${perf.jsKB}KB`, graf.length ? "SVG:" + graf[0] : "");
}
console.log("\n=== FALHAS AA ===");
for (const [k, v] of Object.entries(aaFalhas)) console.log(k, "\n  " + v.join("\n  "));
if (!Object.keys(aaFalhas).length) console.log("(nenhuma)");
await b.close();
// CI gate: chumba em falhas AA (e SVG exposto sem equivalente)
const svgExposto = res.flatMap((r) => r.graf.map((g) => `${r.rota}: ${g}`));
if (svgExposto.length) console.log("SVG sem equivalente:\n" + svgExposto.join("\n"));
if (Object.keys(aaFalhas).length || svgExposto.length) process.exitCode = 1;
