/* O Bairro visto de cima — motor isométrico + kit de edifícios.
   Projeção 2:1. Um ladrilho = 128 × 64. As fachadas desenham-se DE FRENTE em 2D (x para a direita,
   y para cima negativo, chão em y = 0) e são projetadas nas paredes com uma matriz:
   parede «esquerda» (ao longo de i) · matrix(.8944, .4472, 0, 1, …) · parede «direita» (ao longo de −j) · matrix(.8944, −.4472, 0, 1, …).
   1 ladrilho de fachada = 71.55 px (o comprimento real da aresta), para as proporções não se deformarem. */
const K = "#16130f";
const TW = 128, TH = 64, LAD = Math.hypot(TW / 2, TH / 2); // 71.55
const OX = 720, OY = 250; // origem do ladrilho (0,0)
const P = (i, j) => [OX + (i - j) * TW / 2, OY + (i + j) * TH / 2];
const f1 = (n) => +n.toFixed(1);
const pts = (...ps) => ps.map((p) => p.map(f1).join(",")).join(" ");
const C = {
  telha: "#d9643a", telhaEsc: "#a8472a", pedra: "#efe6d6", pedraEsc: "#d8cbb4", vidro: "var(--vidro)", verde: "#0c8f5c", verdeEsc: "#07613d",
  amarelo: "#ffc62b", azul: "#2445d6", azulClaro: "#dfe5ff", vermelho: "#e2412a", rosa: "#ff8fb7", creme: "#fff6e3", tijolo: "#c4553a",
  ocre: "#e6a93a", lilas: "#9b7fd9", relva: "#9fd67a", relvaEsc: "#7cbf5a", rua: "#b9b3a8", passeio: "#f2eee4", sombra: "rgba(22,19,15,.18)",
};

/* ——— padrões (espaço do utilizador: seguem a matriz de cada parede) ——— */
function padroes() {
  return `
  <pattern id="azAzul" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f7f9ff"/><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" fill="none" stroke="#2445d6" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#2445d6"/><circle cx="0" cy="0" r="2" fill="#2445d6"/><circle cx="18" cy="0" r="2" fill="#2445d6"/><circle cx="0" cy="18" r="2" fill="#2445d6"/><circle cx="18" cy="18" r="2" fill="#2445d6"/></pattern>
  <pattern id="azVerde" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#eaf7ef"/><path d="M8 2 q6 6 0 12 q-6 -6 0 -12z" fill="#0c8f5c"/></pattern>
  <pattern id="azRosa" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff0f4"/><circle cx="8" cy="8" r="3.2" fill="none" stroke="#e2412a" stroke-width="1.4"/><circle cx="0" cy="0" r="2.4" fill="#ff8fb7"/><circle cx="16" cy="16" r="2.4" fill="#ff8fb7"/><circle cx="16" cy="0" r="2.4" fill="#ff8fb7"/><circle cx="0" cy="16" r="2.4" fill="#ff8fb7"/></pattern>
  <pattern id="tijolo" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#c4553a"/><path d="M0 6 H24 M12 0 V6 M0 6 V12 M24 6 V12" stroke="#9c3e28" stroke-width="1.3"/></pattern>
  <pattern id="calcadaIso" width="64" height="32" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 -.8944 .4472 0 0)"><rect width="64" height="32" fill="#f2eee4"/><path d="M0 16 q8 -9 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#2b2824" stroke-width="4"/></pattern>
  <pattern id="pedrasIso" width="20" height="12" patternUnits="userSpaceOnUse" patternTransform="matrix(.8944 .4472 -.8944 .4472 0 0)"><rect width="20" height="12" fill="#b9b3a8"/><rect x="1" y="1" width="8" height="4" rx="1.5" fill="#a8a296"/><rect x="11" y="1" width="8" height="4" rx="1.5" fill="#aea89c"/><rect x="6" y="7" width="8" height="4" rx="1.5" fill="#a39d91"/></pattern>
  <radialGradient id="brilho" r=".5"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>`;
}

/* ——— chão ——— */
function losango(i, j, wi = 1, dj = 1) { return pts(P(i, j), P(i + wi, j), P(i + wi, j + dj), P(i, j + dj)); }
function chao(i, j, wi, dj, fill, extra = "") { return `<polygon points="${losango(i, j, wi, dj)}" fill="${fill}" stroke="${K}" stroke-width="2.5" stroke-linejoin="round" ${extra}/>`; }

/* ——— fachadas em 2D (coordenadas locais: 0..w, −h..0) ——— */
function janela2(x, y, w, h, o = {}) {
  const arco = o.arco ? `M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} H${x} Z` : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  let s = `<path d="${arco}" fill="${C.pedra}" stroke="${K}" stroke-width="2.4" transform="translate(${x + w / 2} ${y + h / 2}) scale(1.28 1.16) translate(${-(x + w / 2)} ${-(y + h / 2)})"/>`;
  s += `<path class="vidro" d="${arco}" stroke="${K}" stroke-width="2.2"/><path d="M${x + w / 2} ${y} V${y + h}" stroke="${K}" stroke-width="1.6"/>`;
  if (o.portadas) s += `<rect x="${x - w * .45}" y="${y}" width="${w * .4}" height="${h}" fill="${o.portadas}" stroke="${K}" stroke-width="2"/><rect x="${x + w * 1.05}" y="${y}" width="${w * .4}" height="${h}" fill="${o.portadas}" stroke="${K}" stroke-width="2"/>`;
  if (o.varanda) { s += `<rect x="${x - 6}" y="${y + h - 2}" width="${w + 12}" height="4" fill="${C.pedraEsc}" stroke="${K}" stroke-width="1.8"/><path d="M${x - 5} ${y + h - 16} H${x + w + 5}" stroke="${K}" stroke-width="2.2"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${x - 4 + k * (w + 8) / 5} ${y + h - 16} V${y + h - 2}" stroke="${K}" stroke-width="1.5"/>`).join("")}`; if (o.flores) s += `<circle cx="${x + 2}" cy="${y + h - 20}" r="4.5" fill="${C.vermelho}" stroke="${K}" stroke-width="1.5"/><circle cx="${x + w - 3}" cy="${y + h - 20}" r="4" fill="${C.rosa}" stroke="${K}" stroke-width="1.5"/>`; }
  return s;
}
function porta2(x, w, h, cor, arco = false) {
  const top = arco ? `M${x} ${-h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${-h + w / 2}` : `M${x} ${-h} H${x + w}`;
  return `<path d="${top} V0 H${x} Z" fill="${cor}" stroke="${K}" stroke-width="2.4"/><circle cx="${x + w * .78}" cy="${-h * .45}" r="2.3" fill="${C.amarelo}" stroke="${K}" stroke-width="1.2"/>`;
}
function placa2(x, y, w, txt, fundo, cor) {
  const tam = Math.min(15, (w - 10) / (txt.length * .74));
  return `<rect x="${x}" y="${y}" width="${w}" height="${tam + 10}" rx="4" fill="${fundo}" stroke="${K}" stroke-width="2.2"/><text x="${x + w / 2}" y="${y + tam + 3}" text-anchor="middle" font-family="Archivo" font-weight="900" font-stretch="112%" font-size="${tam}" fill="${cor}">${txt}</text>`;
}
function toldo2(x, y, w, c1, c2 = "#fff") { const n = Math.max(3, Math.round(w / 16)); let s = ""; for (let k = 0; k < n; k++) s += `<path d="M${x + k * w / n} ${y} h${w / n} l3 18 h${-w / n} z" fill="${k % 2 ? c2 : c1}" stroke="${K}" stroke-width="1.6"/>`; return s; }
function grelhaJanelas(w, h, pisos, porPiso, o = {}) {
  let s = ""; const base = o.base || 0, top = o.top || 14, alt = (h - base - top) / pisos;
  for (let r = 0; r < pisos; r++) for (let k = 0; k < porPiso; k++) {
    const jw = o.jw || 16, jh = o.jh || Math.min(28, alt * .62), gx = (w - porPiso * jw) / (porPiso + 1);
    s += janela2(gx + k * (jw + gx), -h + top + r * alt + (alt - jh) / 2, jw, jh, { arco: o.arco && r === 0, portadas: o.portadas, varanda: o.varanda && r < pisos, flores: o.flores && (r + k) % 2 === 0 });
  }
  return s;
}

/* ——— caixa isométrica: duas paredes com fachada + telhado ——— */
// fachadas: { esq: fn(w,h) → svg 2D, dir: fn(w,h) → svg 2D, cor: fundo das paredes }
function caixa(i, j, wi, dj, h, o) {
  const A = P(i, j + dj), B = P(i + wi, j + dj), Cc = P(i + wi, j), Dd = P(i, j);
  const up = (p, dh = h) => [p[0], p[1] - dh];
  const wE = wi * LAD, wD = dj * LAD;
  let s = `<g class="caixa">`;
  // sombra no chão (para a direita)
  s += `<polygon points="${pts(B, Cc, [Cc[0] + h * .5, Cc[1] + h * .12], [B[0] + h * .5, B[1] + h * .12])}" fill="${C.sombra}"/>`;
  // parede esquerda (virada para baixo-esquerda), ao longo de i
  s += `<g transform="matrix(.8944 .4472 0 1 ${f1(A[0])} ${f1(A[1])})"><rect x="0" y="${-h}" width="${wE}" height="${h}" fill="${o.fundoE || o.fundo}" stroke="${K}" stroke-width="2.6"/>${o.esq ? o.esq(wE, h) : ""}</g>`;
  // parede direita (virada para baixo-direita), ao longo de −j; um pouco mais escura
  s += `<g transform="matrix(.8944 -.4472 0 1 ${f1(B[0])} ${f1(B[1])})"><rect x="0" y="${-h}" width="${wD}" height="${h}" fill="${o.fundoD || o.fundo}" stroke="${K}" stroke-width="2.6"/>${o.dir ? o.dir(wD, h) : ""}<rect x="0" y="${-h}" width="${wD}" height="${h}" fill="#16130f" opacity=".1"/></g>`;
  // telhado
  if (o.telhado === "duas") {
    const rh = o.rh || 34, m1 = [(Dd[0] + A[0]) / 2, (Dd[1] + A[1]) / 2], m2 = [(Cc[0] + B[0]) / 2, (Cc[1] + B[1]) / 2];
    s += `<polygon points="${pts(up(A), up(B), up(m2, h + rh), up(m1, h + rh))}" fill="${o.corTelhado || C.telha}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts(up(B), up(Cc), up(m2, h + rh))}" fill="${o.corTelhado2 || C.telhaEsc}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<polygon points="${pts(up(Dd), up(Cc), up(m2, h + rh), up(m1, h + rh))}" fill="${o.corTelhado2 || C.telhaEsc}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round" opacity=".9"/>`;
  } else {
    s += `<polygon points="${pts(up(A), up(B), up(Cc), up(Dd))}" fill="${o.topo || C.pedraEsc}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`;
    if (o.telhado === "platibanda") s += `<polygon points="${pts(up(A, h + 8), up(B, h + 8), up(Cc, h + 8), up(Dd, h + 8))}" fill="none" stroke="${K}" stroke-width="2"/>`;
  }
  if (o.extraTopo) s += o.extraTopo({ A: up(A), B: up(B), C: up(Cc), D: up(Dd) });
  return s + `</g>`;
}

/* ——— árvores, candeeiros, bancos ——— */
function jacaranda(x, y, e = 1) {
  return `<g class="arvore" transform="translate(${x} ${y}) scale(${e})"><ellipse cx="0" cy="4" rx="34" ry="12" fill="${C.sombra}"/><path d="M0 4 V-40 M0 -26 l14 -16" stroke="#6b4a2f" stroke-width="7" stroke-linecap="round" fill="none"/>
    ${[[-16, -58, 26], [14, -64, 26], [0, -84, 24], [26, -46, 18], [-26, -44, 18]].map(([dx, dy, r]) => `<circle class="copa" cx="${dx}" cy="${dy}" r="${r}" fill="${C.lilas}" stroke="${K}" stroke-width="2.6"/>`).join("")}</g>`;
}
function arvoreVerde(x, y, e = 1) {
  return `<g class="arvore" transform="translate(${x} ${y}) scale(${e})"><ellipse cx="0" cy="4" rx="26" ry="9" fill="${C.sombra}"/><path d="M0 4 V-26" stroke="#6b4a2f" stroke-width="6" stroke-linecap="round"/><circle class="copa" cx="0" cy="-44" r="24" fill="#4fae6a" stroke="${K}" stroke-width="2.6"/><circle cx="-8" cy="-52" r="8" fill="#7cc98c"/></g>`;
}
function candeeiro(x, y) {
  return `<g class="candeeiro" transform="translate(${x} ${y})"><circle class="luz" cx="0" cy="-58" r="40" fill="url(#brilho)" opacity="0"/><path d="M0 0 V-52" stroke="${K}" stroke-width="3.5"/><path d="M-6 -66 h12 l-2 12 h-8 z" class="lanterna" fill="#fff6c9" stroke="${K}" stroke-width="2.2"/><path d="M-7 -66 l7 -7 l7 7" fill="${K}"/></g>`;
}

/* ——— o pin de dados por cima de cada edifício (sempre de frente, legível) ——— */
function pin(x, y, rotulo, valor, cor = K, fundo = "#fff") {
  const w = Math.max(valor.length * 11.5 + 24, rotulo.length * 7.2 + 24);
  return `<g class="pin" transform="translate(${f1(x)} ${f1(y)})"><g class="pin-corpo"><path d="M0 0 l-8 -12 h16 z" fill="${fundo}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="${-w / 2}" y="-58" width="${w}" height="47" rx="12" fill="${fundo}" stroke="${K}" stroke-width="2.6"/>
    <text x="0" y="-41" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="11.5" fill="#4a4540">${rotulo}</text>
    <text x="0" y="-19" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="19" fill="${cor}" font-variant-numeric="tabular-nums">${valor}</text></g></g>`;
}
