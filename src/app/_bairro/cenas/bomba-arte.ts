/**
 * O interior da Bomba em SVG — a porta de `interiorBomba()`,
 * `encherJarra()`, `mostrador()` e `graficoComb()` do protótipo
 * (`cena-bomba.js`), funções puras + escritoras de ids.
 *
 * Nenhum preço inventado: a decomposição chega JÁ calculada do servidor
 * (`decomporCombustivel` do motor `impostos.ts` + `ivaSobreImp`), e o
 * gráfico desenha as séries DGEG amostradas à semana — a primeira data
 * é a real da série, nunca um ano escrito à mão.
 *
 * Os ids são os do protótipo: `bmbEur`, `bmbLit`, `bmbTipo`,
 * `bmbJarra`, `bmbRot`, `cam-produto|isp|carbono|iva|ivaimp`,
 * `bmbPedro`.
 */
import { fmtLitro, fmtNum } from "@/lib/format";
import type { CombCena } from "./dados-p2b";
import { pontosDeDias } from "./utils";
import { mesCurto } from "./mercearia-arte";
import { pessoa, ELENCO } from "@/lib/bairro/personagens";

const K = "#16130f";

/** As camadas do litro, de baixo para cima (o `CAM` do protótipo). */
export const CAM: [keyof Dec, string, string][] = [
  ["produto", "Combustível e distribuição", "#e9c46a"],
  ["isp", "ISP", "#e2412a"],
  ["carbono", "Taxa de carbono", "#a8321f"],
  ["iva", "IVA", "#ff9a86"],
];

/** A forma da decomposição que a arte precisa (a do servidor + ivaSobreImp). */
export type Dec = NonNullable<CombCena["dec"]>;

/** A jarra de um litro — a caixa onde as camadas se desenham. */
export const JR = { x: 300, w: 130, base: 402, alt: 260 } as const;

export function interiorBomba(): string {
  let s = `<defs><pattern id="b-ivaImp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#ff9a86"/><path d="M0 0 V8" stroke="#e2412a" stroke-width="3"/></pattern>
    <linearGradient id="b-ceuBomba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd6f3"/><stop offset="1" stop-color="#dff2fb"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="url(#b-ceuBomba)"/><rect x="0" y="410" width="640" height="60" fill="#c9c4b8" stroke="${K}" stroke-width="2.6"/><path d="M0 440 H640" stroke="#fff" stroke-width="4" stroke-dasharray="30 20"/>`;
  // a pala
  s += `<rect x="0" y="20" width="420" height="34" fill="#fff" stroke="${K}" stroke-width="3"/><rect x="0" y="20" width="420" height="10" fill="#ffc62b" stroke="${K}" stroke-width="2"/><rect x="0" y="44" width="420" height="10" fill="#e2412a" stroke="${K}" stroke-width="2"/><text x="210" y="42" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="11" letter-spacing=".12em" fill="${K}">COMBUSTÍVEIS</text><rect x="60" y="54" width="14" height="356" fill="#e9e6df" stroke="${K}" stroke-width="2.4"/><rect x="60" y="370" width="14" height="40" fill="#e2412a" stroke="${K}" stroke-width="2"/>`;
  // a bomba com o mostrador
  s += `<g transform="translate(-60 0)"><rect x="96" y="210" width="96" height="200" rx="8" fill="#f7f5f0" stroke="${K}" stroke-width="3"/><rect x="96" y="210" width="96" height="30" rx="8" fill="#e2412a" stroke="${K}" stroke-width="3"/>
    <rect x="106" y="250" width="76" height="62" rx="4" fill="#1d2024" stroke="${K}" stroke-width="2"/><text x="112" y="266" font-family="Archivo" font-weight="700" font-size="8" fill="#c9c4b8">A PAGAR €</text><text id="bmbEur" x="176" y="283" text-anchor="end" font-family="Archivo" font-weight="900" font-size="17" fill="#6fe07a" font-variant-numeric="tabular-nums">0,00</text>
    <text x="112" y="296" font-family="Archivo" font-weight="700" font-size="8" fill="#c9c4b8">LITROS</text><text id="bmbLit" x="176" y="307" text-anchor="end" font-family="Archivo" font-weight="900" font-size="12" fill="#6fe07a" font-variant-numeric="tabular-nums">0,00</text>
    <rect x="112" y="322" width="64" height="16" rx="3" fill="#fff" stroke="${K}" stroke-width="1.6"/><text id="bmbTipo" x="144" y="333.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7.2" fill="${K}"></text>
    </g><path d="M132 360 q10 45 60 45 H440 q40 0 53 -22" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  // o carro do Pedro (com a prancha no tejadilho)
  s += `<g transform="translate(265 60) scale(.85)"><path d="M200 400 v-34 q0 -12 14 -14 l34 -4 l26 -26 q8 -6 20 -6 h70 q12 0 20 8 l22 26 q24 2 26 18 v32 z" fill="#2445d6" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M280 346 l20 -22 h34 v22 z M344 346 v-22 h26 l18 22 z" fill="var(--vidro)" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M340 350 v44" stroke="${K}" stroke-width="1.6" opacity=".5"/>
    <circle cx="246" cy="402" r="18" fill="${K}"/><circle cx="246" cy="402" r="8" fill="#b9c1c9"/><circle cx="376" cy="402" r="18" fill="${K}"/><circle cx="376" cy="402" r="8" fill="#b9c1c9"/>
    <rect x="268" y="376" width="14" height="8" rx="2" fill="#fff" stroke="${K}" stroke-width="1.4"/>
    <path d="M262 318 q60 -16 150 -2 q-80 10 -150 2z" fill="#7fd1c7" stroke="${K}" stroke-width="2.2"/><path d="M290 318 h8 M380 318 h8" stroke="${K}" stroke-width="2"/></g>`;
  s += `<g id="bmbPedro" transform="translate(585 440) scale(.85)">${pedro()}</g>`;
  // o garrafão de um litro, vazio, com as camadas por encher
  s += `<g id="bmbJarra"><path d="M${JR.x} ${JR.base} V${JR.base - JR.alt} q0 -14 14 -18 h${JR.w - 28} q14 4 14 18 V${JR.base} q0 10 -10 10 H${JR.x + 10} q-10 0 -10 -10z" fill="#eef7fb" stroke="${K}" stroke-width="3"/>
    <rect x="${JR.x + 40}" y="${JR.base - JR.alt - 38}" width="${JR.w - 80}" height="22" rx="4" fill="#d6dce1" stroke="${K}" stroke-width="2.4"/>
    ${CAM.map(([k, , cor]) => `<rect class="camada" id="cam-${k}" x="${JR.x + 3}" y="${JR.base}" width="${JR.w - 6}" height="0" fill="${cor}"/>`).join("")}
    <rect id="cam-ivaimp" x="${JR.x + 3}" y="${JR.base}" width="${JR.w - 6}" height="0" fill="url(#b-ivaImp)"/>
    <path d="M${JR.x} ${JR.base} V${JR.base - JR.alt} q0 -14 14 -18 h${JR.w - 28} q14 4 14 18 V${JR.base} q0 10 -10 10 H${JR.x + 10} q-10 0 -10 -10z" fill="none" stroke="${K}" stroke-width="3"/>
    <path d="M${JR.x + 14} ${JR.base - JR.alt + 20} v${JR.alt - 60}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    <text x="${JR.x + JR.w / 2}" y="${JR.base + 30}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="13" fill="${K}">1 litro</text>
    <g id="bmbRot"></g></g>`;
  return s;
}

/**
 * Escreve as camadas do litro no estado final — a cena anima chamando
 * esta dentro de um tween por camada, ou directamente em
 * reduced-motion. Devolve os rectângulos-alvo para quem anima.
 */
export function aplicarJarra(
  raiz: ParentNode,
  d: Dec
): { cam: (typeof CAM)[number][0]; y: number; h: number }[] {
  let y: number = JR.base;
  const esc = JR.alt / d.precoFinal;
  const alvos = CAM.map(([k, ,]) => {
    const h = d[k] * esc;
    const topo = y - h;
    y = topo;
    return { cam: k, y: topo, h };
  });
  for (const { cam, y: yy, h } of alvos) {
    const el = raiz.querySelector(`#cam-${cam}`);
    el?.setAttribute("y", String(yy));
    el?.setAttribute("height", String(h));
  }
  // a parte do IVA que incide sobre o ISP e a taxa de carbono
  const eli = raiz.querySelector("#cam-ivaimp");
  eli?.setAttribute("y", String(y));
  eli?.setAttribute("height", String(d.ivaSobreImp * esc));
  rotulosJarra(raiz, d);
  return alvos;
}

/** Os rótulos à esquerda da jarra (nome + valor por litro). */
export function rotulosJarra(raiz: ParentNode, d: Dec): void {
  let y: number = JR.base;
  const esc = JR.alt / d.precoFinal;
  const rot = CAM.map(([k, nome, cor]) => {
    const h = d[k] * esc;
    const topo = y - h;
    const meio = (y + topo) / 2;
    y = topo;
    return { nome, v: d[k], meio, cor };
  });
  const g = raiz.querySelector("#bmbRot");
  if (g)
    g.innerHTML = rot
      .map(
        ({ nome, v, meio, cor }) =>
          `<path d="M${JR.x - 4} ${meio.toFixed(1)} H${JR.x - 20}" stroke="${K}" stroke-width="1.6"/><text x="${JR.x - 24}" y="${(meio - 2).toFixed(1)}" text-anchor="end" font-family="Archivo" font-weight="800" font-size="10.5" fill="${K}">${nome}</text><text x="${JR.x - 24}" y="${(meio + 11).toFixed(1)}" text-anchor="end" font-family="Archivo" font-weight="900" font-size="12" fill="${cor === "#e9c46a" ? K : "#a8321f"}">${fmtLitro(v)}</text>`
      )
      .join("");
}

/** O mostrador no estado `preco × litros` — a cena anima com um tween sobre estes dois números. */
export function mostrador(raiz: ParentNode, nome: string, eur: number, litros: number): void {
  const eu = raiz.querySelector("#bmbEur");
  const li = raiz.querySelector("#bmbLit");
  const tp = raiz.querySelector("#bmbTipo");
  if (eu) eu.textContent = fmtNum(eur, 2);
  if (li) li.textContent = fmtNum(litros, 2);
  if (tp) tp.textContent = nome.toUpperCase();
}

/* ————— o gráfico: o preço ao longo dos anos (um ponto por semana) ————— */

const GP = { x0: 50, x1: 500, y0: 250, y1: 20 };

/**
 * Os dois preços, série diária amostrada à semana — os pontos chegam do
 * servidor compactos e aqui ganham as datas reais (`pontosDeDias`).
 */
export function graficoComb(gasolina: NonNullable<CombCena["serie"]>, gasoleo: NonNullable<CombCena["serie"]>, aria: string): string {
  const a = pontosDeDias(gasolina);
  const b = pontosDeDias(gasoleo);
  const todos = [...a, ...b].map((p) => p.v);
  const lo = Math.floor(Math.min(...todos) * 5) / 5;
  const hi = Math.ceil(Math.max(...todos) * 5) / 5;
  const x = (k: number, n: number) => GP.x0 + ((GP.x1 - GP.x0) * k) / (n - 1);
  const y = (v: number) => GP.y0 - ((GP.y0 - GP.y1) * (v - lo)) / (hi - lo);
  let s = "";
  for (let v = lo; v <= hi + 1e-9; v += 0.2)
    s += `<path d="M${GP.x0} ${y(v).toFixed(1)} H${GP.x1}" stroke="currentColor" stroke-opacity=".1"/><text x="${GP.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${fmtNum(v, 2)}</text>`;
  let anoV = "";
  a.forEach((p, k) => {
    const ano = p.t.slice(0, 4);
    if (ano !== anoV && +ano % 2 === 1)
      s += `<text x="${x(k, a.length).toFixed(1)}" y="${GP.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${ano}</text>`;
    anoV = ano;
  });
  const lin = (arr: { v: number }[]) =>
    arr.map((p, k) => `${k ? "L" : "M"}${x(k, arr.length).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  s += `<path d="${lin(b)}" fill="none" stroke="#16130f" stroke-width="2.4"/><path d="${lin(a)}" fill="none" stroke="#e2412a" stroke-width="2.6"/><path d="M${GP.x0} ${GP.y0} H${GP.x1}" stroke="#16130f" stroke-width="2"/>`;
  const km = a.reduce((m, p, k) => (p.v > a[m].v ? k : m), 0);
  const kn = a.reduce((m, p, k) => (p.v < a[m].v ? k : m), 0);
  s += `<circle cx="${x(km, a.length).toFixed(1)}" cy="${y(a[km].v).toFixed(1)}" r="5.5" fill="#e2412a" stroke="#16130f" stroke-width="2"/><text x="${(x(km, a.length) + 8).toFixed(1)}" y="${(y(a[km].v) + 4).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="17" fill="#c7361f" stroke="#fff" stroke-width="4" paint-order="stroke">o pico: ${fmtLitro(a[km].v)} (${mesCurto(a[km].t)})</text>`;
  s += `<circle cx="${x(kn, a.length).toFixed(1)}" cy="${y(a[kn].v).toFixed(1)}" r="5.5" fill="#fff" stroke="#16130f" stroke-width="2"/><text x="${x(kn, a.length).toFixed(1)}" y="${(y(a[kn].v) + 20).toFixed(1)}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="17" fill="#16130f" stroke="#fff" stroke-width="4" paint-order="stroke">o mais baixo: ${fmtLitro(a[kn].v)} (${mesCurto(a[kn].t)})</text>`;
  s += `<text x="${GP.x0 + 6}" y="${GP.y1 + 6}" font-family="Caveat" font-weight="700" font-size="18" fill="#c7361f">gasolina 95</text><text x="${GP.x0 + 96}" y="${GP.y1 + 6}" font-family="Caveat" font-weight="700" font-size="18" fill="#16130f">gasóleo</text>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 280" role="img" aria-label="${aria}" font-family="Archivo">${s}</svg>`;
}

/* ————— pessoas do interior: a MESMA personagem do mapa (`pessoa()`), com
   as especificações do protótipo — nada de mini-figuras ————— */
const pedro = (): string => pessoa({ ...ELENCO.pedro, prancha: undefined });
