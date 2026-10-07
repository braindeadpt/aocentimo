/**
 * O interior da Mercearia em SVG — a porta de `interiorMercearia()`,
 * `barrasSubida()` e `graficoIndice()` do protótipo (`cena-mercearia.js`),
 * funções puras. Nenhum preço em euros é inventado: «o que custava 1 €
 * em T0 custa hoje X €» é a razão entre dois índices — e é tudo.
 */
import { FINO, fmtNum } from "@/lib/format";
import type { DadosMercearia, ItemMerc, SerieCena } from "./dados";
import { pontosDaSerie } from "./utils";
import { pessoa, ELENCO } from "@/lib/bairro/personagens";

const K = "#16130f";

export const mesCurto = (t: string) => {
  const M = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${M[+t.slice(5, 7) - 1]} ${t.slice(0, 4)}`;
};
export const mesLongo = (t: string) => {
  const M = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${M[+t.slice(5, 7) - 1]} de ${t.slice(0, 4)}`;
};

/** A variação como texto: 1,234 → «+23,4 %» (o `pctVar` do protótipo). */
export function pctVar(r: number): string {
  const v = fmtNum(Math.abs(r - 1) * 100, 1);
  return `${r >= 1 ? "+" : "−"}${v}${FINO}%`;
}

/** A razão índice(T1)/índice(T0) de uma série compacta, ou 0 se falta um ponto. */
export function razao(serie: SerieCena, t0: string): number {
  const ps = pontosDaSerie(serie);
  const a = ps.find((p) => p.t === t0);
  const b = ps[ps.length - 1];
  if (!a || !b || !a.v) return 0;
  return b.v / a.v;
}

/** Os itens ordenados pela subida (o que mais subiu primeiro). */
export function itensOrdenados(D: DadosMercearia): (ItemMerc & { r: number })[] {
  return D.itens
    .map((it) => ({ ...it, r: razao(it.serie, D.t0) }))
    .sort((a, b) => b.r - a.r);
}

/* ————— os produtos desenhados (ícones do protótipo, pés em y = 0) ————— */

const ICONE: Record<string, string> = {
  pao: `<ellipse cx="0" cy="-14" rx="26" ry="14" fill="#d9964a" stroke="${K}" stroke-width="2.4"/><path d="M-14 -22 q4 6 0 12 M-2 -25 q4 7 0 14 M10 -22 q4 6 0 12" fill="none" stroke="#a8672e" stroke-width="2.2" stroke-linecap="round"/>`,
  carne: `<path d="M-24 -10 q-4 -22 18 -24 q24 -2 28 12 q4 14 -14 18 q-22 4 -32 -6z" fill="#d9483a" stroke="${K}" stroke-width="2.4"/><path d="M-18 -12 q10 -10 28 -8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="-14" r="4" fill="#fff" stroke="${K}" stroke-width="1.6"/>`,
  peixe: `<path d="M-26 -14 q20 -18 40 0 q-20 18 -40 0z" fill="#8fb4c9" stroke="${K}" stroke-width="2.4"/><path d="M14 -14 l14 -10 v20 z" fill="#8fb4c9" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-16" cy="-16" r="2.4" fill="${K}"/><path d="M-6 -20 q4 6 0 12 M2 -20 q4 6 0 12" fill="none" stroke="#5f8aa3" stroke-width="1.6"/>`,
  leite: `<path d="M-18 0 v-34 l6 -8 h14 l6 8 v34 z" fill="#fff" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><rect x="-18" y="-24" width="26" height="12" fill="#2445d6"/><ellipse cx="18" cy="-9" rx="8" ry="10" fill="#fbf1dc" stroke="${K}" stroke-width="2.2"/>`,
  azeite: `<path d="M-9 0 v-30 q0 -6 5 -8 v-8 h8 v8 q5 2 5 8 v30 z" fill="#8a9a2e" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><rect x="-7" y="-26" width="14" height="12" fill="#f4efe4" stroke="${K}" stroke-width="1.4"/><rect x="-4" y="-50" width="8" height="5" fill="${K}"/><rect x="14" y="-14" width="18" height="14" rx="2" fill="#f7d774" stroke="${K}" stroke-width="2"/>`,
  fruta: `<circle cx="-10" cy="-13" r="13" fill="#e2412a" stroke="${K}" stroke-width="2.4"/><path d="M-10 -26 q2 -6 6 -8" stroke="${K}" stroke-width="2" fill="none"/><path d="M-6 -30 q6 -4 10 0 q-6 3 -10 0z" fill="#4fae6a" stroke="${K}" stroke-width="1.2"/><circle cx="14" cy="-11" r="11" fill="#f39c2b" stroke="${K}" stroke-width="2.4"/>`,
  legumes: `<path d="M-22 -4 l26 -26 q6 -2 4 6 l-26 22 q-6 2 -4 -2z" fill="#f28c28" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 -30 l6 -8 M6 -28 l10 -4" stroke="#4fae6a" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="-12" r="12" fill="#7cc98c" stroke="${K}" stroke-width="2.4"/><path d="M8 -12 q8 -8 16 0 M10 -6 q6 -6 12 0" fill="none" stroke="#3f9b52" stroke-width="1.6"/>`,
  acucar: `<path d="M-16 0 v-30 q0 -6 4 -8 h24 q4 2 4 8 v30 z" fill="#fff" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><text x="0" y="-15" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7.5" fill="${K}">AÇÚCAR</text><rect x="16" y="-12" width="16" height="12" rx="3" fill="#8a4a2b" stroke="${K}" stroke-width="2"/>`,
};

const PRATELEIRA: [string, number, number][] = [
  ["pao", 80, 150],
  ["leite", 180, 150],
  ["carne", 280, 150],
  ["peixe", 380, 150],
  ["fruta", 80, 272],
  ["legumes", 180, 272],
  ["azeite", 280, 272],
  ["acucar", 380, 272],
];

/** O interior: prateleiras com etiquetas «1 € em 2020», o balcão e o Sr. Manuel. */
export function interiorMercearia(): string {
  let s = `<defs><pattern id="mercAz" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#eaf7ef"/><path d="M8 2 q6 6 0 12 q-6 -6 0 -12z" fill="#0c8f5c" opacity=".55"/></pattern>
    <pattern id="mercChao" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#d9cdb6"/><rect width="20" height="10" fill="#c9bb9f"/><rect x="20" y="10" width="20" height="10" fill="#c9bb9f"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="url(#mercAz)"/><rect x="0" y="410" width="640" height="60" fill="url(#mercChao)" stroke="${K}" stroke-width="2.6"/>`;
  s += `<rect x="130" y="16" width="380" height="34" rx="6" fill="#fff6e3" stroke="${K}" stroke-width="2.8"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="${K}">MERCEARIA DO MANUEL</text>`;
  // a estante com duas prateleiras
  s += `<rect x="24" y="70" width="412" height="300" fill="#8a5a2b" stroke="${K}" stroke-width="3"/><rect x="36" y="80" width="388" height="280" fill="#f3e6cf" stroke="${K}" stroke-width="2"/>`;
  for (const y of [150, 272]) s += `<rect x="30" y="${y}" width="400" height="12" fill="#b98552" stroke="${K}" stroke-width="2.4"/>`;
  for (const [id, x, y] of PRATELEIRA) {
    // o `.prod-i` interior é o que salta: o GSAP mexe no transform dele
    // sem apagar o translate da prateleira
    s += `<g class="prod" data-id="${id}" transform="translate(${x} ${y})"><g class="prod-i">${ICONE[id]}</g></g>`;
    s += `<g class="etiq" id="etq-${id}" transform="translate(${x} ${y + 14})"><path d="M-36 0 h72 v26 h-72z" fill="#fff" stroke="${K}" stroke-width="2"/><text class="etq-a" x="0" y="11" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="8.5" fill="#6e675e">1 € em 2020</text><text class="etq-b" x="0" y="23" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="12" fill="${K}">?</text></g>`;
  }
  // o balcão: caixa registadora, o talão escondido, o saco, o Sr. Manuel
  s += `<g id="mercManuel" transform="translate(540 352) scale(1.05)">${manuel()}</g>`;
  s += `<rect x="450" y="300" width="186" height="110" fill="#b98552" stroke="${K}" stroke-width="3"/><rect x="444" y="290" width="198" height="14" rx="3" fill="#6b4226" stroke="${K}" stroke-width="2.6"/>`;
  s += `<g><rect x="452" y="262" width="44" height="30" rx="4" fill="#c9ced3" stroke="${K}" stroke-width="2.2"/><rect x="458" y="254" width="32" height="10" fill="#e9ecef" stroke="${K}" stroke-width="2"/><rect x="460" y="270" width="28" height="10" fill="#1d2024"/><text x="474" y="278.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7" fill="#6fe07a">0,000</text></g>`;
  s += `<g><rect x="584" y="250" width="50" height="42" rx="5" fill="#2c3036" stroke="${K}" stroke-width="2.4"/><rect x="590" y="256" width="38" height="12" fill="#6fe07a" stroke="${K}" stroke-width="1.4"/><path d="M592 274 h10 M606 274 h10 M620 274 h8 M592 282 h10 M606 282 h10" stroke="#aeb4ba" stroke-width="3"/>
    <g id="mercTalaoArte" opacity="0"><rect x="596" y="210" width="26" height="42" fill="#fff" stroke="${K}" stroke-width="1.6"/><path d="M600 220 h18 M600 226 h14 M600 232 h18 M600 238 h10" stroke="${K}" stroke-width="1" opacity=".5"/></g></g>`;
  s += `<g id="mercSaco" transform="translate(478 452) scale(1.35)"><path d="M-26 0 l4 -44 h44 l4 44z" fill="#f3e6cf" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-12 -44 q12 -18 24 0" fill="none" stroke="${K}" stroke-width="2.4"/><path d="M-10 -44 v-8 q10 -12 20 0 v8" fill="#4fae6a" stroke="${K}" stroke-width="1.6"/><circle cx="-6" cy="-48" r="7" fill="#e2412a" stroke="${K}" stroke-width="1.6"/><text id="mercSacoTxt" x="0" y="-16" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="11" fill="${K}">10 €</text></g>`;
  return s;
}

/** As etiquetas mostram o preço de hoje do que custava 1 € em T0. */
export function etiquetasDe(D: DadosMercearia, raiz: ParentNode): void {
  for (const it of itensOrdenados(D)) {
    const g = raiz.querySelector(`#etq-${it.id}`);
    if (!g) continue;
    const b = g.querySelector(".etq-b");
    if (b) b.textContent = textoEtiqueta(it.r);
  }
}

/** O texto de baixo de uma etiqueta: o preço de hoje do que custava 1 €. */
export const textoEtiqueta = (r: number): string => (r ? `${fmtNum(r, 2)} € hoje` : "—");

/** «Ver outra vez»: a mercearia volta ao estado de abertura (o protótipo redesenhava o interior). */
export function reporMercearia(raiz: ParentNode): void {
  raiz.querySelectorAll(".etq-b").forEach((b) => (b.textContent = "?"));
  const saco = raiz.querySelector("#mercSacoTxt");
  if (saco) saco.textContent = "10 €";
  const t = raiz.querySelector<SVGGElement>("#mercTalaoArte");
  if (t) {
    t.setAttribute("opacity", "0");
    t.style.opacity = "";
    t.style.transform = "";
  }
  raiz.querySelectorAll(".prod").forEach((g) => g.classList.remove("realce"));
}

/** As barras: quanto subiu cada produto desde T0, com a marca da inflação geral. */
export function barrasSubida(D: DadosMercearia, ariaGeral: string): { html: string; total: number } {
  const itens = itensOrdenados(D);
  const total = razao(D.total, D.t0);
  const max = Math.max(...itens.map((i) => i.r - 1));
  const esc = (r: number) => ((r - 1) / (max * 1.08)) * 100;
  const html =
    `<div class="b-subidas" role="list">` +
    itens
      .map(
        (it, k) =>
          `<div class="b-sub-l" role="listitem"><span class="b-sub-n">${it.nome}${it.ex ? ` <small>${it.ex}</small>` : ""}</span><span class="b-sub-b"><i style="width:${esc(it.r).toFixed(1)}%" class="${k === 0 ? "top" : ""}"></i><em style="left:${esc(total).toFixed(1)}%" aria-hidden="true"></em></span><b>${pctVar(it.r)}</b></div>`
      )
      .join("") +
    `<div class="b-sub-leg"><span><em aria-hidden="true"></em>${ariaGeral}: ${pctVar(total)}</span></div></div>`;
  return { html, total };
}

/** O gráfico do índice: 100 = preço em T0; o produto contra a inflação geral. */
export function graficoIndice(D: DadosMercearia, it: ItemMerc & { r: number }): string {
  const GM = { x0: 52, x1: 500, y0: 250, y1: 18 };
  const base = (serie: SerieCena) => {
    const pts = pontosDaSerie(serie);
    const b = pts.find((p) => p.t === D.t0)?.v ?? 1;
    return pts.map((p) => ({ t: p.t, v: (p.v / b) * 100 }));
  };
  const a = base(it.serie);
  const tot = base(D.total);
  const n = Math.min(a.length, tot.length);
  const todos = [...a.slice(0, n), ...tot.slice(0, n)].map((p) => p.v);
  const lo = Math.floor(Math.min(...todos) / 10) * 10;
  const hi = Math.ceil(Math.max(...todos) / 10) * 10;
  const x = (k: number) => GM.x0 + ((GM.x1 - GM.x0) * k) / (n - 1);
  const y = (v: number) => GM.y0 - ((GM.y0 - GM.y1) * (v - lo)) / (hi - lo);
  let s = "";
  for (let v = lo; v <= hi; v += 10)
    s += `<path d="M${GM.x0} ${y(v).toFixed(1)} H${GM.x1}" stroke="currentColor" stroke-opacity="${v === 100 ? 0.55 : 0.1}" ${v === 100 ? 'stroke-dasharray="2 3"' : ""}/><text x="${GM.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e" font-weight="${v === 100 ? 800 : 400}">${v}</text>`;
  a.forEach((p, k) => {
    if (k < n && p.t.endsWith("-01"))
      s += `<text x="${x(k).toFixed(1)}" y="${GM.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${p.t.slice(0, 4)}</text>`;
  });
  const k0 = a.findIndex((p) => p.t === D.t0);
  const linha = (arr: { v: number }[]) => arr.slice(0, n).map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  s += `<path d="${linha(tot)}" fill="none" stroke="#16130f" stroke-width="2" stroke-dasharray="5 4"/><path d="${linha(a)}" fill="none" stroke="#e2412a" stroke-width="3.2"/>`;
  s += `<path d="M${GM.x0} ${GM.y0} H${GM.x1}" stroke="#16130f" stroke-width="2"/>`;
  if (k0 >= 0)
    s += `<circle cx="${x(k0).toFixed(1)}" cy="${y(100).toFixed(1)}" r="6" fill="#fff" stroke="#16130f" stroke-width="2.4"/><text x="${(x(k0) + 8).toFixed(1)}" y="${(y(100) + 22).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="18" fill="#16130f">100 = o preço em ${mesCurto(D.t0)}</text>`;
  const kz = n - 1;
  const geral = Math.round(tot[kz]?.v ?? 100);
  s += `<circle cx="${x(kz).toFixed(1)}" cy="${y(a[kz].v).toFixed(1)}" r="6.5" fill="#e2412a" stroke="#16130f" stroke-width="2"/><text x="${(x(kz) - 8).toFixed(1)}" y="${(y(a[kz].v) - 12).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="20" fill="#c7361f">${Math.round(a[kz].v)}: ${pctVar(it.r)}</text>`;
  s += `<text x="${(x(kz) - 8).toFixed(1)}" y="${(y(tot[kz].v) + 20).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="17" fill="#16130f">inflação geral: ${geral}</text>`;
  const hoje = Math.round(a[kz].v);
  const aria = `Índice de preços de ${it.nome}, com 100 no preço de ${mesLongo(D.t0)}: hoje vale ${hoje}. A inflação geral, a tracejado, vale ${geral}.`;
  return `<svg class="grafico-irs" viewBox="0 0 520 280" role="img" aria-label="${aria}" font-family="Archivo">${s}</svg>`;
}

/** O talão do IVA: por cada 10 € gastos, quanto é IVA (taxas de data/). */
export function talaoIva(D: DadosMercearia): { html: string; aria: string } {
  const t = Object.fromEntries(D.iva.taxas.map((x) => [x.nome, x.taxa]));
  const letra: Record<string, string> = { Reduzida: "A", "Intermédia": "B", Normal: "C" };
  const linhas: [string, string][] = [
    ["Pão", "Reduzida"],
    ["Leite", "Reduzida"],
    ["Fruta e legumes", "Reduzida"],
    ["Conservas", "Intermédia"],
    ["Vinho", "Intermédia"],
    ["Outros produtos *", "Normal"],
  ];
  const ivaDe = (taxa: number) => (10 * taxa) / (1 + taxa);
  const soma: Record<string, number> = {};
  for (const [, n] of linhas) soma[n] = (soma[n] ?? 0) + ivaDe(t[n]);
  const totIva = Object.values(soma).reduce((a, b) => a + b, 0);
  const em10 = (n: string) => `${fmtNum(ivaDe(t[n]), 2)} €`;
  const aria = `Talão de exemplo: por cada 10 euros em pão, leite e fruta e legumes, ${em10("Reduzida")} são IVA; em conservas e vinho, ${em10("Intermédia")}; nos outros produtos, ${em10("Normal")}.`;
  const html =
    `<div class="b-talao" role="img" aria-label="${aria}">` +
    `<b class="t-cab">MERCEARIA DO MANUEL</b><span class="t-sub">por cada 10,00 € que pagas em…</span>` +
    linhas.map(([nome, n]) => `<span class="t-l"><span>${nome}</span><span>10,00 ${letra[n]}</span></span>`).join("") +
    `<span class="t-sep"></span><span class="t-l"><b>TOTAL</b><b>60,00</b></span><span class="t-sep"></span><span class="t-sub">IVA incluído no preço</span>` +
    Object.keys(soma)
      .map((n) => `<span class="t-l"><span>${letra[n]} · taxa ${n.toLowerCase()} ${fmtNum(t[n] * 100, 0)}${FINO}%</span><span>${fmtNum(soma[n], 2)}</span></span>`)
      .join("") +
    `<span class="t-l t-tot"><b>IVA total</b><b>${fmtNum(totIva, 2)} €</b></span></div>`;
  return { html, aria };
}

/* ————— pessoas do interior: a MESMA personagem do mapa (`pessoa()`), com
   as especificações do protótipo — nada de mini-figuras ————— */
const manuel = (): string => pessoa(ELENCO.manuel);
