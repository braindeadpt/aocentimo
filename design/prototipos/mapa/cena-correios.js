/* ——— CENA · Correios, senha A: a poupança da Dona Arminda ———
   O passado é medido (índice de preços do Eurostat, o mesmo da Mercearia); o futuro é uma hipótese dita em voz alta:
   «se a taxa ficasse em X e a inflação em Y». Regras: data/fiscal/ca.json e capitais.json. Contas = poupanca.ts (trajetoriaCA). */
const AF = DADOS.aforro, CAP0 = 10000;
function taxaCAano(ano) { const p = AF.premios.find((x) => ano >= x.de && ano <= x.ate); return AF.taxa + (p ? p.pp / 100 : 0); }
function simCA(anos, infl) { // capitalização trimestral, imposto retido em cada vencimento
  let cap = CAP0, jur = 0, imp = 0;
  for (let t = 1; t <= Math.round(anos * 4); t++) { const j = cap * taxaCAano(Math.ceil(t / 4)) / 4; jur += j; imp += j * AF.imposto; cap += j * (1 - AF.imposto); }
  return { saldo: cap, real: cap / Math.pow(1 + infl, anos), jur, imp };
}
const colchao = (anos, infl) => ({ saldo: CAP0, real: CAP0 / Math.pow(1 + infl, anos) });

const PL = { base: 392, alt: 190, max: 16000 }; // pilhas de notas: altura proporcional aos euros
function pilha(id, x, rotulo, lado = 1) {
  return `<g id="${id}"><rect class="p-sombra" x="${x - 44}" y="${PL.base - 4}" width="92" height="8" rx="4" fill="rgba(22,19,15,.18)"/>
    <rect class="p-notas" x="${x - 38}" y="${PL.base}" width="76" height="0" fill="url(#notas)" stroke="${K}" stroke-width="2.4"/>
    <rect class="p-cinta" x="${x - 38}" y="${PL.base}" width="76" height="8" fill="#f7d774" stroke="${K}" stroke-width="1.6"/>
    <g class="p-real"><path d="M${x - 46} 0 H${x + 46}" stroke="#e2412a" stroke-width="3" stroke-dasharray="6 4"/><text x="${x + lado * 50}" y="4" text-anchor="${lado > 0 ? "start" : "end"}" font-family="Caveat" font-weight="700" font-size="17" fill="#c7361f">compra</text></g>
    <text class="p-valor" x="${x}" y="${PL.base - 12}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="16" fill="${K}"></text>
    <text x="${x}" y="${PL.base + 26}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="12.5" fill="${K}">${rotulo}</text></g>`;
}
function porPilha(id, nominal, real, anima) {
  const g = document.getElementById(id); if (!g) return;
  const h = PL.alt * nominal / PL.max, hr = PL.alt * real / PL.max, notas = g.querySelector(".p-notas"), cinta = g.querySelector(".p-cinta"), valor = g.querySelector(".p-valor"), linha = g.querySelector(".p-real");
  const alvo = { h, hr };
  const aplica = (o) => { notas.setAttribute("y", PL.base - o.h); notas.setAttribute("height", o.h); cinta.setAttribute("y", PL.base - o.h * .55); valor.setAttribute("y", PL.base - o.h - 12); linha.setAttribute("transform", `translate(0 ${(PL.base - o.hr).toFixed(1)})`); };
  valor.textContent = EURO(nominal);
  if (anima && temG) { const o = { h: +notas.getAttribute("height") || 0, hr: g._hr ?? h }; gsap.to(o, { ...alvo, duration: .9, ease: "power2.inOut", onUpdate: () => aplica(o) }); }
  else aplica(alvo);
  g._hr = hr;
}

function interiorCorreios() {
  let s = `<defs><pattern id="notas" width="76" height="6" patternUnits="userSpaceOnUse"><rect width="76" height="6" fill="#bfe0c4"/><path d="M0 5.5 H76" stroke="#6aa877" stroke-width="1.2"/><circle cx="60" cy="3" r="1.4" fill="#6aa877"/></pattern>
    <pattern id="corChao" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#e4dccb"/><rect width="20" height="10" fill="#d6ccb7"/><rect x="20" y="10" width="20" height="10" fill="#d6ccb7"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="#fbf3e6"/><rect x="0" y="0" width="640" height="26" fill="${C.vermelho}"/><rect x="0" y="410" width="640" height="60" fill="url(#corChao)" stroke="${K}" stroke-width="2.6"/>`;
  s += `<rect x="200" y="36" width="240" height="32" rx="5" fill="${C.vermelho}" stroke="${K}" stroke-width="2.6"/><text x="320" y="59" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" letter-spacing=".08em" fill="#fff">CORREIOS</text>`;
  // cacifos na parede
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) s += `<rect x="${24 + c * 38}" y="${90 + r * 34}" width="34" height="30" rx="2" fill="#c9a36b" stroke="${K}" stroke-width="1.8"/><circle cx="${48 + c * 38}" cy="${105 + r * 34}" r="2.4" fill="${K}"/><rect x="${30 + c * 38}" y="${96 + r * 34}" width="14" height="6" fill="#fff" stroke="${K}" stroke-width="1"/>`;
  // painel da senha
  s += `<g><rect x="490" y="36" width="120" height="50" rx="7" fill="#26282b" stroke="${K}" stroke-width="2.6"/><text x="550" y="52" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="9" letter-spacing=".14em" fill="#c9c4b8">SENHA</text><text id="corPainel" x="550" y="77" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="#ff5a3c">A 014</text></g>`;
  // a funcionária atrás do vidro do guiché
  s += `<g id="corFunc" transform="translate(450 330) scale(1.02)">${pessoa({ pele: "c", cabelo: "coque", corCabelo: "#2b1d14", roupa: "#e2412a", calcas: "#2b3a55", gola: "#fff", oculos: true })}</g>`;
  s += `<rect x="376" y="150" width="146" height="140" fill="#cfe6f5" fill-opacity=".35" stroke="${K}" stroke-width="2.4"/><path d="M386 170 l30 -14 M396 190 l50 -24" stroke="#fff" stroke-width="3" opacity=".7"/><rect x="430" y="120" width="40" height="24" rx="4" fill="#fff" stroke="${K}" stroke-width="2"/><text x="450" y="137" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="15" fill="${K}">A</text>`;
  // o balcão com as duas pilhas
  s += `<rect x="150" y="300" width="380" height="110" fill="#e7d3b0" stroke="${K}" stroke-width="3"/><rect x="142" y="290" width="396" height="14" rx="3" fill="#8a5a2b" stroke="${K}" stroke-width="2.6"/>`;
  s += `<g transform="translate(0 -102)">${pilha("pilhaCol", 232, "colchão", -1)}${pilha("pilhaCA", 324, "certificados", 1)}</g>`;
  // a Dona Arminda com a caderneta
  s += `<g id="corArminda" transform="translate(585 440) scale(-.98 .98)">${pessoa(ELENCO.arminda)}<rect x="-32" y="-74" width="16" height="20" rx="2" fill="#2445d6" stroke="${K}" stroke-width="2"/></g>`;
  return s;
}

/* o gráfico: euros que se veem (nominal) e o que esses euros compram (real), ano a ano */
const GC = { x0: 58, x1: 500, y0: 250, y1: 18 };
function graficoAforro(infl) {
  const anos = 15, ca = [], co = [];
  for (let a = 0; a <= anos; a++) { ca.push(a ? simCA(a, infl) : { saldo: CAP0, real: CAP0 }); co.push(colchao(a, infl)); }
  const todos = [...ca, ...co].flatMap((p) => [p.saldo, p.real]), lo = Math.floor(Math.min(...todos) / 1000) * 1000, hi = Math.ceil(Math.max(...todos) / 1000) * 1000;
  const x = (a) => GC.x0 + (GC.x1 - GC.x0) * a / anos, y = (v) => GC.y0 - (GC.y0 - GC.y1) * (v - lo) / (hi - lo);
  let s = "";
  const passo = hi - lo > 6000 ? 2000 : 1000;
  for (let v = lo; v <= hi; v += passo) s += `<path d="M${GC.x0} ${y(v).toFixed(1)} H${GC.x1}" stroke="currentColor" stroke-opacity="${v === CAP0 ? .5 : .1}"/><text x="${GC.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${eur(v, 0)}${SEP}€</text>`;
  for (let a = 0; a <= anos; a += 5) s += `<text x="${x(a).toFixed(1)}" y="${GC.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${a ? a + " anos" : "hoje"}</text>`;
  const lin = (arr, k) => arr.map((p, a) => `${a ? "L" : "M"}${x(a).toFixed(1)} ${y(p[k]).toFixed(1)}`).join(" ");
  s += `<path d="${lin(ca, "saldo")} ${ca.map((p, a) => `L${x(anos - a).toFixed(1)} ${y(ca[anos - a].real).toFixed(1)}`).join(" ")} Z" fill="#e2412a" fill-opacity=".1"/>`;
  s += `<path d="${lin(co, "saldo")}" fill="none" stroke="#8e867a" stroke-width="2.6"/><path d="${lin(co, "real")}" fill="none" stroke="#8e867a" stroke-width="2.6" stroke-dasharray="6 4"/>`;
  s += `<path d="${lin(ca, "saldo")}" fill="none" stroke="#0c7a4f" stroke-width="3.2"/><path d="${lin(ca, "real")}" fill="none" stroke="#0c7a4f" stroke-width="3.2" stroke-dasharray="6 4"/>`;
  s += `<path d="M${GC.x0} ${GC.y0} H${GC.x1}" stroke="#16130f" stroke-width="2"/>`;
  const f = ca[anos], c = co[anos];
  s += `<text x="${GC.x1 - 4}" y="${(y(f.saldo) - 8).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="18" fill="#0c7a4f">certificados: os euros que vês</text>`;
  s += `<text x="${GC.x1 - 4}" y="${(y(f.real) + (f.real > c.saldo - 400 && f.real < c.saldo + 400 ? -8 : 18)).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="18" fill="#0c7a4f">…e o que compram</text>`;
  s += `<text x="${x(5).toFixed(1)}" y="${(y(c.saldo) - 8).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="17" fill="#6e675e">colchão: sempre ${eur(CAP0, 0)}${SEP}€…</text>`;
  s += `<text x="${GC.x1 - 4}" y="${Math.min(GC.y0 - 6, y(c.real) + 20).toFixed(1)}" text-anchor="end" font-family="Caveat" font-weight="700" font-size="17" fill="#6e675e">…mas compra cada vez menos</text>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 280" role="img" aria-label="Gráfico de 15 anos: as linhas cheias são os euros que se veem, as tracejadas o que esses euros compram. Com ${pctT(infl)} de inflação por ano, os ${EURO(CAP0)} do colchão compram ${EURO(c.real)} ao fim de 15 anos; nos Certificados de Aforro, ${EURO(f.saldo)} que compram ${EURO(f.real)}." font-family="Archivo">${s}</svg>`;
}

function calcAforro(anos, inflPct) {
  return `<div class="calc"><label for="corAnos"><b>Daqui a quantos anos?</b> <output id="corAnosOut"></output></label><input type="range" id="corAnos" min="1" max="15" step="1" value="${anos}">
    <label for="corInfl"><b>Se a inflação fosse, por ano…</b> <output id="corInflOut"></output></label><input type="range" id="corInfl" min="0" max="6" step="0.1" value="${inflPct}">
    <div class="linha"><span>No colchão</span><b id="corCol"></b></div>
    <div class="linha"><span>Nos Certificados de Aforro (já sem imposto)</span><b id="corCA"></b></div>
    <div class="linha"><span>Juros brutos · imposto retido (${pctT(AF.imposto)})</span><b id="corJur"></b></div></div>`;
}
function ligarCalcAforro(aoMudar) {
  const q = (id) => document.getElementById(id);
  const atualiza = (anima) => {
    const a = +q("corAnos").value, i = +q("corInfl").value / 100, ca = simCA(a, i), co = colchao(a, i);
    q("corAnosOut").textContent = a === 1 ? "1 ano" : a + " anos"; q("corInflOut").textContent = pctT(i);
    q("corCol").innerHTML = `${EURO(co.saldo)} · compram <span class="r">${EURO(co.real)}</span>`;
    q("corCA").innerHTML = `${EURO(ca.saldo)} · compram <span class="${ca.real >= CAP0 ? "g" : "r"}">${EURO(ca.real)}</span>`;
    q("corJur").textContent = `${EURO(ca.jur)} · ${EURO(ca.imp)}`;
    porPilha("pilhaCol", co.saldo, co.real, anima); porPilha("pilhaCA", ca.saldo, ca.real, anima);
    aoMudar && aoMudar(i);
  };
  q("corAnos").oninput = () => atualiza(true); q("corInfl").oninput = () => atualiza(true);
  atualiza(true);
}

function cenaCorreios() {
  const cena = $("cenaCor"), corpo = $("corCorpo"), fala = $("corFala"), acoes = $("corAcoes");
  const botoesC = (lista) => { acoes.innerHTML = ""; lista.forEach(([t, fn, claro]) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (claro ? " claro" : ""); b.textContent = t; b.onclick = fn; acoes.appendChild(b); }); };
  const topo = () => { cena.scrollTop = 0; palco.scrollTop = 0; palco.scrollLeft = 0; };
  const [x, y] = pontoEcra("correios"); ir(x, y - 60, 480, true, .9);
  const inflHoje = DADOS.inflacao; // homóloga, a mesma do quiosque
  const abrir = () => {
    cena.hidden = false; $("corArte").innerHTML = interiorCorreios(); corpo.innerHTML = "";
    $("corFonte").textContent = DADOS.fontes.aforroCena;
    porPilha("pilhaCol", CAP0, CAP0, false); porPilha("pilhaCA", 0, 0, false); document.querySelector("#pilhaCA").style.opacity = 0;
    if (temG) gsap.fromTo(cena, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" });
    passo1();
  };
  function passo1() {
    topo();
    fala.innerHTML = `Bom dia! A <b>poupança</b> é no balcão A. A Dona Arminda está à espera com a caderneta.`;
    botoesC([["Chamar a senha A 015", () => {
      const p = $("corPainel");
      if (temG) { gsap.timeline().to(p, { opacity: 0, duration: .12, repeat: 3, yoyo: true }).add(() => { p.textContent = "A 015"; }); gsap.timeline({ delay: .4 }).to("#corFunc .braco-d", { rotation: -150, transformOrigin: "50% 0%", duration: .25 }).to("#corFunc .braco-d", { rotation: 0, duration: .3, delay: .5 }); }
      else p.textContent = "A 015";
      setTimeout(passo2, temG ? 900 : 0);
    }]]);
  }
  function passo2() {
    topo();
    fala.innerHTML = `Em ${mesLongo(MERC.T0)}, a Dona Arminda guardou <b>${EURO(CAP0)}</b> no colchão. Hoje ainda lá estão, todos. Um palpite:`;
    corpo.innerHTML = `<p class="pergunta-fin">Esses ${EURO(CAP0)} compram hoje o mesmo que quanto dinheiro comprava em ${mesCurto(MERC.T0)}?</p>
      <div class="palpite-linha"><output id="corPalOut"></output><input type="range" id="corPal" min="5000" max="10000" step="100" value="9500" aria-label="O teu palpite em euros"></div>`;
    const pal = $("corPal"); pal.oninput = () => $("corPalOut").textContent = EURO(+pal.value); pal.oninput();
    botoesC([["Mostrar a resposta", () => passo3(+pal.value)]]);
  }
  function passo3(palpite) {
    topo();
    const real = CAP0 / R_TOTAL, dif = Math.abs(real - palpite), juizo = dif <= 200 ? "Acertaste em cheio!" : dif <= 600 ? "Quase!" : palpite > real ? "Ainda menos!" : "Um pouco mais!";
    porPilha("pilhaCol", CAP0, real, true);
    fala.innerHTML = `<b>${juizo}</b> Compram o mesmo que <span class="r">${EURO(real)}</span> compravam em ${mesCurto(MERC.T0)}.`;
    corpo.innerHTML = `<p>O dinheiro não desapareceu: <b>encolheu</b>. Os preços subiram ${pctVar(R_TOTAL)} e cada euro compra menos. Chama-se perder <b>poder de compra</b>: a linha vermelha no monte de notas marca o que ele ainda compra.</p>
      <p>E nos <b>Certificados de Aforro</b>, a poupança do Estado que se faz nos Correios? Hoje rendem <b>${pctT(AF.taxa)}</b> por ano, mais um prémio a partir do 2.º ano, e ${pctT(AF.imposto)} dos juros ficam para o IRS.</p>`;
    botoesC([["E se fosse para os certificados? →", passo4]]);
  }
  function passo4() {
    topo();
    document.querySelector("#pilhaCA").style.opacity = 1;
    const i = inflHoje / 100, liq = AF.taxa * (1 - AF.imposto);
    fala.innerHTML = `Os ${EURO(CAP0)} crescem nos certificados. Mas crescem <b>mais depressa do que os preços?</b>`;
    corpo.innerHTML = `<p>No 1.º ano, a taxa de ${pctT(AF.taxa)} fica em <b>${pctT(liq)}</b> depois do imposto. Se a inflação for maior do que isso, os euros aumentam mas compram menos; se for menor, ganha-se poder de compra. Experimenta:</p>
      ${calcAforro(5, inflHoje)}
      <p class="nota-fin">Isto é uma hipótese, não uma previsão: a taxa dos certificados muda todos os meses (hoje ${pctT(AF.taxa)}, em vigor desde ${AF.vigencia.split("-").reverse().join("/")}) e ninguém sabe a inflação futura. Começa com a inflação dos últimos 12 meses, ${pctT(i)}. ${AF.garantia}.</p>`;
    ligarCalcAforro();
    botoesC([["Aprender a ler o gráfico →", passo5]]);
  }
  function passo5() {
    topo();
    fala.innerHTML = `As linhas <b>cheias</b> são os euros que vês. As <span class="r">tracejadas</span> são o que esses euros compram.`;
    corpo.innerHTML = `<div id="corGrafico">${graficoAforro(inflHoje / 100)}</div>
      <p>No colchão, a linha cheia nunca se mexe: são sempre ${EURO(CAP0)}. Mas a tracejada desce todos os anos. Nos certificados, a cheia sobe; se a tracejada ficar abaixo de ${EURO(CAP0)}, a poupança está a perder para os preços. A distância entre as duas linhas é a <b>inflação</b>.</p>
      ${calcAforro(15, inflHoje)}`;
    ligarCalcAforro((i) => { $("corGrafico").innerHTML = graficoAforro(i); });
    botoesC([["Voltar ao bairro", fechar, true], ["Ver outra vez", () => { $("corArte").innerHTML = interiorCorreios(); porPilha("pilhaCol", CAP0, CAP0, false); porPilha("pilhaCA", 0, 0, false); document.querySelector("#pilhaCA").style.opacity = 0; passo1(); corpo.innerHTML = ""; }, true]]);
  }
  function fechar() { cena.hidden = true; mapa.querySelectorAll(".ed.ativo").forEach((g) => g.classList.remove("ativo")); }
  $("corFechar").onclick = fechar;
  cena.onkeydown = (e) => { if (e.key === "Escape") fechar(); };
  setTimeout(abrir, temG ? 700 : 0);
}
