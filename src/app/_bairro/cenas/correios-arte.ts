/**
 * O interior dos Correios em SVG — a porta de `interiorCorreios()`,
 * `pilha()`/`porPilha()` e `graficoAforro()` do protótipo
 * (`cena-correios.js`), funções puras que devolvem a string SVG ou que
 * escrevem directamente nos ids (a cena nunca vê a árvore por dentro).
 *
 * Os euros nas pilhas e no gráfico NUNCA são inventados: o nominal e o
 * real vêm de `trajetoriaCA`/`trajetoriaColchao` (motor puro, chamado no
 * componente) e o que «o colchão compra» é cap0 ÷ razão IHPC medida.
 *
 * Os ids são os do protótipo: `corPainel`, `corFunc`, `corArminda`,
 * `pilhaCol`, `pilhaCA` (com `.p-notas`, `.p-cinta`, `.p-valor`,
 * `.p-real` por dentro — é nelas que a cena escreve).
 */
import { fmtEUR0 } from "@/lib/format";
import type { PontoPoupanca } from "@/lib/engines/poupanca";

const K = "#16130f";

/* As pilhas de notas: a altura é proporcional aos euros (o `PL` do protótipo). */
export const PL = { base: 392, alt: 190, max: 16000 } as const;

function pilha(id: string, x: number, rotulo: string, lado = 1): string {
  return `<g id="${id}"><rect class="p-sombra" x="${x - 44}" y="${PL.base - 4}" width="92" height="8" rx="4" fill="rgba(22,19,15,.18)"/>
    <rect class="p-notas" x="${x - 38}" y="${PL.base}" width="76" height="0" fill="url(#b-notas)" stroke="${K}" stroke-width="2.4"/>
    <rect class="p-cinta" x="${x - 38}" y="${PL.base}" width="76" height="8" fill="#f7d774" stroke="${K}" stroke-width="1.6"/>
    <g class="p-real"><path d="M${x - 46} 0 H${x + 46}" stroke="#e2412a" stroke-width="3" stroke-dasharray="6 4"/><text x="${x + lado * 50}" y="4" text-anchor="${lado > 0 ? "start" : "end"}" font-family="Caveat" font-weight="700" font-size="17" fill="#c7361f">compra</text></g>
    <text class="p-valor" x="${x}" y="${PL.base - 12}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="16" fill="${K}"></text>
    <text x="${x}" y="${PL.base + 26}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="12.5" fill="${K}">${rotulo}</text></g>`;
}

/**
 * Escreve uma pilha no estado `nominal`/`real` — sem animação (a cena
 * anima chamando-a dentro de um tween, ou directamente em
 * reduced-motion). Devolve as alturas de pixeis para quem anima.
 */
export function aplicarPilha(
  raiz: ParentNode,
  id: string,
  nominal: number,
  real: number
): { h: number; hr: number } {
  const g = raiz.querySelector(`#${id}`);
  const h = (PL.alt * nominal) / PL.max;
  const hr = (PL.alt * real) / PL.max;
  if (g) escreverPilha(g, nominal, h, hr);
  return { h, hr };
}

/** O mesmo, mas dentro de um tween: alturas dadas, valor já decidido. */
export function escreverPilha(g: Element, nominal: number, h: number, hr: number): void {
  const notas = g.querySelector(".p-notas");
  const cinta = g.querySelector(".p-cinta");
  const valor = g.querySelector(".p-valor");
  const linha = g.querySelector(".p-real");
  notas?.setAttribute("y", String(PL.base - h));
  notas?.setAttribute("height", String(h));
  cinta?.setAttribute("y", String(PL.base - h * 0.55));
  valor?.setAttribute("y", String(PL.base - h - 12));
  if (valor) valor.textContent = fmtEUR0(nominal);
  linha?.setAttribute("transform", `translate(0 ${(PL.base - hr).toFixed(1)})`);
  g.setAttribute("data-hr", String(hr));
}

/** O interior: cacifos, o painel da senha, o guiché A e as duas pilhas. */
export function interiorCorreios(): string {
  let s = `<defs><pattern id="b-notas" width="76" height="6" patternUnits="userSpaceOnUse"><rect width="76" height="6" fill="#bfe0c4"/><path d="M0 5.5 H76" stroke="#6aa877" stroke-width="1.2"/><circle cx="60" cy="3" r="1.4" fill="#6aa877"/></pattern>
    <pattern id="b-corChao" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#e4dccb"/><rect width="20" height="10" fill="#d6ccb7"/><rect x="20" y="10" width="20" height="10" fill="#d6ccb7"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="#fbf3e6"/><rect x="0" y="0" width="640" height="26" fill="#e2412a"/><rect x="0" y="410" width="640" height="60" fill="url(#b-corChao)" stroke="${K}" stroke-width="2.6"/>`;
  s += `<rect x="200" y="36" width="240" height="32" rx="5" fill="#e2412a" stroke="${K}" stroke-width="2.6"/><text x="320" y="59" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" letter-spacing=".08em" fill="#fff">CORREIOS</text>`;
  // cacifos na parede
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++)
      s += `<rect x="${24 + c * 38}" y="${90 + r * 34}" width="34" height="30" rx="2" fill="#c9a36b" stroke="${K}" stroke-width="1.8"/><circle cx="${48 + c * 38}" cy="${105 + r * 34}" r="2.4" fill="${K}"/><rect x="${30 + c * 38}" y="${96 + r * 34}" width="14" height="6" fill="#fff" stroke="${K}" stroke-width="1"/>`;
  // painel da senha — a Dona Arminda é a A 015, ainda por chamar
  s += `<g><rect x="490" y="36" width="120" height="50" rx="7" fill="#26282b" stroke="${K}" stroke-width="2.6"/><text x="550" y="52" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="9" letter-spacing=".14em" fill="#c9c4b8">SENHA</text><text id="corPainel" x="550" y="77" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="#ff5a3c">A 014</text></g>`;
  // a funcionária atrás do vidro do guiché
  s += `<g id="corFunc" transform="translate(450 330) scale(1.02)">${funcionaria()}</g>`;
  s += `<rect x="376" y="150" width="146" height="140" fill="#cfe6f5" fill-opacity=".35" stroke="${K}" stroke-width="2.4"/><path d="M386 170 l30 -14 M396 190 l50 -24" stroke="#fff" stroke-width="3" opacity=".7"/><rect x="430" y="120" width="40" height="24" rx="4" fill="#fff" stroke="${K}" stroke-width="2"/><text x="450" y="137" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="15" fill="${K}">A</text>`;
  // o balcão com as duas pilhas
  s += `<rect x="150" y="300" width="380" height="110" fill="#e7d3b0" stroke="${K}" stroke-width="3"/><rect x="142" y="290" width="396" height="14" rx="3" fill="#8a5a2b" stroke="${K}" stroke-width="2.6"/>`;
  s += `<g transform="translate(0 -102)">${pilha("pilhaCol", 232, "colchão", -1)}${pilha("pilhaCA", 324, "certificados", 1)}</g>`;
  // a Dona Arminda com a caderneta
  s += `<g id="corArminda" transform="translate(585 440) scale(-.98 .98)">${arminda()}<rect x="-32" y="-74" width="16" height="20" rx="2" fill="#2445d6" stroke="${K}" stroke-width="2"/></g>`;
  return s;
}

/* ————— o gráfico: nominal (cheio) contra poder de compra (tracejado) ————— */

const GC = { x0: 58, x1: 500, y0: 250, y1: 18 };

/**
 * O gráfico dos 15 anos: os pontos chegam JÁ calculados pelo motor
 * (`trajetoriaCA`/`trajetoriaColchao`, um por ano) — a arte não soma
 * juros, só desenha. O ponto «hoje» (ano 0, saldo = real = cap0) é
 * acrescentado aqui, como o protótipo.
 */
export function graficoAforro(
  cap0: number,
  ca: PontoPoupanca[],
  co: PontoPoupanca[],
  infl: number,
  aria: string
): string {
  const anos = Math.max(ca.length, co.length);
  const hoje = { ano: 0, saldo: cap0, real: cap0, juro: 0, imposto: 0 };
  const cA = [hoje, ...ca];
  const cO = [hoje, ...co];
  const todos = [...cA, ...cO].flatMap((p) => [p.saldo, p.real]);
  const lo = Math.floor(Math.min(...todos) / 1000) * 1000;
  const hi = Math.ceil(Math.max(...todos) / 1000) * 1000;
  const x = (a: number) => GC.x0 + ((GC.x1 - GC.x0) * a) / anos;
  const y = (v: number) => GC.y0 - ((GC.y0 - GC.y1) * (v - lo)) / (hi - lo);
  let s = "";
  const passo = hi - lo > 6000 ? 2000 : 1000;
  for (let v = lo; v <= hi; v += passo)
    s += `<path d="M${GC.x0} ${y(v).toFixed(1)} H${GC.x1}" stroke="currentColor" stroke-opacity="${v === cap0 ? 0.5 : 0.1}"/><text x="${GC.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${fmtEUR0(v)}</text>`;
  for (let a = 0; a <= anos; a += 5)
    s += `<text x="${x(a).toFixed(1)}" y="${GC.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${a ? `${a} anos` : "hoje"}</text>`;
  const lin = (arr: PontoPoupanca[], k: "saldo" | "real") =>
    arr.map((p, a) => `${a ? "L" : "M"}${x(a).toFixed(1)} ${y(p[k]).toFixed(1)}`).join(" ");
  // a faixa entre o nominal e o real dos certificados — é a inflação
  s += `<path d="${lin(cA, "saldo")} ${cA.map((p, a) => `L${x(anos - a).toFixed(1)} ${y(cA[anos - a].real).toFixed(1)}`).join(" ")} Z" fill="#e2412a" fill-opacity=".1"/>`;
  s += `<path d="${lin(cO, "saldo")}" fill="none" stroke="#8e867a" stroke-width="2.6"/><path d="${lin(cO, "real")}" fill="none" stroke="#8e867a" stroke-width="2.6" stroke-dasharray="6 4"/>`;
  s += `<path d="${lin(cA, "saldo")}" fill="none" stroke="#0c7a4f" stroke-width="3.2"/><path d="${lin(cA, "real")}" fill="none" stroke="#0c7a4f" stroke-width="3.2" stroke-dasharray="6 4"/>`;
  s += `<path d="M${GC.x0} ${GC.y0} H${GC.x1}" stroke="#16130f" stroke-width="2"/>`;
  const f = cA[anos];
  const c = cO[anos];
  s += `<text x="${GC.x1 - 4}" y="${(y(f.saldo) - 8).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="18" fill="#0c7a4f">certificados: os euros que vês</text>`;
  s += `<text x="${GC.x1 - 4}" y="${(y(f.real) + (f.real > c.saldo - 400 && f.real < c.saldo + 400 ? -8 : 18)).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="18" fill="#0c7a4f">…e o que compram</text>`;
  s += `<text x="${x(5).toFixed(1)}" y="${(y(c.saldo) - 8).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="17" fill="#6e675e">colchão: sempre ${fmtEUR0(cap0)}…</text>`;
  s += `<text x="${GC.x1 - 4}" y="${Math.min(GC.y0 - 6, y(c.real) + 20).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="17" fill="#6e675e">…mas compra cada vez menos</text>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 280" role="img" aria-label="${aria}" font-family="Archivo">${s}</svg>`;
}

/* ————— pessoas do interior (mini-porta de personagens.ts, como nas P2a) ————— */

function pessoaBase(pele: string, cabeloSvg: string, roupa: string, calcas: string, extra = ""): string {
  return `<g stroke="${K}" stroke-width="2.2">
    <ellipse cx="0" cy="2" rx="20" ry="6" fill="rgba(22,19,15,.18)" stroke="none"/>
    <rect x="-13" y="-26" width="26" height="30" rx="8" fill="${roupa}"/>
    <rect x="-12" y="2" width="10" height="26" fill="${calcas}"/><rect x="2" y="2" width="10" height="26" fill="${calcas}"/>
    <circle cx="0" cy="-38" r="13" fill="${pele}"/>
    ${cabeloSvg}
    <path class="braco-e" d="M-13 -12 q-8 2 -6 12" fill="none" stroke-linecap="round"/><path class="braco-d" d="M13 -12 q8 2 6 12" fill="none" stroke-linecap="round"/>
    ${extra}
    <path d="M-4 -35 q4 4 8 0" fill="none"/>
  </g>`;
}

/** A funcionária dos Correios (coque escuro, roupa vermelha, óculos). */
function funcionaria(): string {
  return pessoaBase(
    "#d49a72",
    `<path d="M-13 -40 a13 13 0 0 1 26 0 v4 q-13 -7 -26 0z" fill="#2b1d14"/><circle cx="0" cy="-52" r="6.5" fill="#2b1d14"/>`,
    "#e2412a",
    "#2b3a55",
    `<circle cx="-6.5" cy="-38" r="4.8" fill="none"/><circle cx="6.5" cy="-38" r="4.8" fill="none"/><path d="M-1.7 -38 h3.4" fill="none"/>`
  );
}

/** A Dona Arminda (carrapito grisalho, roupa bordeaux, saia, óculos). */
function arminda(): string {
  return pessoaBase(
    "#f3cba8",
    `<path d="M-13 -40 a13 13 0 0 1 26 0 v4 q-13 -7 -26 0z" fill="#cfc9c1"/><circle cx="0" cy="-52" r="7" fill="#cfc9c1"/>`,
    "#9e2f45",
    "#3d3a4f",
    `<circle cx="-6.5" cy="-38" r="4.8" fill="none"/><circle cx="6.5" cy="-38" r="4.8" fill="none"/><path d="M-1.7 -38 h3.4" fill="none"/>`
  );
}
