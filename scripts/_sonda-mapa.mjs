// Sonda de diagnóstico do mapa: camadas compostas, memória de GPU estimada,
// erros de consola, enquadramento inicial e custo do toggle de tema.
// Uso: node scripts/_sonda-mapa.mjs [movel|desktop] [dia|noite]
import { chromium } from "@playwright/test";

const modo = process.argv[2] ?? "movel";
const hora = process.argv[3] ?? "";
const PORTA = process.env.PORTA ?? "3100";
const exe = process.env.CHROME ?? "/usr/bin/chromium";

const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--enable-gpu-rasterization"] });
const ctx = await browser.newContext(
  modo === "movel"
    ? { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
);
const page = await ctx.newPage();
const erros = [];
page.on("pageerror", (e) => erros.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") erros.push(m.type() + ": " + m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send("LayerTree.enable");
let camadas = [];
cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) camadas = e.layers; });

await page.goto(`http://localhost:${PORTA}/`, { waitUntil: "load" });
await page.waitForSelector(".b-mundo[data-vivo='1']", { timeout: 20000, state: 'attached' });
if (hora) {
  const idx = { dia: 0, tarde: 1, noite: 2 }[hora];
  await page.locator(".b-controlos .b-ctl").nth(idx).click();
}
await page.locator(".b-janela").scrollIntoViewIfNeeded();
await page.waitForTimeout(3500);

const resumo = (ls) => {
  const dpr = modo === "movel" ? 3 : 2;
  const grandes = ls
    .filter((l) => l.drawsContent)
    .map((l) => ({ id: l.layerId, w: Math.round(l.width), h: Math.round(l.height), mb: +((l.width * l.height * dpr * dpr * 4) / 1048576).toFixed(1) }))
    .sort((a, b) => b.mb - a.mb);
  return { total: ls.length, desenham: grandes.length, mbEstimado: +grandes.reduce((s, l) => s + l.mb, 0).toFixed(1), top: grandes.slice(0, 8) };
};
const r1 = resumo(camadas);
const razoes = [];
for (const l of camadas.filter((l) => l.drawsContent && l.width * l.height > 1e6).slice(0, 8)) {
  try {
    const { compositingReasons } = await cdp.send("LayerTree.compositingReasons", { layerId: l.layerId });
    razoes.push({ w: Math.round(l.width), h: Math.round(l.height), compositingReasons });
  } catch {}
}
const metricas = Object.fromEntries((await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] }))).metrics?.map((m) => [m.name, m.value]) ?? []);
const heap = await page.evaluate(() => (performance).memory?.usedJSHeapSize ?? null);

// enquadramento: centro das caixas dos edifícios vs centro da janela
const enquadra = await page.evaluate(() => {
  const j = document.querySelector(".b-janela").getBoundingClientRect();
  const eds = [...document.querySelectorAll(".b-mundo .ed")].map((g) => g.getBoundingClientRect());
  const pins = [...document.querySelectorAll(".b-mundo .pin")].map((g) => g.getBoundingClientRect());
  const caixa = (rs) => {
    const l = Math.min(...rs.map((r) => r.left)), r = Math.max(...rs.map((r) => r.right));
    const t = Math.min(...rs.map((r) => r.top)), b = Math.max(...rs.map((r) => r.bottom));
    return { l: l - j.left, r: j.right - r, t: t - j.top, b: j.bottom - b };
  };
  return { janela: { w: j.width, h: j.height }, edificios: caixa(eds), marcadores: caixa(pins), transform: document.querySelector(".b-mundo").style.transform };
});

let tema = null;
if (modo === "desktop") {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const t0 = Date.now();
  await cdp.send("Performance.enable");
  const antes = await page.evaluate(() => performance.now());
  await page.locator("[data-theme-toggle]").first().click();
  const lt = await page.evaluate(async () => {
    const tarefas = [];
    const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => tarefas.push(Math.round(e.duration))));
    po.observe({ type: "longtask", buffered: true });
    await new Promise((r) => setTimeout(r, 1500));
    po.disconnect();
    return { tarefas, tema: document.documentElement.dataset.theme };
  });
  tema = { ms: Date.now() - t0, ...lt, antes };
}

console.log(JSON.stringify({ modo, hora: hora || "omissão", camadas: r1, razoes, heapMB: heap && +(heap / 1048576).toFixed(1), nos: metricas.Nodes, layoutCount: metricas.LayoutCount, enquadra, tema, erros: erros.slice(0, 15) }, null, 1));
await browser.close();
