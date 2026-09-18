import { chromium } from "playwright";

const rotas = ["/salario", "/inflacao", "/irs", "/trabalho", "/precos", "/dados", "/metodologia", "/"];

const EV = `(() => {
  const srgb = (v) => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const lum = (rgb) => 0.2126*srgb(rgb[0]) + 0.7152*srgb(rgb[1]) + 0.0722*srgb(rgb[2]);
  const parse = (s) => {
    s = s.trim();
    if (s.startsWith("#")) { const h = s.slice(1); return [0,2,4].map(i => parseInt(h.substr(i,2), 16)); }
    const m = (s.match(/[\\d.]+/g) ?? []).slice(0,3).map(Number);
    return s.startsWith("color(") ? m.map(v=>v*255) : m;
  };
  const fundoDe = (el) => {
    // texto SVG: o papel é um <path> com pointer-events:none — invisível
    // a elementsFromPoint. isPointInFill testa a geometria real, mas em
    // coordenadas de utilizador do SVG — o getScreenCTM traduz o ponto.
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
          } catch {
            /* forma sem geometria */
          }
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
    if (ratio < min) falhas.push(el.tagName.toLowerCase()+"."+String(el.className?.baseVal ?? el.className ?? "").slice(0,30)+" «"+(el.textContent??"").trim().slice(0,36)+"» fg="+JSON.stringify(frente.map(Math.round))+" bg="+JSON.stringify(fundo.map(Math.round))+" → "+ratio.toFixed(2));
  }
  return falhas;
})()`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.emulateMedia({ reducedMotion: "reduce" });
for (const rota of rotas) {
  await p.goto(`http://localhost:3100${rota}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  for (const tema of ["dark", "light"]) {
    await p.evaluate((t) => (document.documentElement.dataset.theme = t), tema);
    await p.waitForTimeout(60);
    const f = await p.evaluate(EV);
    if (f.length) console.log(`\n${rota} [${tema}]\n  ` + [...new Set(f)].slice(0, 6).join("\n  "));
  }
}
await b.close();
