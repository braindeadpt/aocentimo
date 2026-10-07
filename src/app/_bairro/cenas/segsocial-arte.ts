/**
 * O interior da Segurança Social em SVG — a porta do desenho de
 * `cenaSegSocial()` do protótipo (`cenas-bairro.js`): o guiché A, a
 * funcionária, a Inês com o recibo e o mealheiro comum onde caem as
 * moedas dos descontos dela e da empresa.
 *
 * O nível do mealheiro é o total REAL (trabalhador + TSU) — a cena
 * escreve-o com `nivel()`; a chuva de moedas é GSAP no componente
 * (estado final garantido pelo nível, como manda a casa).
 *
 * Os ids são os do protótipo: `ssPainel`, `ssFunc`, `ssMeal`,
 * `ssNivel`, `ssMealTxt`, `ssInes`, `ssMoedas`.
 */
import { fmtEUR } from "@/lib/format";
import { pessoa, ELENCO } from "@/lib/bairro/personagens";

const K = "#16130f";

const painelSenha = (id: string, x: number, y: number, txt: string): string =>
  `<g><rect x="${x}" y="${y}" width="120" height="50" rx="7" fill="#26282b" stroke="${K}" stroke-width="2.6"/><text x="${x + 60}" y="${y + 16}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="9" letter-spacing=".14em" fill="#c9c4b8">SENHA</text><text id="${id}" x="${x + 60}" y="${y + 41}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="#ff5a3c">${txt}</text></g>`;

/** A moeda que cai no mealheiro (o `moedaSvg` do protótipo). */
export const moedaSvg = (x: number, y: number, r = 11): string =>
  `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#f0a468" stroke="${K}" stroke-width="2.2"/><text y="${(r * 0.36).toFixed(1)}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="${(r * 0.95).toFixed(1)}" fill="${K}">€</text></g>`;

/** O interior: parede, guiché A, a Inês e o mealheiro comum. */
export function interiorSegSocial(): string {
  let s = `<defs><pattern id="b-ssAz" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f7f9ff"/><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" fill="none" stroke="#2445d6" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#2445d6"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="#eef1f6"/><rect x="0" y="410" width="640" height="60" fill="#d6ccb7" stroke="${K}" stroke-width="2.6"/>`;
  s += `<rect x="196" y="16" width="248" height="34" rx="6" fill="#2445d6" stroke="${K}" stroke-width="2.6"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="#fff">SEGURANÇA SOCIAL</text>`;
  s += `<rect x="0" y="300" width="640" height="110" fill="url(#b-ssAz)"/><rect x="0" y="296" width="640" height="8" fill="#d8cbb4" stroke="${K}" stroke-width="2"/>`;
  s += painelSenha("ssPainel", 500, 70, "A 106");
  s += `<g id="ssFunc" transform="translate(190 330) scale(1.02)">${funcionaria()}</g>`;
  s += `<rect x="80" y="290" width="230" height="120" fill="#e7d3b0" stroke="${K}" stroke-width="3"/><rect x="72" y="280" width="246" height="14" rx="3" fill="#2445d6" stroke="${K}" stroke-width="2.6"/><rect x="170" y="310" width="50" height="30" rx="4" fill="#fff" stroke="${K}" stroke-width="2.2"/><text x="195" y="332" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${K}">A</text>`;
  // o mealheiro comum
  s += `<g id="ssMeal"><path d="M380 404 V200 q0 -18 18 -22 h124 q18 4 18 22 V404 q0 10 -10 10 H390 q-10 0 -10 -10z" fill="#eef7fb" stroke="${K}" stroke-width="3"/><rect x="430" y="168" width="60" height="14" rx="4" fill="#26282b"/>
    <rect id="ssNivel" x="383" y="404" width="154" height="0" fill="#f0a468" opacity=".85"/><text x="460" y="440" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="13" fill="${K}">o bolo comum</text><text id="ssMealTxt" x="460" y="230" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="20" fill="${K}"></text></g>`;
  s += `<g id="ssInes" transform="translate(340 440) scale(.92)">${ines()}<rect x="16" y="-66" width="18" height="24" fill="#fff" stroke="${K}" stroke-width="1.8"/></g>`;
  s += `<g id="ssMoedas"></g>`;
  return s;
}

/**
 * O nível do mealheiro no estado `v` euros — o 900 do protótipo é o
 * topo da escala do copo (200 px para 900 €). Sem animação escreve-se
 * directamente; com GSAP a cena tweena `y`/`height`.
 */
export function nivel(raiz: ParentNode, v: number): { y: number; h: number } {
  const h = (200 * v) / 900;
  const el = raiz.querySelector("#ssNivel");
  const txt = raiz.querySelector("#ssMealTxt");
  if (txt) txt.textContent = v ? fmtEUR(v) : "";
  if (el) {
    el.setAttribute("y", String(404 - h));
    el.setAttribute("height", String(h));
  }
  return { y: 404 - h, h };
}

/** O recibo da Inês — a mesma classe `.b-talao` da Mercearia. Os valores chegam já formatados. */
export function reciboInes(o: {
  linhas: { bruto: string; ss: string; tsu: string; total: string };
  textos: { cab: string; bruto: string; ss: string; sub: string; tsu: string; total: string };
}): string {
  const t = o.textos;
  return (
    `<div class="b-talao" role="img" aria-label="${t.cab}: bruto ${o.linhas.bruto}, Segurança Social ${o.linhas.ss}, mais ${o.linhas.tsu} da empresa — ${o.linhas.total} no total.">` +
    `<b class="t-cab">${t.cab}</b>` +
    `<span class="t-l"><span>${t.bruto}</span><span>${o.linhas.bruto}</span></span>` +
    `<span class="t-l"><span>${t.ss}</span><span>−${o.linhas.ss}</span></span>` +
    `<span class="t-sep"></span><span class="t-sub">${t.sub}</span>` +
    `<span class="t-l"><span>${t.tsu}</span><span>+${o.linhas.tsu}</span></span>` +
    `<span class="t-sep"></span><span class="t-l t-tot"><b>${t.total}</b><b>${o.linhas.total}</b></span></div>`
  );
}

/**
 * As barras «por cada 100 €»: Inês (ela + empresa) contra Pedro
 * (sozinho). O `barras-quem` do protótipo — a escala é ×2 (50 → 100 %).
 */
export function barrasQuem(o: {
  inesEla: number;
  inesEmp: number;
  pedro: number;
  aria: string;
  textos: { ines: string; pedro: string; ela: string; empresa: string; ele: string; legenda: string };
}): string {
  const t = o.textos;
  return (
    `<div class="b-barras-quem" role="img" aria-label="${o.aria}">` +
    `<span class="bq-n">${t.ines}</span><span class="bq-b"><i class="eu" style="width:${o.inesEla * 2}%">${t.ela}</i><i class="emp" style="width:${o.inesEmp * 2}%">${t.empresa}</i></span>` +
    `<span class="bq-n">${t.pedro}</span><span class="bq-b"><i class="eu" style="width:${o.pedro * 2}%">${t.ele}</i></span>` +
    `<span></span><span class="bq-leg">${t.legenda}</span></div>`
  );
}

/* ————— pessoas do interior: a MESMA personagem do mapa (`pessoa()`), com
   as especificações do protótipo — nada de mini-figuras ————— */
const funcionaria = (): string => pessoa({ pele: "a", cabelo: "bob", corCabelo: "#8a5a2b", roupa: "#2445d6", calcas: "#2b3a55", gola: "#fff", oculos: "quadrados" });
const ines = (): string => pessoa(ELENCO.ines);
