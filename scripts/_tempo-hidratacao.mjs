// mede, com CPU 4× (throttle do CDP), o tempo que o browser leva a
// hidratar a home — onde agora vive a construção do mapa — e lista os
// avisos de consola. Uso: node scripts/_tempo-hidratacao.mjs [porta]
import { chromium } from "playwright";

const porta = process.argv[2] ?? "3199";
const b = await chromium.launch();
const p = await b.newPage();
const cdp = await p.context().newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

const avisos = [];
p.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") avisos.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
p.on("pageerror", (e) => avisos.push(`pageerror: ${String(e).slice(0, 160)}`));

await p.goto(`http://localhost:${porta}/`, { waitUntil: "commit" });
// timing do load até hidratação completa: marcamos quando os .pin existem
// (o SSR põe-nos lá sem JS) e quando o React termina (listener no load +
// pintura seguinte); mede-se o intervalo de construção do mapa na prática:
await p.waitForLoadState("load");
// O custo PURO da construção do mapa mede-se em Node (mesma engine V8,
// os builders são puros: sem DOM, sem relógio) — ver
// scripts/_tempo-mundo.mjs. Aqui mede-se o que o utilizador sente: o
// tempo do load até à pintura estável, com o CPU a 4×, mais os avisos.
const estavel = await p.evaluate(() => new Promise((res) => {
  requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now())));
}));
console.log(`load→pintura estável: ${estavel.toFixed(0)} ms (CPU 4×)`);
console.log(avisos.length ? `consola:\n  ${avisos.join("\n  ")}` : "consola: zero avisos, zero erros");
await b.close();
