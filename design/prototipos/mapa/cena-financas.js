/* ——— CENA · Finanças, senha A: o IRS em gavetas ———
   Cada escalão é uma gaveta. O rendimento coletável enche as gavetas de baixo para cima; em cada gaveta,
   a taxa só se aplica ao que está lá dentro. Números: escalões de 2026 do repositório (data/fiscal/irs-2026.json). */
const IRS = DADOS.irs;
const SEP = EURO(1).slice(-2, -1); // o mesmo espaço fino que o resto do site usa antes de «€»
const pctT = (t) => { const v = Math.round(t * 10000) / 100, casas = Number.isInteger(v) ? 0 : Number.isInteger(Math.round(v * 100) / 10) ? 1 : 2; return eur(v, casas) + SEP + "%"; };
const ordinal = (n) => n + ".º";
function irsGavetas(c) {
  let de = 0;
  return IRS.escaloes.map((e, k) => {
    const ate = e.ate ?? Infinity, dentro = Math.max(0, Math.min(c, ate) - de);
    const g = { k, de, ate: e.ate, taxa: e.taxa, dentro, imposto: dentro * e.taxa };
    de = ate; return g;
  });
}
const coleta = (c) => irsGavetas(c).reduce((a, g) => a + g.imposto, 0);
const coletavel = (brutoMes) => { const ano = brutoMes * 14; return Math.max(0, ano - Math.max(IRS.dedEsp, ano * IRS.ssTaxa)); };
const gavetaMaisAlta = (c) => irsGavetas(c).filter((g) => g.dentro > 0).at(-1);

/* o interior: parede, painel da senha, máquina das senhas, balcão com o funcionário, a Inês, a cómoda das gavetas */
const GV = { x: 372, y: 34, w: 250, h: 38, gap: 4 };
function interiorFinancas() {
  const n = IRS.escaloes.length, altura = n * (GV.h + GV.gap) + 16;
  let s = `<defs><pattern id="finAz" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f7f9ff"/><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" fill="none" stroke="#2445d6" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#2445d6"/></pattern>
    <pattern id="finChao" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#e4dccb"/><rect width="20" height="10" fill="#d6ccb7"/><rect x="20" y="10" width="20" height="10" fill="#d6ccb7"/></pattern></defs>`;
  // parede, lambrim de azulejo, chão
  s += `<rect x="0" y="0" width="640" height="410" fill="#f4efe4"/><rect x="0" y="250" width="640" height="160" fill="url(#finAz)"/><rect x="0" y="246" width="640" height="8" fill="#d8cbb4" stroke="${K}" stroke-width="2"/><rect x="0" y="410" width="640" height="60" fill="url(#finChao)" stroke="${K}" stroke-width="2.6"/>`;
  // placa FINANÇAS e relógio
  s += `<rect x="190" y="26" width="150" height="30" rx="5" fill="${K}"/><text x="265" y="47" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="#fff">FINANÇAS</text>`;
  s += `<circle cx="265" cy="100" r="22" fill="#fbfaf6" stroke="${K}" stroke-width="3"/><path d="M265 100 v-14 M265 100 h10" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`;
  // painel da senha
  s += `<g><rect x="30" y="26" width="140" height="74" rx="8" fill="#26282b" stroke="${K}" stroke-width="3"/><text x="100" y="45" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="10" letter-spacing=".14em" fill="#c9c4b8">SENHA · BALCÃO</text>
    <text id="finPainel" x="100" y="86" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="32" fill="#ff5a3c" font-variant-numeric="tabular-nums">A 022</text></g>`;
  // máquina das senhas
  s += `<g><rect x="36" y="150" width="70" height="110" rx="10" fill="${C.vermelho}" stroke="${K}" stroke-width="3"/><rect x="46" y="162" width="50" height="28" rx="4" fill="#fff" stroke="${K}" stroke-width="2"/><text x="71" y="181" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="12" fill="${K}">A · IRS</text><rect x="52" y="206" width="38" height="6" rx="3" fill="${K}"/><rect x="62" y="260" width="18" height="150" fill="#9aa3ad" stroke="${K}" stroke-width="2.4"/>
    <g id="finTalao" opacity="0"><rect x="53" y="208" width="36" height="46" fill="#fff" stroke="${K}" stroke-width="1.8"/><text x="71" y="224" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="7" fill="${K}">SENHA</text><text x="71" y="243" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="13" fill="${K}">A 023</text></g></g>`;
  // o funcionário (atrás do balcão) e a Inês (à frente)
  s += `<g id="finFunc" transform="translate(222 352) scale(1.05)">${pessoa({ pele: "b", cabelo: "careca", corCabelo: "#8d8d8d", roupa: "#dfe5ff", calcas: "#2b3a55", gravata: "#2445d6", gola: "#fff", oculos: "quadrados", bigode: true })}</g>`;
  s += `<g><rect x="130" y="300" width="220" height="110" fill="#b98552" stroke="${K}" stroke-width="3"/><rect x="122" y="292" width="236" height="12" rx="3" fill="#8a5a2b" stroke="${K}" stroke-width="2.6"/>${[0, 1, 2, 3].map((k) => `<path d="M${148 + k * 52} 318 v76" stroke="${K}" stroke-width="1.4" opacity=".35"/>`).join("")}
    <rect x="200" y="322" width="80" height="34" rx="5" fill="#fff" stroke="${K}" stroke-width="2.4"/><text x="240" y="345" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${K}">A</text><rect x="296" y="278" width="34" height="16" fill="#fff" stroke="${K}" stroke-width="1.8" transform="rotate(-6 313 286)"/><rect x="150" y="270" width="24" height="24" rx="3" fill="#26282b" stroke="${K}" stroke-width="1.8"/><rect x="153" y="273" width="18" height="13" fill="#9fd0ff"/></g>`;
  s += `<g id="finInes" transform="translate(320 430) scale(.95)">${pessoa(ELENCO.ines)}</g>`;
  // a cómoda das gavetas (de baixo para cima: 1.º escalão em baixo)
  s += `<rect x="${GV.x - 12}" y="${GV.y - 12}" width="${GV.w + 24}" height="${altura}" rx="6" fill="#8a5a2b" stroke="${K}" stroke-width="3"/><rect x="${GV.x - 18}" y="${GV.y - 20}" width="${GV.w + 36}" height="12" rx="3" fill="#6b4226" stroke="${K}" stroke-width="2.6"/><path d="M${GV.x - 6} ${GV.y - 12 + altura} v26 M${GV.x + GV.w + 6} ${GV.y - 12 + altura} v26" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  IRS.escaloes.forEach((e, k) => {
    const y = GV.y + (n - 1 - k) * (GV.h + GV.gap), de = k ? IRS.escaloes[k - 1].ate : 0;
    const faixa = e.ate ? `${eur(de, 0)} a ${eur(e.ate, 0)}${SEP}€` : `acima de ${eur(de, 0)}${SEP}€`;
    s += `<g class="gaveta" id="gav${k}"><rect x="${GV.x}" y="${y}" width="${GV.w}" height="${GV.h}" rx="4" fill="#fbf6ec" stroke="${K}" stroke-width="2.4"/>
      <rect class="g-fica" x="${GV.x + 2}" y="${y + 2}" width="0" height="${GV.h - 4}" fill="#bfe8d2"/><rect class="g-irs" x="${GV.x + 2}" y="${y + 2}" width="0" height="${GV.h - 4}" fill="#ffc2b3"/>
      <text x="${GV.x + 10}" y="${y + 17}" font-family="Archivo" font-weight="900" font-size="14" fill="${K}">${ordinal(k + 1)}</text><text x="${GV.x + 10}" y="${y + 31}" font-family="Archivo" font-weight="600" font-size="10" fill="#4a4540">${faixa}</text>
      <text x="${GV.x + GV.w - 12}" y="${y + 25}" text-anchor="end" font-family="Archivo" font-weight="900" font-size="16" fill="${K}">${pctT(e.taxa)}</text>
      <circle cx="${GV.x + GV.w / 2 + 16}" cy="${y + GV.h / 2}" r="4" fill="#e6a93a" stroke="${K}" stroke-width="1.6"/></g>`;
  });
  return s;
}
// larguras de cada gaveta: parte que fica (verde) e parte do IRS (vermelha); a última gaveta não tem fim — enche a 60 000 € acima do início
function encherGavetas(c, anima) {
  const W = GV.w - 4, topo = gavetaMaisAlta(c);
  irsGavetas(c).forEach((g) => {
    const cap = g.ate ? g.ate - g.de : 60000, fr = Math.min(1, g.dentro / cap);
    const el = document.getElementById("gav" + g.k); if (!el) return;
    const wf = W * fr * (1 - g.taxa), wi = W * fr * g.taxa, fica = el.querySelector(".g-fica"), ir = el.querySelector(".g-irs"), x0 = GV.x + 2;
    const alvo = { fica: { width: wf }, irs: { width: wi, x: x0 + wf } };
    if (anima && temG) { gsap.to(fica, { attr: alvo.fica, duration: .55, delay: g.k * .07, ease: "power2.out" }); gsap.to(ir, { attr: alvo.irs, duration: .55, delay: g.k * .07, ease: "power2.out" }); }
    else { fica.setAttribute("width", wf); ir.setAttribute("width", wi); ir.setAttribute("x", x0 + wf); }
    el.classList.toggle("ativa", !!topo && g.k === topo.k);
  });
}

/* o gráfico que ensina a ler-se: o degrau (taxa da gaveta mais alta) e a curva (taxa média) */
const GR = { x0: 56, x1: 500, y0: 250, y1: 20, max: 100000, tmax: .5 };
const gx = (v) => GR.x0 + (GR.x1 - GR.x0) * Math.min(v, GR.max) / GR.max, gy = (t) => GR.y0 - (GR.y0 - GR.y1) * t / GR.tmax;
function graficoIrs() {
  let s = "";
  for (let t = 0; t <= .5 + 1e-9; t += .1) s += `<path d="M${GR.x0} ${gy(t).toFixed(1)} H${GR.x1}" stroke="currentColor" stroke-opacity=".12"/><text x="${GR.x0 - 8}" y="${(gy(t) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${Math.round(t * 100)}${SEP}%</text>`;
  for (let v = 0; v <= GR.max; v += 25000) s += `<text x="${gx(v).toFixed(1)}" y="${GR.y0 + 18}" text-anchor="${v === GR.max ? "end" : "middle"}" font-size="11" fill="#6e675e">${v ? eur(v, 0) + SEP + "€" : "0"}</text>`;
  // degrau
  let d = `M${gx(0)} ${gy(IRS.escaloes[0].taxa).toFixed(1)}`, de = 0;
  IRS.escaloes.forEach((e) => { const ate = Math.min(e.ate ?? GR.max, GR.max); d += ` H${gx(ate).toFixed(1)}`; const prox = IRS.escaloes[IRS.escaloes.indexOf(e) + 1]; if (prox && e.ate < GR.max) d += ` V${gy(prox.taxa).toFixed(1)}`; de = ate; });
  s += `<path d="${d}" fill="none" stroke="#e2412a" stroke-width="3" stroke-linejoin="round"/>`;
  // curva da taxa média
  let m = ""; for (let v = 500; v <= GR.max; v += 500) m += `${m ? " L" : "M"}${gx(v).toFixed(1)} ${gy(coleta(v) / v).toFixed(1)}`;
  s += `<path d="${m}" fill="none" stroke="#16130f" stroke-width="3"/>`;
  s += `<path d="M${GR.x0} ${GR.y0} H${GR.x1}" stroke="#16130f" stroke-width="2"/>`;
  // legendas manuscritas
  s += `<text x="${gx(2000)}" y="${gy(.475)}" font-family="Caveat" font-weight="700" font-size="19" fill="#c7361f">o degrau: a taxa da gaveta mais alta</text>`;
  s += `<text x="${gx(50000)}" y="${gy(.215)}" font-family="Caveat" font-weight="700" font-size="19" fill="#16130f">a curva: o que pagas mesmo</text>`;
  s += `<text x="${GR.x1}" y="${GR.y0 + 34}" text-anchor="end" font-size="11.5" font-weight="700" fill="#4a4540">rendimento coletável por ano →</text>`;
  s += `<g id="grPonto"><path id="grLinha" stroke="#2445d6" stroke-width="2" stroke-dasharray="4 4"/><circle id="grMarg" r="7" fill="#fff" stroke="#e2412a" stroke-width="3"/><circle id="grMed" r="7" fill="#2445d6" stroke="#16130f" stroke-width="2"/><text id="grRot" font-family="Caveat" font-weight="700" font-size="20" fill="#2445d6"></text></g>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 290" role="img" aria-label="Gráfico: a taxa do escalão sobe aos degraus, a taxa média sobe devagar e fica sempre abaixo." font-family="Archivo">${s}</svg>`;
}
function pontoGrafico(c) {
  const g = gavetaMaisAlta(c), med = c ? coleta(c) / c : 0, x = gx(c);
  const q = (id) => document.getElementById(id); if (!q("grPonto")) return;
  q("grLinha").setAttribute("d", `M${x.toFixed(1)} ${GR.y0} V${gy(g ? g.taxa : 0).toFixed(1)}`);
  q("grMarg").setAttribute("cx", x); q("grMarg").setAttribute("cy", gy(g ? g.taxa : 0));
  q("grMed").setAttribute("cx", x); q("grMed").setAttribute("cy", gy(med));
  const r = q("grRot"); r.textContent = c === coletavel(1500) ? "a Inês" : "tu"; r.setAttribute("x", Math.min(x + 10, GR.x1 - 40)); r.setAttribute("y", gy(med) + 24);
}

/* a calculadora: salário bruto por mês → o que acontece nas gavetas */
function calcFinancas(inicial) {
  return `<div class="calc"><label for="finSal"><b>Experimenta: salário bruto por mês</b> <output id="finSalOut"></output></label>
    <input type="range" id="finSal" min="800" max="7000" step="50" value="${inicial}">
    <div class="linha"><span>Rendimento coletável por ano</span><b id="finCol"></b></div>
    <div class="linha"><span>IRS pelos escalões, por ano</span><b id="finIrs" class="r"></b></div>
    <div class="linha"><span>Taxa da gaveta mais alta</span><b id="finMarg"></b></div>
    <div class="linha"><span>Taxa média (o que pagas mesmo)</span><b id="finMed"></b></div></div>`;
}
function ligarCalc() {
  const sl = document.getElementById("finSal"); if (!sl) return;
  const atualiza = (anima) => {
    const b = +sl.value, c = coletavel(b), ir = coleta(c), g = gavetaMaisAlta(c);
    document.getElementById("finSalOut").textContent = EURO(b);
    document.getElementById("finCol").textContent = EURO(c);
    document.getElementById("finIrs").textContent = EURO(ir);
    document.getElementById("finMarg").textContent = g ? `${pctT(g.taxa)} (${ordinal(g.k + 1)} escalão)` : "—";
    document.getElementById("finMed").textContent = c ? pctT(ir / c) : "—";
    encherGavetas(c, anima); pontoGrafico(c);
  };
  sl.oninput = () => atualiza(false); sl.onchange = () => atualiza(true); atualiza(true);
}

function cenaFinancas() {
  const cena = $("cenaFin"), corpo = $("finCorpo"), fala = $("finFala"), acoes = $("finAcoes");
  const botoesFin = (lista) => { acoes.innerHTML = ""; lista.forEach(([t, fn, claro]) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (claro ? " claro" : ""); b.textContent = t; b.onclick = fn; acoes.appendChild(b); }); };
  const [x, y] = pontoEcra("financas"); ir(x, y - 60, 480, true, .9);
  const abrir = () => {
    cena.hidden = false; $("finArte").innerHTML = interiorFinancas(); corpo.innerHTML = ""; $("finTalao") && ($("finTalao").style.opacity = 0);
    $("finFonte").textContent = DADOS.fontes.financas;
    $("finTabela").innerHTML = `<thead><tr><th>Escalão</th><th>Rendimento coletável</th><th>Taxa</th></tr></thead><tbody>${IRS.escaloes.map((e, k) => `<tr><td>${ordinal(k + 1)}</td><td>${e.ate ? `${eur(k ? IRS.escaloes[k - 1].ate : 0, 0)}${SEP}€ a ${eur(e.ate, 0)}${SEP}€` : `acima de ${eur(IRS.escaloes[k - 1].ate, 0)}${SEP}€`}</td><td>${pctT(e.taxa)}</td></tr>`).join("")}</tbody>`;
    encherGavetas(0, false);
    if (temG) gsap.fromTo(cena, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" });
    passo1();
  };
  const topo = () => { cena.scrollTop = 0; palco.scrollTop = 0; palco.scrollLeft = 0; };
  function passo1() {
    topo();
    fala.innerHTML = `Bem-vindo às Finanças. Para o <b>IRS</b> é o balcão A: tira a tua senha.`;
    botoesFin([["Tirar senha", () => {
      const t = $("finTalao"), p = $("finPainel");
      if (temG) { gsap.fromTo(t, { opacity: 1, y: -30 }, { y: 0, duration: .5, ease: "back.out(2)" }); gsap.timeline().to(p, { opacity: 0, duration: .12, repeat: 3, yoyo: true }).add(() => { p.textContent = "A 023"; }); gsap.timeline({ delay: .5 }).to("#finFunc .braco-d", { rotation: -150, transformOrigin: "50% 0%", duration: .25 }).to("#finFunc .braco-d", { rotation: 0, duration: .3, delay: .5 }); }
      else { t.style.opacity = 1; p.textContent = "A 023"; }
      setTimeout(passo2, temG ? 900 : 0);
    }]]);
  }
  function passo2() {
    topo();
    fala.innerHTML = `Senha <b>A 023</b>, faz favor! Antes de começarmos, um palpite:`;
    corpo.innerHTML = `<p class="pergunta-fin">A Inês foi aumentada de <b>${EURO(1500)}</b> para <b>${EURO(1650)}</b> brutos por mês e passou do ${ordinal(gavetaMaisAlta(coletavel(1500)).k + 1)} para o ${ordinal(gavetaMaisAlta(coletavel(1650)).k + 1)} escalão do IRS. No fim do ano, fica com…</p>`;
    botoesFin([["menos dinheiro", () => passo3("menos"), true], ["o mesmo", () => passo3("igual"), true], ["mais dinheiro", () => passo3("mais"), true]]);
  }
  function passo3(palpite) {
    topo();
    const c0 = coletavel(1500), c1 = coletavel(1650), i0 = coleta(c0), i1 = coleta(c1), aum = 150 * 14, ss = aum * IRS.ssTaxa;
    const g1 = gavetaMaisAlta(c1), naNova = g1.dentro, ganho = aum - ss - (i1 - i0);
    const acerto = palpite === "mais" ? `<b>Acertaste.</b>` : `<b>Afinal não.</b>`;
    fala.innerHTML = `${acerto} <span class="g">Fica com mais ${EURO(ganho)} por ano.</span>`;
    corpo.innerHTML = `<p>Os escalões são <b>gavetas</b>. O rendimento enche-as de baixo para cima, e a taxa de cada gaveta só se aplica ao que está <b>lá dentro</b>.</p>
      <p>Com o aumento, só <b>${EURO(naNova)}</b> entraram na ${ordinal(g1.k + 1)} gaveta. Só esses pagam <span class="r">${pctT(g1.taxa)}</span>; tudo o que já estava nas gavetas de baixo paga o mesmo que antes. Dos ${EURO(aum)} a mais por ano, <span class="r">${EURO(i1 - i0)}</span> vão para o IRS e <span class="a">${EURO(ss)}</span> para a Segurança Social.</p>
      <div class="opcoes" role="group" aria-label="Ver as gavetas da Inês"><button class="btn claro" type="button" id="finAntes">Inês antes: ${EURO(1500)}</button><button class="btn claro" type="button" id="finDepois">Inês depois: ${EURO(1650)}</button></div>
      ${calcFinancas(1650)}`;
    $("finAntes").onclick = () => { $("finSal").value = 1500; $("finSal").onchange(); };
    $("finDepois").onclick = () => { $("finSal").value = 1650; $("finSal").onchange(); };
    ligarCalc(); $("finSal").value = 1500; $("finSal").onchange();
    setTimeout(() => { $("finSal").value = 1650; $("finSal").onchange(); }, temG ? 1500 : 0);
    botoesFin([["Aprender a ler o gráfico →", passo4]]);
  }
  function passo4() {
    topo();
    const c0 = coletavel(1500), g0 = gavetaMaisAlta(c0), med0 = coleta(c0) / c0;
    fala.innerHTML = `Quando ouvires «estou no escalão dos ${pctT(g0.taxa)}», isso é o <span class="r">degrau</span>. O que pagas mesmo é a <b>curva</b>.`;
    corpo.innerHTML = `${graficoIrs()}
      <p>A Inês está no degrau dos <span class="r">${pctT(g0.taxa)}</span>, mas paga em média <b>${pctT(med0)}</b> do rendimento coletável. A curva está sempre abaixo do degrau e nunca dá saltos, porque cada gaveta nova só apanha o dinheiro a mais.</p>
      <p class="nota-fin">Este é o IRS calculado só pelos escalões. Depois ainda se descontam as deduções à coleta: com as despesas gerais familiares, a Inês paga <b>${EURO(IRS.motorIrsAnual)}</b> por ano, o mesmo que o simulador do AO CÊNTIMO calcula. Nos rendimentos mais baixos, o mínimo de existência ainda baixa o imposto.</p>
      ${calcFinancas(1500)}`;
    ligarCalc();
    botoesFin([["Voltar ao bairro", fechar, true], ["Ver outra vez", () => { passo1(); corpo.innerHTML = ""; $("finPainel").textContent = "A 022"; $("finTalao").style.opacity = 0; encherGavetas(0, true); }, true]]);
  }
  function fechar() { cena.hidden = true; mapa.querySelectorAll(".ed.ativo").forEach((g) => g.classList.remove("ativo")); }
  $("finFechar").onclick = fechar;
  cena.onkeydown = (e) => { if (e.key === "Escape") fechar(); };
  setTimeout(abrir, temG ? 700 : 0);
}
