/* Personagens do bairro — v2. Um só esqueleto, pés na origem, ~128 de altura.
   Proporções: cabeça ≈ 1/5 da altura (lê-se bem pequenino), ombros marcados, pescoço, sapatos, sobrancelhas.
   Partes animáveis (não mudar os nomes): .perna-e .perna-d .braco-e .braco-d .tronco .cabeca .olhos .boca .escala */
const PELE = { a: "#f3cba8", b: "#e8b48f", c: "#d49a72", d: "#b97a52", e: "#7f4f33" };
const K2 = "#16130f", C_AMARELO = "#ffc62b";
const escurecer = (hex, f = .78) => { const n = parseInt(hex.slice(1), 16); const c = (s) => Math.min(255, Math.round(((n >> s) & 255) * f)).toString(16).padStart(2, "0"); return "#" + c(16) + c(8) + c(0); };

let lencoAtual = null;
const o_lenco = () => lencoAtual ? `<path d="M-17 -123 q17 -9 34 0 l-1 5 q-16 -8 -32 0z" fill="${lencoAtual}" stroke="${K2}" stroke-width="2"/><path d="M15 -122 q7 2 8 8 q-5 -1 -8 -4" fill="${lencoAtual}" stroke="${K2}" stroke-width="1.8"/>` : "";
function cabelo(tipo, cor, fase) {
  const s = escurecer(cor, .8);
  const tras = {
    bob: `<path d="M-19 -110 q-1 22 4 30 h8 v-26 z M19 -110 q1 22 -4 30 h-8 v-26 z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
    comprido: `<path d="M-18 -112 q-4 34 2 44 h32 q6 -10 2 -44 z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
    coque: `<circle cx="3" cy="-139" r="7.5" fill="${cor}" stroke="${K2}" stroke-width="2.6"/><path d="M-2 -134 q5 -3 10 0" stroke="${K2}" stroke-width="2" fill="none"/>`,
    rabo: `<path class="rabo-cavalo" d="M14 -122 q20 2 16 32 q-3 6 -8 2 q2 -20 -10 -26" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
  }[tipo] || "";
  const frente = {
    bob: `<path d="M-18 -110 q-2 -26 18 -26 q20 0 18 26 q-8 -12 -18 -13 q-6 6 -18 13z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/><path d="M-6 -130 q8 -3 16 2" stroke="${s}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    comprido: `<path d="M-18 -110 q-2 -26 18 -26 q20 0 18 26 q-10 -10 -18 -12 q-8 2 -18 12z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
    careca: `<path d="M-17 -108 q-2 -8 3 -12 M17 -108 q2 -8 -3 -12" stroke="${cor}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M-6 -129 q6 -2 12 0" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    carrapito: `<circle cx="0" cy="-138" r="8.5" fill="${cor}" stroke="${K2}" stroke-width="2.6"/><path d="M-18 -110 q0 -24 18 -24 q18 0 18 24 q-8 -10 -18 -10 q-10 0 -18 10z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
    rabo: `<path d="M-18 -110 q0 -24 18 -24 q18 0 18 24 q-8 -11 -18 -11 q-10 0 -18 11z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
    coque: `<path d="M-18 -110 q-2 -26 18 -26 q20 0 18 26 q-6 -15 -18 -16 q-12 1 -18 16z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/><path d="M-9 -128 q9 -5 18 0" stroke="${s}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    surf: `<path d="M-18 -108 q-4 -18 4 -25 q8 -8 20 -5 q12 -1 16 8 q5 8 -2 22 q-3 -9 -9 -11 q-3 6 -10 4 q-5 -4 -6 -9 q-6 5 -13 16z" fill="${cor}" stroke="${K2}" stroke-width="2.6" stroke-linejoin="round"/><path d="M-8 -130 q6 -4 12 -2 M4 -128 q6 0 9 5" stroke="#f3dc8a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    espetado: `<path d="M-18 -108 q-3 -14 2 -20 l-1 -8 l7 5 l3 -10 l6 8 l5 -10 l4 10 l6 -7 l0 9 q6 6 3 23 q-4 -10 -17 -13 q-12 3 -18 13z" fill="${cor}" stroke="${K2}" stroke-width="2.6" stroke-linejoin="round"/>`,
    afro: `<path d="M-17 -112 q-1 -16 8 -20 q9 -5 18 0 q9 4 8 20 q-4 -9 -8 -10 q-4 4 -9 1 q-5 3 -9 -1 q-5 2 -8 10z" fill="${cor}" stroke="${K2}" stroke-width="2.2" stroke-linejoin="round"/>${o_lenco()}`,
    curto: `<path d="M-18 -110 q-2 -26 18 -26 q20 0 18 26 l-4 -6 q-6 -8 -14 -8 q-10 0 -18 14z" fill="${cor}" stroke="${K2}" stroke-width="2.6"/>`,
  }[tipo] || "";
  return fase === "tras" ? tras : frente;
}

function pessoa(o) {
  lencoAtual = o.lenco || null;
  const pele = PELE[o.pele || "b"], alt = o.escala || 1, roupa = o.roupa, sombraRoupa = escurecer(roupa, .82);
  const calcas = o.calcas || "#2b3a55", sapato = o.sapato || "#2b2320";
  const perna = (cls, dx) => `<g class="${cls}"><path d="M${dx - 5.5} -46 h11 v40 q0 3 -3 3 h-5 q-3 0 -3 -3 z" fill="${o.saia || o.calcoes ? pele : calcas}" stroke="${K2}" stroke-width="2.6"/>${o.calcoes ? `<path d="M${dx - 6.5} -47 h13 v19 h-13 z" fill="${calcas}" stroke="${K2}" stroke-width="2.4"/>` : ""}<path d="M${dx - 7} -6 h13 q5 0 5 5 v2 h-18 z" fill="${sapato}" stroke="${K2}" stroke-width="2.2"/></g>`;
  const braco = (cls, lado) => `<g class="${cls}"><path d="M${lado * 15} -88 q${lado * 7} 16 ${lado * 6} 34" fill="none" stroke="${K2}" stroke-width="12.5" stroke-linecap="round"/><path d="M${lado * 15} -88 q${lado * 7} 16 ${lado * 6} 34" fill="none" stroke="${roupa}" stroke-width="7.5" stroke-linecap="round"/><circle cx="${lado * 21}" cy="-51" r="5" fill="${pele}" stroke="${K2}" stroke-width="2.2"/></g>`;
  return `<g class="pessoa" data-nome="${o.nome || ""}"><g class="escala" transform="scale(${alt})">
    <ellipse cx="0" cy="1" rx="20" ry="4.5" fill="${K2}" opacity=".16"/>
    ${perna("perna-e", -6.5)}${perna("perna-d", 6.5)}
    <g class="tronco">
      ${o.mochila ? `<path d="M-25 -88 h13 v34 q0 4 -4 4 h-5 q-4 0 -4 -4 z" fill="${o.mochila}" stroke="${K2}" stroke-width="2.4"/>` : ""}
      ${cabelo(o.cabelo, o.corCabelo, "tras")}
      ${braco("braco-e", -1)}
      <path d="M-17 -84 q0 -10 10 -11 h14 q10 1 10 11 l2 ${o.saia ? 36 : 40} h-38 z" fill="${roupa}" stroke="${K2}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M-15 -60 q15 5 30 0" stroke="${sombraRoupa}" stroke-width="2" fill="none" opacity=".7"/>
      ${o.estampa === "ondas" ? `<path d="M-11 -76 q3 -3 6 0 t6 0 t6 0 t6 0 M-11 -69 q3 -3 6 0 t6 0 t6 0 t6 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>` : ""}
      ${o.saia ? `<path d="M-19 -50 h38 l6 18 h-50 z" fill="${o.saia}" stroke="${K2}" stroke-width="2.6" stroke-linejoin="round"/>` : `<path d="M-19 -46 h38" stroke="${K2}" stroke-width="2"/>`}
      ${o.gola ? `<path d="M-6 -95 l6 9 l6 -9" fill="${o.gola}" stroke="${K2}" stroke-width="2"/>` : `<path d="M-5 -95 q5 5 10 0" fill="${pele}" stroke="${K2}" stroke-width="2"/>`}
      ${o.auscultadores ? `<path d="M-11 -93 q11 9 22 0" fill="none" stroke="${o.auscultadores}" stroke-width="3.2" stroke-linecap="round"/><rect x="-17" y="-98" width="8" height="10" rx="3.5" fill="${o.auscultadores}" stroke="${K2}" stroke-width="1.6"/><rect x="9" y="-98" width="8" height="10" rx="3.5" fill="${o.auscultadores}" stroke="${K2}" stroke-width="1.6"/>` : ""}
      ${o.cachecol ? `<g class="cachecol"><path d="M-15 -95 q15 11 30 0 l1 7 q-16 11 -32 0z" fill="#0a3d91" stroke="${K2}" stroke-width="2"/>${[-10, -3, 4, 11].map((x) => `<path d="M${x} ${-93 + Math.abs(x) * .12} v6" stroke="#fff" stroke-width="3"/>`).join("")}<path d="M-12 -89 h8 v26 h-8z" fill="#0a3d91" stroke="${K2}" stroke-width="2"/>${[-84, -76, -68].map((y) => `<path d="M-12 ${y} h8" stroke="#fff" stroke-width="3"/>`).join("")}<path d="M-12 -63 v4 M-9.5 -63 v4 M-7 -63 v4 M-4.5 -63 v4" stroke="${K2}" stroke-width="1.2"/></g>` : ""}
      ${o.tiracolo ? `<path d="M-13 -92 L16 -58" stroke="${o.tiracolo}" stroke-width="3.4" stroke-linecap="round"/>` : ""}
      ${o.gravata ? `<path d="M0 -89 l-3 4 l3 20 l3 -20 z" fill="${o.gravata}" stroke="${K2}" stroke-width="1.6"/>` : ""}
      ${o.avental ? `<path d="M-11 -82 h22 v34 q-11 4 -22 0 z" fill="${o.avental}" stroke="${K2}" stroke-width="2.2"/><path d="M-11 -82 l-5 -9 M11 -82 l5 -9" stroke="${K2}" stroke-width="1.8"/>` : ""}
      ${o.manjerico ? `<g class="manjerico"><path d="M-30 -52 h14 l-2 12 h-10z" fill="#c4623f" stroke="${K2}" stroke-width="2"/><circle cx="-23" cy="-58" r="8" fill="#3f9b52" stroke="${K2}" stroke-width="2"/><circle cx="-26" cy="-61" r="2.4" fill="#7cc98c"/><path d="M-19 -58 v-16" stroke="${K2}" stroke-width="1.2"/><path d="M-19 -74 h9 l-2 3 l2 3 h-9z" fill="#fff" stroke="${K2}" stroke-width="1"/><circle cx="-19" cy="-75" r="3" fill="#e2412a" stroke="${K2}" stroke-width="1"/></g>` : ""}
      ${o.prancha ? `<g class="prancha" transform="rotate(10 30 -70)"><path d="M30 -150 C40 -128 42 -92 40 -48 C39 -26 35 -12 30 -10 C25 -12 21 -26 20 -48 C18 -92 20 -128 30 -150 Z" fill="${o.prancha}" stroke="${K2}" stroke-width="2.4"/><path d="M21.5 -86 C24 -84 36 -84 38.5 -86 L38.8 -76 C36 -74 24 -74 21.2 -76 Z" fill="#e2412a" stroke="${K2}" stroke-width="1.4"/><path d="M30 -146 V-12" stroke="${K2}" stroke-width="1" opacity=".45"/><path d="M24 -130 q3 -8 6 -12" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/><path d="M30 -18 l6 8 h-6 z" fill="${K2}"/></g>` : ""}
      ${braco("braco-d", 1)}
      ${o.martelo ? `<g class="martelinho" transform="rotate(32 21 -51)"><path d="M21 -51 V-82" stroke="${C_AMARELO}" stroke-width="4" stroke-linecap="round"/><path d="M21 -51 V-82" stroke="${K2}" stroke-width="1" opacity=".4"/><rect x="11" y="-94" width="20" height="13" rx="3" fill="#e2412a" stroke="${K2}" stroke-width="2"/>${[15, 19, 23, 27].map((x) => `<path d="M${x} -93 v11" stroke="#fff" stroke-width="1.3" opacity=".7"/>`).join("")}</g>` : ""}
      <g class="cabeca">
        <rect x="-4.5" y="-100" width="9" height="8" fill="${pele}" stroke="${K2}" stroke-width="2"/>
        ${o.cabelo === "afro" ? `<path d="M-21 -110 a9 9 0 0 1 -2 -14 a11 11 0 0 1 9 -15 a12 12 0 0 1 14 -7 a12 12 0 0 1 14 7 a11 11 0 0 1 9 15 a9 9 0 0 1 -2 14 z" fill="${o.corCabelo}" stroke="${K2}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="-8" cy="-136" r="5" fill="#fff" opacity=".12"/>` : ""}
        <circle cx="-17.5" cy="-114" r="3.6" fill="${pele}" stroke="${K2}" stroke-width="2"/><circle cx="17.5" cy="-114" r="3.6" fill="${pele}" stroke="${K2}" stroke-width="2"/>
        <circle cx="0" cy="-116" r="17" fill="${pele}" stroke="${K2}" stroke-width="2.8"/>
        ${cabelo(o.cabelo, o.corCabelo, "frente")}
        <g class="olhos"><ellipse cx="-6.5" cy="-115" rx="2.4" ry="3" fill="${K2}"/><ellipse cx="6.5" cy="-115" rx="2.4" ry="3" fill="${K2}"/><circle cx="-5.8" cy="-116" r=".9" fill="#fff"/><circle cx="7.2" cy="-116" r=".9" fill="#fff"/></g>
        <path class="sobrancelhas" d="M-10 -121 q3.5 -2 7 0 M3 -121 q3.5 -2 7 0" stroke="${escurecer(o.corCabelo || "#3b2418", .7)}" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${o.sardas ? [[-11, -110], [-9, -107.5], [-13, -107], [11, -110], [9, -107.5], [13, -107]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#b8683a"/>`).join("") : ""}
        ${o.barbaCurta ? [[-12,-109],[-10,-105],[-7,-101.5],[-3.5,-99.5],[0,-99],[3.5,-99.5],[7,-101.5],[10,-105],[12,-109],[-8,-104.5],[-4.5,-102.5],[4.5,-102.5],[8,-104.5],[-5,-107.8],[-2,-108.3],[2,-108.3],[5,-107.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".85" fill="${escurecer(o.corCabelo || "#3b2418", .8)}"/>`).join("") : ""}
        ${o.oculos === "quadrados" ? `<rect x="-12.5" y="-120" width="11" height="9" rx="2" fill="none" stroke="${K2}" stroke-width="2"/><rect x="1.5" y="-120" width="11" height="9" rx="2" fill="none" stroke="${K2}" stroke-width="2"/><path d="M-1.5 -116 h3" stroke="${K2}" stroke-width="2"/>` : ""}
        ${o.oculos && o.oculos !== "quadrados" ? `<circle cx="-6.5" cy="-115" r="5.8" fill="none" stroke="${K2}" stroke-width="1.8"/><circle cx="6.5" cy="-115" r="5.8" fill="none" stroke="${K2}" stroke-width="1.8"/><path d="M-.7 -115 h1.4" stroke="${K2}" stroke-width="1.8"/>` : ""}
        ${o.bone ? `<path d="M-18 -114 q0 -25 18 -25 q18 0 18 25 q-18 -5 -36 0z" fill="${o.bone}" stroke="${K2}" stroke-width="2.4"/><path d="M13 -117 q16 -4 22 3 q-10 4 -22 1z" fill="${escurecer(o.bone, .8)}" stroke="${K2}" stroke-width="2.2"/><circle cx="0" cy="-139" r="2.4" fill="${escurecer(o.bone, .8)}" stroke="${K2}" stroke-width="1.4"/>` : ""}
        <path d="M0 -113 q1.5 3.5 -1 4.5" stroke="${escurecer(pele, .72)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        ${o.bigode ? `<path d="M-8 -106 q8 -5 16 0 q-8 3.5 -16 0z" fill="${o.corCabelo}" stroke="${K2}" stroke-width="1.6"/>` : ""}
        ${o.barba ? `<path d="M-16 -113 q0 20 16 22 q16 -2 16 -22 q-4 9 -16 9 q-12 0 -16 -9z" fill="${o.corCabelo}" stroke="${K2}" stroke-width="2.2"/>` : ""}
        <path class="boca" d="M-4.5 ${o.bigode ? -102 : -105} q4.5 4.5 9 0" fill="none" stroke="${K2}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="-11" cy="-108" r="3" fill="#f2785a" opacity=".35"/><circle cx="11" cy="-108" r="3" fill="#f2785a" opacity=".35"/>
      </g>
      ${o.mala ? `<g class="mala"><path d="M17 -72 q7 -9 13 0" fill="none" stroke="${K2}" stroke-width="2.4"/><rect x="14" y="-72" width="21" height="17" rx="4" fill="${o.mala}" stroke="${K2}" stroke-width="2.4"/></g>` : ""}
      ${o.tiracolo ? `<g><rect x="9" y="-62" width="24" height="17" rx="3" fill="${o.tiracolo}" stroke="${K2}" stroke-width="2.4"/><path d="M9 -62 h24 v7 q-12 4 -24 0z" fill="${escurecer(o.tiracolo, .8)}" stroke="${K2}" stroke-width="2"/><rect x="19" y="-57" width="4" height="3" fill="${K2}"/></g>` : ""}
      ${o.pasta ? `<g><rect x="16" y="-60" width="20" height="15" rx="2" fill="${o.pasta}" stroke="${K2}" stroke-width="2.4"/><path d="M22 -60 v-3 h8 v3" fill="none" stroke="${K2}" stroke-width="2"/></g>` : ""}
    </g>
  </g></g>`;
}

const ELENCO = {
  ines: { nome: "Inês", pele: "b", cabelo: "bob", corCabelo: "#3b2418", roupa: "#2445d6", calcas: "#1f2b45", gola: "#dfe5ff" },
  manuel: { nome: "Sr. Manuel", pele: "c", cabelo: "careca", corCabelo: "#8d8d8d", roupa: "#ffffff", calcas: "#3a3a3a", avental: "#0c8f5c", bigode: true },
  arminda: { nome: "Dona Arminda", pele: "a", cabelo: "carrapito", corCabelo: "#cfc9c1", roupa: "#9e2f45", saia: "#3d3a4f", oculos: true, mala: "#e2412a", sapato: "#3d3a4f" },
  goncalo: { nome: "Gonçalo", pele: "a", cabelo: "espetado", corCabelo: "#c26b2b", roupa: "#0c8f5c", calcas: "#3557b7", mochila: "#ffc62b", bone: "#e2412a", auscultadores: "#16130f", sardas: true, escala: .86, sapato: "#ffffff" },
  rui: { nome: "Rui", pele: "a", cabelo: "curto", corCabelo: "#3b2418", roupa: "#26282b", calcas: "#3557b7", cachecol: true, manjerico: true, sapato: "#ffffff" },
  marta: { nome: "Marta", pele: "e", cabelo: "afro", corCabelo: "#1d1410", lenco: "#ffc62b", roupa: "#e2412a", calcas: "#26282b", martelo: true, sapato: "#ffffff" },
  diana: { nome: "Diana", pele: "a", cabelo: "comprido", corCabelo: "#e8c068", roupa: "#ffffff", saia: "#2445d6", pasta: "#7a4a2a", sapato: "#16130f" },
  pedro: { nome: "Pedro", pele: "c", cabelo: "surf", corCabelo: "#a8742c", roupa: "#1f8fb3", estampa: "ondas", calcas: "#f0b429", calcoes: true, prancha: "#7fd1c7", sapato: "#e9e3d6" },
};
const PASSANTES = [
  { pele: "c", cabelo: "curto", corCabelo: "#2b1d14", roupa: "#ff8fb7", calcas: "#2b3a55" },
  { pele: "a", cabelo: "comprido", corCabelo: "#c26b2b", roupa: "#16130f", calcas: "#4a3b2f" },
  { pele: "e", cabelo: "curto", corCabelo: "#1d1410", roupa: "#ffc62b", calcas: "#1f2b45", gravata: "#2445d6", gola: "#fff" },
];
