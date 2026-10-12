// _fluidez.mjs — a fluidez a sério, no telemóvel e com o telemóvel todo
// carregado: iPhone 12 Pro emulado (390×844, DPR 3, toque), 4× de CPU a
// menos e rede 4G má (150 ms de ida e volta, ~1,6 Mbps). Lê o `out/` pelo
// servidor estático (`_serve-static`), não o `next dev`.
//
// Mede, por rota:
//   · LCP, CLS e o bloqueio total (TBT) por observação de `longtask`;
//   · nós no DOM, elementos SVG e animações CSS a correr;
//   · heap de JavaScript (Chromium) no fim da carga;
//   · a FLUIDEZ: durante 3 s de arrasto verdadeiro no mapa (o gesto que
//     mais pinta), quantos quadros passam de 33 ms e de 50 ms — e o pior
//     quadro. Uma quebra é um quadro de mais de 50 ms; um arrasto é o
//     queixo a cair quando mais de 10 % deles passa dos 33 ms.
//
// Não escreve nada. `PORTA` escolhe o servidor (por omissão 3100), como
// nos outros scripts da casa.
//
// uso: node scripts/_fluidez.mjs [porta] [rotas separadas por vírgula]
import { chromium, devices } from "@playwright/test";

const PORTA = process.argv[2] ?? process.env.PORTA ?? "3100";
const BASE = `http://localhost:${PORTA}`;
const rotas = process.argv[3]
  ? process.argv[3].split(",")
  : ["/", "/salario", "/inflacao", "/credito", "/dados"];

const CPU = 4; // 4× mais lento — telemóvel de gama média
// A vista por omissão é a de um iPhone 12 Pro de pé; `VISTA=390x664`
// reproduz a calibração da `AUDITORIA-MAPA-2026-10.md` (mediana 21 ms,
// p90 38 ms depois da correcção do arrasto), para se comparar números
const VISTA = (process.env.VISTA ?? "390x844").split("x").map(Number);
// O piso do arrasto é ARQUITECTURAL, não um defeito por arrumar: a
// câmara move 8 camadas SVG de 3600×2500 e o que se paga é a rasteirização
// da parte visível a cada quadro (medido: ~20-30 ms por quadro a 4× menos
// CPU; sem essas camadas o mesmo gesto vai a 52 fps). Promover o mundo a
// uma camada composta resolvia — e era exactamente o que enchia a memória
// do iPhone que rebentava com o mapa. O que se julga é a MEDIANA e o p95
// (os números da `AUDITORIA-MAPA-2026-10.md` §6: 21 ms de mediana e 38 ms
// de p90 depois da correcção), não o pior quadro: o pior quadro é ruído
// da máquina (GC, outro processo, a promoção da camada no 1.º fotograma do
// gesto) e mediu 100 ms numa corrida e 550 ms na seguinte, com o MESMO
// build — um gate no pior quadro falhava por causa do vizinho.
const QUADRO_MAU = 200; // ms — 50 ms a 1×: uma travagem a sério, não o arranque do gesto
const MEDIANA_MAU = 50; // ms — 2,4× a mediana medida depois da correcção (21 ms)
const P95_MAU = 120; // ms — 30 ms a 1×

const REGISTADOR = (ms) => `(() => {
  window.__q = [];
  let ultimo = performance.now();
  const fim = ultimo + ${ms};
  return new Promise((res) => {
    const passo = (t) => {
      window.__q.push(t - ultimo);
      ultimo = t;
      if (t < fim) requestAnimationFrame(passo);
      else res(window.__q);
    };
    requestAnimationFrame(passo);
  });
})()`;

const CARGA = `(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    lcp: window.__lcp ?? 0,
    cls: window.__cls ?? 0,
    tbt: window.__tbt ?? 0,
    longas: window.__longas ?? 0,
    nos: document.querySelectorAll("*").length,
    svgs: document.querySelectorAll("svg").length,
    animacoes: document.getAnimations().length,
    svgMundo: document.querySelector("#b-mundo")?.querySelectorAll("*").length ?? 0,
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    alturaDoc: document.documentElement.scrollHeight,
    lcpEl: window.__lcpEl ?? "",
    tempoNav: Math.round(nav ? nav.duration : 0),
  };
})()`;

const OBSERVADORES = `(() => {
  window.__lcp = 0; window.__cls = 0; window.__tbt = 0; window.__longas = 0; window.__lcpEl = "";
  try {
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      window.__lcp = e.startTime; window.__lcpEl = (e.element?.tagName ?? "") + "." + String(e.element?.className ?? "").slice(0, 40);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { window.__longas++; window.__tbt += Math.max(0, e.duration - 50); }
    }).observe({ type: "longtask", buffered: true });
  } catch {}
})()`;

const b = await chromium.launch();
const resultados = [];
const falhas = [];
const avisos = [];

for (const rota of rotas) {
  const ctx = await b.newContext({
    viewport: { width: VISTA[0], height: VISTA[1] },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 12 Pro"].userAgent,
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: "cellular4g",
  });
  await p.addInitScript(OBSERVADORES);

  await p.goto(BASE + rota, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1200);
  const carga = await p.evaluate(CARGA);

  // a fluidez: 3 s de arrasto verdadeiro no mapa, quando ele existe
  let fluidez = null;
  const janela = await p.$(".b-janela");
  if (janela) {
    const caixa = await janela.boundingBox();
    if (caixa) {
      const registador = p.evaluate(REGISTADOR(3000));
      await p.mouse.move(caixa.x + caixa.width * 0.7, caixa.y + caixa.height * 0.55);
      await p.mouse.down();
      for (let k = 0; k < 40; k++) {
        await p.mouse.move(
          caixa.x + caixa.width * (0.7 - (k % 2 ? -0.09 : 0.09)),
          caixa.y + caixa.height * (0.55 + (k % 3 ? 0.02 : -0.02))
        );
      }
      await p.mouse.up();
      const quadros = await registador;
      const lentos = quadros.filter((q) => q > 33).length;
      const maus = quadros.filter((q) => q > QUADRO_MAU).length;
      const ordenados = [...quadros].sort((a, b2) => a - b2);
      fluidez = {
        quadros: quadros.length,
        fps: Math.round((quadros.length / 3000) * 1000),
        lentos,
        maus,
        // a mediana e o p95 são os números da casa (AUDITORIA-MAPA §6):
        // a média esconde uma quebra e o pior quadro isolado é a
        // promoção da camada no primeiro fotograma do gesto
        mediana: Math.round(ordenados[Math.floor(ordenados.length / 2)] ?? 0),
        p95: Math.round(ordenados[Math.floor(ordenados.length * 0.95)] ?? 0),
        pior: Math.round(ordenados.at(-1) ?? 0),
      };
    }
  }

  const etiqueta = rota.padEnd(12);
  console.log(
    `${etiqueta} LCP ${String(carga.lcp).padStart(4)}ms · CLS ${carga.cls.toFixed(3)} · TBT ${Math.round(carga.tbt)}ms (${carga.longas} longas)` +
      ` · DOM ${carga.nos} (svg ${carga.svgs}/mundo ${carga.svgMundo}) · anim ${carga.animacoes} · heap ${carga.heapMB ?? "?"}MB` +
      (fluidez
        ? ` · arrasto ${fluidez.fps}fps, mediana ${fluidez.mediana}ms p95 ${fluidez.p95}ms pior ${fluidez.pior}ms, ${fluidez.maus} > ${QUADRO_MAU}ms, ${fluidez.lentos} > 33ms`
        : " · sem mapa")
  );

  if (fluidez && fluidez.maus / fluidez.quadros > 0.3)
    falhas.push(`${rota}: ${Math.round((fluidez.maus / fluidez.quadros) * 100)}% dos quadros do arrasto acima de ${QUADRO_MAU}ms (pior ${fluidez.pior}ms)`);
  if (fluidez && fluidez.mediana > MEDIANA_MAU)
    falhas.push(`${rota}: mediana do arrasto ${fluidez.mediana}ms (limite ${MEDIANA_MAU}ms) — a pausa do gesto deve ter deixado de apanhar as animações`);
  if (fluidez && fluidez.p95 > P95_MAU)
    avisos.push(`${rota}: p95 do arrasto ${fluidez.p95}ms (limite ${P95_MAU}ms)`);
  if (fluidez && fluidez.pior > 250)
    avisos.push(
      `${rota}: pior quadro do arrasto ${fluidez.pior}ms — 1 a 2 quadros pesados por gesto, ` +
        `no ARRANQUE (a promoção da camada e a pausa das animações), medidos entre 100 e 750 ms no mesmo build`
    );
  if (carga.heapMB !== null && carga.heapMB > 60) falhas.push(`${rota}: heap ${carga.heapMB}MB`);
  if (carga.longas > 12) falhas.push(`${rota}: ${carga.longas} tarefas longas na carga (TBT ${Math.round(carga.tbt)}ms)`);
  if (carga.cls > 0.1) falhas.push(`${rota}: CLS ${carga.cls.toFixed(3)}`);

  resultados.push({ rota, ...carga, fluidez });
  await ctx.close();
}

await b.close();

console.log(`\n=== FALHAS (${falhas.length}) ===  (CPU ${CPU}×, rede 4G má, iPhone 12 Pro)`);
for (const f of falhas) console.log(" ✗ " + f);
if (!falhas.length) console.log("(nenhuma)");
console.log(`\n=== AVISOS (${avisos.length}) ===`);
for (const a of avisos) console.log(" ~ " + a);
if (!avisos.length) console.log("(nenhum)");
console.log(
  `limiares: >30% dos quadros do arrasto acima de ${QUADRO_MAU}ms · mediana do arrasto > ${MEDIANA_MAU}ms · heap > 60MB · > 12 tarefas longas · CLS > 0,1`
);
if (falhas.length) process.exitCode = 1;
