/**
 * O interior das Finanças em SVG — a porta de `interiorFinancas()` e
 * `graficoIrs()` do protótipo (`cena-financas.js`), como funções puras
 * que devolvem a string SVG. O React injeta-as com
 * `dangerouslySetInnerHTML`, como o mapa.
 *
 * A regra do desenho é a de `iso.ts`: o protótipo é o contrato visual.
 * Os ids (`finPainel`, `gav0`…, `grMarg`…) são os que a cena manipula.
 */
import { FINO, fmtNum } from "@/lib/format";
import { pessoa, ELENCO } from "@/lib/bairro/personagens";

/** O traço do mapa: o mesmo preto do resto do bairro. */
const K = "#16130f";

const GV = { x: 372, y: 34, w: 250, h: 38, gap: 4 };

const ordinal = (n: number): string => `${n}.º`;

/** A taxa como texto: 0,125 → «12,5 %» (o `pctT` do protótipo). */
export function pctTaxa(t: number): string {
  const v = Math.round(t * 10000) / 100;
  const casas = Number.isInteger(v) ? 0 : Number.isInteger(Math.round(v * 100) / 10) ? 1 : 2;
  return fmtNum(v, casas) + FINO + "%";
}

/** A moeda a N casas, com o fino do site. */
export function moeda(v: number, casas = 0): string {
  return fmtNum(v, casas) + FINO + "€";
}

/** O interior: parede, lambrim de azulejo, chão, placa, relógio, senhas, balcão, a cómoda das gavetas. */
export function interiorFinancas(
  escaloes: { de: number; ate: number | null; taxa: number }[]
): string {
  const n = escaloes.length;
  const altura = n * (GV.h + GV.gap) + 16;
  let s = `<defs><pattern id="finAz" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f7f9ff"/><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" fill="none" stroke="#2445d6" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#2445d6"/></pattern>
    <pattern id="finChao" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#e4dccb"/><rect width="20" height="10" fill="#d6ccb7"/><rect x="20" y="10" width="20" height="10" fill="#d6ccb7"/></pattern></defs>`;
  // parede, lambrim, chão
  s += `<rect x="0" y="0" width="640" height="410" fill="#f4efe4"/><rect x="0" y="250" width="640" height="160" fill="url(#finAz)"/><rect x="0" y="246" width="640" height="8" fill="#d8cbb4" stroke="${K}" stroke-width="2"/><rect x="0" y="410" width="640" height="60" fill="url(#finChao)" stroke="${K}" stroke-width="2.6"/>`;
  // placa e relógio
  s += `<rect x="190" y="26" width="150" height="30" rx="5" fill="${K}"/><text x="265" y="47" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="#fff">FINANÇAS</text>`;
  s += `<circle cx="265" cy="100" r="22" fill="#fbfaf6" stroke="${K}" stroke-width="3"/><path d="M265 100 v-14 M265 100 h10" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`;
  // painel da senha
  s += `<g><rect x="30" y="26" width="140" height="74" rx="8" fill="#26282b" stroke="${K}" stroke-width="3"/><text x="100" y="45" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="10" letter-spacing=".14em" fill="#c9c4b8">SENHA · BALCÃO</text>
    <text id="finPainel" x="100" y="86" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="32" fill="#ff5a3c" font-variant-numeric="tabular-nums">A 022</text></g>`;
  // máquina das senhas com o talão escondido
  s += `<g><rect x="36" y="150" width="70" height="110" rx="10" fill="#e2412a" stroke="${K}" stroke-width="3"/><rect x="46" y="162" width="50" height="28" rx="4" fill="#fff" stroke="${K}" stroke-width="2"/><text x="71" y="181" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="12" fill="${K}">A · IRS</text><rect x="52" y="206" width="38" height="6" rx="3" fill="${K}"/><rect x="62" y="260" width="18" height="150" fill="#9aa3ad" stroke="${K}" stroke-width="2.4"/>
    <g id="finTalao" opacity="0"><rect x="53" y="208" width="36" height="46" fill="#fff" stroke="${K}" stroke-width="1.8"/><text x="71" y="224" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="7" fill="${K}">SENHA</text><text x="71" y="243" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="13" fill="${K}">A 023</text></g></g>`;
  // funcionário e balcão
  s += `<g id="finFunc" transform="translate(222 352) scale(1.05)">${funcionario()}</g>`;
  s += `<g><rect x="130" y="300" width="220" height="110" fill="#b98552" stroke="${K}" stroke-width="3"/><rect x="122" y="292" width="236" height="12" rx="3" fill="#8a5a2b" stroke="${K}" stroke-width="2.6"/>${[0, 1, 2, 3].map((k) => `<path d="M${148 + k * 52} 318 v76" stroke="${K}" stroke-width="1.4" opacity=".35"/>`).join("")}
    <rect x="200" y="322" width="80" height="34" rx="5" fill="#fff" stroke="${K}" stroke-width="2.4"/><text x="240" y="345" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${K}">A</text><rect x="296" y="278" width="34" height="16" fill="#fff" stroke="${K}" stroke-width="1.8" transform="rotate(-6 313 286)"/><rect x="150" y="270" width="24" height="24" rx="3" fill="#26282b" stroke="${K}" stroke-width="1.8"/><rect x="153" y="273" width="18" height="13" fill="#9fd0ff"/></g>`;
  s += `<g id="finInes" transform="translate(320 430) scale(.95)">${ines()}</g>`;
  // a cómoda das gavetas (1.º escalão em baixo)
  s += `<rect x="${GV.x - 12}" y="${GV.y - 12}" width="${GV.w + 24}" height="${altura}" rx="6" fill="#8a5a2b" stroke="${K}" stroke-width="3"/><rect x="${GV.x - 18}" y="${GV.y - 20}" width="${GV.w + 36}" height="12" rx="3" fill="#6b4226" stroke="${K}" stroke-width="2.6"/><path d="M${GV.x - 6} ${GV.y - 12 + altura} v26 M${GV.x + GV.w + 6} ${GV.y - 12 + altura} v26" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  escaloes.forEach((e, k) => {
    const y = GV.y + (n - 1 - k) * (GV.h + GV.gap);
    const faixa = e.ate != null ? `${fmtNum(e.de, 0)} a ${moeda(e.ate, 0)}` : `acima de ${moeda(e.de, 0)}`;
    s += `<g class="gaveta" id="gav${k}"><rect x="${GV.x}" y="${y}" width="${GV.w}" height="${GV.h}" rx="4" fill="#fbf6ec" stroke="${K}" stroke-width="2.4"/>
      <rect class="g-fica" x="${GV.x + 2}" y="${y + 2}" width="0" height="${GV.h - 4}" fill="#bfe8d2"/><rect class="g-irs" x="${GV.x + 2}" y="${y + 2}" width="0" height="${GV.h - 4}" fill="#ffc2b3"/>
      <text x="${GV.x + 10}" y="${y + 17}" font-family="Archivo" font-weight="900" font-size="14" fill="${K}">${ordinal(k + 1)}</text><text x="${GV.x + 10}" y="${y + 31}" font-family="Archivo" font-weight="600" font-size="10" fill="#4a4540">${faixa}</text>
      <text x="${GV.x + GV.w - 12}" y="${y + 25}" text-anchor="end" font-family="Archivo" font-weight="900" font-size="16" fill="${K}">${pctTaxa(e.taxa)}</text>
      <circle cx="${GV.x + GV.w / 2 + 16}" cy="${y + GV.h / 2}" r="4" fill="#e6a93a" stroke="${K}" stroke-width="1.6"/></g>`;
  });
  return s;
}

/** Encher as gavetas até `c` (verde = fica, vermelho = IRS). Sem GSAP: larguras diretas. */
export function encherGavetasSvg(
  escaloes: { de: number; ate: number | null; taxa: number }[],
  c: number
): string {
  const W = GV.w - 4;
  const porGaveta = (g: { k: number; de: number; ate: number | null; dentro: number; taxa: number }) => {
    const cap = (g.ate ?? g.de + 60000) - g.de;
    const fr = Math.min(1, g.dentro / cap);
    const wf = W * fr * (1 - g.taxa);
    const wi = W * fr * g.taxa;
    return `<rect class="g-fica" x="${GV.x + 2}" y="${GV.y + (escaloes.length - 1 - g.k) * (GV.h + GV.gap) + 2}" width="${wf.toFixed(1)}" height="${GV.h - 4}" fill="#bfe8d2"/><rect class="g-irs" x="${(GV.x + 2 + wf).toFixed(1)}" y="${GV.y + (escaloes.length - 1 - g.k) * (GV.h + GV.gap) + 2}" width="${wi.toFixed(1)}" height="${GV.h - 4}" fill="#ffc2b3"/>`;
  };
  // recalcula a parte de cada gaveta para o rendimento dado
  let de = 0;
  const partes = escaloes.map((e, k) => {
    const ate = e.ate ?? Infinity;
    const dentro = Math.max(0, Math.min(c, ate) - de);
    const r = { k, de, ate: e.ate, dentro, taxa: e.taxa };
    de = ate;
    return porGaveta(r);
  });
  return partes.join("");
}

/** O gráfico degrau (taxa da gaveta mais alta) e curva (taxa média). */
export function graficoIrs(escaloes: { de: number; ate: number | null; taxa: number }[], fonteLabel: string): string {
  const IRS_TOTAL = 100000; // o eixo x vai até 100 000 € de rendimento coletável
  const GR = { x0: 56, x1: 500, y0: 250, y1: 20, max: IRS_TOTAL };
  const gx = (v: number) => GR.x0 + (GR.x1 - GR.x0) * Math.min(v, GR.max) / GR.max;
  const gy = (t: number) => GR.y0 - (GR.y0 - GR.y1) * t / 0.5;

  const irsDe = (c: number): number => {
    let de = 0, total = 0;
    for (const e of escaloes) {
      const ate = e.ate ?? Infinity;
      total += Math.max(0, Math.min(c, ate) - de) * e.taxa;
      de = ate;
    }
    return total;
  };

  let s = "";
  for (let t = 0; t <= 0.5 + 1e-9; t += 0.1)
    s += `<path d="M${GR.x0} ${gy(t).toFixed(1)} H${GR.x1}" stroke="currentColor" stroke-opacity=".12"/><text x="${GR.x0 - 8}" y="${(gy(t) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${Math.round(t * 100)}${FINO}%</text>`;
  for (let v = 0; v <= GR.max; v += 25000)
    s += `<text x="${gx(v).toFixed(1)}" y="${GR.y0 + 18}" text-anchor="${v === GR.max ? "end" : "middle"}" font-size="11" fill="#6e675e">${v ? moeda(v, 0) : "0"}</text>`;
  // o degrau
  let d = `M${gx(0).toFixed(1)} ${gy(escaloes[0].taxa).toFixed(1)}`;
  escaloes.forEach((e, k) => {
    const ate = Math.min(e.ate ?? GR.max, GR.max);
    d += ` H${gx(ate).toFixed(1)}`;
    const prox = escaloes[k + 1];
    if (prox && e.ate != null && e.ate < GR.max) d += ` V${gy(prox.taxa).toFixed(1)}`;
  });
  s += `<path d="${d}" fill="none" stroke="#e2412a" stroke-width="3" stroke-linejoin="round"/>`;
  // a curva da taxa média
  let m = "";
  for (let v = 500; v <= GR.max; v += 500)
    m += `${m ? " L" : "M"}${gx(v).toFixed(1)} ${gy(irsDe(v) / v).toFixed(1)}`;
  s += `<path d="${m}" fill="none" stroke="#16130f" stroke-width="3"/>`;
  s += `<path d="M${GR.x0} ${GR.y0} H${GR.x1}" stroke="#16130f" stroke-width="2"/>`;
  // as legendas manuscritas
  s += `<text x="${gx(2000).toFixed(1)}" y="${gy(0.475).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="19" fill="#c7361f">o degrau: a taxa da gaveta mais alta</text>`;
  s += `<text x="${gx(50000).toFixed(1)}" y="${gy(0.215).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="19" fill="#16130f">a curva: o que pagas mesmo</text>`;
  s += `<text x="${GR.x1}" y="${GR.y0 + 34}" text-anchor="end" font-size="11.5" font-weight="700" fill="#4a4540">rendimento coletável por ano →</text>`;
  // o ponto do rendimento escolhido (a cena move-o por id)
  s += `<g id="grPonto"><path id="grLinha" stroke="#2445d6" stroke-width="2" stroke-dasharray="4 4"/><circle id="grMarg" r="7" fill="#fff" stroke="#e2412a" stroke-width="3"/><circle id="grMed" r="7" fill="#2445d6" stroke="#16130f" stroke-width="2"/><text id="grRot" font-family="Caveat" font-weight="700" font-size="20" fill="#2445d6"></text></g>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 290" role="img" aria-label="${fonteLabel}" font-family="Archivo">${s}</svg>`;
}

/** A posição do marcador do gráfico para um rendimento (a cena usa isto). */
export function pontoGrafico(escaloes: { de: number; ate: number | null; taxa: number }[], c: number): { x: number; yDegrau: number; yMedia: number } {
  const GR = { x0: 56, x1: 500, y0: 250, y1: 20, max: 100000 };
  const gx = (v: number) => GR.x0 + (GR.x1 - GR.x0) * Math.min(v, GR.max) / GR.max;
  const gy = (t: number) => GR.y0 - (GR.y0 - GR.y1) * t / 0.5;
  let de = 0, total = 0, taxaTopo = 0;
  for (const e of escaloes) {
    const ate = e.ate ?? Infinity;
    const dentro = Math.max(0, Math.min(c, ate) - de);
    total += dentro * e.taxa;
    if (dentro > 0) taxaTopo = e.taxa;
    de = ate;
  }
  return { x: gx(c), yDegrau: gy(taxaTopo), yMedia: gy(c ? total / c : 0) };
}

/* ————— pessoas do interior: a MESMA personagem do mapa (`pessoa()`), com
   as especificações do protótipo — nada de mini-figuras ————— */
const funcionario = (): string => pessoa({ pele: "b", cabelo: "careca", corCabelo: "#8d8d8d", roupa: "#dfe5ff", calcas: "#2b3a55", gravata: "#2445d6", gola: "#fff", oculos: "quadrados", bigode: true });
const ines = (): string => pessoa(ELENCO.ines);
