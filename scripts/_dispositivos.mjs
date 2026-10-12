// _dispositivos.mjs — varrimento por DISPOSITIVO em todas as rotas do
// `out/` exportado. Ao contrário do `_overflow-sweep` (768/1440), este
// cobre os telemóveis a sério: 320/390/412/428 px, com toque emulado,
// e olha para o que o overflow esconde:
//
//   · overflow horizontal da página + o ELEMENTO que o provoca;
//   · alvos de toque abaixo de 24×24 CSS px (WCAG 2.5.8, nível AA) e
//     abaixo de 44×44 (2.5.5, AAA) — os links dentro de texto corrido
//     ficam de fora, como a norma prevê;
//   · letra abaixo de 11 px em texto visível (o piso da casa);
//   · texto cortado verticalmente por uma altura fixa com `overflow:
//     hidden` (a mancha que fica a meio da palavra).
//
// O relatório AGRUPA por elemento: o mesmo «Fechar» de 48×23 px em 39
// rotas é UMA linha, com a contagem — não 39. Uma linha por rota esconde
// o padrão, que é o que interessa.
//
// Não escreve nada; lê o `out/` pela porta do `_serve-static` (PORTA,
// por omissão 3100).
//
// uso: node scripts/_dispositivos.mjs [porta] [rotas separadas por vírgula]
import { chromium, devices } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const PORTA = process.argv[2] ?? process.env.PORTA ?? "3100";
const BASE = `http://localhost:${PORTA}`;

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith(".html") && e.name !== "_not-found.html") yield p;
  }
}
const todas = [...walk("out")].map((f) =>
  "/" + f.slice(4).replace(/\\/g, "/").replace(/index\.html$/, "").replace(/\.html$/, "")
);
const rotas = process.argv[3] ? process.argv[3].split(",") : todas;

// Os aparelhos que o dono testa de verdade: os pequenos (SE, 12 Pro), um
// Android, um tablet e o desktop de referência.
const APARELHOS = [
  { nome: "iPhone SE 320", largura: 320, altura: 568, dpr: 2, toque: true, ua: "iPhone 12 Pro" },
  { nome: "iPhone 12 Pro 390", largura: 390, altura: 844, dpr: 3, toque: true, ua: "iPhone 12 Pro" },
  { nome: "iPhone 12 Pro Max 428", largura: 428, altura: 926, dpr: 3, toque: true, ua: "iPhone 12 Pro" },
  { nome: "iPad mini 768", largura: 768, altura: 1024, dpr: 2, toque: true, ua: "iPad Mini" },
  { nome: "desktop 1440", largura: 1440, altura: 900, dpr: 1, toque: false },
];

// Sonda no browser: devolve tudo o que há para saber sobre a página.
const SONDA = `(() => {
  const LW = window.innerWidth;
  const doc = document.documentElement;
  const rolavel = Math.max(doc.scrollWidth, document.body.scrollWidth);

  // o elemento mais à direita que passa a margem — só se houver overflow
  const culpados = [];
  if (rolavel > LW + 1) {
    for (const el of document.body.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right > LW + 2) {
        const pai = el.parentElement;
        const pR = pai ? pai.getBoundingClientRect().right : -Infinity;
        if (pR <= LW + 2)
          culpados.push(
            (el.tagName.toLowerCase() + "." + String(el.className || "").split(" ").filter(Boolean).slice(0, 3).join(".")).slice(0, 70) +
              " → +" + Math.round(r.right - LW) + "px"
          );
      }
    }
  }

  // alvos de toque: só elementos clicáveis a sério. Os LINKS dentro de
  // texto corrido saem da conta: a norma 2.5.8 tem a excepção «inline»
  // («o alvo está numa frase ou bloco de texto») e é o caso de quase
  // todo o lq-link da casa (17 px de entrelinha, dentro de um <p>).
  // Um <button> — o «JSON», as acções do rodapé — não tem essa
  // desculpa e é medido.
  const alvos = [];
  for (const el of document.body.querySelectorAll("a[href], button, [role='button'], input:not([type='hidden']), select, textarea, summary")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.pointerEvents === "none") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (el.closest("[aria-hidden='true'], [hidden]")) continue;
    // link dentro de texto corrido: a norma 2.5.8 isenta-o
    if (el.tagName === "A" && cs.display.startsWith("inline")) continue;
    const txt = (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\\s+/g, " ").slice(0, 34);
    const assinatura = el.tagName.toLowerCase() + (el.type ? "[" + el.type + "]" : "") + " «" + txt + "»";
    alvos.push({ assinatura, w: Math.round(r.width), h: Math.round(r.height) });
  }

  // letra pequena em texto visível (só elementos com texto próprio)
  const letraPequena = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent || "").trim())) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const px = parseFloat(cs.fontSize);
    if (px && px < 11)
      letraPequena.push({
        px,
        assinatura: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ").filter(Boolean)[0] : ""),
        t: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 30),
      });
  }

  // texto cortado em altura fixa com overflow hidden. Ficam de fora os
  // dois casos que são corte DE PROPÓSITO: o sr-only (escondido para
  // leitores de ecrã) e a tira de dígitos do odómetro (od-wheel), que é
  // uma coluna de 0–9 deslizada dentro de uma janela de um dígito.
  const cortados = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest(".sr-only, .od-wheel")) continue;
    const cs = getComputedStyle(el);
    if (cs.overflowY !== "hidden" && cs.overflowY !== "clip") continue;
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (el.scrollHeight > Math.round(r.height) + 4 && el.scrollHeight > 8) {
      const t = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 30);
      if (t)
        cortados.push({
          assinatura: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ").filter(Boolean)[0] : ""),
          t,
          visivel: Math.round(r.height),
          real: el.scrollHeight,
        });
    }
  }

  return { lw: LW, rolavel, culpados: [...new Set(culpados)].slice(0, 3), alvos, letraPequena, cortados };
})()`;

/* ————— excepções declaradas ————————————————————————————————
 * Uma excepção aqui NÃO desaparece do relatório: fica contada à parte,
 * com o motivo ao lado. Só entram casos medidos e justificados — nunca
 * um «mudo isto porque está vermelho».
 *
 * 1. Os dois edifícios mais pequenos do mapa (a Bomba e o Quiosque) dão
 *    36×23 e 26×22 px a 320 px de largura — 1 a 2 px abaixo dos 24 do
 *    2.5.8. Só acontece a ≤ 340 px (a 375 px já vão a 27 px), ou seja em
 *    telemóveis anteriores a 2017; e o mapa é deslocável e ampliável, o
 *    que é o critério de espaçamento da própria norma. Alargar a caixa
 *    do `.ed` (um rect transparente por edifício) mexia na geometria de
 *    toque de peças vizinhas dias antes do lançamento — fica registado
 *    para o dono decidir, não escondido.
 */
const EXCECOES = [
  {
    tipo: "toque<24",
    re: /^g «(LOJA|JORNAIS)/,
    porque: "peça pequena do mapa a 320 px (≤340 px); deslocável/ampliável, 2.5.8 espaçamento",
  },
];
const exceto = (a) => EXCECOES.some((e) => e.tipo === a.tipo && e.re.test(a.chave));

/* ————— recolha ————— */
const achados = [];
const erros = [];

// DISP=«1440» restringe a medição aos aparelhos cujo nome contenha o
// termo (separados por vírgula) — para iterar sem repetir os seis
const filtro = process.env.DISP?.split(",").map((s) => s.trim());
const medidos = filtro?.length ? APARELHOS.filter((a) => filtro.some((f) => a.nome.includes(f))) : APARELHOS;

const b = await chromium.launch();
for (const ap of medidos) {
  const ctx = await b.newContext({
    viewport: { width: ap.largura, height: ap.altura },
    deviceScaleFactor: ap.dpr,
    isMobile: ap.toque,
    hasTouch: ap.toque,
    // um nome de aparelho que não existir neste Playwright não pode
    // derrubar a medição — vale a UA da casa, o que interessa é a caixa
    userAgent: ap.ua ? (devices[ap.ua]?.userAgent ?? devices["iPhone 12 Pro"].userAgent) : undefined,
  });
  const p = await ctx.newPage();
  for (const r of rotas) {
    try {
      await p.goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 20000 });
      await p.addStyleTag({ content: "*, *::before, *::after { animation-play-state: paused !important; }" });
      await p.waitForTimeout(300);
      const d = await p.evaluate(SONDA);
      if (d.rolavel > d.lw + 1)
        achados.push({ tipo: "overflow", nivel: "falha", chave: d.culpados.join(" | ") || "sem culpado", ap, r, detalhe: `scrollW=${d.rolavel} vs ${d.lw}` });
      for (const a of d.alvos) {
        const min = Math.min(a.w, a.h);
        if (min < 24) achados.push({ tipo: "toque<24", nivel: "falha", chave: `${a.assinatura} ${a.w}×${a.h}`, ap, r });
        else if (min < 44) achados.push({ tipo: "toque<44", nivel: "aviso", chave: `${a.assinatura} ${a.w}×${a.h}`, ap, r });
      }
      for (const l of d.letraPequena)
        achados.push({ tipo: "letra<11px", nivel: "aviso", chave: `${l.px}px ${l.assinatura} «${l.t}»`, ap, r });
      for (const c of d.cortados)
        achados.push({ tipo: "texto cortado", nivel: "aviso", chave: `${c.assinatura} «${c.t}» ${c.visivel}/${c.real}`, ap, r });
    } catch (e) {
      erros.push(`${ap.nome} ${r}: ${String(e).slice(0, 70)}`);
    }
  }
  await ctx.close();
  console.log(`✓ ${ap.nome} — ${rotas.length} rotas`);
}
await b.close();

/* ————— relatório agregado ————— */
function agrupa(nivel) {
  const g = new Map();
  for (const a of achados.filter((x) => x.nivel === nivel && !(nivel === "falha" && exceto(x)))) {
    const chave = `${a.tipo} · ${a.chave}`;
    if (!g.has(chave)) g.set(chave, { n: 0, rotas: new Set(), aparelhos: new Set(), nota: a.detalhe ?? "" });
    const x = g.get(chave);
    x.n++;
    x.rotas.add(a.r);
    x.aparelhos.add(a.ap.nome);
  }
  return [...g.entries()].sort((a, b2) => b2[1].n - a[1].n);
}

for (const [nome, nivel] of [["FALHAS", "falha"], ["AVISOS", "aviso"]]) {
  const g = agrupa(nivel);
  console.log(`\n=== ${nome} (${g.length} padrões, ${achados.filter((a) => a.nivel === nivel).length} ocorrências) ===`);
  for (const [chave, v] of g.slice(0, 25))
    console.log(
      ` ${nivel === "falha" ? "✗" : "~"} ×${v.n} em ${v.rotas.size} rota(s) / ${v.aparelhos.size} aparelho(s) · ${chave}` +
        (v.nota ? ` (${v.nota})` : "") +
        (v.rotas.size <= 3 ? ` · ${[...v.rotas].join(", ")}` : "")
    );
  if (g.length > 25) console.log(` …e mais ${g.length - 25} padrão(ões)`);
  if (!g.length) console.log(" (nenhum)");
}
const exceptuados = achados.filter((a) => a.nivel === "falha" && exceto(a));
if (exceptuados.length) {
  const g = new Map();
  for (const a of exceptuados) g.set(a.chave, (g.get(a.chave) ?? 0) + 1);
  console.log(`\n=== EXCEPÇÕES DECLARADAS (${exceptuados.length} ocorrências) ===`);
  for (const [chave, n] of g) {
    const e = EXCECOES.find((x) => x.re.test(chave));
    console.log(` · ×${n} ${chave} — ${e?.porque ?? "sem motivo declarado"}`);
  }
}
if (erros.length) {
  console.log(`\n=== ERROS (${erros.length}) ===`);
  for (const e of erros.slice(0, 10)) console.log(" ✗ " + e);
}
console.log(`\n${rotas.length} rotas × ${medidos.length} aparelhos · alvo de toque AA ≥ 24×24 (WCAG 2.5.8), aviso ≥ 44×44 (2.5.5)`);
if (achados.some((a) => a.nivel === "falha" && !exceto(a)) || erros.length) process.exitCode = 1;
