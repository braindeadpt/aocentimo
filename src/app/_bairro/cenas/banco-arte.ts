/**
 * O interior do Banco em SVG — a porta de `interiorBanco()` e
 * `graficoBanco()` do protótipo (`cena-banco.js`), funções puras que
 * devolvem a string SVG. Os ids (`banPainel`, `banPrest`, `banPa`…)
 * são os que a cena manipula por efeito.
 *
 * A PRESTAÇÃO é sempre `simularPrestacao()` (o motor do site, método
 * francês) — a cena não tem fórmula própria; a do protótipo era a
 * mesma, mas aqui quem assina a conta é o motor, com a taxa em FRAÇÃO
 * como o motor pede.
 */
import { FINO, fmtEUR0, fmtNum } from "@/lib/format";
import { simularPrestacao } from "@/lib/engines/prestacao";
import type { Ponto } from "./dados";
import { pessoa, ELENCO } from "@/lib/bairro/personagens";

const K = "#16130f";

const MES3 = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESX = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const mesCurto = (t: string) => `${MES3[+t.slice(5, 7) - 1]} ${t.slice(0, 4)}`;
export const mesLongo = (t: string) => `${MESX[+t.slice(5, 7) - 1]} de ${t.slice(0, 4)}`;

/** A taxa como «4,16 %» (o `pct2` do protótipo, com o fino do site). */
export const pct2 = (v: number) => fmtNum(v, 2) + FINO + "%";

/** A prestação POR MÊS, calculada pelo motor (taxa em %, como o quadro mostra). */
export function prestacaoDe(capital: number, anos: number, euriborPct: number, spreadPct: number): number {
  return simularPrestacao(capital, anos * 12, euriborPct / 100, spreadPct / 100).prestacao;
}

/** O texto de uma palheta do quadro: «−0,50%» / «4,16%», 7 caracteres. */
export function quadroTexto(v: number): string[] {
  const txt = (v < 0 ? "−" : "") + fmtNum(Math.abs(v), 2) + "%";
  return txt.padStart(7, " ").split("");
}

/** O interior: balcão de mármore, o cofre, o quadro da Euribor, a senha, o gerente, o papel da prestação. */
export function interiorBanco(): string {
  let s = `<defs><pattern id="banMarmore" width="60" height="30" patternUnits="userSpaceOnUse"><rect width="60" height="30" fill="#e9e4da"/><path d="M0 22 q15 -8 30 -2 t30 -4" fill="none" stroke="#cfc6b6" stroke-width="1.4"/><path d="M0 0 H60 M30 0 V30" stroke="#d6cebf" stroke-width="1.2"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="#e8efe9"/><rect x="0" y="0" width="640" height="30" fill="#0c5e3f"/><rect x="0" y="410" width="640" height="60" fill="url(#banMarmore)" stroke="${K}" stroke-width="2.6"/>`;
  for (const x of [20, 600])
    s += `<rect x="${x}" y="30" width="22" height="380" fill="#f3efe6" stroke="${K}" stroke-width="2.4"/><rect x="${x - 4}" y="30" width="30" height="14" fill="#e2dccf" stroke="${K}" stroke-width="2"/>`;
  // o cofre ao fundo
  s += `<g><circle cx="530" cy="190" r="62" fill="#b9c1c9" stroke="${K}" stroke-width="3"/><circle cx="530" cy="190" r="46" fill="#d6dce1" stroke="${K}" stroke-width="2.4"/>${[0, 1, 2, 3, 4, 5].map((k) => { const a = (k * Math.PI) / 3; return `<path d="M530 190 L${(530 + Math.cos(a) * 30).toFixed(1)} ${(190 + Math.sin(a) * 30).toFixed(1)}" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`; }).join("")}<circle cx="530" cy="190" r="10" fill="#8e99a5" stroke="${K}" stroke-width="2.4"/></g>`;
  // o quadro da Euribor (letras que viram)
  s += `<g><rect x="60" y="52" width="380" height="118" rx="10" fill="#1d2024" stroke="${K}" stroke-width="3"/><text x="250" y="76" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="12" letter-spacing=".16em" fill="#c9c4b8">EURIBOR A 12 MESES · MÉDIA DO MÊS</text>
    ${[0, 1, 2, 3, 4, 5, 6].map((k) => `<g class="palheta" data-k="${k}"><rect x="${84 + k * 48}" y="90" width="42" height="62" rx="5" fill="#2c3036" stroke="#000" stroke-width="1.6"/><path d="M${84 + k * 48} 121 h42" stroke="#000" stroke-width="1.4"/><text class="pal-t" x="${105 + k * 48}" y="136" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="36" fill="#ffd34d"></text></g>`).join("")}
    <text id="banMes" x="250" y="188" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="16" fill="${K}"></text></g>`;
  // painel da senha
  s += `<g><rect x="460" y="52" width="110" height="46" rx="6" fill="#26282b" stroke="${K}" stroke-width="2.6"/><text id="banPainel" x="515" y="85" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="24" fill="#ff5a3c">A 040</text></g>`;
  // o gerente atrás do balcão
  s += `<g id="banGer" transform="translate(250 346) scale(1.05)">${gerente()}</g>`;
  // o balcão com o papel da prestação
  s += `<g><rect x="180" y="300" width="300" height="110" fill="#f3efe6" stroke="${K}" stroke-width="3"/><rect x="172" y="290" width="316" height="14" rx="3" fill="#0c5e3f" stroke="${K}" stroke-width="2.6"/>${[0, 1, 2].map((k) => `<rect x="${204 + k * 94}" y="318" width="66" height="76" fill="none" stroke="${K}" stroke-width="1.6" opacity=".35"/>`).join("")}
    <g id="banPapel" transform="rotate(-4 410 262)"><rect x="342" y="228" width="136" height="64" fill="#fff" stroke="${K}" stroke-width="2"/><text x="410" y="245" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="9.5" fill="#6e675e">PRESTAÇÃO POR MÊS</text><text id="banPrest" x="410" y="276" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="26" fill="${K}"></text><text id="banTanP" x="410" y="288" text-anchor="middle" font-family="Archivo" font-weight="600" font-size="8.5" fill="#6e675e"></text></g></g>`;
  // o Rui e a Marta à frente do balcão
  s += `<g id="banRui" transform="translate(120 440) scale(.95)">${rui()}</g><g id="banMarta" transform="translate(560 440) scale(-.95 .95)">${marta()}</g>`;
  return s;
}

/** Os dois gráficos empilhados, com o mesmo tempo: Euribor+taxa (e a faixa do spread) em cima, prestação em baixo. */
export function graficoBanco(
  eur: readonly Ponto[],
  o: { capital: number; anos: number; spread: number },
  aria: string
): {
  svg: string;
  x: (k: number) => number;
  ya: (v: number) => number;
  yb: (v: number) => number;
  prs: number[];
} {
  const n = eur.length;
  const GB = { x0: 58, x1: 500, a0: 128, a1: 16, b0: 262, b1: 156 };
  const x = (k: number) => GB.x0 + ((GB.x1 - GB.x0) * k) / (n - 1);
  const tMin = Math.min(-1, Math.floor(Math.min(...eur.map((p) => p.v))));
  const tMax = Math.ceil(Math.max(...eur.map((p) => p.v)) + o.spread + 0.5);
  const ya = (v: number) => GB.a0 - ((GB.a0 - GB.a1) * (v - tMin)) / (tMax - tMin);
  const prs = eur.map((p) => prestacaoDe(o.capital, o.anos, p.v, o.spread));
  const pMax = Math.ceil(Math.max(...prs) / 100) * 100 + 100;
  const pMin = Math.max(0, Math.floor(Math.min(...prs) / 100) * 100 - 100);
  const yb = (v: number) => GB.b0 - ((GB.b0 - GB.b1) * (v - pMin)) / (pMax - pMin);

  let s = "";
  for (let v = tMin; v <= tMax; v++)
    s += `<path d="M${GB.x0} ${ya(v).toFixed(1)} H${GB.x1}" stroke="currentColor" stroke-opacity="${v === 0 ? 0.5 : 0.1}"/><text x="${GB.x0 - 8}" y="${(ya(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${v < 0 ? "−" : ""}${Math.abs(v)}${FINO}%</text>`;
  const passoP = pMax - pMin > 600 ? 200 : 100;
  for (let v = pMin; v <= pMax; v += passoP)
    s += `<path d="M${GB.x0} ${yb(v).toFixed(1)} H${GB.x1}" stroke="currentColor" stroke-opacity=".1"/><text x="${GB.x0 - 8}" y="${(yb(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${fmtNum(v, 0)}${FINO}€</text>`;
  eur.forEach((p, k) => {
    if (p.t.endsWith("-01"))
      s += `<text x="${x(k).toFixed(1)}" y="${GB.b0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${p.t.slice(0, 4)}</text><path d="M${x(k).toFixed(1)} ${GB.b0} v5" stroke="currentColor" stroke-opacity=".5"/>`;
  });
  const linha = (f: (p: Ponto, k: number) => number) => eur.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${f(p, k).toFixed(1)}`).join(" ");
  // a faixa do spread entre a Euribor e a taxa
  s += `<path d="${linha((p) => ya(p.v + o.spread))} ${eur.map((_, k) => `L${x(n - 1 - k).toFixed(1)} ${ya(eur[n - 1 - k].v).toFixed(1)}`).join(" ")} Z" fill="#ffc62b" fill-opacity=".45"/>`;
  s += `<path d="${linha((p) => ya(p.v))}" fill="none" stroke="#2445d6" stroke-width="3"/>`;
  s += `<path d="${linha((p) => ya(p.v + o.spread))}" fill="none" stroke="#16130f" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<path d="${linha((_, k) => yb(prs[k]))}" fill="none" stroke="#e2412a" stroke-width="3"/><path d="M${GB.x0} ${GB.b0} H${GB.x1}" stroke="#16130f" stroke-width="2"/>`;
  s += `<text x="${GB.x0 + 6}" y="${GB.a1 + 4}" font-family="Caveat" font-weight="700" font-size="19" fill="#2445d6">a Euribor (muda com o mercado)</text>`;
  s += `<text x="${GB.x0 + 6}" y="${ya(Math.min(tMax - 0.6, 2.3)).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="17" fill="#7a5600">o spread do banco</text>`;
  s += `<text x="${GB.x0 + 6}" y="${GB.b1 - 6}" font-family="Caveat" font-weight="700" font-size="19" fill="#c7361f">a prestação (sobe e desce com ela)</text>`;
  s += `<g><path id="banCursor" stroke="#16130f" stroke-width="1.6" stroke-dasharray="3 3"/><circle id="banPa" r="6" fill="#2445d6" stroke="#16130f" stroke-width="2"/><circle id="banPb" r="6" fill="#e2412a" stroke="#16130f" stroke-width="2"/></g>`;
  return { svg: `<svg class="grafico-irs" viewBox="0 0 520 285" role="img" aria-label="${aria}" font-family="Archivo">${s}</svg>`, x, ya, yb, prs };
}

/**
 * Mostra o mês `k` no quadro, no papel e na taxa. Sem `virar` as letras
 * mudam direto; com `virar` (GSAP, só com movimento) cada palheta que
 * muda vira como no protótipo — a letra final é sempre a mesma.
 */
export function mostrarMesSvg(
  raiz: ParentNode,
  eur: readonly Ponto[],
  k: number,
  o: { capital: number; anos: number; spread: number },
  virar?: (palheta: Element, texto: Element, novo: string) => void
): { tan: number; pr: number } {
  const p = eur[k];
  const tan = p.v + o.spread;
  const pr = prestacaoDe(o.capital, o.anos, p.v, o.spread);
  // o quadro: 7 palhetas
  const cel = quadroTexto(p.v);
  raiz.querySelectorAll<SVGGElement>(".palheta").forEach((p, i) => {
    const t = p.querySelector<SVGTextElement>(".pal-t");
    if (!t) return;
    const novo = cel[i] === " " ? "" : cel[i];
    if (t.textContent === novo) return;
    if (virar) virar(p, t, novo);
    else t.textContent = novo;
  });
  const mes = raiz.querySelector<SVGTextElement>("#banMes");
  if (mes) mes.textContent = mesLongo(p.t);
  const prest = raiz.querySelector<SVGTextElement>("#banPrest");
  if (prest) prest.textContent = fmtEUR0(pr);
  const tanP = raiz.querySelector<SVGTextElement>("#banTanP");
  if (tanP) tanP.textContent = `taxa ${pct2(tan)} = Euribor + spread`;
  return { tan, pr };
}

/** O cursor dos gráficos no mês `k`. */
export function cursorGrafico(
  raiz: ParentNode,
  g: { x: (k: number) => number; ya: (v: number) => number; yb: (v: number) => number; prs: number[] },
  eur: readonly Ponto[],
  k: number
): void {
  const xx = g.x(k).toFixed(1);
  const q = (id: string) => raiz.querySelector<SVGElement>(`#${id}`);
  q("banCursor")?.setAttribute("d", `M${xx} 16 V262`);
  const pa = q("banPa");
  if (pa) {
    pa.setAttribute("cx", String(g.x(k)));
    pa.setAttribute("cy", String(g.ya(eur[k].v)));
  }
  const pb = q("banPb");
  if (pb) {
    pb.setAttribute("cx", String(g.x(k)));
    pb.setAttribute("cy", String(g.yb(g.prs[k])));
  }
}

/* ————— pessoas do interior: a MESMA personagem do mapa (`pessoa()`), com
   as especificações do protótipo — nada de mini-figuras ————— */
const gerente = (): string => pessoa({ pele: "d", cabelo: "curto", corCabelo: "#1d1410", roupa: "#26282b", calcas: "#26282b", gravata: "#e2412a", gola: "#fff" });
const rui = (): string => pessoa(ELENCO.rui);
const marta = (): string => pessoa(ELENCO.marta);
