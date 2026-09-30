/* O Bairro visto de cima — motor isométrico + kit de edifícios (v3: terreno com alturas).
   Projeção 2:1. Um ladrilho = 128 × 64. As fachadas desenham-se DE FRENTE em 2D (x para a direita,
   y para cima negativo, chão em y = 0) e são projetadas nas paredes com uma matriz:
   parede «esquerda» (ao longo de i) · matrix(.8944, .4472, 0, 1, …) · parede «direita» (ao longo de −j) · matrix(.8944, −.4472, 0, 1, …).
   1 ladrilho de fachada = 71.55 px (o comprimento real da aresta), para as proporções não se deformarem.
   O terreno tem cotas: a planta diz a altura de cada ponto com definirTerreno(); P() já a aplica.
   Uma saliência de d ladrilhos para fora da parede esquerda (varandas) = (−71.55·d, +64·d) em coordenadas da fachada. */
const K = "#16130f";
const TW = 128, TH = 64, LAD = Math.hypot(TW / 2, TH / 2); // 71.55
const OX = 720, OY = 250; // origem do ladrilho (0,0)
let ALT = () => 0;
function definirTerreno(f) { ALT = f; }
const P = (i, j, z = ALT(i, j)) => [OX + (i - j) * TW / 2, OY + (i + j) * TH / 2 - z];
const P0 = (i, j) => P(i, j, 0);
const f1 = (n) => +n.toFixed(1);
const pts = (...ps) => ps.map((p) => p.map(f1).join(",")).join(" ");
const C = {
  telha: "#d9643a", telhaEsc: "#a8472a", pedra: "#efe6d6", pedraEsc: "#d8cbb4", vidro: "var(--vidro)", verde: "#0c8f5c", verdeEsc: "#07613d",
  amarelo: "#ffc62b", azul: "#2445d6", azulClaro: "#dfe5ff", vermelho: "#e2412a", rosa: "#ff8fb7", creme: "#fff6e3", tijolo: "#c4553a",
  ocre: "#e6a93a", relva: "#9fd67a", relvaEsc: "#7cbf5a", rua: "#b9b3a8", passeio: "#f2eee4", sombra: "rgba(22,19,15,.18)",
  granito: "#cfc5b3", granitoEsc: "#a99d89", ferro: "#2d2b29",
};

/* ——— padrões (espaço do utilizador: seguem a matriz de cada parede) ——— */
function padroes() {
  return `
  <pattern id="azAzul" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f7f9ff"/><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" fill="none" stroke="#2445d6" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#2445d6"/><circle cx="0" cy="0" r="2" fill="#2445d6"/><circle cx="18" cy="0" r="2" fill="#2445d6"/><circle cx="0" cy="18" r="2" fill="#2445d6"/><circle cx="18" cy="18" r="2" fill="#2445d6"/></pattern>
  <pattern id="azVerde" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#eaf7ef"/><path d="M8 2 q6 6 0 12 q-6 -6 0 -12z" fill="#0c8f5c"/></pattern>
  <pattern id="azRosa" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff0f4"/><circle cx="8" cy="8" r="3.2" fill="none" stroke="#e2412a" stroke-width="1.4"/><circle cx="0" cy="0" r="2.4" fill="#ff8fb7"/><circle cx="16" cy="16" r="2.4" fill="#ff8fb7"/><circle cx="16" cy="0" r="2.4" fill="#ff8fb7"/><circle cx="0" cy="16" r="2.4" fill="#ff8fb7"/></pattern>
  <pattern id="azAmarelo" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#fff6d6"/><path d="M7 1 L13 7 L7 13 L1 7 Z" fill="#f0b429" stroke="#b7791f" stroke-width="1"/></pattern>
  <pattern id="tijolo" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#c4553a"/><path d="M0 6 H24 M12 0 V6 M0 6 V12 M24 6 V12" stroke="#9c3e28" stroke-width="1.3"/></pattern>
  <pattern id="granito" width="36" height="18" patternUnits="userSpaceOnUse"><rect width="36" height="18" fill="#cfc5b3"/><path d="M0 9 H36 M18 0 V9 M0 9 V18 M36 9 V18" stroke="#9d917c" stroke-width="1.3"/><circle cx="7" cy="4" r=".9" fill="#9d917c"/><circle cx="27" cy="13" r=".9" fill="#9d917c"/><circle cx="12" cy="14" r=".7" fill="#fff" opacity=".6"/></pattern>
  <pattern id="chapa" width="6" height="10" patternUnits="userSpaceOnUse"><path d="M3 0 V10" stroke="#16130f" stroke-opacity=".2" stroke-width="1.4"/><path d="M4.4 0 V10" stroke="#fff" stroke-opacity=".25" stroke-width="1"/></pattern>
  <pattern id="calcadaIso" width="64" height="32" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 -.8944 .4472 0 0)"><rect width="64" height="32" fill="#f2eee4"/><path d="M0 16 q8 -9 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#2b2824" stroke-width="2.6"/></pattern>
  <pattern id="pedrasIso" width="20" height="12" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 -.8944 .4472 0 0)"><rect width="20" height="12" fill="#b9b3a8"/><rect x="1" y="1" width="8" height="4" rx="1.5" fill="#a8a296"/><rect x="11" y="1" width="8" height="4" rx="1.5" fill="#aea89c"/><rect x="6" y="7" width="8" height="4" rx="1.5" fill="#a39d91"/></pattern>
  <pattern id="lajesIso" width="48" height="32" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 -.8944 .4472 0 0)"><rect width="48" height="32" fill="#ddd6c8"/><path d="M0 0 H48 M0 16 H48 M0 0 V16 M24 16 V32" stroke="#b3aa99" stroke-width="1.6"/><circle cx="10" cy="7" r="1" fill="#b3aa99"/><circle cx="36" cy="24" r="1" fill="#b3aa99"/></pattern>
  <pattern id="telhaE" width="14" height="9" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 0 1 0 0)"><path d="M0 8.5 q3.5 -6 7 0 q3.5 -6 7 0" fill="none" stroke="#16130f" stroke-opacity=".28" stroke-width="1.3"/></pattern>
  <pattern id="telhaD" width="14" height="9" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 -.4472 0 1 0 0)"><path d="M0 8.5 q3.5 -6 7 0 q3.5 -6 7 0" fill="none" stroke="#16130f" stroke-opacity=".28" stroke-width="1.3"/></pattern>
  <pattern id="aguaIso" width="90" height="30" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 -.8944 .4472 0 0)"><rect width="90" height="30" fill="#4f9bc4"/><path class="onda" d="M4 10 q8 -4 16 0 M48 22 q8 -4 16 0" fill="none" stroke="#dff2ff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/><path d="M30 4 q6 -3 12 0 M72 16 q6 -3 12 0" fill="none" stroke="#2f6f93" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/></pattern>
  <pattern id="riscas" width="40" height="7" patternUnits="userSpaceOnUse"><rect width="40" height="4.2" fill="#fff"/><rect x="8" y="4.2" width="18" height="2.8" fill="#fff" opacity=".45"/></pattern>
  <mask id="mascOndas"><rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#riscas)"/></mask>
  <linearGradient id="baseSombra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16130f" stop-opacity="0"/><stop offset="1" stop-color="#16130f" stop-opacity=".22"/></linearGradient>
  <linearGradient id="aguaCorte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9bc4"/><stop offset="1" stop-color="#1f5578"/></linearGradient>
  <radialGradient id="brilho" r=".5"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>`;
}

/* ——— chão ——— */
function losango(i, j, wi = 1, dj = 1, z) { return pts(P(i, j, z), P(i + wi, j, z), P(i + wi, j + dj, z), P(i, j + dj, z)); }
function chao(i, j, wi, dj, fill, extra = "", z) { return `<polygon points="${losango(i, j, wi, dj, z)}" fill="${fill}" stroke="${K}" stroke-width="2.5" stroke-linejoin="round" ${extra}/>`; }
// parede vertical ao longo de i (virada para quem olha), de i0 a i1, na linha j, entre as cotas zBaixo e zCima
function muroI(i0, i1, j, zBaixo, zCima, fill = "url(#granito)", extra = "") {
  const a = P(i0, j, zBaixo), w = (i1 - i0) * LAD, h = zCima - zBaixo;
  return `<g transform="matrix(.8944 .4472 0 1 ${f1(a[0])} ${f1(a[1])})"><rect x="0" y="${f1(-h)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" stroke="${K}" stroke-width="2.6"/>${extra}</g>`;
}

/* ——— fachadas em 2D (coordenadas locais: 0..w, −h..0) ——— */
function janela2(x, y, w, h, o = {}) {
  const arco = o.arco ? `M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} H${x} Z` : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  let s = `<path d="${arco}" fill="${C.pedra}" stroke="${K}" stroke-width="2.4" transform="translate(${x + w / 2} ${y + h / 2}) scale(1.28 1.16) translate(${-(x + w / 2)} ${-(y + h / 2)})"/>`;
  s += `<path class="vidro" d="${arco}" stroke="${K}" stroke-width="2.2"/><path d="M${x + 3} ${y + h * .62} l${w * .3} ${-h * .3} M${x + 3} ${y + h * .82} l${w * .18} ${-h * .18}" stroke="#fff" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"/><path d="M${x + w / 2} ${y} V${y + h}" stroke="${K}" stroke-width="1.6"/>`;
  if (!o.varanda) s += `<rect x="${x - 4}" y="${y + h}" width="${w + 8}" height="3.5" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.6"/>`;
  if (o.portadas) s += `<rect x="${x - w * .45}" y="${y}" width="${w * .4}" height="${h}" fill="${o.portadas}" stroke="${K}" stroke-width="2"/><rect x="${x + w * 1.05}" y="${y}" width="${w * .4}" height="${h}" fill="${o.portadas}" stroke="${K}" stroke-width="2"/>`;
  if (o.varanda) s += varandaFerro(x - 4, x + w + 4, y + h, o.flores);
  return s;
}
// varanda de ferro que sai da parede: laje vista de cima, a espessura, a grade em três lados
function varandaFerro(x0, x1, yb, flores) {
  const dx = -7.9, dy = 7, alt = 13;
  let s = `<path d="M${x0} ${yb} H${x1} l${dx} ${dy} H${x0 + dx} Z" fill="#6d6a66" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>`;
  s += `<path d="M${x0 + dx} ${yb + dy} H${x1 + dx} v2.6 H${x0 + dx} Z" fill="#46433f" stroke="${K}" stroke-width="1.2"/>`;
  if (flores) s += `<rect x="${x0 + dx + 2}" y="${yb + dy - 5}" width="6" height="5" fill="#b8543a" stroke="${K}" stroke-width="1"/><circle cx="${x0 + dx + 5}" cy="${yb + dy - 8}" r="3.6" fill="#e2412a" stroke="${K}" stroke-width="1"/><circle cx="${x0 + dx + 2}" cy="${yb + dy - 6}" r="2.4" fill="#4fae6a" stroke="${K}" stroke-width=".8"/>`;
  s += `<path d="M${x0} ${yb - alt} l${dx} ${dy} H${x1 + dx} L${x1} ${yb - alt}" fill="none" stroke="${C.ferro}" stroke-width="2" stroke-linejoin="round"/>`;
  const n = Math.max(3, Math.round((x1 - x0) / 4));
  for (let k = 0; k <= n; k++) { const x = x0 + dx + (x1 - x0) * k / n; s += `<path d="M${f1(x)} ${yb + dy - alt} V${yb + dy}" stroke="${C.ferro}" stroke-width="1.1"/>`; }
  s += `<path d="M${x0} ${yb - alt} V${yb} M${x1} ${yb - alt} V${yb} M${f1(x0 + dx / 2)} ${f1(yb - alt + dy / 2)} v${alt} M${f1(x1 + dx / 2)} ${f1(yb - alt + dy / 2)} v${alt}" stroke="${C.ferro}" stroke-width="1.1"/>`;
  return s;
}
// janela de sacada/guilhotina da Ribeira: aro claro, caixilho em cruz, às vezes alguém à janela
function janelaR(x, y, w, h, o = {}) {
  let s = `<rect x="${f1(x - 2.5)}" y="${f1(y - 2.5)}" width="${f1(w + 5)}" height="${f1(h + 5)}" fill="${o.moldura || "#f4efe4"}" stroke="${K}" stroke-width="1.8"/>`;
  s += `<rect class="vidro" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" stroke="${K}" stroke-width="1.5"/>`;
  if (o.vizinho) s += `<g class="vizinho" opacity="0"><circle cx="${f1(x + w / 2)}" cy="${f1(y + h * .52)}" r="${f1(w * .3)}" fill="${o.vizinho[0]}" stroke="${K}" stroke-width="1.2"/><path d="M${f1(x + w * .2)} ${f1(y + h * .48)} q${f1(w * .3)} ${f1(-w * .5)} ${f1(w * .6)} 0" fill="${o.vizinho[1]}" stroke="${K}" stroke-width="1"/></g>`;
  s += `<path d="M${f1(x)} ${f1(y + h * .5)} H${f1(x + w)} M${f1(x + w / 2)} ${f1(y)} V${f1(y + h)}" stroke="${o.moldura || "#f4efe4"}" stroke-width="1.8"/>`;
  s += `<path d="M${f1(x + 2)} ${f1(y + h * .4)} l${f1(w * .3)} ${f1(-h * .22)}" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" stroke-linecap="round"/>`;
  if (o.portadas) s += `<rect x="${f1(x - w * .42 - 2.5)}" y="${f1(y - 2)}" width="${f1(w * .42)}" height="${f1(h + 4)}" fill="${o.portadas}" stroke="${K}" stroke-width="1.5"/><rect x="${f1(x + w + 2.5)}" y="${f1(y - 2)}" width="${f1(w * .42)}" height="${f1(h + 4)}" fill="${o.portadas}" stroke="${K}" stroke-width="1.5"/>`;
  if (o.varanda) s += varandaFerro(x - 3.5, x + w + 3.5, y + h + 2.5, o.flores);
  else { s += `<rect x="${f1(x - 4)}" y="${f1(y + h + 2.5)}" width="${f1(w + 8)}" height="3" fill="#d8cbb4" stroke="${K}" stroke-width="1.3"/>`; if (o.flores) s += `<circle cx="${f1(x + 2)}" cy="${f1(y + h)}" r="3" fill="#e2412a" stroke="${K}" stroke-width=".9"/><circle cx="${f1(x + w - 2)}" cy="${f1(y + h - .5)}" r="2.6" fill="#ff8fb7" stroke="${K}" stroke-width=".9"/>`; }
  return s;
}
function porta2(x, w, h, cor, arco = false) {
  const top = arco ? `M${x} ${-h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${-h + w / 2}` : `M${x} ${-h} H${x + w}`;
  return `<path d="${top} V0 H${x} Z" fill="${cor}" stroke="${K}" stroke-width="2.4"/><circle cx="${x + w * .78}" cy="${-h * .45}" r="2.3" fill="${C.amarelo}" stroke="${K}" stroke-width="1.2"/>`;
}
function placa2(x, y, w, txt, fundo, cor) {
  const tam = Math.min(15, (w - 10) / (txt.length * .74));
  return `<rect x="${x}" y="${y}" width="${w}" height="${f1(tam + 10)}" rx="4" fill="${fundo}" stroke="${K}" stroke-width="2.2"/><text x="${x + w / 2}" y="${f1(y + tam + 3)}" text-anchor="middle" font-family="Archivo" font-weight="900" font-stretch="112%" font-size="${f1(tam)}" fill="${cor}">${txt}</text>`;
}
function toldo2(x, y, w, c1, c2 = "#fff") { const n = Math.max(3, Math.round(w / 12)); let s = ""; for (let k = 0; k < n; k++) s += `<path d="M${f1(x + k * w / n)} ${y} h${f1(w / n)} l-4 16 h${f1(-w / n)} z" fill="${k % 2 ? c2 : c1}" stroke="${K}" stroke-width="1.5"/>`; s += `<path d="M${f1(x - 4)} ${y + 16} ${Array.from({ length: n }, (_, k) => `q${f1(w / n / 2)} 5 ${f1(w / n)} 0`).join(" ")}" fill="${c1}" stroke="${K}" stroke-width="1.5"/>`; return s; }
function grelhaJanelas(w, h, pisos, porPiso, o = {}) {
  let s = ""; const base = o.base || 0, top = o.top || 14, alt = (h - base - top) / pisos;
  for (let r = 0; r < pisos; r++) for (let k = 0; k < porPiso; k++) {
    const jw = o.jw || 16, jh = o.jh || Math.min(28, alt * .62), gx = (w - porPiso * jw) / (porPiso + 1);
    s += janela2(gx + k * (jw + gx), -h + top + r * alt + (alt - jh) / 2, jw, jh, { arco: o.arco && r === 0, portadas: o.portadas, varanda: o.varanda && r < pisos, flores: o.flores && (r + k) % 2 === 0 });
  }
  return s;
}

/* ——— casas estreitas da Ribeira ——— */
const VIZINHOS = [["#f1c9a5", "#3b2418"], ["#d49a72", "#1d1410"], ["#e8b48f", "#c26b2b"], ["#b97a52", "#cfc9c1"]];
function fachadaRibeira(w, hh, o) {
  const rc = o.rc || 40, pisos = o.pisos || 3, alt = (hh - rc - 12) / pisos, n = o.porPiso || (w > 58 ? 2 : 1), sem = o.semente || 0;
  let s = "";
  if (o.chapa) s += `<rect x="0" y="${-hh}" width="${f1(w)}" height="${f1(hh - rc)}" fill="url(#chapa)"/>`;
  // cunhais de granito e a faixa entre o rés-do-chão e o 1.º andar
  s += `<rect x="0" y="${-hh}" width="5" height="${hh}" fill="${C.granito}" stroke="${K}" stroke-width="1.1"/><rect x="${f1(w - 5)}" y="${-hh}" width="5" height="${hh}" fill="${C.granito}" stroke="${K}" stroke-width="1.1"/>`;
  s += `<rect x="0" y="${-rc - 5}" width="${f1(w)}" height="5" fill="${C.granito}" stroke="${K}" stroke-width="1.3"/>`;
  for (let r = 0; r < pisos; r++) for (let k = 0; k < n; k++) {
    const jw = Math.min(15, (w - 10) / n - 12), jh = Math.min(26, alt * .72), gx = (w - n * jw) / (n + 1);
    const x = gx + k * (jw + gx), y = -hh + 12 + r * alt + (alt - jh) * .3;
    const sacada = o.varandas === "todas" || (o.varandas === "baixo" && r >= pisos - 2) || (o.varandas === "cima" && r === 0) || (o.varandas === "alternadas" && (r + sem) % 2 === 0);
    const idx = r * n + k + sem;
    s += janelaR(x, y, jw, jh, { varanda: sacada, flores: idx % 3 === 0, vizinho: idx % 5 === 2 ? VIZINHOS[idx % 4] : null, moldura: o.moldura, portadas: o.portadas && !sacada ? o.portadas : null });
  }
  if (o.roupa) { const y = -hh + 12 + (pisos - 1) * alt + alt * .92; s += `<g class="roupa"><path d="M6 ${f1(y)} Q${f1(w / 2)} ${f1(y + 6)} ${f1(w - 6)} ${f1(y)}" fill="none" stroke="${K}" stroke-width="1.1"/>${[[.28, C.vermelho, 8, 11], [.48, C.amarelo, 10, 13], [.68, "#fff", 7, 10]].map(([t, c, pw, ph], k) => `<rect class="peca p${k + 1}" x="${f1(w * t - pw / 2)}" y="${f1(y + 3)}" width="${pw}" height="${ph}" fill="${c}" stroke="${K}" stroke-width="1.2"/>`).join("")}</g>`; }
  s += o.rdc ? o.rdc(w, rc) : porta2(f1(w / 2 - 9), 18, rc - 6, o.corPorta || "#5a3d27", true);
  return s;
}
// rés-do-chão em arcada de granito (esplanada lá dentro)
function arcada(w, rc) {
  let s = `<rect x="0" y="${-rc}" width="${f1(w)}" height="${rc}" fill="url(#granito)" stroke="${K}" stroke-width="1.6"/>`;
  const n = Math.max(1, Math.round(w / 34)), aw = w / n;
  for (let k = 0; k < n; k++) { const x = k * aw + 5, lw = aw - 10; s += `<path d="M${f1(x)} 0 V${-rc + lw / 2 + 4} A${f1(lw / 2)} ${f1(lw / 2)} 0 0 1 ${f1(x + lw)} ${-rc + lw / 2 + 4} V0 Z" fill="#3b2f26" stroke="${K}" stroke-width="2"/><rect x="${f1(x + lw * .25)}" y="-12" width="${f1(lw * .5)}" height="3" fill="#fff" stroke="${K}" stroke-width="1"/><path d="M${f1(x + lw / 2)} -9 V0" stroke="#fff" stroke-width="1.6"/>`; }
  return s;
}
function chamine(ridge, k = 0) { const [x, y] = ridge; return `<rect x="${f1(x - 4 + k)}" y="${f1(y - 14)}" width="8" height="16" fill="${C.granito}" stroke="${K}" stroke-width="1.8"/><rect x="${f1(x - 5.5 + k)}" y="${f1(y - 17)}" width="11" height="4" fill="${C.telhaEsc}" stroke="${K}" stroke-width="1.6"/>`; }
function casaRibeira(i, j, wi, dj, h, o) {
  const rh = o.rh || 22;
  return caixa(i, j, wi, dj, h, {
    fundo: o.cor, telhado: "duas", rh, corTelhado: o.telha || C.telha, corTelhado2: o.telha2,
    esq: (w, hh) => fachadaRibeira(w, hh, o) + (o.extraEsq ? o.extraEsq(w, hh) : ""),
    dir: (w, hh) => grelhaJanelas(w, hh, Math.max(1, (o.pisos || 3) - 1), 1, { jw: 12, jh: 18, top: 18, base: 44 }),
    extraTopo: ({ A, B, C: Cc, D: Dd }) => { const m1 = [(Dd[0] + A[0]) / 2, (Dd[1] + A[1]) / 2 - rh], m2 = [(Cc[0] + B[0]) / 2, (Cc[1] + B[1]) / 2 - rh]; const t = o.chamine ?? .7; return (t ? chamine([m1[0] + (m2[0] - m1[0]) * t, m1[1] + (m2[1] - m1[1]) * t + 2]) : "") + (o.extraTopo ? o.extraTopo({ A, B, C: Cc, D: Dd, m1, m2 }) : ""); },
  });
}

/* ——— caixa isométrica: duas paredes com fachada + telhado ——— */
// fachadas: { esq: fn(w,h) → svg 2D, dir: fn(w,h) → svg 2D }; assenta na cota do terreno ao centro (ou em o.z0)
function caixa(i, j, wi, dj, h, o) {
  const z = o.z0 ?? ALT(i + wi / 2, j + dj / 2);
  const A = P(i, j + dj, z), B = P(i + wi, j + dj, z), Cc = P(i + wi, j, z), Dd = P(i, j, z);
  const up = (p, dh = h) => [p[0], p[1] - dh];
  const wE = wi * LAD, wD = dj * LAD;
  const sil = [A, B, Cc, Dd, up(A), up(B), up(Cc), up(Dd)];
  if (o.telhado === "duas") { const rh = o.rh || 34; sil.push(up([(Dd[0] + A[0]) / 2, (Dd[1] + A[1]) / 2], h + rh), up([(Cc[0] + B[0]) / 2, (Cc[1] + B[1]) / 2], h + rh)); }
  let s = `<g class="caixa" data-sil="${pts(...sil)}">`;
  // sombra no chão (para a direita): curta de dia, comprida ao fim da tarde
  if (!o.semSombra) s += `<polygon class="sombra-d" points="${pts(B, Cc, [Cc[0] + h * .5, Cc[1] + h * .12], [B[0] + h * .5, B[1] + h * .12])}" fill="${C.sombra}"/><polygon class="sombra-t" points="${pts(A, B, Cc, [Cc[0] + h * 1.25, Cc[1] + h * .42], [B[0] + h * 1.25, B[1] + h * .42], [A[0] + h * 1.25, A[1] + h * .42])}" fill="rgba(90,40,20,.2)"/>`;
  // parede esquerda (virada para baixo-esquerda), ao longo de i
  s += `<g transform="matrix(.8944 .4472 0 1 ${f1(A[0])} ${f1(A[1])})"><rect x="0" y="${-h}" width="${f1(wE)}" height="${h}" fill="${o.fundoE || o.fundo}" stroke="${K}" stroke-width="2.6"/>${o.semRodape ? "" : `<rect x="0" y="-9" width="${f1(wE)}" height="9" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.8"/>`}${o.esq ? o.esq(wE, h) : ""}<rect x="0" y="-22" width="${f1(wE)}" height="22" fill="url(#baseSombra)" pointer-events="none"/>${o.semCornija ? "" : `<rect x="-2" y="${-h}" width="${f1(wE + 4)}" height="6" fill="${C.pedra}" stroke="${K}" stroke-width="1.8"/>`}</g>`;
  // parede direita (virada para baixo-direita), ao longo de −j; um pouco mais escura
  s += `<g transform="matrix(.8944 -.4472 0 1 ${f1(B[0])} ${f1(B[1])})"><rect x="0" y="${-h}" width="${f1(wD)}" height="${h}" fill="${o.fundoD || o.fundo}" stroke="${K}" stroke-width="2.6"/>${o.semRodape ? "" : `<rect x="0" y="-9" width="${f1(wD)}" height="9" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.8"/>`}${o.dir ? o.dir(wD, h) : ""}<rect x="0" y="-22" width="${f1(wD)}" height="22" fill="url(#baseSombra)" pointer-events="none"/>${o.semCornija ? "" : `<rect x="-2" y="${-h}" width="${f1(wD + 4)}" height="6" fill="${C.pedra}" stroke="${K}" stroke-width="1.8"/>`}<rect x="0" y="${-h}" width="${f1(wD)}" height="${h}" fill="#1a2250" opacity=".13" pointer-events="none"/></g>`;
  // telhado
  if (o.telhado === "duas") {
    const rh = o.rh || 34, m1 = [(Dd[0] + A[0]) / 2, (Dd[1] + A[1]) / 2], m2 = [(Cc[0] + B[0]) / 2, (Cc[1] + B[1]) / 2];
    s += `<polygon points="${pts(up(Dd), up(Cc), up(m2, h + rh), up(m1, h + rh))}" fill="${o.corTelhado2 || C.telhaEsc}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts(up(A), up(B), up(m2, h + rh), up(m1, h + rh))}" fill="${o.corTelhado || C.telha}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/><polygon points="${pts(up(A), up(B), up(m2, h + rh), up(m1, h + rh))}" fill="url(#telhaE)"/>`;
    s += `<polygon points="${pts(up(B), up(Cc), up(m2, h + rh))}" fill="${o.corTelhado2 || C.telhaEsc}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/><polygon points="${pts(up(B), up(Cc), up(m2, h + rh))}" fill="url(#telhaD)"/>`;
    s += `<path d="M${pts(up(m1, h + rh), up(m2, h + rh)).replace(" ", " L")}" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/>`;
  } else {
    s += `<polygon points="${pts(up(A), up(B), up(Cc), up(Dd))}" fill="${o.topo || C.pedraEsc}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`;
    if (o.telhado === "platibanda") s += `<polygon points="${pts(up(A, h + 8), up(B, h + 8), up(Cc, h + 8), up(Dd, h + 8))}" fill="none" stroke="${K}" stroke-width="2"/>`;
  }
  if (o.extraTopo) s += o.extraTopo({ A: up(A), B: up(B), C: up(Cc), D: up(Dd) });
  return s + `</g>`;
}

/* ——— Torre dos Clérigos: blocos de granito que afinam, relógio, sineiras, pináculos, cúpula com a bola e a cruz ——— */
function clerigos(ci, cj, E = 1.22) {
  const G = "#dcd3c3", G2 = "#b9ae9a", z0 = ALT(ci, cj);
  const esc = (fn) => fn && ((w, hh) => `<g transform="scale(${E})">${fn(w / E, hh / E)}</g>`);
  let s = "", z = z0;
  const pilastras = (w, hh) => `<rect x="0" y="${-hh}" width="6" height="${hh}" fill="${G2}" stroke="${K}" stroke-width="1.2"/><rect x="${f1(w - 6)}" y="${-hh}" width="6" height="${hh}" fill="${G2}" stroke="${K}" stroke-width="1.2"/>`;
  const bloco = (lado, h, o = {}) => { lado *= E; h *= E; const r = lado / 2; s += caixa(ci - r, cj - r, lado, lado, h, { z0: z, fundo: G, topo: G2, semRodape: true, semCornija: true, semSombra: z !== z0, ...o, esq: esc(o.esq), dir: esc(o.dir) }); z += h; };
  const cornija = (lado, h = 6) => bloco(lado, h, { fundo: G2, topo: G });
  const cantos = (lado, desenho) => { const r = lado * E / 2; [[-r, r], [r, r], [r, -r]].forEach(([di, dj]) => { const p = P(ci + di, cj + dj, z); s += `<g transform="translate(${f1(p[0])} ${f1(p[1])}) scale(${E})">${desenho}</g>`; }); };
  const urna = `<path d="M-3.5 0 h7 l-1 -5 q4 -4 0 -9 q-2.5 -4 -2.5 -7 q0 3 -2.5 7 q-4 5 0 9 z" fill="${G}" stroke="${K}" stroke-width="1.4"/>`;
  const faces = (fn) => ({ esq: fn, dir: fn });
  bloco(1.02, 8, { fundo: G2, topo: G });
  bloco(.94, 92, faces((w, hh) => `${pilastras(w, hh)}${porta2(f1(w / 2 - 8), 16, 30, "#8a3b2a", true)}<ellipse cx="${f1(w / 2)}" cy="-42" rx="9" ry="7" fill="${G2}" stroke="${K}" stroke-width="1.6"/><path d="M${f1(w / 2 - 7)} -58 v-16 a7 7 0 0 1 14 0 v16 z" fill="#8f8574" stroke="${K}" stroke-width="1.6"/><circle cx="${f1(w / 2)}" cy="-68" r="2.6" fill="${G}" stroke="${K}" stroke-width="1"/><path d="M${f1(w / 2)} -66 v7" stroke="${K}" stroke-width="2.6"/>`));
  cornija(1.02);
  bloco(.9, 46, faces((w, hh) => `${pilastras(w, hh)}<rect x="${f1(w / 2 - 6)}" y="-32" width="12" height="16" rx="5" fill="#3b342c" stroke="${K}" stroke-width="1.5"/><path d="M${f1(w / 2 - 6)} -24 h12 M${f1(w / 2)} -32 v16" stroke="${G2}" stroke-width="1.2"/>`));
  cornija(.98);
  bloco(.86, 86, faces((w, hh) => `${pilastras(w, hh)}<path d="M${f1(w / 2 - 10)} -14 V-52 a10 10 0 0 1 20 0 V-14 Z" fill="#2f2923" stroke="${K}" stroke-width="1.8"/><path d="M${f1(w / 2 - 6)} -24 q0 -12 6 -14 q6 2 6 14 z" fill="#6f7a4a" stroke="${K}" stroke-width="1.3"/><path d="M${f1(w / 2 - 9)} -76 h18 v8 q0 9 -9 11 q-9 -2 -9 -11 z" fill="${G2}" stroke="${K}" stroke-width="1.5"/>`));
  cornija(1.0, 8);
  bloco(.74, 56, faces((w, hh) => `${pilastras(w, hh)}<circle cx="${f1(w / 2)}" cy="-30" r="12" fill="#fbfaf6" stroke="${K}" stroke-width="2"/>${Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return `<path d="M${f1(w / 2 + Math.sin(a) * 9.5)} ${f1(-30 - Math.cos(a) * 9.5)} L${f1(w / 2 + Math.sin(a) * 11)} ${f1(-30 - Math.cos(a) * 11)}" stroke="${K}" stroke-width="1"/>`; }).join("")}<path class="ponteiro" d="M${f1(w / 2)} -30 v-8" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/><path class="ponteiro2" d="M${f1(w / 2)} -30 h6" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>`));
  cantos(.74, urna);
  cornija(.8);
  bloco(.62, 24, faces((w, hh) => `${Array.from({ length: Math.floor(w / 6) }, (_, k) => `<path d="M${4 + k * 6} -4 q-2 -6 0 -9 q2 3 0 9" fill="${G}" stroke="${K}" stroke-width="1"/>`).join("")}<rect x="0" y="-20" width="${f1(w)}" height="4" fill="${G2}" stroke="${K}" stroke-width="1.2"/>`));
  bloco(.5, 42, faces((w, hh) => `${pilastras(w, hh)}<path d="M${f1(w / 2 - 7)} -8 V-28 a7 7 0 0 1 14 0 V-8 Z" fill="#2f2923" stroke="${K}" stroke-width="1.6"/><path d="M${f1(w / 2 - 4)} -14 q0 -8 4 -9 q4 1 4 9 z" fill="#6f7a4a" stroke="${K}" stroke-width="1.1"/>`));
  cantos(.5, urna);
  cornija(.56, 5);
  const t = P(ci, cj, z);
  s += `<g transform="translate(${f1(t[0])} ${f1(t[1])}) scale(${E})"><path d="M-14 0 q0 -14 14 -18 q14 4 14 18 z" fill="${G}" stroke="${K}" stroke-width="2"/><path d="M-5 -2 q0 -9 5 -13" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/><circle cy="-24" r="5.5" fill="#3a352f" stroke="${K}" stroke-width="1.6"/><path d="M0 -29 V-52 M-6 -44 H6" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/></g>`;
  return `<g class="clerigos">${s}</g>`;
}

/* ——— árvores, candeeiros, mobiliário do cais ——— */
function arvoreVerde(x, y, e = 1) {
  return `<g class="arvore" transform="translate(${f1(x)} ${f1(y)}) scale(${e})"><ellipse cx="0" cy="4" rx="26" ry="9" fill="${C.sombra}"/><path d="M0 4 V-26" stroke="#6b4a2f" stroke-width="6" stroke-linecap="round"/><circle class="copa" cx="0" cy="-44" r="24" fill="#4fae6a" stroke="${K}" stroke-width="2.6"/><circle cx="-8" cy="-52" r="8" fill="#7cc98c"/></g>`;
}
function candeeiro(x, y) {
  return `<g class="candeeiro" transform="translate(${f1(x)} ${f1(y)})"><path d="M0 0 V-52" stroke="${K}" stroke-width="3.5"/><path d="M-4 0 h8" stroke="${K}" stroke-width="3"/><path d="M-6 -66 h12 l-2 12 h-8 z" class="lanterna" fill="#fff6c9" stroke="${K}" stroke-width="2.2"/><path d="M-7 -66 l7 -7 l7 7" fill="${K}"/></g>`;
}
// esplanada: chapéu-de-sol branco, mesa, duas cadeiras
function esplanada(x, y, cor = "#fff") {
  return `<g class="esplanada" transform="translate(${f1(x)} ${f1(y)})"><ellipse cx="0" cy="2" rx="20" ry="7" fill="${C.sombra}"/><path d="M-12 0 v-10 h5 M12 2 v-10 h-5" stroke="${K}" stroke-width="2" fill="none"/><path d="M0 0 V-14 M-6 -14 h12" stroke="${K}" stroke-width="2.2"/><ellipse cx="0" cy="-14" rx="8" ry="3" fill="#fff" stroke="${K}" stroke-width="1.6"/><path d="M0 -14 V-40" stroke="${K}" stroke-width="2"/><path d="M-24 -32 L0 -46 L24 -32 q-12 5 -24 0 q-12 5 -24 0z" fill="${cor}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -46 L-8 -32 M0 -46 L8 -32" stroke="${K}" stroke-width="1" opacity=".35"/></g>`;
}
function cabeco(x, y) { return `<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-4.5" y="-10" width="9" height="10" rx="2" fill="#3b3a38" stroke="${K}" stroke-width="1.8"/><ellipse cx="0" cy="-10" rx="6" ry="2.6" fill="#55534f" stroke="${K}" stroke-width="1.6"/></g>`; }
function pombo(x, y, d = 1) { return `<g class="pombo" transform="translate(${f1(x)} ${f1(y)}) scale(${d} 1)"><g class="corpo-pombo"><ellipse cx="0" cy="-5" rx="6.5" ry="4.5" fill="#9aa3ad" stroke="${K}" stroke-width="1.3"/><path d="M-6 -6 l-5 -2 l2 4 z" fill="#6c757f" stroke="${K}" stroke-width="1"/><circle cx="5.5" cy="-9" r="3" fill="#8b949e" stroke="${K}" stroke-width="1.2"/><path d="M8.2 -9 l2.4 1 l-2.4 .8" fill="#e69b3a"/></g><path d="M-1 -1 v2 M2 -1 v2" stroke="#e69b3a" stroke-width="1.2"/></g>`; }
function nuvem(x, y, e = 1) { return `<g class="nuvem" transform="translate(${f1(x)} ${f1(y)}) scale(${e})"><path d="M0 0 h96 a16 16 0 0 0 -8 -30 a24 24 0 0 0 -42 -12 a18 18 0 0 0 -32 10 a15 15 0 0 0 -14 32 z" fill="#fff" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/><path d="M20 -8 h40" stroke="#dbe9f3" stroke-width="4" stroke-linecap="round"/></g>`; }

/* ——— o marcador de dados por cima de cada edifício (sempre de frente, legível) ——— */
function pin(x, y, rotulo, valor, cor = K, fundo = "#fff") {
  const w = Math.max(valor.length * 11.5 + 26, rotulo.length * 6.6 + 26);
  return `<g class="pin" data-x="${f1(x)}" data-y="${f1(y)}" data-w="${f1(w + 3)}" transform="translate(${f1(x)} ${f1(y)})"><path class="guia" d="M0 0 V0" stroke="${K}" stroke-width="2" stroke-dasharray="3 3"/><g class="pin-corpo">
    <rect x="${f1(-w / 2 + 3)}" y="-58" width="${f1(w)}" height="48" rx="11" fill="${K}"/>
    <path d="M-7 -16 L0 0 L7 -16 Z" fill="${fundo}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="${f1(-w / 2)}" y="-62" width="${f1(w)}" height="48" rx="11" fill="${fundo}" stroke="${K}" stroke-width="2.6"/>
    <path d="M${f1(-w / 2)} -46 V-51 a11 11 0 0 1 11 -11 H${f1(w / 2 - 11)} a11 11 0 0 1 11 11 V-46 Z" fill="${C.amarelo}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>
    <text x="0" y="-50.5" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="10.5" fill="${K}">${rotulo}</text>
    <text x="0" y="-22" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="19" fill="${cor}" font-variant-numeric="tabular-nums">${valor}</text></g></g>`;
}

/* ——— peças do Porto ——— */
// bandeira nacional num mastro (verde 2/5, vermelho 3/5, esfera armilar simplificada); ondula por CSS
function bandeiraPT(x, y, e = 1) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${e})"><path d="M0 0 V-46" stroke="${K}" stroke-width="2.4"/><circle cx="0" cy="-47" r="2.2" fill="${C.amarelo}" stroke="${K}" stroke-width="1.2"/>
    <g class="bandeira-pt"><path d="M1 -44 h11 v16 h-11 z" fill="#0f7b3f" stroke="${K}" stroke-width="1.4"/><path d="M12 -44 h15 v16 h-15 z" fill="#d7262b" stroke="${K}" stroke-width="1.4"/><circle cx="12" cy="-36" r="3.6" fill="${C.amarelo}" stroke="${K}" stroke-width="1"/></g></g>`;
}
// cameleira — a árvore do Porto (flores cor-de-rosa e vermelhas)
function cameleira(x, y, e = 1) {
  const flores = [[-14, -52], [10, -60], [-2, -76], [18, -44], [-20, -38], [4, -46], [-8, -64], [14, -72]];
  return `<g class="arvore" transform="translate(${f1(x)} ${f1(y)}) scale(${e})"><ellipse cx="0" cy="4" rx="30" ry="10" fill="${C.sombra}"/><path d="M0 4 V-30 M0 -18 l10 -12" stroke="#6b4a2f" stroke-width="6" stroke-linecap="round" fill="none"/>
    ${[[-14, -50, 22], [12, -56, 22], [0, -72, 20], [20, -40, 15], [-22, -38, 15]].map(([dx, dy, r]) => `<circle class="copa" cx="${dx}" cy="${dy}" r="${r}" fill="#2f8f55" stroke="${K}" stroke-width="2.4"/>`).join("")}
    ${flores.map(([dx, dy], k) => `<circle cx="${dx}" cy="${dy}" r="3.4" fill="${k % 2 ? "#ff8fb7" : "#e2412a"}" stroke="${K}" stroke-width="1"/>`).join("")}</g>`;
}
// balões de papel do São João pendurados num cordel
function baloesSaoJoao(a, b, n = 7) {
  const cores = ["#e2412a", "#ffc62b", "#2445d6", "#0c8f5c", "#ff8fb7", "#ff8a3d"];
  let s = `<path d="M${f1(a[0])} ${f1(a[1])} Q${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2 + 30)} ${f1(b[0])} ${f1(b[1])}" fill="none" stroke="${K}" stroke-width="1.4"/>`;
  for (let k = 0; k < n; k++) {
    const t = (k + .5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t + 30 * 4 * t * (1 - t) * .5;
    const c = cores[k % cores.length];
    s += `<g class="balao-sj" style="transform-origin:${f1(x)}px ${f1(y)}px"><path d="M${f1(x)} ${f1(y)} v4" stroke="${K}" stroke-width="1"/><ellipse cx="${f1(x)}" cy="${f1(y + 12)}" rx="7" ry="9" fill="${c}" stroke="${K}" stroke-width="1.4"/><path d="M${f1(x - 7)} ${f1(y + 12)} h14 M${f1(x)} ${f1(y + 3)} v18" stroke="${K}" stroke-width=".9" opacity=".6"/><rect x="${f1(x - 3)}" y="${f1(y + 20)}" width="6" height="2.6" fill="${K}"/></g>`;
  }
  return `<g class="sao-joao">${s}</g>`;
}
// barco rabelo (desenhado com a popa em i = 0 e a proa em i = 2,1, linha de água à cota 0; coloca-se por translação):
// casco comprido de madeira envernizada, popa e proa levantadas, torre da espadela perto da popa (pernas em X e escada),
// a espadela — remo de governo enorme — por cima da popa até à água, pipas deitadas no convés, mastro com vela quadrada
function rabelo(vela = true) {
  const CMP = 2.1, CJ = .3, Q = (t, j, z) => P(t * CMP, j, z), L = (arr) => arr.map((p) => p.map(f1).join(",")).join(" ");
  const boca = (t) => .19 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), .55);
  const borda = (t) => 12 + (t < .16 ? 24 * Math.pow(1 - t / .16, 2) : 0) + (t > .86 ? 16 * Math.pow((t - .86) / .14, 2) : 0);
  const T = Array.from({ length: 29 }, (_, k) => k / 28);
  const madeira = "#7a4526", escura = "#4d2a17", clara = "#a8683c";
  let s = `<g class="rabelo">`;
  // sombra na água, ao comprido do casco
  const c = Q(.5, CJ, -2); s += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1] + 4)}" rx="96" ry="13" transform="rotate(26.57 ${f1(c[0])} ${f1(c[1] + 4)})" fill="#1f5578" opacity=".35"/>`;
  // a espadela: do alto da torre, por cima da popa, até à água lá atrás
  const e0 = Q(.3, CJ, 50), e1 = Q(-.62, CJ + .02, -1);
  s += `<path d="M${L([e0])} L${L([e1])}" stroke="${escura}" stroke-width="5.5" stroke-linecap="round"/><path d="M${L([e0])} L${L([e1])}" stroke="${clara}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="${f1(e1[0] + 4)}" cy="${f1(e1[1] - 2)}" rx="13" ry="4.5" transform="rotate(26 ${f1(e1[0] + 4)} ${f1(e1[1] - 2)})" fill="${clara}" stroke="${K}" stroke-width="1.6"/>`;
  // bordo de bombordo por dentro (o lado de trás), convés
  s += `<polygon points="${L(T.map((t) => Q(t, CJ - boca(t), borda(t))))} ${L(T.slice().reverse().map((t) => Q(t, CJ - boca(t) * .8, 4)))}" fill="${escura}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<polygon points="${L(T.map((t) => Q(t, CJ - boca(t) * .8, 4)))} ${L(T.slice().reverse().map((t) => Q(t, CJ + boca(t) * .8, 4)))}" fill="${clara}" stroke="${K}" stroke-width="1.2"/>`;
  for (const t of [.2, .36, .52, .68, .84]) s += `<path d="M${L([Q(t, CJ - boca(t) * .8, 4)])} L${L([Q(t, CJ + boca(t) * .8, 4)])}" stroke="${madeira}" stroke-width="1.2"/>`;
  // as pipas, deitadas de través, em duas filas
  for (let k = 0; k < 4; k++) for (const dj of [-.07, .07]) {
    const t = .5 + k * .1, a = Q(t, CJ + dj - .06, 10), b = Q(t, CJ + dj + .06, 10);
    s += `<path d="M${f1(a[0])} ${f1(a[1] - 6)} L${f1(b[0])} ${f1(b[1] - 6)} L${f1(b[0])} ${f1(b[1] + 6)} L${f1(a[0])} ${f1(a[1] + 6)} Z" fill="#9a6232" stroke="${K}" stroke-width="1.2"/><ellipse cx="${f1(b[0])}" cy="${f1(b[1])}" rx="4.6" ry="6.4" fill="#b5773f" stroke="${K}" stroke-width="1.3"/><path d="M${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2 - 6.5)} v13" stroke="#3a3a3a" stroke-width="1.3"/>`;
  }
  // a torre da espadela: quatro pernas, travessas em X, escada, estrado com guarda
  const zT = 44, cT = [[.22, -.13], [.34, -.13], [.22, .13], [.34, .13]];
  const perna = ([t, dj]) => `<path d="M${L([Q(t, CJ + dj, 4)])} L${L([Q(t, CJ + dj, zT)])}" stroke="${escura}" stroke-width="2.6"/>`;
  s += perna(cT[0]) + perna(cT[1]);
  s += `<path d="M${L([Q(.22, CJ + .13, 6)])} L${L([Q(.34, CJ + .13, zT - 2)])} M${L([Q(.34, CJ + .13, 6)])} L${L([Q(.22, CJ + .13, zT - 2)])}" stroke="${madeira}" stroke-width="2"/>`;
  s += perna(cT[2]) + perna(cT[3]);
  for (let k = 1; k < 6; k++) { const z = 4 + k * (zT - 4) / 6; s += `<path d="M${L([Q(.35, CJ + .05, z)])} L${L([Q(.35, CJ + .12, z)])}" stroke="${clara}" stroke-width="1.6"/>`; }
  s += `<polygon points="${L([Q(.2, CJ - .15, zT), Q(.36, CJ - .15, zT), Q(.36, CJ + .15, zT), Q(.2, CJ + .15, zT)])}" fill="${clara}" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/>`;
  s += `<path d="M${L([Q(.2, CJ + .15, zT), Q(.2, CJ + .15, zT + 8), Q(.36, CJ + .15, zT + 8), Q(.36, CJ + .15, zT)]).replace(/ /g, " L")}" fill="none" stroke="${escura}" stroke-width="1.6"/>`;
  // o casco (o lado de estibordo, virado para quem olha): tábuas, verniz, a borda clara
  s += `<polygon points="${L(T.map((t) => Q(t, CJ + boca(t), borda(t))))} ${L(T.slice().reverse().map((t) => Q(t, CJ + boca(t) * .82, -3)))}" fill="${madeira}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>`;
  for (const f of [.35, .68]) s += `<path d="M${L(T.slice(1, -1).map((t) => Q(t, CJ + boca(t) * (.82 + .18 * f), -3 + (borda(t) + 3) * f))).replace(/ /g, " L")}" fill="none" stroke="${escura}" stroke-width="1.1"/>`;
  s += `<path d="M${L(T.map((t) => Q(t, CJ + boca(t), borda(t)))).replace(/ /g, " L")}" fill="none" stroke="${clara}" stroke-width="2.4"/><path d="M${L(T.map((t) => Q(t, CJ + boca(t), borda(t)))).replace(/ /g, " L")}" fill="none" stroke="${K}" stroke-width="1"/>`;
  // bandeira nacional na popa
  const pb = Q(.03, CJ, borda(.03));
  s += bandeiraPT(pb[0], pb[1], .42);
  // mastro, cordame e a vela quadrada (desfraldada a navegar; enrolada na verga quando atracado)
  const m0 = Q(.44, CJ, 4), m1 = Q(.44, CJ, 132);
  s += `<path d="M${L([Q(.44, CJ, 128)])} L${L([Q(.98, CJ, 30)])} M${L([Q(.44, CJ, 128)])} L${L([Q(.06, CJ, 36)])}" stroke="${K}" stroke-width=".9" opacity=".6"/>`;
  s += `<path d="M${L([m0])} L${L([m1])}" stroke="${escura}" stroke-width="3.4" stroke-linecap="round"/>`;
  const vA = Q(.44, CJ + .42, 0);
  if (vela) s += `<g transform="matrix(.8944 -.4472 0 1 ${f1(vA[0])} ${f1(vA[1])})"><path class="vela" d="M0 -124 H${f1(.84 * LAD)} q9 30 3 64 H-3 q-6 -34 3 -64 z" fill="#f4ecd8" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${f1(.28 * LAD)} -122 q4 30 1 60 M${f1(.56 * LAD)} -122 q5 30 2 60" fill="none" stroke="${K}" stroke-width=".9" opacity=".25"/><path d="M-6 -126 H${f1(.84 * LAD + 6)}" stroke="${escura}" stroke-width="3.2" stroke-linecap="round"/></g>`;
  else s += `<g transform="matrix(.8944 -.4472 0 1 ${f1(vA[0])} ${f1(vA[1])})"><path d="M-6 -118 H${f1(.84 * LAD + 6)}" stroke="${escura}" stroke-width="3.2" stroke-linecap="round"/><path d="M0 -118 q${f1(.42 * LAD)} 12 ${f1(.84 * LAD)} 0" fill="#f4ecd8" stroke="${K}" stroke-width="1.8"/></g>`;
  return s + `</g>`;
}
// Ponte D. Luís I, com volume: duas treliças paralelas (planos i = iA atrás e i = iB à frente) e os tabuleiros entre elas.
// O arco nasce nos encontros de granito, à cota da água, e a coroa toca o tabuleiro de cima; o tabuleiro de cima liga os
// dois altos (o miradouro do Porto e a Serra do Pilar); o de baixo vai de cais a cais, pendurado no arco.
// o = { iA, iB, jPorto, jGaia, jA1, jA2 (nascenças do arco), zCima (tabuleiro de cima), pilares: [[j, zBase], …] }
function ponteLuisI(o) {
  const { iA, iB, jPorto, jGaia, jA1, jA2, zCima } = o;
  const AG = -22, VIGA = 16, zViga = zCima - VIGA, zBaixo = 9, jB1 = jA1 - .45, jB2 = jA2 + .45;
  const aco = "#5b6773", acoEsc = "#39424b", L = (arr) => arr.map((p) => p.map(f1).join(",")).join(" ");
  const arcoTopo = (t) => AG + (zViga - AG) * (1 - Math.pow(2 * t - 1, 2));
  const arcoBase = (t) => arcoTopo(t) - (7 + 15 * Math.pow(2 * t - 1, 2));
  const jArco = (t) => jA1 + t * (jA2 - jA1);
  const N = 40, T = Array.from({ length: N + 1 }, (_, k) => k / N);
  const linha = (i, a, b, w = 1.4, cor = acoEsc) => `<path d="M${L([P(i, a[0], a[1])])} L${L([P(i, b[0], b[1])])}" stroke="${cor}" stroke-width="${w}"/>`;
  // uma treliça (um plano): arco, montantes, pendurais, pilares metálicos, as duas vigas
  const plano = (i, frente) => {
    let s = "";
    const sw = frente ? 2.4 : 1.8;
    // montantes do arco ao tabuleiro de cima e pendurais do arco ao tabuleiro de baixo
    for (let k = 1; k < 14; k++) { const t = k / 14, j = jArco(t); const zt = arcoTopo(t), zb = arcoBase(t);
      if (zt < zViga - 4) s += linha(i, [j, zt], [j, zViga], frente ? 2 : 1.4);
      if (zb > zBaixo + 6) s += linha(i, [j, zb], [j, zBaixo], frente ? 1.3 : 1); }
    // o arco: banda entre as duas cordas, com a treliça em ziguezague
    s += `<polygon points="${L(T.map((t) => P(i, jArco(t), arcoTopo(t))))} ${L(T.slice().reverse().map((t) => P(i, jArco(t), arcoBase(t))))}" fill="${aco}" fill-opacity="${frente ? .9 : .7}" stroke="${K}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    for (let k = 0; k < N; k++) { const t0 = T[k], t1 = T[k + 1]; s += linha(i, [jArco(t0), k % 2 ? arcoTopo(t0) : arcoBase(t0)], [jArco(t1), k % 2 ? arcoBase(t1) : arcoTopo(t1)], 1.1); }
    // pilares metálicos em treliça (fora do arco e sobre os encontros)
    for (const [jp, zb] of o.pilares) { const w = .16;
      s += `<polygon points="${L([P(i, jp - w, zb), P(i, jp + w, zb), P(i, jp + w * .6, zViga), P(i, jp - w * .6, zViga)])}" fill="none" stroke="${K}" stroke-width="${sw}"/>`;
      const n = Math.max(2, Math.round((zViga - zb) / 18));
      for (let k = 0; k < n; k++) { const z0 = zb + (zViga - zb) * k / n, z1 = zb + (zViga - zb) * (k + 1) / n, w0 = w - (w * .4) * k / n, w1 = w - (w * .4) * (k + 1) / n; s += linha(i, [jp - w0, z0], [jp + w1, z1], 1.1) + linha(i, [jp + w0, z0], [jp - w1, z1], 1.1); } }
    // viga do tabuleiro de cima (Warren) e guarda
    s += `<polygon points="${L([P(i, jPorto, zViga), P(i, jGaia, zViga), P(i, jGaia, zCima), P(i, jPorto, zCima)])}" fill="${aco}" fill-opacity="${frente ? .35 : .25}" stroke="${K}" stroke-width="${sw}"/>`;
    for (let j = jPorto; j < jGaia - .01; j += .22) s += linha(i, [j, zViga], [Math.min(jGaia, j + .11), zCima], 1.2) + linha(i, [Math.min(jGaia, j + .11), zCima], [Math.min(jGaia, j + .22), zViga], 1.2);
    // viga do tabuleiro de baixo
    s += `<polygon points="${L([P(i, jB1, -4), P(i, jB2, -4), P(i, jB2, zBaixo), P(i, jB1, zBaixo)])}" fill="${frente ? "#46505a" : aco}" stroke="${K}" stroke-width="${sw}"/>`;
    if (frente) for (let j = jB1 + .1; j < jB2; j += .3) s += linha(i, [j, -4], [j + .15, zBaixo], 1, "#2c343c") + linha(i, [j + .15, zBaixo], [j + .3, -4], 1, "#2c343c");
    return s;
  };
  let s = plano(iA, false);
  // postes da catenária do metro (lado de trás)
  for (let j = jPorto + .5; j < jGaia - .2; j += 1.3) s += linha(iA, [j, zCima], [j, zCima + 30], 2, acoEsc) + `<path d="M${L([P(iA, j, zCima + 27)])} L${L([P(iA + (iB - iA) * .75, j, zCima + 27)])}" stroke="${acoEsc}" stroke-width="1.6"/>`;
  s += `<path d="M${L([P(iA + (iB - iA) * .4, jPorto, zCima + 26)])} L${L([P(iA + (iB - iA) * .4, jGaia, zCima + 26)])} M${L([P(iA + (iB - iA) * .62, jPorto, zCima + 26)])} L${L([P(iA + (iB - iA) * .62, jGaia, zCima + 26)])}" stroke="${K}" stroke-width=".9" opacity=".7"/>`;
  // o que se vê entre as duas treliças: o dorso do arco, os tabuleiros com os carris do metro e o passeio
  s += T.slice(0, -1).map((t, k) => { const t1 = T[k + 1]; return `<polygon points="${L([P(iA, jArco(t), arcoTopo(t)), P(iB, jArco(t), arcoTopo(t)), P(iB, jArco(t1), arcoTopo(t1)), P(iA, jArco(t1), arcoTopo(t1))])}" fill="#76838f" stroke="${K}" stroke-width=".8"/>`; }).join("");
  s += `<polygon points="${L([P(iA, jB1, zBaixo), P(iB, jB1, zBaixo), P(iB, jB2, zBaixo), P(iA, jB2, zBaixo)])}" fill="#8d8a84" stroke="${K}" stroke-width="2"/>`;
  s += `<polygon points="${L([P(iA, jPorto, zCima), P(iB, jPorto, zCima), P(iB, jGaia, zCima), P(iA, jGaia, zCima)])}" fill="#8d8a84" stroke="${K}" stroke-width="2.2"/>`;
  for (const f of [.4, .6]) { const ii = iA + (iB - iA) * f; s += `<path d="M${L([P(ii, jPorto, zCima)])} L${L([P(ii, jGaia, zCima)])}" stroke="#4a4744" stroke-width="1.6"/>`; }
  const tras = s; s = "";
  s += plano(iB, true);
  // guarda de ferro do tabuleiro de baixo, do lado de quem olha
  s += `<path d="M${L([P(iB, jB1, zBaixo + 11)])} L${L([P(iB, jB2, zBaixo + 11)])}" stroke="${K}" stroke-width="2.2"/>`;
  for (let j = jB1; j <= jB2 + .01; j += .12) s += linha(iB, [j, zBaixo], [j, zBaixo + 11], 1.2, K);
  // guardas por cima dos tabuleiros
  for (const ii of [iA, iB]) s += `<path d="M${L([P(ii, jPorto, zCima + 7)])} L${L([P(ii, jGaia, zCima + 7)])}" stroke="${K}" stroke-width="1.4"/>`;
  if (jGaia >= 18.9) s += `<polygon points="${L([P(iA, jGaia, zViga), P(iB, jGaia, zViga), P(iB, jGaia, zCima), P(iA, jGaia, zCima)])}" fill="#46505a" stroke="${K}" stroke-width="2.2"/>`;
  // encontros de granito nas margens, com o arco de passagem do tabuleiro de baixo
  const encontro = (j0) => caixa(iA - .16, j0, iB - iA + .32, .6, 38, { z0: AG, fundo: "url(#granito)", topo: "#c2b7a4", semRodape: true, semCornija: true, semSombra: true,
    esq: (w, hh) => `<path d="M${f1(w * .2)} ${-22} V${-40} a${f1(w * .3)} ${f1(w * .3)} 0 0 1 ${f1(w * .6)} 0 V-22 Z" fill="#5b5147" stroke="${K}" stroke-width="1.8"/><path d="M${f1(w * .2)} -24 h${f1(w * .6)}" stroke="#8d8a84" stroke-width="4"/>` });
  s += encontro(jA1 - .42) + encontro(jA2 - .18);
  return { tras: `<g class="ponte" id="ponteT">${tras}</g>`, frente: `<g class="ponte" id="ponteF">${s}</g>` };
}
// o metro do Porto (Eurotram): prata, faixa preta das janelas, amarelo na frente e numa risca, pantógrafo; ao longo de j, desenhado em j = 0
function metroIso(i, z) {
  const wi = .22, dj = 1.45, h = 26;
  return caixa(i - wi / 2, -dj, wi, dj, h, { z0: z, fundo: "#c7ccd1", topo: "#8e959c", semRodape: true, semCornija: true, semSombra: true,
    esq: (w, hh) => `<path d="M0 ${-hh + 3} q${f1(w / 2)} -5 ${f1(w)} 0 V-4 H0 Z" fill="${C.amarelo}" stroke="${K}" stroke-width="1.6"/><path d="M1.5 ${-hh + 5} q${f1(w / 2 - 1.5)} -4 ${f1(w - 3)} 0 V${-hh + 14} H1.5 Z" fill="#1d2126" stroke="${K}" stroke-width="1.2"/><circle cx="4" cy="-7" r="1.6" fill="#fff6c9"/><circle cx="${f1(w - 4)}" cy="-7" r="1.6" fill="#fff6c9"/>`,
    dir: (w, hh) => `<rect x="0" y="${-hh + 5}" width="${f1(w)}" height="10" fill="#1d2126"/>${Array.from({ length: 9 }, (_, k) => `<rect x="${f1(4 + k * w / 9)}" y="${-hh + 6.5}" width="${f1(w / 9 - 3)}" height="7" rx="1.5" class="vidro" opacity=".55"/>`).join("")}<path d="M0 -8 H${f1(w)}" stroke="${C.amarelo}" stroke-width="3"/><path d="M${f1(w * .5)} ${-hh} V0" stroke="${K}" stroke-width="1.2"/>${[.18, .38, .64, .84].map((f) => `<rect x="${f1(w * f - 4)}" y="${-hh + 5}" width="8" height="${hh - 7}" fill="none" stroke="${K}" stroke-width="1"/>`).join("")}`,
    extraTopo: ({ A, B, C: Cc, D: Dd }) => { const m = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2]; return `<path d="M${f1(m[0] - 6)} ${f1(m[1] - 1)} l6 -9 l6 9 M${f1(m[0] - 7)} ${f1(m[1] - 10)} h14" fill="none" stroke="${K}" stroke-width="1.4"/>`; } });
}
// cúpula de esquina à moda dos prédios dos Aliados: tambor de pedra com óculos, cúpula de ardósia com nervuras, lanternim
function cupula(x, y, rx, ardosia) {
  const ry = rx / 2, hT = Math.round(rx * .75), hC = rx * 1.45, pedra = "#efe6d6", L = (n) => f1(n);
  let s = `<g class="cupula">`;
  // tambor: cilindro (lados + frente curva), cornija por cima
  s += `<path d="M${L(x - rx)} ${L(y)} V${L(y - hT)} A${rx} ${ry} 0 0 0 ${L(x + rx)} ${L(y - hT)} V${L(y)} A${rx} ${ry} 0 0 1 ${L(x - rx)} ${L(y)} Z" fill="${pedra}" stroke="${K}" stroke-width="2.2"/>`;
  for (const f of [-.6, 0, .6]) { const w = 2.6 * Math.sqrt(1 - f * f) + 1.2, cx = x + rx * f, cy = y - 3 + Math.sqrt(1 - f * f) * ry; s += `<path d="M${L(cx - w)} ${L(cy)} V${L(cy - 9)} a${L(w)} ${L(w)} 0 0 1 ${L(2 * w)} 0 V${L(cy)} Z" fill="#5a6b7a" stroke="${K}" stroke-width="1.1"/>`; }
  s += `<ellipse cx="${L(x)}" cy="${L(y - hT)}" rx="${L(rx + 3)}" ry="${L(ry + 1.6)}" fill="${C.pedraEsc}" stroke="${K}" stroke-width="2"/>`;
  // cúpula de ardósia: meia-cúpula em perfil de sino, nervuras, reflexo
  const b = y - hT;
  s += `<path d="M${L(x - rx)} ${L(b)} C${L(x - rx)} ${L(b - hC * .75)} ${L(x - rx * .35)} ${L(b - hC)} ${L(x)} ${L(b - hC)} C${L(x + rx * .35)} ${L(b - hC)} ${L(x + rx)} ${L(b - hC * .75)} ${L(x + rx)} ${L(b)} A${rx} ${ry} 0 0 1 ${L(x - rx)} ${L(b)} Z" fill="${ardosia}" stroke="${K}" stroke-width="2.4"/>`;
  for (const f of [-.6, -.25, .12, .5]) s += `<path d="M${L(x + rx * f)} ${L(b + Math.sqrt(1 - f * f) * ry)} Q${L(x + rx * f * .8)} ${L(b - hC * .7)} ${L(x)} ${L(b - hC + 1)}" fill="none" stroke="${K}" stroke-width="1.2" opacity=".5"/>`;
  s += `<path d="M${L(x - rx * .72)} ${L(b - hC * .25)} Q${L(x - rx * .65)} ${L(b - hC * .8)} ${L(x - rx * .2)} ${L(b - hC * .95)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round"/>`;
  // lanternim com remate
  const t = b - hC;
  s += `<rect x="${L(x - 5)}" y="${L(t - 12)}" width="10" height="12" fill="${pedra}" stroke="${K}" stroke-width="1.8"/><path d="M${L(x - 2)} ${L(t - 3)} v-6" stroke="#3b342c" stroke-width="2"/><path d="M${L(x - 7)} ${L(t - 12)} q7 -9 14 0z" fill="${ardosia}" stroke="${K}" stroke-width="1.8"/><path d="M${L(x)} ${L(t - 16)} v-9" stroke="${K}" stroke-width="2"/><circle cx="${L(x)}" cy="${L(t - 26)}" r="2.6" fill="${C.amarelo}" stroke="${K}" stroke-width="1.2"/>`;
  return s + `</g>`;
}
// Mosteiro da Serra do Pilar: igreja redonda com cúpula e lanterna (cilindros desenhados com elipses)
function serraDoPilar(ci, cj, z) {
  const [x, y] = P(ci, cj, z), rx = 44, ry = 22, h = 58;
  const pedra = "#e8e0cf";
  let s = `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx + 6}" ry="${ry + 3}" fill="${C.sombra}"/>`;
  s += `<path d="M${f1(x - rx)} ${f1(y)} V${f1(y - h)} A${rx} ${ry} 0 0 1 ${f1(x + rx)} ${f1(y - h)} V${f1(y)} A${rx} ${ry} 0 0 1 ${f1(x - rx)} ${f1(y)} Z" fill="${pedra}" stroke="${K}" stroke-width="2.4"/>`;
  for (const f of [-.6, -.2, .2, .6]) s += `<path d="M${f1(x + rx * f - 3)} ${f1(y - h * .55 + Math.sqrt(1 - f * f) * ry)} v-16 a3 3 0 0 1 6 0 v16 z" fill="#3b342c" stroke="${K}" stroke-width="1.2"/>`;
  s += `<path d="M${f1(x - rx)} ${f1(y - h)} A${rx} ${ry} 0 0 0 ${f1(x + rx)} ${f1(y - h)}" fill="none" stroke="${K}" stroke-width="2"/><path d="M${f1(x - rx - 3)} ${f1(y - h)} A${rx + 3} ${ry + 2} 0 0 0 ${f1(x + rx + 3)} ${f1(y - h)}" fill="none" stroke="${C.granitoEsc}" stroke-width="3"/>`;
  s += `<path d="M${f1(x - rx + 4)} ${f1(y - h)} Q${f1(x - rx + 6)} ${f1(y - h - 44)} ${f1(x)} ${f1(y - h - 50)} Q${f1(x + rx - 6)} ${f1(y - h - 44)} ${f1(x + rx - 4)} ${f1(y - h)} A${rx - 4} ${ry - 2} 0 0 1 ${f1(x - rx + 4)} ${f1(y - h)} Z" fill="#cfc6b4" stroke="${K}" stroke-width="2.4"/>`;
  s += `<path d="M${f1(x - 16)} ${f1(y - h - 30)} q6 -14 16 -18" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.2"/>`;
  s += `<rect x="${f1(x - 8)}" y="${f1(y - h - 66)}" width="16" height="18" fill="${pedra}" stroke="${K}" stroke-width="1.8"/><path d="M${f1(x - 9)} ${f1(y - h - 66)} q9 -12 18 0 z" fill="#cfc6b4" stroke="${K}" stroke-width="1.6"/><path d="M${f1(x)} ${f1(y - h - 72)} v-10 M${f1(x - 4)} ${f1(y - h - 78)} h8" stroke="${K}" stroke-width="1.8"/>`;
  return `<g class="serra-pilar">${s}</g>`;
}
// bandeira de adepto do FC Porto: riscas azuis e brancas, «FCP» ao centro (sem o emblema do clube); ondula por CSS
function bandeiraFCP(x, y, w = 30, h = 46) {
  const n = 5, az = "#0a3d91";
  let s = Array.from({ length: n }, (_, k) => `<rect x="${f1(x + k * w / n)}" y="${y}" width="${f1(w / n)}" height="${h}" fill="${k % 2 ? "#fff" : az}"/>`).join("");
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${K}" stroke-width="1.6"/><rect x="${f1(x + 3)}" y="${f1(y + h / 2 - 7)}" width="${w - 6}" height="14" rx="3" fill="#fff" stroke="${K}" stroke-width="1.2"/><text x="${f1(x + w / 2)}" y="${f1(y + h / 2 + 4)}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="10.5" fill="${az}">FCP</text>`;
  return `<g class="bandeira-fcp">${s}<path d="M${x - 2} ${y} h${w + 4}" stroke="${K}" stroke-width="2.2"/></g>`;
}
function gaivota() { return `<path class="gaivota" d="M-9 0 q4 -6 9 0 q5 -6 9 0" fill="none" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`; }
// carro (caixa baixa com o habitáculo de vidro por cima), ao longo de i
function carro(i, j, cor) {
  const z = ALT(i + .31, j + .16);
  const cabine = caixa(i + .14, j + .04, .34, .24, 11, { z0: z + 14, fundo: "#cfe6f5", topo: cor, semRodape: true, semCornija: true, semSombra: true, esq: (w) => `<path d="M${f1(w * .5)} -11 V0" stroke="${K}" stroke-width="1.4"/>` });
  const rodas = [[.12, .32], [.5, .32]].map(([u, v]) => { const [x, y] = P(i + u, j + v, z); return `<ellipse cx="${f1(x)}" cy="${f1(y - 3)}" rx="4.5" ry="5" fill="${K}"/>`; }).join("");
  return `<g class="carro">${caixa(i, j, .62, .32, 14, { z0: z + 2, fundo: cor, topo: cor, semRodape: true, semCornija: true })}${rodas}${cabine}</g>`;
}
