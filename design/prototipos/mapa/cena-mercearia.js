/* ——— CENA · Mercearia do Sr. Manuel: a inflação, os essenciais ao longo dos anos e o IVA no talão ———
   Índices de preços do Eurostat por produto (ECOICOP 01.1.1 a 01.1.8) e taxas do Código do IVA, do repositório.
   Nenhum preço em euros é inventado: «o que custava 1 € em 2020 custa hoje X €» é só a razão entre dois índices. */
const MERC = DADOS.merc;
const valorEm = (serie, t) => (serie.find((p) => p.t === t) || {}).v;
const razaoIdx = (serie) => valorEm(serie, MERC.T1) / valorEm(serie, MERC.T0);
const ITENS = MERC.itens.map((it) => ({ ...it, r: razaoIdx(it.serie) })).sort((a, b) => b.r - a.r);
const R_TOTAL = razaoIdx(MERC.total), R_COMIDA = razaoIdx(MERC.comida);
const pctVar = (r) => (r >= 1 ? "+" : "−") + eur(Math.abs(r - 1) * 100, 1) + SEP + "%";

// os produtos desenhados (ícones simples, pés em y = 0)
const ICONE = {
  pao: `<ellipse cx="0" cy="-14" rx="26" ry="14" fill="#d9964a" stroke="${K}" stroke-width="2.4"/><path d="M-14 -22 q4 6 0 12 M-2 -25 q4 7 0 14 M10 -22 q4 6 0 12" fill="none" stroke="#a8672e" stroke-width="2.2" stroke-linecap="round"/>`,
  carne: `<path d="M-24 -10 q-4 -22 18 -24 q24 -2 28 12 q4 14 -14 18 q-22 4 -32 -6z" fill="#d9483a" stroke="${K}" stroke-width="2.4"/><path d="M-18 -12 q10 -10 28 -8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="-14" r="4" fill="#fff" stroke="${K}" stroke-width="1.6"/>`,
  peixe: `<path d="M-26 -14 q20 -18 40 0 q-20 18 -40 0z" fill="#8fb4c9" stroke="${K}" stroke-width="2.4"/><path d="M14 -14 l14 -10 v20 z" fill="#8fb4c9" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-16" cy="-16" r="2.4" fill="${K}"/><path d="M-6 -20 q4 6 0 12 M2 -20 q4 6 0 12" fill="none" stroke="#5f8aa3" stroke-width="1.6"/>`,
  leite: `<path d="M-18 0 v-34 l6 -8 h14 l6 8 v34 z" fill="#fff" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><rect x="-18" y="-24" width="26" height="12" fill="#2445d6"/><ellipse cx="18" cy="-9" rx="8" ry="10" fill="#fbf1dc" stroke="${K}" stroke-width="2.2"/>`,
  azeite: `<path d="M-9 0 v-30 q0 -6 5 -8 v-8 h8 v8 q5 2 5 8 v30 z" fill="#8a9a2e" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><rect x="-7" y="-26" width="14" height="12" fill="#f4efe4" stroke="${K}" stroke-width="1.4"/><rect x="-4" y="-50" width="8" height="5" fill="${K}"/><rect x="14" y="-14" width="18" height="14" rx="2" fill="#f7d774" stroke="${K}" stroke-width="2"/>`,
  fruta: `<circle cx="-10" cy="-13" r="13" fill="#e2412a" stroke="${K}" stroke-width="2.4"/><path d="M-10 -26 q2 -6 6 -8" stroke="${K}" stroke-width="2" fill="none"/><path d="M-6 -30 q6 -4 10 0 q-6 3 -10 0z" fill="#4fae6a" stroke="${K}" stroke-width="1.2"/><circle cx="14" cy="-11" r="11" fill="#f39c2b" stroke="${K}" stroke-width="2.4"/>`,
  legumes: `<path d="M-22 -4 l26 -26 q6 -2 4 6 l-26 22 q-6 2 -4 -2z" fill="#f28c28" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 -30 l6 -8 M6 -28 l10 -4" stroke="#4fae6a" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="-12" r="12" fill="#7cc98c" stroke="${K}" stroke-width="2.4"/><path d="M8 -12 q8 -8 16 0 M10 -6 q6 -6 12 0" fill="none" stroke="#3f9b52" stroke-width="1.6"/>`,
  acucar: `<path d="M-16 0 v-30 q0 -6 4 -8 h24 q4 2 4 8 v30 z" fill="#fff" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><text x="0" y="-15" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7.5" fill="${K}">AÇÚCAR</text><rect x="16" y="-12" width="16" height="12" rx="3" fill="#8a4a2b" stroke="${K}" stroke-width="2"/>`,
};
const PRATELEIRA = [["pao", 80, 150], ["leite", 180, 150], ["carne", 280, 150], ["peixe", 380, 150], ["fruta", 80, 272], ["legumes", 180, 272], ["azeite", 280, 272], ["acucar", 380, 272]];

function interiorMercearia() {
  let s = `<defs><pattern id="mercAz" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#eaf7ef"/><path d="M8 2 q6 6 0 12 q-6 -6 0 -12z" fill="#0c8f5c" opacity=".55"/></pattern>
    <pattern id="mercChao" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#d9cdb6"/><rect width="20" height="10" fill="#c9bb9f"/><rect x="20" y="10" width="20" height="10" fill="#c9bb9f"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="url(#mercAz)"/><rect x="0" y="410" width="640" height="60" fill="url(#mercChao)" stroke="${K}" stroke-width="2.6"/>`;
  s += `<rect x="130" y="16" width="380" height="34" rx="6" fill="#fff6e3" stroke="${K}" stroke-width="2.8"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="${K}">MERCEARIA DO MANUEL</text>`;
  // estante com duas prateleiras
  s += `<rect x="24" y="70" width="412" height="300" fill="#8a5a2b" stroke="${K}" stroke-width="3"/><rect x="36" y="80" width="388" height="280" fill="#f3e6cf" stroke="${K}" stroke-width="2"/>`;
  for (const y of [150, 272]) s += `<rect x="30" y="${y}" width="400" height="12" fill="#b98552" stroke="${K}" stroke-width="2.4"/>`;
  PRATELEIRA.forEach(([id, x, y]) => {
    s += `<g class="prod" data-id="${id}" transform="translate(${x} ${y})">${ICONE[id]}</g>`;
    s += `<g class="etiq" id="etq-${id}" transform="translate(${x} ${y + 14})"><path d="M-36 0 h72 v26 h-72z" fill="#fff" stroke="${K}" stroke-width="2"/><text class="etq-a" x="0" y="11" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="8.5" fill="#6e675e">1 € em 2020</text><text class="etq-b" x="0" y="23" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="12" fill="${K}">?</text></g>`;
  });
  // o balcão: balança, caixa registadora, o saco, o Sr. Manuel
  s += `<g id="mercManuel" transform="translate(540 352) scale(1.05)">${pessoa(ELENCO.manuel)}</g>`;
  s += `<rect x="450" y="300" width="186" height="110" fill="#b98552" stroke="${K}" stroke-width="3"/><rect x="444" y="290" width="198" height="14" rx="3" fill="#6b4226" stroke="${K}" stroke-width="2.6"/>`;
  s += `<g><rect x="452" y="262" width="44" height="30" rx="4" fill="#c9ced3" stroke="${K}" stroke-width="2.2"/><rect x="458" y="254" width="32" height="10" fill="#e9ecef" stroke="${K}" stroke-width="2"/><rect x="460" y="270" width="28" height="10" fill="#1d2024"/><text x="474" y="278.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7" fill="#6fe07a">0,000</text></g>`;
  s += `<g><rect x="584" y="250" width="50" height="42" rx="5" fill="#2c3036" stroke="${K}" stroke-width="2.4"/><rect x="590" y="256" width="38" height="12" fill="#6fe07a" stroke="${K}" stroke-width="1.4"/><path d="M592 274 h10 M606 274 h10 M620 274 h8 M592 282 h10 M606 282 h10" stroke="#aeb4ba" stroke-width="3"/>
    <g id="mercTalaoArte" opacity="0"><rect x="596" y="210" width="26" height="42" fill="#fff" stroke="${K}" stroke-width="1.6"/><path d="M600 220 h18 M600 226 h14 M600 232 h18 M600 238 h10" stroke="${K}" stroke-width="1" opacity=".5"/></g></g>`;
  s += `<g id="mercSaco" transform="translate(478 452) scale(1.35)"><path d="M-26 0 l4 -44 h44 l4 44z" fill="#f3e6cf" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-12 -44 q12 -18 24 0" fill="none" stroke="${K}" stroke-width="2.4"/><path d="M-10 -44 v-8 q10 -12 20 0 v8" fill="#4fae6a" stroke="${K}" stroke-width="1.6"/><circle cx="-6" cy="-48" r="7" fill="#e2412a" stroke="${K}" stroke-width="1.6"/><text id="mercSacoTxt" x="0" y="-16" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="11" fill="${K}">10 €</text></g>`;
  return s;
}
function etiquetas(anima) {
  ITENS.forEach((it, k) => {
    const g = document.getElementById("etq-" + it.id); if (!g) return;
    const b = g.querySelector(".etq-b"), txt = EURO(it.r, 2) + " hoje";
    if (anima && temG) gsap.timeline({ delay: .15 * k }).to(g, { scaleY: 0, transformOrigin: "50% 0%", duration: .12 }).add(() => { b.textContent = txt; }).to(g, { scaleY: 1, duration: .2, ease: "back.out(3)" });
    else b.textContent = txt;
  });
}

// barras: quanto subiu cada produto desde T0, com a marca da inflação geral
function barrasSubida() {
  const max = Math.max(...ITENS.map((i) => i.r - 1)), esc = (r) => ((r - 1) / (max * 1.08) * 100).toFixed(1);
  return `<div class="subidas" role="list">${ITENS.map((it, k) => `<div class="sub-l" role="listitem"><span class="sub-n">${it.nome}${it.ex ? `<small> ${it.ex}</small>` : ""}</span><span class="sub-b"><i style="width:${esc(it.r)}%" class="${k === 0 ? "top" : ""}"></i><em style="left:${esc(R_TOTAL)}%" aria-hidden="true"></em></span><b>${pctVar(it.r)}</b></div>`).join("")}
    <div class="sub-leg"><span><em aria-hidden="true"></em> tudo o que compramos (inflação geral): ${pctVar(R_TOTAL)}</span></div></div>`;
}

// o gráfico do índice: 100 = preço em T0; o produto escolhido contra a inflação geral
const GM = { x0: 52, x1: 500, y0: 250, y1: 18 };
function graficoIndice(it) {
  const base = (serie) => { const b = valorEm(serie, MERC.T0); return serie.map((p) => ({ t: p.t, v: p.v / b * 100 })); };
  const a = base(it.serie), tot = base(MERC.total), n = a.length;
  const todos = [...a, ...tot].map((p) => p.v), lo = Math.floor(Math.min(...todos) / 10) * 10, hi = Math.ceil(Math.max(...todos) / 10) * 10;
  const x = (k) => GM.x0 + (GM.x1 - GM.x0) * k / (n - 1), y = (v) => GM.y0 - (GM.y0 - GM.y1) * (v - lo) / (hi - lo);
  let s = "";
  for (let v = lo; v <= hi; v += 10) s += `<path d="M${GM.x0} ${y(v).toFixed(1)} H${GM.x1}" stroke="currentColor" stroke-opacity="${v === 100 ? .55 : .1}" ${v === 100 ? 'stroke-dasharray="2 3"' : ""}/><text x="${GM.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e" font-weight="${v === 100 ? 800 : 400}">${v}</text>`;
  a.forEach((p, k) => { if (p.t.endsWith("-01")) s += `<text x="${x(k).toFixed(1)}" y="${GM.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${p.t.slice(0, 4)}</text>`; });
  const k0 = a.findIndex((p) => p.t === MERC.T0), kz = n - 1;
  const linha = (arr) => arr.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  s += `<path d="${linha(tot)}" fill="none" stroke="#16130f" stroke-width="2" stroke-dasharray="5 4"/><path d="${linha(a)}" fill="none" stroke="#e2412a" stroke-width="3.2"/>`;
  s += `<path d="M${GM.x0} ${GM.y0} H${GM.x1}" stroke="#16130f" stroke-width="2"/>`;
  s += `<circle cx="${x(k0).toFixed(1)}" cy="${y(100).toFixed(1)}" r="6" fill="#fff" stroke="#16130f" stroke-width="2.4"/><text x="${(x(k0) + 8).toFixed(1)}" y="${(y(100) + 22).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="18" fill="#16130f">100 = o preço em ${mesCurto(MERC.T0)}</text>`;
  s += `<circle cx="${x(kz).toFixed(1)}" cy="${y(a[kz].v).toFixed(1)}" r="6.5" fill="#e2412a" stroke="#16130f" stroke-width="2"/><text x="${(x(kz) - 8).toFixed(1)}" y="${(y(a[kz].v) - 12).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="20" fill="#c7361f">${Math.round(a[kz].v)}: ${pctVar(it.r)}</text>`;
  s += `<text x="${(x(kz) - 8).toFixed(1)}" y="${(y(tot[kz].v) + 20).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="17" fill="#16130f">inflação geral: ${Math.round(tot[kz].v)}</text>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 280" role="img" aria-label="Índice de preços de ${it.nome}, com 100 no preço de ${mesLongo(MERC.T0)}: hoje vale ${Math.round(a[kz].v)}. A inflação geral, a tracejado, vale ${Math.round(tot[kz].v)}." font-family="Archivo">${s}</svg>`;
}

// o talão do IVA: por cada 10 € gastos, quanto é IVA — contas sobre as taxas do Código do IVA
const TX = Object.fromEntries(MERC.iva.taxas.map((x) => [x.nome, x.taxa])), ivaEm10 = (taxa) => 10 * taxa / (1 + taxa);
function talaoIva() {
  const t = TX, letra = { Reduzida: "A", "Intermédia": "B", Normal: "C" };
  const linhas = [["Pão", "Reduzida"], ["Leite", "Reduzida"], ["Fruta e legumes", "Reduzida"], ["Conservas", "Intermédia"], ["Vinho", "Intermédia"], ["Outros produtos *", "Normal"]];
  const ivaDe = (taxa) => 10 * taxa / (1 + taxa);
  const soma = {}; linhas.forEach(([, n]) => soma[n] = (soma[n] || 0) + ivaDe(t[n]));
  const totIva = Object.values(soma).reduce((a, b) => a + b, 0);
  return `<div class="talao" role="img" aria-label="Talão de exemplo: por cada 10 euros em pão, leite e fruta e legumes, ${EURO(ivaEm10(TX.Reduzida), 2)} são IVA; em conservas e vinho, ${EURO(ivaEm10(TX["Intermédia"]), 2)}; nos outros produtos, ${EURO(ivaEm10(TX.Normal), 2)}.">
    <b class="t-cab">MERCEARIA DO MANUEL</b><span class="t-sub">por cada 10,00 € que pagas em…</span>
    ${linhas.map(([nome, n]) => `<span class="t-l"><span>${nome}</span><span>10,00 ${letra[n]}</span></span>`).join("")}
    <span class="t-sep"></span><span class="t-l"><b>TOTAL</b><b>60,00</b></span><span class="t-sep"></span><span class="t-sub">IVA incluído no preço</span>
    ${Object.keys(soma).map((n) => `<span class="t-l"><span>${letra[n]} · taxa ${n.toLowerCase()} ${pctT(t[n])}</span><span>${eur(soma[n], 2)}</span></span>`).join("")}
    <span class="t-l t-tot"><b>IVA total</b><b>${eur(totIva, 2)} €</b></span></div>`;
}

function cenaMerc() {
  const cena = $("cenaMerc"), corpo = $("mercCorpo"), fala = $("mercFala"), acoes = $("mercAcoes");
  const botoesM = (lista) => { acoes.innerHTML = ""; lista.forEach(([t, fn, claro]) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (claro ? " claro" : ""); b.textContent = t; b.onclick = fn; acoes.appendChild(b); }); };
  const topo = () => { cena.scrollTop = 0; palco.scrollTop = 0; palco.scrollLeft = 0; };
  const [x, y] = pontoEcra("mercearia"); ir(x + 40, y - 60, 480, true, .9);
  const acena = () => { if (temG) gsap.timeline().to("#mercManuel .braco-d", { rotation: -150, transformOrigin: "50% 0%", duration: .25 }).to("#mercManuel .braco-d", { rotation: -120, duration: .15, yoyo: true, repeat: 3 }).to("#mercManuel .braco-d", { rotation: 0, duration: .3 }); };
  const abrir = () => {
    cena.hidden = false; $("mercArte").innerHTML = interiorMercearia(); corpo.innerHTML = "";
    $("mercFonte").textContent = DADOS.fontes.mercCena;
    if (temG) gsap.fromTo(cena, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" });
    acena(); passo1();
  };
  function passo1() {
    topo();
    fala.innerHTML = `Bom dia! Em ${mesLongo(MERC.T0)}, este saco de compras custava <b>10 €</b>. Quanto custa hoje o mesmo saco?`;
    corpo.innerHTML = `<div class="palpite-linha"><output id="mercPalOut">12,00 €</output><input type="range" id="mercPal" min="8" max="18" step="0.1" value="12" aria-label="O teu palpite em euros"></div>`;
    const pal = $("mercPal"); pal.oninput = () => $("mercPalOut").textContent = EURO(+pal.value, 2); pal.oninput();
    botoesM([["Mostrar a resposta", () => passo2(+pal.value)]]);
  }
  function passo2(g) {
    topo();
    const real = 10 * R_COMIDA, dif = Math.abs(real - g), juizo = dif <= .3 ? "Acertaste em cheio!" : dif <= 1 ? "Quase!" : g < real ? "Mais caro do que pensavas!" : "Um pouco menos!";
    const o = { v: 10 }; const saco = $("mercSacoTxt");
    if (temG) gsap.to(o, { v: real, duration: 1.3, ease: "power2.out", onUpdate: () => saco.textContent = EURO(o.v, 2) }); else saco.textContent = EURO(real, 2);
    fala.innerHTML = `<b>${juizo}</b> Hoje o mesmo saco custa <span class="r">${EURO(real, 2)}</span>. Isto chama-se inflação.`;
    corpo.innerHTML = `<p>A comida subiu <span class="r">${pctVar(R_COMIDA)}</span> desde ${mesLongo(MERC.T0)}; tudo o que compramos, em média, subiu <b>${pctVar(R_TOTAL)}</b>. Mas cada prateleira subiu à sua maneira: as etiquetas dizem quanto custa hoje o que custava 1 € em 2020.</p>${barrasSubida()}`;
    etiquetas(true);
    if (temG) { const top = ITENS[0].id; gsap.fromTo(`#mercArte .prod[data-id="${top}"]`, { y: 0 }, { y: -10, duration: .25, yoyo: true, repeat: 5, delay: 1.4, ease: "power1.inOut" }); }
    botoesM([["Aprender a ler o gráfico →", () => passo3(ITENS[0].id)]]);
  }
  function passo3(id) {
    topo();
    const it = ITENS.find((i) => i.id === id);
    fala.innerHTML = `Um <b>índice</b> é uma régua de preços. Aqui, <b>100</b> é o preço em ${mesLongo(MERC.T0)}.`;
    corpo.innerHTML = `<div class="opcoes" role="group" aria-label="Escolher o produto">${ITENS.map((i) => `<button class="btn claro${i.id === id ? " ligado" : ""}" type="button" data-id="${i.id}" aria-pressed="${i.id === id}">${i.nome}</button>`).join("")}</div>
      ${graficoIndice(it)}
      <p>A linha vermelha é <b>${it.nome.toLowerCase()}</b>: começa em 100 e hoje vale <span class="r">${Math.round(valorEm(it.serie, MERC.T1) / valorEm(it.serie, MERC.T0) * 100)}</span>, ou seja, está <span class="r">${pctVar(it.r)}</span> mais caro. A tracejado, a inflação geral. Quando a vermelha fica por cima, esse produto subiu mais do que o resto.</p>
      <p class="nota-fin">São índices, não preços: dizem quanto subiu, não quanto custa um quilo. Cada produto é uma família do índice europeu de preços (por exemplo, «cereais e derivados» inclui pão, arroz e massa).</p>`;
    corpo.querySelectorAll(".opcoes .btn").forEach((b) => b.onclick = () => passo3(b.dataset.id));
    $("mercArte").querySelectorAll(".prod").forEach((p) => p.classList.toggle("realce", p.dataset.id === id));
    botoesM([["Ver o IVA no talão →", passo4]]);
  }
  function passo4() {
    topo();
    $("mercArte").querySelectorAll(".prod").forEach((p) => p.classList.remove("realce"));
    const t = $("mercTalaoArte"); if (temG) gsap.fromTo(t, { opacity: 1, y: 40 }, { y: 0, duration: .7, ease: "power2.out" }); else t.style.opacity = 1;
    fala.innerHTML = `E há uma parte de cada compra que vai para o Estado: o <b>IVA</b>. Já vem dentro do preço.`;
    corpo.innerHTML = `${talaoIva()}
      <p>O IVA tem três taxas. O que é essencial, como o pão, o leite, a fruta e os legumes, paga a <b>reduzida</b>, ${pctT(TX.Reduzida)}: em cada 10 € ficam ${EURO(ivaEm10(TX.Reduzida), 2)} para o Estado. As conservas e o vinho pagam a <b>intermédia</b>, ${pctT(TX["Intermédia"])}. Tudo o que não está nas listas do Código do IVA paga a <span class="r">normal</span>, ${pctT(TX.Normal)}: ${EURO(ivaEm10(TX.Normal), 2)} em cada 10 €.</p>
      <p class="nota-fin">* Taxa normal: o que não está nas listas I e II do Código do IVA (art. 18.º). Os exemplos são indicativos; as listas definem o enquadramento exato de cada produto. ${MERC.iva.regiao}.</p>`;
    $("mercFonte").textContent = DADOS.fontes.ivaCena;
    botoesM([["Voltar ao bairro", fechar, true], ["Ver outra vez", () => { $("mercArte").innerHTML = interiorMercearia(); $("mercFonte").textContent = DADOS.fontes.mercCena; passo1(); }, true]]);
  }
  function fechar() { cena.hidden = true; mapa.querySelectorAll(".ed.ativo").forEach((g) => g.classList.remove("ativo")); }
  $("mercFechar").onclick = fechar;
  cena.onkeydown = (e) => { if (e.key === "Escape") fechar(); };
  setTimeout(abrir, temG ? 700 : 0);
}
