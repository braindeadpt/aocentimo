/* O Bairro do Cêntimo — cenário em SVG (peças reutilizáveis: o «kit» do bairro).
   Unidades da cena: 3400 × 900. Linha do passeio: y = 700. Tinta: contorno 4. */
const K = "#16130f";
const COR = {
  telha: "#d9643a", pedra: "#efe6d6", pedraEsc: "#d8cbb4", vidro: "#9fd0ff", verde: "#0c8f5c", verdeEsc: "#07613d",
  amarelo: "#ffc62b", azul: "#2445d6", azulClaro: "#dfe5ff", vermelho: "#e2412a", rosa: "#ff8fb7", creme: "#fff6e3",
  tijolo: "#c4553a", cobre: "#d27a3f", ocre: "#e6a93a", lilas: "#9b7fd9",
};
const W = 3400, H = 900, CHAO = 700;
const f = (n) => +n.toFixed(1);

/* ——— padrões: azulejos, calçada, tijolo, pedras da rua ——— */
function padroes() {
  return `
  <pattern id="azAzul" width="28" height="28" patternUnits="userSpaceOnUse">
    <rect width="28" height="28" fill="#f7f9ff"/><path d="M14 2 L26 14 L14 26 L2 14 Z" fill="none" stroke="#2445d6" stroke-width="2.2"/>
    <circle cx="14" cy="14" r="3.6" fill="#2445d6"/><circle cx="0" cy="0" r="3" fill="#2445d6"/><circle cx="28" cy="0" r="3" fill="#2445d6"/><circle cx="0" cy="28" r="3" fill="#2445d6"/><circle cx="28" cy="28" r="3" fill="#2445d6"/>
    <rect width="28" height="28" fill="none" stroke="#c9d2f5" stroke-width=".8"/>
  </pattern>
  <pattern id="azVerde" width="26" height="26" patternUnits="userSpaceOnUse">
    <rect width="26" height="26" fill="#eaf7ef"/><path d="M13 3 q10 10 0 20 q-10 -10 0 -20z" fill="#0c8f5c"/><path d="M3 13 q10 -10 20 0 q-10 10 -20 0z" fill="#0c8f5c" opacity=".55"/>
    <rect width="26" height="26" fill="none" stroke="#b8dcc7" stroke-width=".8"/>
  </pattern>
  <pattern id="azLosango" width="30" height="30" patternUnits="userSpaceOnUse">
    <rect width="30" height="30" fill="#fff3c9"/><path d="M15 0 L30 15 L15 30 L0 15 Z" fill="#2445d6"/><path d="M15 7 L23 15 L15 23 L7 15 Z" fill="#ffc62b"/>
  </pattern>
  <pattern id="azRosa" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="#fff0f4"/><circle cx="12" cy="12" r="5" fill="none" stroke="#e2412a" stroke-width="2"/><circle cx="0" cy="0" r="4" fill="#ff8fb7"/><circle cx="24" cy="24" r="4" fill="#ff8fb7"/><circle cx="24" cy="0" r="4" fill="#ff8fb7"/><circle cx="0" cy="24" r="4" fill="#ff8fb7"/>
  </pattern>
  <pattern id="calcada" width="140" height="44" patternUnits="userSpaceOnUse">
    <rect width="140" height="44" fill="#f2eee4"/>
    <path d="M0 22 q17.5 -18 35 0 t35 0 t35 0 t35 0" fill="none" stroke="#2b2824" stroke-width="9"/>
  </pattern>
  <pattern id="pedrasRua" width="36" height="22" patternUnits="userSpaceOnUse">
    <rect width="36" height="22" fill="#b9b3a8"/><rect x="1.5" y="1.5" width="15" height="8" rx="2.5" fill="#a8a296"/><rect x="19.5" y="1.5" width="15" height="8" rx="2.5" fill="#aea89c"/>
    <rect x="-7.5" y="12.5" width="15" height="8" rx="2.5" fill="#aea89c"/><rect x="10.5" y="12.5" width="15" height="8" rx="2.5" fill="#a39d91"/><rect x="28.5" y="12.5" width="15" height="8" rx="2.5" fill="#a8a296"/>
  </pattern>
  <pattern id="tijolo" width="40" height="20" patternUnits="userSpaceOnUse">
    <rect width="40" height="20" fill="#c4553a"/><path d="M0 10 H40 M20 0 V10 M0 10 V20 M40 10 V20" stroke="#9c3e28" stroke-width="2"/>
  </pattern>
  <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop class="ceu-a" offset="0"/><stop class="ceu-b" offset="1"/></linearGradient>
  <radialGradient id="brilhoCand" r=".5"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>`;
}

/* ——— peças ——— */
function janela(x, y, w, h, o = {}) {
  const arco = o.arco ? `M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} H${x} Z` : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  let s = `<g class="janela">`;
  const m = 7, moldura = o.arco ? `M${x - m} ${y + w / 2} A${w / 2 + m} ${w / 2 + m} 0 0 1 ${x + w + m} ${y + w / 2} V${y + h + m} H${x - m} Z` : `M${x - m} ${y - m} H${x + w + m} V${y + h + m} H${x - m} Z`;
  s += `<path d="${moldura}" fill="${COR.pedra}" stroke="${K}" stroke-width="4"/>`;
  s += `<path class="vidro" d="${arco}" stroke="${K}" stroke-width="3.5"/>`;
  s += `<path d="M${x + w / 2} ${y + (o.arco ? w / 2 - w / 2 : 0)} V${y + h} M${x} ${y + h * .55} H${x + w}" stroke="${K}" stroke-width="2.5"/>`;
  if (o.portadas) s += `<rect x="${x - w * .42}" y="${y + (o.arco ? w * .45 : 0)}" width="${w * .38}" height="${h - (o.arco ? w * .45 : 0)}" fill="${o.portadas}" stroke="${K}" stroke-width="3"/><rect x="${x + w * 1.04}" y="${y + (o.arco ? w * .45 : 0)}" width="${w * .38}" height="${h - (o.arco ? w * .45 : 0)}" fill="${o.portadas}" stroke="${K}" stroke-width="3"/>`;
  if (o.varanda) {
    const vy = y + h - 8, vx = x - 14, vw = w + 28;
    s += `<rect x="${vx}" y="${vy + 2}" width="${vw}" height="8" fill="${COR.pedraEsc}" stroke="${K}" stroke-width="3"/>`;
    s += `<path d="M${vx + 2} ${vy - 34} H${vx + vw - 2}" stroke="${K}" stroke-width="4"/>`;
    for (let i = 0; i <= 8; i++) s += `<path d="M${vx + 4 + i * (vw - 8) / 8} ${vy - 34} V${vy + 2}" stroke="${K}" stroke-width="2.5"/>`;
    if (o.vasos) s += `<g class="vasos"><rect x="${vx + 6}" y="${vy - 50}" width="18" height="16" fill="${COR.telha}" stroke="${K}" stroke-width="2.5"/><circle cx="${vx + 11}" cy="${vy - 56}" r="7" fill="${COR.vermelho}" stroke="${K}" stroke-width="2"/><circle cx="${vx + 20}" cy="${vy - 58}" r="6" fill="${COR.rosa}" stroke="${K}" stroke-width="2"/>
      <rect x="${vx + vw - 24}" y="${vy - 50}" width="18" height="16" fill="${COR.telha}" stroke="${K}" stroke-width="2.5"/><path d="M${vx + vw - 15} ${vy - 50} q-8 -14 -2 -22 M${vx + vw - 15} ${vy - 50} q6 -16 12 -18" stroke="${COR.verde}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
  }
  return s + `</g>`;
}
function porta(x, y, w, h, cor, o = {}) {
  const topo = o.arco ? `M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}` : `M${x} ${y} H${x + w}`;
  return `<g class="porta-g"><path d="M${x - 8} ${CHAO} V${y + (o.arco ? w / 2 : 0) - 8} ${o.arco ? `A${w / 2 + 8} ${w / 2 + 8} 0 0 1 ${x + w + 8} ${y + w / 2 - 8}` : `H${x + w + 8}`} V${CHAO}" fill="${COR.pedra}" stroke="${K}" stroke-width="4"/>
    <path class="porta-fundo" d="${topo} V${CHAO} H${x} Z" fill="#3a2a1c"/>
    <g class="folha" style="transform-box:fill-box;transform-origin:0% 50%"><path d="${topo} V${CHAO} H${x} Z" fill="${cor}" stroke="${K}" stroke-width="4"/>
    <rect x="${x + w * .18}" y="${y + (o.arco ? w * .6 : h * .12)}" width="${w * .64}" height="${h * .3}" rx="3" fill="none" stroke="${K}" stroke-width="2.5" opacity=".5"/>
    <circle cx="${x + w * .82}" cy="${y + h * .6}" r="4" fill="${COR.amarelo}" stroke="${K}" stroke-width="2"/></g></g>`;
}
function placa(x, y, w, texto, fundo = K, cor = "#fff", tam = 26) {
  tam = Math.min(tam, (w - 24) / (texto.length * .78));
  return `<g class="placa"><rect x="${x}" y="${y}" width="${w}" height="${tam + 20}" rx="8" fill="${fundo}" stroke="${K}" stroke-width="4"/>
    <text x="${x + w / 2}" y="${y + tam + 3}" text-anchor="middle" font-family="Archivo" font-weight="900" font-stretch="112%" font-size="${tam}" fill="${cor}" letter-spacing="1">${texto}</text></g>`;
}
// quadro de dados na fachada: o número de hoje, com rótulo
function quadroDados(x, y, w, rotulo, valor, o = {}) {
  const h = o.h || 74; w = Math.max(w, String(valor).length * 18 + 30, rotulo.length * 9.6 + 28);
  return `<g class="quadro-dados" data-dado="${o.id || ""}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${o.fundo || "#1f2a24"}" stroke="${K}" stroke-width="4"/>
    <text x="${x + 14}" y="${y + 26}" font-family="Archivo" font-weight="700" font-size="17" fill="${o.corRot || "#cfe9d8"}">${rotulo}</text>
    <text x="${x + 14}" y="${y + 58}" font-family="Archivo" font-weight="900" font-size="30" fill="${o.corVal || "#fff"}" font-variant-numeric="tabular-nums">${valor}</text></g>`;
}
function telhado(x, y, w, cor = COR.telha) {
  return `<path d="M${x - 14} ${y} L${x + 24} ${y - 34} H${x + w - 24} L${x + w + 14} ${y} Z" fill="${cor}" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M${x + 10} ${y - 12} H${x + w - 10} M${x + 18} ${y - 23} H${x + w - 18}" stroke="#a8472a" stroke-width="2.5"/>`;
}
function cornija(x, y, w) { return `<rect x="${x - 10}" y="${y}" width="${w + 20}" height="14" fill="${COR.pedra}" stroke="${K}" stroke-width="4"/>`; }
function toldo(x, y, w, c1, c2 = "#fff") {
  const n = Math.round(w / 34); let s = `<g class="toldo">`;
  for (let i = 0; i < n; i++) s += `<path d="M${x + i * w / n} ${y} h${w / n} l6 46 h${-w / n} z" fill="${i % 2 ? c2 : c1}" stroke="${K}" stroke-width="3"/>`;
  s += `<path d="M${x} ${y + 46} ${Array.from({ length: n }, (_, i) => `q${w / n / 2} 16 ${w / n} 0`).join(" ")}" fill="${c1}" stroke="${K}" stroke-width="3" transform="translate(6 0)"/>`;
  return s + `</g>`;
}

/* ——— os edifícios (cada um é um <g class="edificio"> com área de clique) ——— */
function edificio(id, x, w, alto, conteudo, rotulo) {
  return `<g class="edificio" data-id="${id}" tabindex="0" role="button" aria-label="${rotulo}">
    <rect class="alvo" x="${x - 10}" y="${CHAO - alto - 60}" width="${w + 20}" height="${alto + 60}" fill="transparent"/>
    <g class="corpo-ed">${conteudo}</g></g>`;
}

function fabrica(x, D) {
  const w = 380, alto = 330, y = CHAO - alto;
  let s = `<rect x="${x + 250}" y="${y - 150}" width="46" height="170" fill="url(#tijolo)" stroke="${K}" stroke-width="4"/><rect x="${x + 244}" y="${y - 160}" width="58" height="16" fill="${COR.pedraEsc}" stroke="${K}" stroke-width="4"/>
    <g class="fumo">${[0, 1, 2, 3].map((i) => `<circle class="baforada" cx="${x + 273}" cy="${y - 175}" r="${16 + i * 3}" fill="#e7e2d8" opacity="0"/>`).join("")}</g>
    <rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="url(#tijolo)" stroke="${K}" stroke-width="4"/>
    <path d="M${x - 6} ${y} ${[0, 1, 2, 3].map((i) => `L${x + i * 95 + 60} ${y - 62} L${x + i * 95 + 95} ${y}`).join(" ")} Z" fill="#6b7a8f" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${x + i * 95 + 62} ${y - 58} L${x + i * 95 + 92} ${y - 4} L${x + i * 95 + 62} ${y - 4} Z" class="vidro" stroke="${K}" stroke-width="3"/>`).join("")}`;
  for (let i = 0; i < 4; i++) s += janela(x + 26 + i * 90, y + 50, 58, 90);
  s += placa(x + 70, y + 150, 240, "FÁBRICA", COR.amarelo, K, 30);
  s += porta(x + 150, CHAO - 130, 80, 130, "#6b7a8f");
  s += quadroDados(x + 246, CHAO - 100, 120, "Salário bruto", D.salario, { fundo: "#fff", corRot: "#4a4540", corVal: K, id: "salario", h: 70 });
  return edificio("fabrica", x, w, alto + 160, s, "Fábrica — para onde vai o teu salário?");
}
function segSocial(x, D) {
  const w = 270, alto = 380, y = CHAO - alto;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="#e9eef7" stroke="${K}" stroke-width="4"/>
    <path d="M${x - 14} ${y} L${x + w / 2} ${y - 70} L${x + w + 14} ${y} Z" fill="${COR.pedra}" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="${x + w / 2}" cy="${y - 28}" r="18" fill="${COR.azulClaro}" stroke="${K}" stroke-width="3.5"/>
    ${cornija(x, y, w)}`;
  for (let i = 0; i < 3; i++) s += janela(x + 30 + i * 78, y + 44, 52, 84, { arco: true });
  s += placa(x + 18, y + 150, w - 36, "SEGURANÇA SOCIAL", COR.azul, "#fff", 20);
  s += `${[0, 1, 2, 3].map((i) => `<rect x="${x + 22 + i * 66}" y="${y + 206}" data-coluna="${i}" width="22" height="${alto - 206}" fill="${COR.pedra}" stroke="${K}" stroke-width="3.5"/>`).join("")}`;
  s += porta(x + 184, CHAO - 120, 62, 120, COR.azul, { arco: true });
  s += quadroDados(x + 14, CHAO - 140, 120, "TSU", D.tsu, { h: 64 });
  return edificio("segsocial", x, w, alto + 70, s, "Segurança Social — os descontos para o futuro");
}
function financas(x, D) {
  const w = 290, alto = 410, y = CHAO - alto;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="${COR.pedra}" stroke="${K}" stroke-width="4"/>
    ${cornija(x, y, w)}<rect x="${x + w / 2 - 50}" y="${y - 58}" width="100" height="58" fill="${COR.pedra}" stroke="${K}" stroke-width="4"/>
    <circle class="relogio" cx="${x + w / 2}" cy="${y - 29}" r="22" fill="#fff" stroke="${K}" stroke-width="4"/><path class="ponteiro" d="M${x + w / 2} ${y - 29} V${y - 44}" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/><path class="ponteiro2" d="M${x + w / 2} ${y - 29} H${x + w / 2 + 11}" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>`;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) s += janela(x + 36 + i * 82, y + 40 + r * 118, 52, 82, { portadas: r === 0 ? "#7c8a6a" : null });
  s += placa(x + 40, y + 250, w - 80, "FINANÇAS", K, "#fff", 26);
  s += porta(x + w / 2 - 38, CHAO - 104, 76, 104, "#5a3d27");
  s += `<g class="fila">${[0, 1, 2].map((i) => `<rect x="${x + 16 + i * 26}" y="${CHAO - 58}" width="16" height="58" rx="8" fill="${["#9b7fd9", "#e2412a", "#2445d6"][i]}" stroke="${K}" stroke-width="3"/><circle cx="${x + 24 + i * 26}" cy="${CHAO - 70}" r="11" fill="#f1c6a3" stroke="${K}" stroke-width="3"/>`).join("")}</g>`;
  s += quadroDados(x + w - 104, CHAO - 100, 96, "IRS", D.irsAno, { h: 64, fundo: "#fff", corRot: "#4a4540", corVal: K });
  return edificio("financas", x, w, alto + 60, s, "Finanças — como funciona o IRS");
}
function predioInes(x, D) {
  const w = 250, alto = 470, y = CHAO - alto;
  let s = telhado(x, y, w) + `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="url(#azAzul)" stroke="${K}" stroke-width="4"/>
    <rect x="${x - 6}" y="${y}" width="16" height="${alto}" fill="${COR.pedra}" stroke="${K}" stroke-width="3"/><rect x="${x + w - 10}" y="${y}" width="16" height="${alto}" fill="${COR.pedra}" stroke="${K}" stroke-width="3"/>
    <g class="gato" transform="translate(${x + 170} ${y - 34})"><path d="M0 0 q-2 -26 14 -28 q16 2 14 28 z" fill="${K}"/><path d="M3 -24 l3 -10 l6 8 M26 -24 l-3 -10 l-6 8" fill="${K}"/><circle cx="9" cy="-16" r="2.2" fill="${COR.amarelo}"/><circle cx="19" cy="-16" r="2.2" fill="${COR.amarelo}"/><path class="cauda" d="M26 -2 q18 -4 16 -24" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/></g>`;
  for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) s += janela(x + 44 + i * 112, y + 36 + r * 118, 50, 80, { arco: r === 0, varanda: true, vasos: r === 1 && i === 0 });
  // roupa estendida entre as janelas do 2.º andar
  s += `<g class="roupa"><path d="M${x + 106} ${y + 186} Q${x + 150} ${y + 200} ${x + 190} ${y + 186}" fill="none" stroke="${K}" stroke-width="2"/>
    <g class="peca" style="transform-origin:${x + 122}px ${y + 190}px"><rect x="${x + 114}" y="${y + 190}" width="18" height="26" fill="${COR.vermelho}" stroke="${K}" stroke-width="2.5"/></g>
    <g class="peca p2" style="transform-origin:${x + 148}px ${y + 194}px"><path d="M${x + 138} ${y + 194} h22 l4 10 l-6 2 v20 h-18 v-20 l-6 -2 z" fill="${COR.amarelo}" stroke="${K}" stroke-width="2.5"/></g>
    <g class="peca p3" style="transform-origin:${x + 174}px ${y + 191}px"><rect x="${x + 168}" y="${y + 191}" width="14" height="20" fill="#fff" stroke="${K}" stroke-width="2.5"/></g></g>`;
  s += porta(x + w / 2 - 34, CHAO - 118, 68, 118, COR.verde, { arco: true });
  s += `<text x="${x + w / 2}" y="${CHAO - 126}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${K}">24</text>`;
  return edificio("casa", x, w, alto + 70, s, "Casa da Inês — o que chega ao fim do mês");
}
function mercearia(x, D) {
  const w = 270, alto = 400, y = CHAO - alto;
  let s = telhado(x, y, w, "#c9573a") + `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="url(#azVerde)" stroke="${K}" stroke-width="4"/>`;
  for (let i = 0; i < 2; i++) s += janela(x + 50 + i * 118, y + 34, 52, 80, { varanda: true, vasos: i === 1 });
  s += `<rect x="${x + 8}" y="${y + 176}" width="${w - 16}" height="${alto - 176}" fill="#7a4a2a" stroke="${K}" stroke-width="4"/>`;
  s += placa(x + 22, y + 146, w - 44, "MERCEARIA DO MANUEL", COR.creme, K, 18);
  s += toldo(x + 6, y + 196, w - 12, COR.verde, "#fff");
  s += `<rect x="${x + 22}" y="${y + 256}" width="120" height="${alto - 256 - 50}" class="vidro" stroke="${K}" stroke-width="4"/>`;
  s += quadroDados(x + 30, y + 266, 104, "Cabaz", D.cabaz, { h: 70, fundo: "#23302a" });
  s += porta(x + 168, CHAO - 150, 72, 150, "#5a3d27");
  // caixas de fruta à porta
  s += `<g class="fruta"><rect x="${x + 16}" y="${CHAO - 46}" width="64" height="40" fill="#c99a5b" stroke="${K}" stroke-width="3.5"/>${[0, 1, 2, 3].map((i) => `<circle cx="${x + 26 + i * 15}" cy="${CHAO - 50}" r="9" fill="${COR.vermelho}" stroke="${K}" stroke-width="2.5"/>`).join("")}
    <rect x="${x + 84}" y="${CHAO - 40}" width="64" height="34" fill="#c99a5b" stroke="${K}" stroke-width="3.5"/>${[0, 1, 2, 3].map((i) => `<circle cx="${x + 94 + i * 15}" cy="${CHAO - 44}" r="8.5" fill="${COR.amarelo}" stroke="${K}" stroke-width="2.5"/>`).join("")}</g>`;
  return edificio("mercearia", x, w, alto + 70, s, "Mercearia — porque está tudo mais caro?");
}
function pastelaria(x, D) {
  const w = 250, alto = 360, y = CHAO - alto;
  let s = telhado(x, y, w) + `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="url(#azRosa)" stroke="${K}" stroke-width="4"/>`;
  for (let i = 0; i < 2; i++) s += janela(x + 46 + i * 110, y + 34, 50, 78, { portadas: "#e2412a" });
  s += placa(x + 24, y + 150, w - 48, "PASTELARIA", "#fff", COR.vermelho, 24);
  s += toldo(x + 6, y + 200, w - 12, COR.vermelho, "#fff");
  s += `<rect x="${x + 16}" y="${y + 258}" width="118" height="${alto - 258 - 46}" class="vidro" stroke="${K}" stroke-width="4"/>
    <g transform="translate(${x + 42} ${y + 300})"><ellipse cx="0" cy="0" rx="18" ry="8" fill="#f2b33d" stroke="${K}" stroke-width="3"/><ellipse cx="0" cy="-2" rx="10" ry="4" fill="#8a4b12"/></g>
    <g transform="translate(${x + 92} ${y + 300})"><ellipse cx="0" cy="0" rx="18" ry="8" fill="#f2b33d" stroke="${K}" stroke-width="3"/><ellipse cx="0" cy="-2" rx="10" ry="4" fill="#8a4b12"/></g>`;
  s += porta(x + 156, CHAO - 144, 66, 144, "#fff");
  s += `<g class="mesa" transform="translate(-6 0)"><rect x="${x + 20}" y="${CHAO - 46}" width="58" height="8" fill="#fff" stroke="${K}" stroke-width="3"/><path d="M${x + 49} ${CHAO - 38} V${CHAO}" stroke="${K}" stroke-width="4"/>
    <path d="M${x + 44} ${CHAO - 58} h12 v10 h-12 z" fill="#fff" stroke="${K}" stroke-width="2.5"/><path class="vapor" d="M${x + 48} ${CHAO - 64} q-4 -8 0 -14 M${x + 53} ${CHAO - 64} q-4 -8 0 -14" stroke="#9a9186" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
  s += `<g class="cavalete"><path d="M${x + 96} ${CHAO} L${x + 108} ${CHAO - 96} M${x + 176} ${CHAO} L${x + 164} ${CHAO - 96}" stroke="#7a4a2a" stroke-width="6"/>
    <rect x="${x + 76}" y="${CHAO - 108}" width="120" height="80" rx="6" fill="#26332c" stroke="${K}" stroke-width="4"/>
    <text x="${x + 136}" y="${CHAO - 82}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="19" fill="#fff">cafés desde 2020</text>
    <text x="${x + 136}" y="${CHAO - 46}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="28" fill="${COR.amarelo}">${D.cafes}</text></g>`;
  return edificio("pastelaria", x, w, alto + 70, s, "Pastelaria — o preço do café e do pastel");
}
function praca(x, D) {
  // jacarandá, banco de jardim, quiosque com as manchetes do dia
  let s = `<g class="jacaranda"><path d="M${x + 60} ${CHAO} q6 -90 -8 -150 M${x + 58} ${CHAO - 100} q30 -30 40 -70" stroke="#6b4a2f" stroke-width="12" fill="none" stroke-linecap="round"/>
    ${[[-10, -210, 70], [60, -220, 64], [30, -270, 62], [100, -180, 48], [-40, -170, 46]].map(([dx, dy, r]) => `<circle class="copa" cx="${x + 50 + dx}" cy="${CHAO + dy}" r="${r}" fill="${COR.lilas}" stroke="${K}" stroke-width="4"/>`).join("")}</g>
    <g class="banco-jardim"><rect x="${x + 110}" y="${CHAO - 42}" width="70" height="8" fill="${COR.verde}" stroke="${K}" stroke-width="3"/><rect x="${x + 110}" y="${CHAO - 60}" width="70" height="8" fill="${COR.verde}" stroke="${K}" stroke-width="3"/><path d="M${x + 118} ${CHAO - 34} V${CHAO} M${x + 172} ${CHAO - 34} V${CHAO}" stroke="${K}" stroke-width="4"/></g>`;
  const q = x + 200;
  s += `<g class="quiosque-g"><path d="M${q - 8} ${CHAO - 230} Q${q + 60} ${CHAO - 300} ${q + 128} ${CHAO - 230} Z" fill="${COR.verde}" stroke="${K}" stroke-width="4"/><circle cx="${q + 60}" cy="${CHAO - 270}" r="8" fill="${COR.amarelo}" stroke="${K}" stroke-width="3"/>
    <rect x="${q}" y="${CHAO - 230}" width="120" height="230" fill="${COR.verdeEsc}" stroke="${K}" stroke-width="4"/>
    <rect x="${q + 10}" y="${CHAO - 218}" width="100" height="26" fill="#fff" stroke="${K}" stroke-width="3"/><text x="${q + 60}" y="${CHAO - 199}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="15" fill="${K}">QUIOSQUE</text>
    ${[[D.jornal1, 0], [D.jornal2, 1]].map(([t, i]) => `<g class="jornal"><rect x="${q + 10}" y="${CHAO - 180 + i * 78}" width="100" height="68" fill="#fff" stroke="${K}" stroke-width="3"/><text x="${q + 60}" y="${CHAO - 160 + i * 78}" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="12" fill="#4a4540">${t[0]}</text><text x="${q + 60}" y="${CHAO - 132 + i * 78}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="24" fill="${K}">${t[1]}</text></g>`).join("")}
  </g>`;
  return edificio("quiosque", x + 180, 160, 300, s, "Quiosque — os números do país hoje");
}
function banco(x, D) {
  const w = 320, alto = 420, y = CHAO - alto;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="${COR.pedra}" stroke="${K}" stroke-width="4"/>
    <path d="M${x - 16} ${y} L${x + w / 2} ${y - 74} L${x + w + 16} ${y} Z" fill="${COR.pedraEsc}" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>
    <text x="${x + w / 2}" y="${y - 20}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="28" fill="${K}">€</text>${cornija(x, y, w)}`;
  s += placa(x + 50, y + 34, w - 100, "BANCO", "#fff", K, 30);
  s += `${[0, 1, 2, 3, 4].map((i) => `<g><rect x="${x + 22 + i * 62}" y="${y + 104}" width="28" height="${alto - 104}" fill="#fff" stroke="${K}" stroke-width="3.5"/><rect x="${x + 16 + i * 62}" y="${y + 96}" width="40" height="12" fill="${COR.pedra}" stroke="${K}" stroke-width="3"/></g>`).join("")}`;
  s += quadroDados(x + 60, y + 132, 200, "Euribor 12 meses", D.euribor, { h: 76, fundo: "#16213f", corRot: "#c9d4ff" });
  s += porta(x + w / 2 - 42, CHAO - 150, 84, 150, "#2b3a66");
  return edificio("banco", x, w, alto + 80, s, "Banco — crédito, juros e a Euribor");
}
function correios(x, D) {
  const w = 250, alto = 360, y = CHAO - alto;
  let s = telhado(x, y, w) + `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="${COR.creme}" stroke="${K}" stroke-width="4"/>`;
  for (let i = 0; i < 2; i++) s += janela(x + 46 + i * 110, y + 34, 50, 78, { portadas: COR.vermelho });
  s += placa(x + 30, y + 146, w - 60, "CORREIOS", COR.vermelho, "#fff", 26);
  s += quadroDados(x + 18, y + 190, 136, "Cert. de Aforro", D.ca, { h: 62, fundo: "#fff", corRot: "#4a4540", corVal: COR.verde });
  s += porta(x + 162, CHAO - 140, 66, 140, COR.vermelho);
  // o marco do correio
  s += `<g class="marco"><rect x="${x + 96}" y="${CHAO - 96}" width="42" height="96" rx="6" fill="${COR.vermelho}" stroke="${K}" stroke-width="4"/><path d="M${x + 96} ${CHAO - 84} q21 -26 42 0" fill="${COR.vermelho}" stroke="${K}" stroke-width="4"/><rect x="${x + 104}" y="${CHAO - 70}" width="26" height="6" rx="3" fill="${K}"/></g>`;
  return edificio("correios", x, w, alto + 70, s, "Correios — poupar em certificados de aforro");
}
function escola(x, D) {
  const w = 300, alto = 380, y = CHAO - alto;
  let s = telhado(x, y, w, "#b8543a") + `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="${COR.ocre}" stroke="${K}" stroke-width="4"/>
    <rect x="${x + w / 2 - 34}" y="${y - 70}" width="68" height="40" fill="${COR.ocre}" stroke="${K}" stroke-width="4"/><path d="M${x + w / 2 - 34} ${y - 70} L${x + w / 2} ${y - 96} L${x + w / 2 + 34} ${y - 70}" fill="#b8543a" stroke="${K}" stroke-width="4"/>
    <circle cx="${x + w / 2}" cy="${y - 50}" r="11" fill="${COR.amarelo}" stroke="${K}" stroke-width="3"/>`;
  for (let i = 0; i < 3; i++) s += janela(x + 30 + i * 90, y + 36, 60, 90);
  s += placa(x + 60, y + 150, w - 120, "ESCOLA", "#fff", K, 28);
  s += `<g class="quadro-negro"><rect x="${x + 18}" y="${y + 214}" width="160" height="96" fill="#264a3a" stroke="${K}" stroke-width="5"/><text x="${x + 98}" y="${y + 246}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="22" fill="#fff">Pergunta do dia:</text><text x="${x + 98}" y="${y + 276}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="21" fill="${COR.amarelo}">o que é a inflação?</text></g>`;
  s += porta(x + 200, CHAO - 130, 76, 130, COR.azul);
  return edificio("escola", x, w, alto + 110, s, "Escola — aprender as palavras do dinheiro");
}
function bomba(x, D) {
  const w = 400;
  let s = `<rect x="${x}" y="${CHAO - 260}" width="${w}" height="44" fill="${COR.amarelo}" stroke="${K}" stroke-width="4"/>
    <text x="${x + w / 2}" y="${CHAO - 229}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="24" fill="${K}">COMBUSTÍVEIS</text>
    ${[x + 30, x + w - 54].map((cx) => `<rect x="${cx}" y="${CHAO - 216}" width="24" height="216" fill="#dcd6cc" stroke="${K}" stroke-width="4"/>`).join("")}
    ${[x + 110, x + 230].map((px) => `<g class="bomba-g"><rect x="${px}" y="${CHAO - 118}" width="54" height="118" rx="8" fill="${COR.vermelho}" stroke="${K}" stroke-width="4"/><rect x="${px + 9}" y="${CHAO - 104}" width="36" height="28" fill="#fff" stroke="${K}" stroke-width="3"/><path d="M${px + 54} ${CHAO - 70} q20 0 20 30 v20" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/></g>`).join("")}`;
  // o totem dos preços de hoje
  const t = x + w - 10;
  s += `<g class="totem"><rect x="${t - 6}" y="${CHAO - 420}" width="150" height="420" fill="#fff" stroke="${K}" stroke-width="4"/>
    <rect x="${t + 6}" y="${CHAO - 408}" width="126" height="40" fill="${COR.amarelo}" stroke="${K}" stroke-width="3.5"/><text x="${t + 69}" y="${CHAO - 380}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${K}">PREÇO MÉDIO</text>
    ${[["Gasóleo", D.gasoleo, 0], ["Gasolina 95", D.gasolina, 1]].map(([n, v, i]) => `<text x="${t + 69}" y="${CHAO - 336 + i * 96}" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="17" fill="#4a4540">${n}</text><rect x="${t + 6}" y="${CHAO - 326 + i * 96}" width="126" height="52" rx="6" fill="#16130f"/><text x="${t + 69}" y="${CHAO - 290 + i * 96}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="30" fill="${COR.amarelo}" font-variant-numeric="tabular-nums">${v}</text>`).join("")}
    <text x="${t + 69}" y="${CHAO - 124}" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="15" fill="#4a4540">€ por litro</text>
    <text x="${t + 69}" y="${CHAO - 102}" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="15" fill="#4a4540">${D.dataCombustivel}</text></g>`;
  return edificio("bomba", x, w + 150, 440, s, "Bomba de gasolina — quanto do litro é imposto?");
}

/* ——— a rua ——— */
function candeeiro(x) {
  return `<g class="candeeiro"><circle class="luz-cand" cx="${x}" cy="${CHAO - 196}" r="60" fill="url(#brilhoCand)" opacity="0"/>
    <path d="M${x} ${CHAO + 50} V${CHAO - 180} q0 -20 18 -20" stroke="${K}" stroke-width="7" fill="none"/>
    <path d="M${x + 6} ${CHAO - 214} h24 l-4 30 h-16 z" class="lanterna" fill="#fff6c9" stroke="${K}" stroke-width="4" stroke-linejoin="round"/><path d="M${x + 4} ${CHAO - 214} l14 -14 l14 14" fill="${K}"/></g>`;
}
function eletrico() {
  const w = 330;
  let s = `<g id="eletrico"><path class="trolei" d="M${w * .62} 0 L${w * .5} -182" stroke="${K}" stroke-width="5"/><circle cx="${w * .5}" cy="-182" r="6" fill="${K}"/>
    <path d="M14 20 Q${w / 2} -6 ${w - 14} 20 Z" fill="#8f1f1f" stroke="${K}" stroke-width="4"/>
    <rect x="${w * .38}" y="-2" width="80" height="26" rx="4" fill="#16130f" stroke="${K}" stroke-width="3"/><text x="${w * .38 + 40}" y="17" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${COR.amarelo}">28</text>
    <rect x="6" y="20" width="${w - 12}" height="62" rx="12" fill="${COR.creme}" stroke="${K}" stroke-width="4"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${28 + i * 47}" y="30" width="36" height="40" rx="5" class="vidro-el" fill="${COR.vidro}" stroke="${K}" stroke-width="3"/>`).join("")}
    <rect x="0" y="80" width="${w}" height="54" rx="10" fill="${COR.amarelo}" stroke="${K}" stroke-width="4"/>
    
    <rect x="-6" y="128" width="${w + 12}" height="14" rx="4" fill="#8f1f1f" stroke="${K}" stroke-width="4"/>
    <circle cx="${w - 12}" cy="96" r="7" fill="#fff6c9" stroke="${K}" stroke-width="3"/>
    ${[w * .22, w * .78].map((cx) => `<circle class="roda" cx="${cx}" cy="150" r="16" fill="#3a3a3a" stroke="${K}" stroke-width="4"/><path class="raio" d="M${cx - 10} 150 H${cx + 10} M${cx} 140 V160" stroke="#bbb" stroke-width="3"/>`).join("")}
  </g>`;
  return s;
}

function montarCena(D) {
  const xs = { fabrica: 40, segsocial: 450, financas: 750, casa: 1070, mercearia: 1350, pastelaria: 1650, praca: 1920, banco: 2270, correios: 2620, escola: 2900, bomba: 3230 };
  let s = `<defs>${padroes()}</defs>
  <rect class="ceu-rect" width="${W + 700}" height="${CHAO + 20}" fill="url(#ceu)"/>
  <g class="estrelas" opacity="0">${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 197) % (W + 700)}" cy="${(i * 83) % 330 + 20}" r="${1.5 + (i % 3)}" fill="#fff"/>`).join("")}</g>
  <circle class="astro" cx="3000" cy="120" r="52" fill="#ffd24a" stroke="${K}" stroke-width="4"/>
  <g class="nuvens">${[[300, 110, 1], [1300, 80, .8], [2300, 140, 1.1], [3300, 90, .9]].map(([x, y, e]) => `<g class="nuvem" transform="translate(${x} ${y}) scale(${e})"><path d="M0 40 q-4 -30 26 -30 q10 -26 42 -18 q24 -16 44 6 q30 -2 30 26 q0 16 -18 16 h-110 q-14 0 -14 0z" fill="#fff" stroke="${K}" stroke-width="4"/></g>`).join("")}</g>
  <g class="colinas" opacity=".9"><path d="M0 560 Q300 430 620 520 T1300 500 T2000 470 T2700 510 T3400 470 V720 H0Z" fill="#c9d3f5"/>
    <path d="M1600 470 h60 v-30 h14 v14 h14 v-14 h14 v14 h14 v-14 h14 v30 h60 v40 h-204z" fill="#aebbe8"/></g>
  <line x1="0" y1="${CHAO - 150}" x2="${W + 700}" y2="${CHAO - 150}" stroke="${K}" stroke-width="2" opacity=".55"/>`;
  s += fabrica(xs.fabrica, D) + segSocial(xs.segsocial, D) + financas(xs.financas, D) + predioInes(xs.casa, D) + mercearia(xs.mercearia, D) + pastelaria(xs.pastelaria, D) + praca(xs.praca, D) + banco(xs.banco, D) + correios(xs.correios, D) + escola(xs.escola, D) + bomba(xs.bomba, D);
  // bandeirinhas dos Santos Populares na praça
  s += `<g class="bandeirinhas"><path d="M1905 ${CHAO - 330} Q2090 ${CHAO - 280} 2270 ${CHAO - 330}" fill="none" stroke="${K}" stroke-width="2.5"/>${Array.from({ length: 11 }, (_, i) => { const t = (i + .5) / 11, bx = 1905 + t * 365, by = CHAO - 330 + 4 * 50 * t * (1 - t) * .5 + 0; return `<path class="bandeira" d="M${bx - 11} ${by} h22 l-11 24 z" fill="${["#e2412a", "#ffc62b", "#2445d6", "#0c8f5c", "#ff8fb7"][i % 5]}" stroke="${K}" stroke-width="2.5" style="transform-origin:${bx}px ${by}px"/>`; }).join("")}</g>`;
  // passeio, rua, carris
  s += `<rect x="0" y="${CHAO}" width="${W + 700}" height="62" fill="url(#calcada)" stroke="${K}" stroke-width="4"/>
    <rect x="0" y="${CHAO + 62}" width="${W + 700}" height="16" fill="${COR.pedraEsc}" stroke="${K}" stroke-width="4"/>
    <rect x="0" y="${CHAO + 78}" width="${W + 700}" height="122" fill="url(#pedrasRua)"/>
    <path d="M0 ${CHAO + 172} H${W + 700} M0 ${CHAO + 184} H${W + 700}" stroke="#6f6a61" stroke-width="5"/>`;
  s += `<g class="candeeiros">${[380, 1030, 1620, 2240, 2880].map(candeeiro).join("")}</g>`;
  s += `<g id="camadaPessoas"></g><g id="camadaMoedas"></g>`;
  s += `<g id="eletricoPos" transform="translate(-400 ${CHAO + 32})">${eletrico()}</g>`;
  s += `<g class="pombos">${[[1500, CHAO + 110], [1530, CHAO + 118], [2600, CHAO + 106]].map(([x, y], i) => `<g class="pombo" transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="14" ry="9" fill="#9aa3b5" stroke="${K}" stroke-width="3"/><circle class="cabeca" cx="12" cy="-8" r="6" fill="#9aa3b5" stroke="${K}" stroke-width="3"/><path d="M17 -8 l5 1.5 l-5 1.5" fill="${COR.ocre}"/><path d="M-4 9 v6 M4 9 v6" stroke="${COR.telha}" stroke-width="2.5"/></g>`).join("")}</g>`;
  return { svg: s, xs };
}
