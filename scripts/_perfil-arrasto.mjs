// _perfil-arrasto.mjs — DIAGNÓSTICO (só lê e imprime): de que é feito o
// custo de arrastar o mapa. Corre o mesmo gesto — 2 s a arrastar
// `.b-janela` a 4× menos CPU, iPhone 12 Pro — com partes do bairro
// desligadas uma a uma, e reporta os quadros de cada variante. Serve
// para atribuir o jank a uma causa antes de mexer no código; não é gate.
//
// uso: node scripts/_perfil-arrasto.mjs [porta]
import { chromium, devices } from "@playwright/test";

const PORTA = process.argv[2] ?? process.env.PORTA ?? "3100";
const BASE = `http://localhost:${PORTA}/`;

const VARIANTES = [
  { nome: "a arrastar, como está (1.ª)", css: "" },
  { nome: "a arrastar, como está (2.ª)", css: "" },
  { nome: "  + shape-rendering no mundo", css: ".b-mundo { shape-rendering: optimizeSpeed !important; }" },
  { nome: "  + contain: paint na janela", css: ".b-janela { contain: paint !important; }" },
  { nome: "  + contain: layout paint", css: ".b-janela { contain: layout paint !important; }" },
  { nome: "  + shape + contain: paint", css: ".b-mundo { shape-rendering: optimizeSpeed !important; } .b-janela { contain: layout paint !important; }" },
  { nome: "  + shape + text-rendering", css: ".b-mundo { shape-rendering: optimizeSpeed !important; text-rendering: optimizeSpeed !important; } .b-janela { contain: layout paint !important; }" },
];

const MEDIDOR = (ms) => `(() => {
  window.__q = [];
  let ultimo = performance.now();
  const fim = ultimo + ${ms};
  return new Promise((res) => {
    const passo = (t) => { window.__q.push(t - ultimo); ultimo = t; if (t < fim) requestAnimationFrame(passo); else res(window.__q); };
    requestAnimationFrame(passo);
  });
})()`;

const b = await chromium.launch();
console.log("variante                          fps   >33ms  >50ms  pior  p95");
for (const v of VARIANTES) {
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 12 Pro"].userAgent,
    reducedMotion: v.reduced ? "reduce" : "no-preference",
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.goto(BASE, { waitUntil: "load" });
  if (v.css) await p.addStyleTag({ content: v.css });
  await p.waitForTimeout(2500);

  const janela = await p.$(".b-janela");
  const caixa = await janela.boundingBox();
  const registador = p.evaluate(MEDIDOR(2000));
  if (!v.parado) {
    await p.mouse.move(caixa.x + caixa.width * 0.7, caixa.y + caixa.height * 0.55);
    await p.mouse.down();
    for (let k = 0; k < 30; k++) {
      await p.mouse.move(
        caixa.x + caixa.width * (0.7 + (k % 2 ? 0.08 : -0.08)),
        caixa.y + caixa.height * (0.55 + (k % 3 ? 0.02 : -0.02))
      );
    }
    await p.mouse.up();
  }
  const q = await registador;
  const s = [...q].sort((a, b2) => a - b2);
  const media = q.reduce((a, x) => a + x, 0) / q.length;
  console.log(
    `${v.nome.padEnd(33)} ${String(Math.round(1000 / media)).padStart(4)}  ` +
      `${String(q.filter((x) => x > 33).length).padStart(5)}  ${String(q.filter((x) => x > 50).length).padStart(5)}  ` +
      `${String(Math.round(Math.max(...q))).padStart(4)}  ${String(Math.round(s[Math.floor(q.length * 0.95)])).padStart(4)}` +
      `   (${q.length} quadros)`
  );
  await ctx.close();
}
await b.close();
