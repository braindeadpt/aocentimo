// _fluidez.mjs — a fluidez a sério, no telemóvel e com o telemóvel todo
// carregado: iPhone 12 Pro emulado (390×844, DPR 3, toque), 4× de CPU a
// menos e rede 4G má (150 ms de ida e volta, ~1,6 Mbps). Lê o `out/` pelo
// servidor estático (`_serve-static`), não o `next dev`.
//
// Mede, por rota:
//   · LCP, CLS e o bloqueio total (TBT) por observação de `longtask`;
//   · nós no DOM, elementos SVG e animações CSS a correr;
//   · heap de JavaScript (Chromium) no fim da carga;
//   · a FLUIDEZ: 3 s de arrasto verdadeiro no mapa (o gesto que mais
//     pinta), com a mediana, o p95 e o pior quadro;
//   · as TRÊS PEÇAS DO GESTO que fazem o arrasto deslizar (AUDITORIA-MAPA
//     §6): durante o gesto a janela leva `b-arrasto`, o mundo leva
//     `will-change: transform` e as animações do mundo estão PARADAS; ao
//     largar, tudo volta atrás. É esta a invariante que o CI vigia: uma
//     mediana depende da máquina, a pausa do gesto não.
//   · a MESMA invariante na PINÇA (dois dedos, toque verdadeiro pelo CDP)
//     e na RODA do rato: desde o #91 (iPad, 2026-10-07) as duas também
//     põem `b-arrasto`, mas só o arrasto de um dedo estava vigiado — uma
//     regressão na pinça passava o CI calada.
//
// Não escreve nada. `PORTA` escolhe o servidor (por omissão 3100), como
// nos outros scripts da casa.
//
// uso: node scripts/_fluidez.mjs [porta] [rotas separadas por vírgula]
//      node scripts/_fluidez.mjs 3100 /        # no CI: só a home (o mapa)
import { chromium, devices } from "@playwright/test";

const PORTA = process.argv[2] ?? process.env.PORTA ?? "3100";
const BASE = `http://localhost:${PORTA}`;
const rotas = process.argv[3]
  ? process.argv[3].split(",")
  : ["/", "/salario", "/inflacao", "/credito", "/dados"];

// 4× mais lento — telemóvel de gama média. `CPU=1` mede SEM estrangulamento
// (o portátil de quem está a olhar): é assim que se separa o que é o piso do
// gesto na máquina do que é o custo em telemóvel fraco.
const CPU = Number(process.env.CPU ?? 4);
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
// A mediana é o gate GROSSO, não o fino: no arrasto contínuo mede 17-50 ms cá,
// e a máquina do CI não é esta — um limiar apertado falhava pelo ambiente, não
// pelo código. Quem apanha a regressão do gesto são as invariantes (acima); a
// mediana só apanha um arrasto 3× mais lento (ex.: uma peça nova e pesada no
// mapa), e 150 ms é 37 ms a 1× — território de travagem, não de ruído.
const MEDIANA_MAU = 150;
const P95_MAU = 150; // ms — 37 ms a 1×

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

/**
 * As três peças do gesto (AUDITORIA-MAPA §6): `b-arrasto` na janela, o
 * `will-change: transform` no mundo e as animações do mundo paradas — e,
 * depois de largar, o contrário. São invariantes do CÓDIGO, não da
 * máquina: um CI lento muda a mediana, não isto.
 */
const GESTO = `(() => {
  const janela = document.querySelector(".b-janela");
  const mundo = document.querySelector(".b-mundo");
  if (!janela || !mundo) return null;
  // só as ANIMAÇÕES (as do ambiente, que a pausa do gesto para): uma
  // transição de CSS não é ambiente — na pinça os marcadores que saem ou
  // entram na janela esvanecem (classe «b-fora», ~0,2 s) e isso é o zoom a
  // funcionar, não uma animação esquecida a correr
  const animacoes = mundo.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation);
  return {
    arrasto: janela.classList.contains("b-arrasto"),
    willChange: getComputedStyle(mundo).willChange,
    animacoes: animacoes.length,
    aCorrer: animacoes.filter((a) => a.playState === "running").length,
  };
})()`;

/** As peças do gesto que estão partidas (vazio = o arrasto desliza). */
function pecasPartidas(f) {
  if (!f?.durante || !f?.depois) return ["o estado do gesto não foi lido"];
  const partes = [];
  if (!f.durante.arrasto) partes.push("a janela não levou `b-arrasto` durante o gesto");
  if (!/transform/.test(f.durante.willChange))
    partes.push(`o mundo não levou \`will-change: transform\` (viu-se «${f.durante.willChange}»)`);
  if (f.durante.animacoes > 0 && f.durante.aCorrer > 0)
    partes.push(`${f.durante.aCorrer} de ${f.durante.animacoes} animações do mundo a correr durante o gesto`);
  if (f.depois.arrasto) partes.push("`b-arrasto` ficou na janela depois de largar");
  if (f.depois.animacoes > 0 && f.depois.aCorrer === 0)
    partes.push("as animações do mundo não voltaram a andar depois de largar");
  return partes;
}

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

/**
 * A pinça: dois dedos a afastar-se no centro da janela durante ~1,2 s,
 * por `Input.dispatchTouchEvent` (o Chromium entrega-os como pointer
 * events de toque, os mesmos que o iPad dá à câmara). Lê o estado a meio
 * do gesto e depois de levantar os dedos.
 */
async function pinca(p, cdp, caixa) {
  const cx = caixa.x + caixa.width / 2;
  const cy = caixa.y + caixa.height / 2;
  const dedos = (d) => [
    { x: cx - d, y: cy, id: 1 },
    { x: cx + d, y: cy, id: 2 },
  ];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: dedos(30) });
  let durante = null;
  for (let k = 1; k <= 24; k++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: dedos(30 + k * 4) });
    await p.waitForTimeout(50);
    if (k === 12) durante = await p.evaluate(GESTO);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await p.waitForTimeout(300);
  return { durante, depois: await p.evaluate(GESTO) };
}

/**
 * A roda: 20 passos de roda sobre o mapa, um a cada 50 ms, como dá uma
 * roda ou um trackpad. Disparados DENTRO da página: o `mouse.wheel` do
 * Playwright espera que cada passo seja tratado e, a 4× menos CPU, isso
 * espaça-os ~600 ms — mais do que os 220 ms em que a câmara mantém
 * `b-arrasto` depois do último, e o sensor lia um mapa parado. A câmara
 * não olha para `isTrusted`: o caminho é o mesmo do rato a sério.
 */
async function roda(p, caixa) {
  const durante = await p.evaluate(
    ([x, y, gesto]) =>
      new Promise((res) => {
        const janela = document.querySelector(".b-janela");
        let k = 0;
        let lido = null;
        const id = setInterval(() => {
          janela.dispatchEvent(
            new WheelEvent("wheel", { deltaY: k % 2 ? 120 : -120, clientX: x, clientY: y, bubbles: true, cancelable: true })
          );
          k += 1;
          if (k === 10) lido = (0, eval)(gesto);
          if (k === 20) {
            clearInterval(id);
            res(lido);
          }
        }, 50);
      }),
    [caixa.x + caixa.width / 2, caixa.y + caixa.height / 2, GESTO]
  );
  await p.waitForTimeout(220 + 400);
  return { durante, depois: await p.evaluate(GESTO) };
}

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
  // auto-teste do gate: `QUEBRAR=pausa` desfaz a pausa do gesto de
  // propósito — o sensor e a falha têm de a apanhar (senão não vigiam nada)
  if (process.env.QUEBRAR === "pausa")
    await p.addStyleTag({
      content:
        '[data-pele="v5"] .b-janela.b-arrasto .b-mundo * { animation-play-state: running !important; }',
    });
  // `QUEBRAR=pinca` reproduz o defeito de antes do #91: a pinça sem
  // `b-arrasto` (o arrasto de um dedo continua inteiro). Só a vigia da
  // pinça pode apanhar isto
  if (process.env.QUEBRAR === "pinca")
    await p.evaluate(() => {
      const janela = document.querySelector(".b-janela");
      const dedos = new Set();
      janela?.addEventListener("pointerdown", (e) => e.pointerType === "touch" && dedos.add(e.pointerId));
      window.addEventListener("pointerup", (e) => dedos.delete(e.pointerId));
      new MutationObserver(() => {
        if (dedos.size === 2 && janela.classList.contains("b-arrasto")) janela.classList.remove("b-arrasto");
      }).observe(janela, { attributes: true, attributeFilter: ["class"] });
    });
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
      // O GESTO DURA OS 3 s MEDIDOS. Com 40 movimentos (~0,5 s) os outros
      // 2,5 s eram fotogramas ociosos contados como arrasto e a mediana
      // saía melhor do que o gesto é: media-se 17 ms de mediana a olhar
      // para um mapa parado.
      let durante = null;
      const fim = Date.now() + 2900;
      for (let k = 0; Date.now() < fim; k++) {
        await p.mouse.move(
          caixa.x + caixa.width * (0.7 - (k % 2 ? -0.09 : 0.09)),
          caixa.y + caixa.height * (0.55 + (k % 3 ? 0.02 : -0.02))
        );
        // uma leitura a meio do gesto (não no 1.º fotograma, que é o da
        // promoção da camada)
        if (!durante && Date.now() > fim - 2400) durante = await p.evaluate(GESTO);
      }
      await p.mouse.up();
      const quadros = await registador;
      // ao largar, a câmara tira `b-arrasto` e o `ambiente.ts` retoma o que
      // tinha parado (MutationObserver): um instante para isso acontecer
      await p.waitForTimeout(300);
      const depois = await p.evaluate(GESTO);
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
        durante,
        depois,
      };
      // os outros dois gestos, com o mapa já parado
      fluidez.pinca = await pinca(p, cdp, caixa);
      fluidez.roda = await roda(p, caixa);
    }
  }

  const etiqueta = rota.padEnd(12);
  console.log(
    `${etiqueta} LCP ${String(carga.lcp).padStart(4)}ms · CLS ${carga.cls.toFixed(3)} · TBT ${Math.round(carga.tbt)}ms (${carga.longas} longas)` +
      ` · DOM ${carga.nos} (svg ${carga.svgs}/mundo ${carga.svgMundo}) · anim ${carga.animacoes} · heap ${carga.heapMB ?? "?"}MB` +
      (fluidez
        ? ` · arrasto ${fluidez.fps}fps, mediana ${fluidez.mediana}ms p95 ${fluidez.p95}ms pior ${fluidez.pior}ms, ${fluidez.maus} > ${QUADRO_MAU}ms, ${fluidez.lentos} > 33ms` +
          ` · gesto ${pecasPartidas(fluidez).length ? "PARTIDO" : "inteiro"}` +
          ` · pinça ${pecasPartidas(fluidez.pinca).length ? "PARTIDA" : "inteira"}` +
          ` · roda ${pecasPartidas(fluidez.roda).length ? "PARTIDA" : "inteira"}` +
          (fluidez.durante ? ` (${fluidez.durante.animacoes - fluidez.durante.aCorrer}/${fluidez.durante.animacoes} animações paradas)` : "")
        : " · sem mapa")
  );

  if (fluidez && fluidez.maus / fluidez.quadros > 0.3)
    falhas.push(`${rota}: ${Math.round((fluidez.maus / fluidez.quadros) * 100)}% dos quadros do arrasto acima de ${QUADRO_MAU}ms (pior ${fluidez.pior}ms)`);
  const partes = fluidez ? pecasPartidas(fluidez) : [];
  if (partes.length)
    falhas.push(`${rota}: a pausa do gesto não está inteira — ${partes.join("; ")}`);
  for (const [nome, g] of [["pinça", fluidez?.pinca], ["roda", fluidez?.roda]]) {
    if (!fluidez) break;
    const p2 = pecasPartidas(g);
    if (p2.length) falhas.push(`${rota}: a pausa na ${nome} não está inteira — ${p2.join("; ")}`);
  }
  if (fluidez && fluidez.mediana > MEDIANA_MAU)
    falhas.push(`${rota}: mediana do arrasto ${fluidez.mediana}ms (limite ${MEDIANA_MAU}ms)`);
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
  `limiares: >30% dos quadros do arrasto acima de ${QUADRO_MAU}ms · mediana do arrasto > ${MEDIANA_MAU}ms (gate grosso) · as peças do gesto no arrasto, na pinça e na roda (o gate fino) · heap > 60MB · > 12 tarefas longas · CLS > 0,1`
);
if (falhas.length) process.exitCode = 1;
