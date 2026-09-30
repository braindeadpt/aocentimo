/* ——— CENA · Banco, senha A: o crédito à habitação do Rui e da Marta ———
   A prestação de um empréstimo novo feito em cada mês, com a Euribor a 12 meses real (BPstat) e um exemplo de
   montante, prazo e spread (marcados como exemplo e ajustáveis). Fórmula = motor prestacao.ts (método francês). */
const EUR = DADOS.euriborSerie;
const MES3 = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESX = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const mesCurto = (t) => `${MES3[+t.slice(5, 7) - 1]} ${t.slice(0, 4)}`, mesLongo = (t) => `${MESX[+t.slice(5, 7) - 1]} de ${t.slice(0, 4)}`;
const pct2 = (v) => eur(v, 2) + SEP + "%";
const EX = { capital: 150000, anos: 30, spread: 1 }; // exemplo, não é um dado publicado
function prestacao(capital, anos, tanPct) {
  const n = anos * 12, i = tanPct / 100 / 12;
  return i === 0 ? capital / n : capital * i / (1 - Math.pow(1 + i, -n));
}
const idxMin = EUR.reduce((a, p, k) => p.v < EUR[a].v ? k : a, 0), idxMax = EUR.reduce((a, p, k) => p.v > EUR[a].v ? k : a, 0), idxHoje = EUR.length - 1;

function interiorBanco() {
  let s = `<defs><pattern id="banMarmore" width="60" height="30" patternUnits="userSpaceOnUse"><rect width="60" height="30" fill="#e9e4da"/><path d="M0 22 q15 -8 30 -2 t30 -4" fill="none" stroke="#cfc6b6" stroke-width="1.4"/><path d="M0 0 H60 M30 0 V30" stroke="#d6cebf" stroke-width="1.2"/></pattern></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="#e8efe9"/><rect x="0" y="0" width="640" height="30" fill="#0c5e3f"/><rect x="0" y="410" width="640" height="60" fill="url(#banMarmore)" stroke="${K}" stroke-width="2.6"/>`;
  for (const x of [20, 600]) s += `<rect x="${x}" y="30" width="22" height="380" fill="#f3efe6" stroke="${K}" stroke-width="2.4"/><rect x="${x - 4}" y="30" width="30" height="14" fill="#e2dccf" stroke="${K}" stroke-width="2"/>`;
  // o cofre ao fundo
  s += `<g><circle cx="530" cy="190" r="62" fill="#b9c1c9" stroke="${K}" stroke-width="3"/><circle cx="530" cy="190" r="46" fill="#d6dce1" stroke="${K}" stroke-width="2.4"/>${[0, 1, 2, 3, 4, 5].map((k) => { const a = k * Math.PI / 3; return `<path d="M530 190 L${(530 + Math.cos(a) * 30).toFixed(1)} ${(190 + Math.sin(a) * 30).toFixed(1)}" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`; }).join("")}<circle cx="530" cy="190" r="10" fill="#8e99a5" stroke="${K}" stroke-width="2.4"/></g>`;
  // o quadro da Euribor (letras que viram)
  s += `<g><rect x="60" y="52" width="380" height="118" rx="10" fill="#1d2024" stroke="${K}" stroke-width="3"/><text x="250" y="76" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="12" letter-spacing=".16em" fill="#c9c4b8">EURIBOR A 12 MESES · MÉDIA DO MÊS</text>
    ${[0, 1, 2, 3, 4, 5, 6].map((k) => `<g class="palheta" data-k="${k}"><rect x="${84 + k * 48}" y="90" width="42" height="62" rx="5" fill="#2c3036" stroke="#000" stroke-width="1.6"/><path d="M${84 + k * 48} 121 h42" stroke="#000" stroke-width="1.4"/><text class="pal-t" x="${105 + k * 48}" y="136" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="36" fill="#ffd34d"></text></g>`).join("")}
    <text id="banMes" x="250" y="188" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="16" fill="${K}"></text></g>`;
  // painel da senha
  s += `<g><rect x="460" y="52" width="110" height="46" rx="6" fill="#26282b" stroke="${K}" stroke-width="2.6"/><text id="banPainel" x="515" y="85" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="24" fill="#ff5a3c">A 040</text></g>`;
  // o gerente atrás do balcão
  s += `<g id="banGer" transform="translate(250 346) scale(1.05)">${pessoa({ pele: "d", cabelo: "curto", corCabelo: "#1d1410", roupa: "#26282b", calcas: "#26282b", gravata: "#e2412a", gola: "#fff" })}</g>`;
  // o balcão com o papel da prestação
  s += `<g><rect x="180" y="300" width="300" height="110" fill="#f3efe6" stroke="${K}" stroke-width="3"/><rect x="172" y="290" width="316" height="14" rx="3" fill="#0c5e3f" stroke="${K}" stroke-width="2.6"/>${[0, 1, 2].map((k) => `<rect x="${204 + k * 94}" y="318" width="66" height="76" fill="none" stroke="${K}" stroke-width="1.6" opacity=".35"/>`).join("")}
    <g id="banPapel" transform="rotate(-4 410 262)"><rect x="342" y="228" width="136" height="64" fill="#fff" stroke="${K}" stroke-width="2"/><text x="410" y="245" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="9.5" fill="#6e675e">PRESTAÇÃO POR MÊS</text><text id="banPrest" x="410" y="276" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="26" fill="${K}"></text><text id="banTanP" x="410" y="288" text-anchor="middle" font-family="Archivo" font-weight="600" font-size="8.5" fill="#6e675e"></text></g></g>`;
  // o Rui e a Marta à frente do balcão
  s += `<g id="banRui" transform="translate(120 440) scale(.95)">${pessoa(ELENCO.rui)}</g><g id="banMarta" transform="translate(560 440) scale(-.95 .95)">${pessoa(ELENCO.marta)}</g>`;
  return s;
}
// o quadro: 7 palhetas para «−0,50%», «4,16%» … com viragem só nas que mudam
let quadroAtual = "";
function quadro(v, anima) {
  const txt = (v < 0 ? "−" : "") + eur(Math.abs(v), 2) + "%", cel = txt.padStart(7, " ").split("");
  document.querySelectorAll("#banArte .palheta").forEach((p, k) => {
    const t = p.querySelector(".pal-t"), novo = cel[k] === " " ? "" : cel[k];
    if (t.textContent === novo) return;
    if (anima && temG) gsap.timeline().to(p, { scaleY: 0, transformOrigin: "50% 50%", duration: .09, ease: "power1.in", onComplete: () => t.textContent = novo }).to(p, { scaleY: 1, duration: .12, ease: "power1.out" });
    else t.textContent = novo;
  });
  quadroAtual = txt;
}
function mostrarMes(k, o, anima) {
  const p = EUR[k], tan = p.v + o.spread, pr = prestacao(o.capital, o.anos, tan);
  quadro(p.v, anima);
  document.getElementById("banMes").textContent = mesLongo(p.t);
  document.getElementById("banPrest").textContent = EURO(pr);
  document.getElementById("banTanP").textContent = `taxa ${pct2(tan)} = Euribor + spread`;
  return { p, tan, pr };
}

/* os dois gráficos empilhados, com o mesmo tempo: em cima a Euribor e a taxa (a faixa entre elas é o spread); em baixo a prestação */
const GB = { x0: 58, x1: 500, a0: 128, a1: 16, b0: 262, b1: 156 };
function graficoBanco(o) {
  const n = EUR.length, x = (k) => GB.x0 + (GB.x1 - GB.x0) * k / (n - 1);
  const tMin = Math.min(-1, Math.floor(Math.min(...EUR.map((p) => p.v)))), tMax = Math.ceil(Math.max(...EUR.map((p) => p.v)) + o.spread + .5);
  const ya = (v) => GB.a0 - (GB.a0 - GB.a1) * (v - tMin) / (tMax - tMin);
  const prs = EUR.map((p) => prestacao(o.capital, o.anos, p.v + o.spread)), pMax = Math.ceil(Math.max(...prs) / 100) * 100 + 100, pMin = Math.max(0, Math.floor(Math.min(...prs) / 100) * 100 - 100);
  const yb = (v) => GB.b0 - (GB.b0 - GB.b1) * (v - pMin) / (pMax - pMin);
  let s = "";
  for (let v = tMin; v <= tMax; v++) s += `<path d="M${GB.x0} ${ya(v).toFixed(1)} H${GB.x1}" stroke="currentColor" stroke-opacity="${v === 0 ? .5 : .1}"/><text x="${GB.x0 - 8}" y="${(ya(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${v < 0 ? "−" : ""}${Math.abs(v)}${SEP}%</text>`;
  const passoP = (pMax - pMin) > 600 ? 200 : 100;
  for (let v = pMin; v <= pMax; v += passoP) s += `<path d="M${GB.x0} ${yb(v).toFixed(1)} H${GB.x1}" stroke="currentColor" stroke-opacity=".1"/><text x="${GB.x0 - 8}" y="${(yb(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${eur(v, 0)}${SEP}€</text>`;
  EUR.forEach((p, k) => { if (p.t.endsWith("-01")) s += `<text x="${x(k).toFixed(1)}" y="${GB.b0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${p.t.slice(0, 4)}</text><path d="M${x(k).toFixed(1)} ${GB.b0} v5" stroke="currentColor" stroke-opacity=".5"/>`; });
  const linha = (f) => EUR.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${f(p, k).toFixed(1)}`).join(" ");
  // faixa do spread entre a Euribor e a taxa
  s += `<path d="${linha((p) => ya(p.v + o.spread))} ${EUR.map((p, k) => `L${x(n - 1 - k).toFixed(1)} ${ya(EUR[n - 1 - k].v).toFixed(1)}`).join(" ")} Z" fill="#ffc62b" fill-opacity=".45"/>`;
  s += `<path d="${linha((p) => ya(p.v))}" fill="none" stroke="#2445d6" stroke-width="3"/><path d="${linha((p) => ya(p.v + o.spread))}" fill="none" stroke="#16130f" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<path d="${linha((p, k) => yb(prs[k]))}" fill="none" stroke="#e2412a" stroke-width="3"/><path d="M${GB.x0} ${GB.b0} H${GB.x1}" stroke="#16130f" stroke-width="2"/>`;
  s += `<text x="${GB.x0 + 6}" y="${GB.a1 + 4}" font-family="Caveat" font-weight="700" font-size="19" fill="#2445d6">a Euribor (muda com o mercado)</text>`;
  s += `<text x="${GB.x0 + 6}" y="${ya(Math.min(tMax - .6, 2.3)).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="17" fill="#7a5600">o spread do banco</text>`;
  s += `<text x="${GB.x0 + 6}" y="${GB.b1 - 6}" font-family="Caveat" font-weight="700" font-size="19" fill="#c7361f">a prestação (sobe e desce com ela)</text>`;
  s += `<g><path id="banCursor" stroke="#16130f" stroke-width="1.6" stroke-dasharray="3 3"/><circle id="banPa" r="6" fill="#2445d6" stroke="#16130f" stroke-width="2"/><circle id="banPb" r="6" fill="#e2412a" stroke="#16130f" stroke-width="2"/></g>`;
  const cursor = (k) => { const xx = x(k).toFixed(1); const q = (id) => document.getElementById(id); if (!q("banCursor")) return; q("banCursor").setAttribute("d", `M${xx} ${GB.a1} V${GB.b0}`); q("banPa").setAttribute("cx", xx); q("banPa").setAttribute("cy", ya(EUR[k].v)); q("banPb").setAttribute("cx", xx); q("banPb").setAttribute("cy", yb(prs[k])); };
  return { svg: `<svg class="grafico-irs" viewBox="0 0 520 285" role="img" aria-label="Dois gráficos com o mesmo tempo, de 2019 até hoje: em cima a Euribor a 12 meses e a taxa do empréstimo; em baixo a prestação, que sobe e desce com a Euribor." font-family="Archivo">${s}</svg>`, cursor };
}

function calcBanco(o, k) {
  return `<div class="calc"><label for="banTempo"><b>Se pedissem o empréstimo em…</b> <output id="banTempoOut"></output></label>
    <input type="range" id="banTempo" min="0" max="${EUR.length - 1}" step="1" value="${k}">
    <div class="linha"><span>Euribor a 12 meses</span><b id="banEur"></b></div>
    <div class="linha"><span>Taxa do empréstimo (Euribor + spread)</span><b id="banTan"></b></div>
    <div class="linha"><span>Prestação por mês</span><b id="banPre" class="r"></b></div>
    <div class="linha"><span>Da 1.ª prestação, juros</span><b id="banJur"></b></div>
    <div class="barra-juros" aria-hidden="true"><span id="banBj"></span><span id="banBc"></span></div>
    <details class="exemplo"><summary>Exemplo: ${EURO(o.capital)} a ${o.anos} anos, spread de ${pctT(o.spread / 100)}. Mudar</summary>
      <label for="banCap">Montante <output id="banCapOut"></output></label><input type="range" id="banCap" min="50000" max="400000" step="5000" value="${o.capital}">
      <label for="banAnos">Prazo <output id="banAnosOut"></output></label><input type="range" id="banAnos" min="10" max="40" step="1" value="${o.anos}">
      <label for="banSpread">Spread <output id="banSpreadOut"></output></label><input type="range" id="banSpread" min="0.3" max="3" step="0.05" value="${o.spread}"></details></div>`;
}
function ligarCalcBanco(o, aoMudar) {
  const q = (id) => document.getElementById(id), tempo = q("banTempo");
  const atualiza = (anima) => {
    Object.assign(o, { capital: +q("banCap").value, anos: +q("banAnos").value, spread: +q("banSpread").value });
    q("banCapOut").textContent = EURO(o.capital); q("banAnosOut").textContent = o.anos + " anos"; q("banSpreadOut").textContent = pct2(o.spread);
    const k = +tempo.value, r = mostrarMes(k, o, anima), juro = o.capital * r.tan / 100 / 12;
    q("banTempoOut").textContent = mesCurto(r.p.t);
    q("banEur").textContent = pct2(r.p.v); q("banTan").textContent = pct2(r.tan); q("banPre").textContent = EURO(r.pr);
    q("banJur").textContent = `${EURO(Math.max(0, juro))} de ${EURO(r.pr)}`;
    const fr = Math.max(0, Math.min(1, juro / r.pr)); q("banBj").style.width = (fr * 100).toFixed(1) + "%"; q("banBc").style.width = ((1 - fr) * 100).toFixed(1) + "%";
    q("banBj").textContent = fr > .18 ? "juros" : ""; q("banBc").textContent = fr < .82 ? "paga a casa" : "";
    aoMudar && aoMudar(k);
  };
  tempo.oninput = () => atualiza(true);
  ["banCap", "banAnos", "banSpread"].forEach((id) => { q(id).oninput = () => atualiza(false); q(id).onchange = () => { atualiza(false); aoMudar && aoMudar(+tempo.value, true); }; });
  atualiza(false);
  return atualiza;
}

function cenaBanco() {
  const cena = $("cenaBan"), corpo = $("banCorpo"), fala = $("banFala"), acoes = $("banAcoes"), o = { ...EX };
  const botoesBan = (lista) => { acoes.innerHTML = ""; lista.forEach(([t, fn, claro]) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (claro ? " claro" : ""); b.textContent = t; b.onclick = fn; acoes.appendChild(b); }); };
  const topo = () => { cena.scrollTop = 0; palco.scrollTop = 0; palco.scrollLeft = 0; };
  const [x, y] = pontoEcra("banco"); ir(x, y - 60, 480, true, .9);
  const abrir = () => {
    cena.hidden = false; $("banArte").innerHTML = interiorBanco(); corpo.innerHTML = ""; quadroAtual = "";
    mostrarMes(idxMin, o, false);
    $("banFonte").textContent = DADOS.fontes.bancoCena;
    if (temG) gsap.fromTo(cena, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" });
    passo1();
  };
  function passo1() {
    topo();
    fala.innerHTML = `Bom dia! O <b>crédito à habitação</b> é no balcão A. O Rui e a Marta já tiraram a senha.`;
    botoesBan([["Chamar a senha A 041", () => {
      const p = $("banPainel");
      if (temG) { gsap.timeline().to(p, { opacity: 0, duration: .12, repeat: 3, yoyo: true }).add(() => { p.textContent = "A 041"; }); gsap.timeline({ delay: .4 }).to("#banGer .braco-d", { rotation: -150, transformOrigin: "50% 0%", duration: .25 }).to("#banGer .braco-d", { rotation: 0, duration: .3, delay: .5 }); }
      else p.textContent = "A 041";
      setTimeout(passo2, temG ? 900 : 0);
    }]]);
  }
  function passo2() {
    topo();
    const a = EUR[idxMin], b = EUR[idxMax], pa = prestacao(o.capital, o.anos, a.v + o.spread);
    fala.innerHTML = `O Rui e a Marta querem pedir <b>${EURO(o.capital)}</b> a ${o.anos} anos para comprar casa. Um palpite antes:`;
    corpo.innerHTML = `<p class="pergunta-fin">Em <b>${mesLongo(a.t)}</b>, a prestação deste empréstimo seria de <b>${EURO(pa)}</b> por mês. E se o pedissem em <b>${mesLongo(b.t)}</b>, pela mesma casa?</p>
      <div class="palpite-linha"><output id="banPalOut">${EURO(pa)}</output><input type="range" id="banPal" min="${Math.round(pa / 10) * 10}" max="${Math.round(pa * 2.4 / 10) * 10}" step="10" value="${Math.round(pa * 1.3 / 10) * 10}" aria-label="O teu palpite em euros por mês"></div>
      <p class="nota-fin">Exemplo com spread de ${pctT(o.spread / 100)}. Só a Euribor é um dado real (BPstat).</p>`;
    const pal = $("banPal"); pal.oninput = () => $("banPalOut").textContent = EURO(+pal.value); pal.oninput();
    botoesBan([["Mostrar a resposta", () => passo3(+pal.value)]]);
  }
  function passo3(palpite) {
    topo();
    const a = EUR[idxMin], b = EUR[idxMax], pa = prestacao(o.capital, o.anos, a.v + o.spread), pb = prestacao(o.capital, o.anos, b.v + o.spread);
    const dif = Math.abs(palpite - pb), juizo = dif <= 25 ? "Acertaste em cheio!" : dif <= 80 ? "Quase!" : palpite < pb ? "Mais do que pensavas!" : "Um pouco menos!";
    fala.innerHTML = `<b>${juizo}</b> Em ${mesLongo(b.t)} seria <span class="r">${EURO(pb)}</span> por mês: mais <span class="r">${EURO(pb - pa)}</span> do que em ${mesLongo(a.t)}.`;
    corpo.innerHTML = `<p>A casa é a mesma, o dinheiro pedido é o mesmo e o banco não mudou nada. Mudou a <b>Euribor</b>: de <span class="a">${pct2(a.v)}</span> para <span class="a">${pct2(b.v)}</span>. A taxa do empréstimo é a Euribor mais o <b>spread</b>, a parte fixa que o banco cobra.</p>
      <p>Arrasta pelo tempo e vê o quadro e a prestação a mudar. Repara também na barra: quando a taxa sobe, quase toda a primeira prestação vai para juros.</p>
      ${calcBanco(o, idxMax)}`;
    const atualiza = ligarCalcBanco(o);
    if (temG) { $("banTempo").value = idxMin; atualiza(false); const st = { k: idxMin }; gsap.to(st, { k: idxMax, duration: 2.4, ease: "power1.inOut", onUpdate: () => { const k = Math.round(st.k); if (+$("banTempo").value !== k) { $("banTempo").value = k; atualiza(true); } } }); }
    else { $("banTempo").value = idxMax; atualiza(false); }
    botoesBan([["Aprender a ler o gráfico →", passo4]]);
  }
  function passo4() {
    topo();
    const hoje = EUR[idxHoje], ph = prestacao(o.capital, o.anos, hoje.v + o.spread);
    fala.innerHTML = `Dois gráficos, o <b>mesmo tempo</b>. Quando a linha azul sobe, a vermelha sobe logo atrás.`;
    const g = graficoBanco(o);
    corpo.innerHTML = `${g.svg}
      <p>Em cima, a <span class="a">Euribor</span> e, a tracejado, a taxa do empréstimo; a faixa amarela entre as duas é o <b>spread</b>. Em baixo, a <span class="r">prestação</span>. Hoje (${mesLongo(hoje.t)}), a Euribor está em ${pct2(hoje.v)} e a prestação do exemplo seria de <b>${EURO(ph)}</b>.</p>
      <p class="nota-fin">Para comparar, cada ponto é um empréstimo novo feito nesse mês. Num contrato a sério, a taxa revê-se de 3, 6 ou 12 em 12 meses sobre a dívida que falta pagar. Imposto do Selo, seguros e comissões não estão incluídos.</p>
      ${calcBanco(o, idxHoje)}`;
    let gAtual = g;
    const redesenha = (k, mudouExemplo) => { if (mudouExemplo) { const svg = corpo.querySelector("svg.grafico-irs"); const novo = graficoBanco(o); svg.outerHTML = novo.svg; gAtual = novo; } gAtual.cursor(k); };
    ligarCalcBanco(o, redesenha);
    botoesBan([["Voltar ao bairro", fechar, true], ["Ver outra vez", () => { Object.assign(o, EX); $("banPainel").textContent = "A 040"; mostrarMes(idxMin, o, false); passo1(); corpo.innerHTML = ""; }, true]]);
  }
  function fechar() { cena.hidden = true; mapa.querySelectorAll(".ed.ativo").forEach((g) => g.classList.remove("ativo")); }
  $("banFechar").onclick = fechar;
  cena.onkeydown = (e) => { if (e.key === "Escape") fechar(); };
  setTimeout(abrir, temG ? 700 : 0);
}
