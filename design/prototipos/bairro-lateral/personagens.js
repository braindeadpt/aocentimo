/* Personagens do bairro — um só esqueleto (pés na origem, ~125 de altura), vestido de maneiras diferentes.
   Partes animáveis: .perna-e .perna-d .braco-e .braco-d .cabeca .olhos .boca */
const PELE = { a: "#f1c6a3", b: "#e8b48f", c: "#d9a07a", d: "#c98a62", e: "#8d5a3b" };

function cabelo(tipo, cor) {
  switch (tipo) {
    case "bob": return `<path d="M-20 -100 q0 -28 20 -28 q20 0 20 28 v14 q-6 4 -10 0 v-16 q-10 -6 -22 2 v14 q-4 4 -8 0 z" fill="${cor}" stroke="#16130f" stroke-width="3"/>`;
    case "careca": return `<path d="M-19 -100 q-2 -8 3 -10 M19 -100 q2 -8 -3 -10" stroke="${cor}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
    case "carrapito": return `<circle cx="0" cy="-128" r="9" fill="${cor}" stroke="#16130f" stroke-width="3"/><path d="M-19 -102 q0 -24 19 -24 q19 0 19 24 q-10 -8 -19 -8 q-9 0 -19 8z" fill="${cor}" stroke="#16130f" stroke-width="3"/>`;
    case "rabo": return `<path d="M-19 -102 q0 -24 19 -24 q19 0 19 24 q-8 -10 -19 -10 q-11 0 -19 10z" fill="${cor}" stroke="#16130f" stroke-width="3"/><path class="rabo-cavalo" d="M16 -116 q18 4 14 30 q-8 -2 -10 -14" fill="${cor}" stroke="#16130f" stroke-width="3"/>`;
    case "curto": return `<path d="M-19 -102 q-2 -26 19 -26 q21 0 19 26 q-6 -10 -19 -12 q-13 2 -19 12z" fill="${cor}" stroke="#16130f" stroke-width="3"/>`;
    case "afro": return `<circle cx="0" cy="-112" r="27" fill="${cor}" stroke="#16130f" stroke-width="3"/>`;
    default: return "";
  }
}
function pessoa(o) {
  const pele = PELE[o.pele || "b"], alt = o.escala || 1;
  const perna = (cls, dx) => `<g class="${cls}" style="transform-box:view-box;transform-origin:${dx}px -40px"><rect x="${dx - 6}" y="-42" width="12" height="40" rx="5" fill="${o.calcas || "#2b3a55"}" stroke="#16130f" stroke-width="3"/><path d="M${dx - 7} -4 h16 q4 0 4 4 h-20 z" fill="#16130f"/></g>`;
  const braco = (cls, lado) => `<g class="${cls}" style="transform-box:view-box;transform-origin:${lado * 15}px -84px"><path d="M${lado * 15} -84 q${lado * 8} 18 ${lado * 6} 36" fill="none" stroke="${o.roupa}" stroke-width="10" stroke-linecap="round"/><path d="M${lado * 15} -84 q${lado * 8} 18 ${lado * 6} 36" fill="none" stroke="#16130f" stroke-width="14" stroke-linecap="round" opacity="0"/><circle cx="${lado * 21}" cy="-47" r="5.5" fill="${pele}" stroke="#16130f" stroke-width="2.5"/></g>`;
  let s = `<g class="pessoa" data-nome="${o.nome || ""}"><g class="escala" transform="scale(${alt})">
    <ellipse cx="0" cy="0" rx="22" ry="5" fill="#16130f" opacity=".15"/>
    ${perna("perna-e", -7)}${perna("perna-d", 7)}
    <g class="tronco">
      ${o.mochila ? `<rect x="-26" y="-86" width="16" height="36" rx="5" fill="${o.mochila}" stroke="#16130f" stroke-width="3"/>` : ""}
      ${braco("braco-e", -1)}
      <path d="M-17 -88 q0 -8 8 -8 h18 q8 0 8 8 v${o.saia ? 40 : 46} h-34 z" fill="${o.roupa}" stroke="#16130f" stroke-width="3.5"/>
      ${o.saia ? `<path d="M-18 -48 h36 l5 16 h-46 z" fill="${o.saia}" stroke="#16130f" stroke-width="3"/>` : ""}
      ${o.avental ? `<path d="M-11 -80 h22 v38 h-22 z" fill="${o.avental}" stroke="#16130f" stroke-width="2.5"/><path d="M-11 -80 l-6 -10 M11 -80 l6 -10" stroke="#16130f" stroke-width="2"/>` : ""}
      ${braco("braco-d", 1)}
      <g class="cabeca" style="transform-box:view-box;transform-origin:0px -96px">
        <rect x="-5" y="-100" width="10" height="8" fill="${pele}"/>
        ${o.cabelo === "afro" ? cabelo("afro", o.corCabelo) : ""}
        <circle cx="0" cy="-110" r="19" fill="${pele}" stroke="#16130f" stroke-width="3.5"/>
        ${o.cabelo !== "afro" ? cabelo(o.cabelo, o.corCabelo) : ""}
        <g class="olhos" style="transform-box:view-box;transform-origin:0px -110px"><circle cx="-7" cy="-110" r="2.8" fill="#16130f"/><circle cx="7" cy="-110" r="2.8" fill="#16130f"/></g>
        ${o.oculos ? `<circle cx="-7" cy="-110" r="7" fill="none" stroke="#16130f" stroke-width="2.2"/><circle cx="7" cy="-110" r="7" fill="none" stroke="#16130f" stroke-width="2.2"/><path d="M0 -110 h0" stroke="#16130f" stroke-width="2"/>` : ""}
        ${o.bigode ? `<path d="M-9 -101 q9 -6 18 0 q-9 4 -18 0z" fill="${o.corCabelo}" stroke="#16130f" stroke-width="2"/>` : ""}
        ${o.barba ? `<path d="M-17 -108 q0 22 17 24 q17 -2 17 -24 q-4 10 -17 10 q-13 0 -17 -10z" fill="${o.corCabelo}" stroke="#16130f" stroke-width="2.5"/>` : ""}
        <path class="boca" d="M-5 ${o.bigode ? -97 : -101} q5 5 10 0" fill="none" stroke="#16130f" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="-12" cy="-103" r="3.5" fill="#f2785a" opacity=".4"/><circle cx="12" cy="-103" r="3.5" fill="#f2785a" opacity=".4"/>
      </g>
      ${o.mala ? `<g class="mala"><path d="M18 -70 q8 -10 14 0" fill="none" stroke="#16130f" stroke-width="3"/><rect x="14" y="-70" width="24" height="20" rx="4" fill="${o.mala}" stroke="#16130f" stroke-width="3"/></g>` : ""}
      ${o.regador ? `<g class="regador"><path d="M22 -58 h20 v14 h-20 z M42 -56 l14 -8" fill="#9aa3b5" stroke="#16130f" stroke-width="3"/></g>` : ""}
    </g>
  </g></g>`;
  return s;
}

const ELENCO = {
  ines: { nome: "Inês", pele: "b", cabelo: "bob", corCabelo: "#3b2418", roupa: "#2445d6", calcas: "#1f2b45" },
  manuel: { nome: "Sr. Manuel", pele: "c", cabelo: "careca", corCabelo: "#8d8d8d", roupa: "#ffffff", calcas: "#3a3a3a", avental: "#0c8f5c", bigode: true },
  rosa: { nome: "Dona Rosa", pele: "a", cabelo: "carrapito", corCabelo: "#c9c4bd", roupa: "#9b7fd9", saia: "#5b4a8a", calcas: "#f1c6a3", oculos: true, mala: "#e2412a" },
  leonor: { nome: "Leonor", pele: "d", cabelo: "rabo", corCabelo: "#1d1410", roupa: "#ffc62b", calcas: "#3557b7", mochila: "#e2412a", escala: .82 },
  rui: { nome: "Rui", pele: "a", cabelo: "curto", corCabelo: "#6b4226", roupa: "#0c8f5c", calcas: "#2b2b2b", barba: true },
  marta: { nome: "Marta", pele: "e", cabelo: "afro", corCabelo: "#1d1410", roupa: "#e2412a", calcas: "#2b3a55" },
};
const PASSANTES = [
  { pele: "c", cabelo: "curto", corCabelo: "#2b1d14", roupa: "#ff8fb7", calcas: "#2b3a55" },
  { pele: "a", cabelo: "bob", corCabelo: "#c26b2b", roupa: "#16130f", calcas: "#5b4a8a" },
  { pele: "e", cabelo: "curto", corCabelo: "#1d1410", roupa: "#ffc62b", calcas: "#1f2b45" },
];
