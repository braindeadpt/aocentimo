/* ——— CENA · Bomba de gasolina: o litro por dentro ———
   Preço médio de hoje (DGEG), ISP e taxa de carbono de data/fiscal/isp.json (valores indicativos, revistos por portaria),
   IVA de iva.json. Decomposição = motor impostos.ts (decomporCombustivel): o IVA incide sobre o preço já com ISP e carbono. */
const CB = DADOS.comb, LITROS = 50;
function decompor(c) {
  const p = c.preco, iva = p - p / (1 + CB.iva), impostos = iva + c.isp + c.carbono;
  return { p, iva, isp: c.isp, carbono: c.carbono, impostos, produto: p - impostos, ivaSobreImp: (c.isp + c.carbono) * CB.iva, peso: impostos / p };
}
const CAM = [["produto", "Combustível e distribuição", "#e9c46a"], ["isp", "ISP", "#e2412a"], ["carbono", "Taxa de carbono", "#a8321f"], ["iva", "IVA", "#ff9a86"]];
const JR = { x: 300, w: 130, base: 402, alt: 260 };

function interiorBomba() {
  let s = `<defs><pattern id="ivaImp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#ff9a86"/><path d="M0 0 V8" stroke="#e2412a" stroke-width="3"/></pattern>
    <linearGradient id="ceuBomba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd6f3"/><stop offset="1" stop-color="#dff2fb"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="640" height="410" fill="url(#ceuBomba)"/><rect x="0" y="410" width="640" height="60" fill="#c9c4b8" stroke="${K}" stroke-width="2.6"/><path d="M0 440 H640" stroke="#fff" stroke-width="4" stroke-dasharray="30 20"/>`;
  // a pala
  s += `<rect x="0" y="20" width="420" height="34" fill="#fff" stroke="${K}" stroke-width="3"/><rect x="0" y="20" width="420" height="10" fill="${C.amarelo}" stroke="${K}" stroke-width="2"/><rect x="0" y="44" width="420" height="10" fill="${C.vermelho}" stroke="${K}" stroke-width="2"/><text x="210" y="42" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="11" letter-spacing=".12em" fill="${K}">COMBUSTÍVEIS</text><rect x="60" y="54" width="14" height="356" fill="#e9e6df" stroke="${K}" stroke-width="2.4"/><rect x="60" y="370" width="14" height="40" fill="${C.vermelho}" stroke="${K}" stroke-width="2"/>`;
  // a bomba com o mostrador
  s += `<g transform="translate(-60 0)"><rect x="96" y="210" width="96" height="200" rx="8" fill="#f7f5f0" stroke="${K}" stroke-width="3"/><rect x="96" y="210" width="96" height="30" rx="8" fill="${C.vermelho}" stroke="${K}" stroke-width="3"/>
    <rect x="106" y="250" width="76" height="62" rx="4" fill="#1d2024" stroke="${K}" stroke-width="2"/><text x="112" y="266" font-family="Archivo" font-weight="700" font-size="8" fill="#c9c4b8">A PAGAR €</text><text id="bmbEur" x="176" y="283" text-anchor="end" font-family="Archivo" font-weight="900" font-size="17" fill="#6fe07a" font-variant-numeric="tabular-nums">0,00</text>
    <text x="112" y="296" font-family="Archivo" font-weight="700" font-size="8" fill="#c9c4b8">LITROS</text><text id="bmbLit" x="176" y="307" text-anchor="end" font-family="Archivo" font-weight="900" font-size="12" fill="#6fe07a" font-variant-numeric="tabular-nums">0,00</text>
    <rect x="112" y="322" width="64" height="16" rx="3" fill="#fff" stroke="${K}" stroke-width="1.6"/><text id="bmbTipo" x="144" y="333.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="7.2" fill="${K}"></text>
    </g><path d="M132 360 q10 45 60 45 H440 q40 0 53 -22" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  // o carro do Pedro (com a prancha no tejadilho) e o Pedro
  s += `<g transform="translate(265 60) scale(.85)"><path d="M200 400 v-34 q0 -12 14 -14 l34 -4 l26 -26 q8 -6 20 -6 h70 q12 0 20 8 l22 26 q24 2 26 18 v32 z" fill="#2445d6" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M280 346 l20 -22 h34 v22 z M344 346 v-22 h26 l18 22 z" fill="var(--vidro)" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M340 350 v44" stroke="${K}" stroke-width="1.6" opacity=".5"/>
    <circle cx="246" cy="402" r="18" fill="${K}"/><circle cx="246" cy="402" r="8" fill="#b9c1c9"/><circle cx="376" cy="402" r="18" fill="${K}"/><circle cx="376" cy="402" r="8" fill="#b9c1c9"/>
    <rect x="268" y="376" width="14" height="8" rx="2" fill="#fff" stroke="${K}" stroke-width="1.4"/>
    <path d="M262 318 q60 -16 150 -2 q-80 10 -150 2z" fill="#7fd1c7" stroke="${K}" stroke-width="2.2"/><path d="M290 318 h8 M380 318 h8" stroke="${K}" stroke-width="2"/></g>`;
  s += `<g id="bmbPedro" transform="translate(585 440) scale(.85)">${pessoa({ ...ELENCO.pedro, prancha: null })}</g>`;
  // o garrafão de um litro, vazio, com as camadas por encher
  s += `<g id="bmbJarra"><path d="M${JR.x} ${JR.base} V${JR.base - JR.alt} q0 -14 14 -18 h${JR.w - 28} q14 4 14 18 V${JR.base} q0 10 -10 10 H${JR.x + 10} q-10 0 -10 -10z" fill="#eef7fb" stroke="${K}" stroke-width="3"/>
    <rect x="${JR.x + 40}" y="${JR.base - JR.alt - 38}" width="${JR.w - 80}" height="22" rx="4" fill="#d6dce1" stroke="${K}" stroke-width="2.4"/>
    ${CAM.map(([k, , cor]) => `<rect class="camada" id="cam-${k}" x="${JR.x + 3}" y="${JR.base}" width="${JR.w - 6}" height="0" fill="${cor}"/>`).join("")}
    <rect id="cam-ivaimp" x="${JR.x + 3}" y="${JR.base}" width="${JR.w - 6}" height="0" fill="url(#ivaImp)"/>
    <path d="M${JR.x} ${JR.base} V${JR.base - JR.alt} q0 -14 14 -18 h${JR.w - 28} q14 4 14 18 V${JR.base} q0 10 -10 10 H${JR.x + 10} q-10 0 -10 -10z" fill="none" stroke="${K}" stroke-width="3"/>
    <path d="M${JR.x + 14} ${JR.base - JR.alt + 20} v${JR.alt - 60}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    <text x="${JR.x + JR.w / 2}" y="${JR.base + 30}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="13" fill="${K}">1 litro</text>
    <g id="bmbRot"></g></g>`;
  return s;
}
// enche o garrafão por camadas (de baixo para cima) com as alturas proporcionais ao preço
function encherJarra(d, anima) {
  let y = JR.base; const esc = JR.alt / d.p, rot = [];
  CAM.forEach(([k, nome, cor], n) => {
    const h = d[k] * esc, el = document.getElementById("cam-" + k), topo = y - h;
    if (anima && temG) gsap.fromTo(el, { attr: { y: y, height: 0 } }, { attr: { y: topo, height: h }, duration: .5, delay: n * .45, ease: "power1.out" });
    else { el.setAttribute("y", topo); el.setAttribute("height", h); }
    rot.push([nome, d[k], (y + topo) / 2, cor]); y = topo;
  });
  // a parte do IVA que incide sobre o ISP e a taxa de carbono (tracejado dentro da camada do IVA)
  const hi = d.ivaSobreImp * esc, eli = document.getElementById("cam-ivaimp");
  if (anima && temG) gsap.fromTo(eli, { attr: { y: y, height: 0 } }, { attr: { y: y, height: hi }, duration: .4, delay: 2, ease: "power1.out" });
  else { eli.setAttribute("y", y); eli.setAttribute("height", hi); }
  document.getElementById("bmbRot").innerHTML = rot.map(([nome, v, yy, cor]) => `<path d="M${JR.x - 4} ${yy.toFixed(1)} H${JR.x - 20}" stroke="${K}" stroke-width="1.6"/><text x="${JR.x - 24}" y="${(yy - 2).toFixed(1)}" text-anchor="end" font-family="Archivo" font-weight="800" font-size="10.5" fill="${K}">${nome}</text><text x="${JR.x - 24}" y="${(yy + 11).toFixed(1)}" text-anchor="end" font-family="Archivo" font-weight="900" font-size="12" fill="${cor === "#e9c46a" ? K : "#a8321f"}">${EURO(v, 3)}</text>`).join("");
  if (anima && temG) gsap.fromTo("#bmbRot", { opacity: 0 }, { opacity: 1, duration: .4, delay: 1.9 }); else document.getElementById("bmbRot").style.opacity = 1;
}
function mostrador(c, litros, anima) {
  const alvo = { e: c.preco * litros, l: litros }, eu = document.getElementById("bmbEur"), li = document.getElementById("bmbLit");
  document.getElementById("bmbTipo").textContent = c.nome.toUpperCase();
  if (anima && temG) { const o = { e: 0, l: 0 }; gsap.to(o, { ...alvo, duration: 2.2, ease: "none", onUpdate: () => { eu.textContent = eur(o.e, 2); li.textContent = eur(o.l, 2); } }); }
  else { eu.textContent = eur(alvo.e, 2); li.textContent = eur(alvo.l, 2); }
}

/* o gráfico: o preço desde 2017, gasolina 95 e gasóleo (média nacional, um ponto por semana) */
const GP = { x0: 50, x1: 500, y0: 250, y1: 20 };
function graficoComb() {
  const a = CB.gasolina.serie, b = CB.gasoleo.serie, n = a.length, todos = [...a, ...b].map((p) => p.v);
  const lo = Math.floor(Math.min(...todos) * 5) / 5, hi = Math.ceil(Math.max(...todos) * 5) / 5;
  const x = (k, arr) => GP.x0 + (GP.x1 - GP.x0) * k / (arr.length - 1), y = (v) => GP.y0 - (GP.y0 - GP.y1) * (v - lo) / (hi - lo);
  let s = "";
  for (let v = lo; v <= hi + 1e-9; v += .2) s += `<path d="M${GP.x0} ${y(v).toFixed(1)} H${GP.x1}" stroke="currentColor" stroke-opacity=".1"/><text x="${GP.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e">${eur(v, 2)}</text>`;
  let anoV = ""; a.forEach((p, k) => { const ano = p.t.slice(0, 4); if (ano !== anoV && +ano % 2 === 1) s += `<text x="${x(k, a).toFixed(1)}" y="${GP.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${ano}</text>`; anoV = ano; });
  const lin = (arr) => arr.map((p, k) => `${k ? "L" : "M"}${x(k, arr).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  s += `<path d="${lin(b)}" fill="none" stroke="#16130f" stroke-width="2.4"/><path d="${lin(a)}" fill="none" stroke="#e2412a" stroke-width="2.6"/><path d="M${GP.x0} ${GP.y0} H${GP.x1}" stroke="#16130f" stroke-width="2"/>`;
  const km = a.reduce((m, p, k) => p.v > a[m].v ? k : m, 0), kn = a.reduce((m, p, k) => p.v < a[m].v ? k : m, 0);
  s += `<circle cx="${x(km, a).toFixed(1)}" cy="${y(a[km].v).toFixed(1)}" r="5.5" fill="#e2412a" stroke="#16130f" stroke-width="2"/><text x="${(x(km, a) + 8).toFixed(1)}" y="${(y(a[km].v) + 4).toFixed(1)}" font-family="Caveat" font-weight="700" font-size="17" fill="#c7361f" stroke="#fff" stroke-width="4" paint-order="stroke">o pico: ${EURO(a[km].v, 3)} (${mesCurto(a[km].t)})</text>`;
  s += `<circle cx="${x(kn, a).toFixed(1)}" cy="${y(a[kn].v).toFixed(1)}" r="5.5" fill="#fff" stroke="#16130f" stroke-width="2"/><text x="${x(kn, a).toFixed(1)}" y="${(y(a[kn].v) + 20).toFixed(1)}" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="17" fill="#16130f" stroke="#fff" stroke-width="4" paint-order="stroke">o mais baixo: ${EURO(a[kn].v, 3)} (${mesCurto(a[kn].t)})</text>`;
  s += `<text x="${GP.x0 + 6}" y="${GP.y1 + 6}" font-family="Caveat" font-weight="700" font-size="18" fill="#c7361f">gasolina 95</text><text x="${GP.x0 + 96}" y="${GP.y1 + 6}" font-family="Caveat" font-weight="700" font-size="18" fill="#16130f">gasóleo</text>`;
  return `<svg class="grafico-irs" viewBox="0 0 520 280" role="img" aria-label="Preço médio por litro desde 2017: a gasolina 95 teve o pico de ${EURO(a[km].v, 3)} em ${mesLongo(a[km].t)} e o valor mais baixo de ${EURO(a[kn].v, 3)} em ${mesLongo(a[kn].t)}." font-family="Archivo">${s}</svg>`;
}

function cenaBomba() {
  const cena = $("cenaBmb"), corpo = $("bmbCorpo"), fala = $("bmbFala"), acoes = $("bmbAcoes");
  const botoesB = (lista) => { acoes.innerHTML = ""; lista.forEach(([t, fn, claro]) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (claro ? " claro" : ""); b.textContent = t; b.onclick = fn; acoes.appendChild(b); }); };
  const topo = () => { cena.scrollTop = 0; palco.scrollTop = 0; palco.scrollLeft = 0; };
  const [x, y] = pontoEcra("bomba"); ir(x, y - 60, 480, true, .9);
  const abrir = () => {
    cena.hidden = false; $("bmbArte").innerHTML = interiorBomba(); corpo.innerHTML = "";
    $("bmbFonte").textContent = DADOS.fontes.combCena; mostrador(CB.gasolina, 0, false);
    if (temG) gsap.fromTo(cena, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" });
    passo1();
  };
  function passo1() {
    topo();
    const c = CB.gasolina, total = c.preco * LITROS;
    fala.innerHTML = `O Pedro vai atestar: <b>${LITROS} litros</b> de gasolina 95, ao preço médio de hoje, <b>${EURO(c.preco, 3)}</b> por litro.`;
    corpo.innerHTML = `<p class="pergunta-fin">Vai pagar <b>${EURO(total, 2)}</b>. Quanto desse dinheiro é imposto?</p>
      <div class="palpite-linha"><output id="bmbPalOut"></output><input type="range" id="bmbPal" min="0" max="${Math.round(total)}" step="1" value="${Math.round(total * .25)}" aria-label="O teu palpite em euros"></div>`;
    const pal = $("bmbPal"); pal.oninput = () => $("bmbPalOut").textContent = EURO(+pal.value); pal.oninput();
    botoesB([["Atestar e ver a resposta", () => passo2(+pal.value)]]);
    mostrador(c, 0, false);
  }
  function passo2(palpite) {
    topo();
    const c = CB.gasolina, d = decompor(c), imp = d.impostos * LITROS, dif = Math.abs(palpite - imp);
    const juizo = dif <= 3 ? "Acertaste em cheio!" : dif <= 10 ? "Quase!" : palpite < imp ? "Muito mais do que pensavas!" : "Um pouco menos!";
    mostrador(c, LITROS, true);
    fala.innerHTML = `<b>${juizo}</b> Dos ${EURO(c.preco * LITROS, 2)}, <span class="r">${EURO(imp, 2)}</span> são impostos: <span class="r">${Math.round(d.peso * 100)}${SEP}%</span> do que pagou.`;
    corpo.innerHTML = `<p>Olha para dentro de <b>um litro</b>. Por baixo, o que paga o combustível e quem o traz até à bomba. Por cima, três impostos: o <span class="r">ISP</span>, a <span class="r">taxa de carbono</span> e o <span class="r">IVA</span>.</p>
      <div class="opcoes" role="group" aria-label="Escolher o combustível"><button class="btn claro ligado" type="button" data-c="gasolina" aria-pressed="true">Gasolina 95</button><button class="btn claro" type="button" data-c="gasoleo" aria-pressed="false">Gasóleo</button></div>
      <div id="bmbLista"></div>`;
    const mostra = (k, anima) => {
      const cc = CB[k], dd = decompor(cc);
      corpo.querySelectorAll(".opcoes .btn").forEach((b) => { const on = b.dataset.c === k; b.classList.toggle("ligado", on); b.setAttribute("aria-pressed", on); });
      encherJarra(dd, anima); if (k !== "gasolina" || anima === "troca") mostrador(cc, LITROS, false);
      if (anima === "troca") fala.innerHTML = `Com ${cc.nome.toLowerCase()}: dos ${EURO(cc.preco * LITROS, 2)}, <span class="r">${EURO(dd.impostos * LITROS, 2)}</span> são impostos: <span class="r">${Math.round(dd.peso * 100)}${SEP}%</span> do que se paga.`;
      $("bmbLista").innerHTML = `<div class="calc">${CAM.slice().reverse().map(([kk, nome]) => `<div class="linha"><span>${nome}</span><b${kk === "produto" ? "" : ' class="r"'}>${EURO(dd[kk], 3)}</b></div>`).join("")}
        <div class="linha"><span><b>Impostos em cada litro</b></span><b class="r">${EURO(dd.impostos, 3)} · ${Math.round(dd.peso * 100)}${SEP}%</b></div>
        <div class="linha"><span>Num depósito de ${LITROS} litros</span><b class="r">${EURO(dd.impostos * LITROS, 2)} de ${EURO(cc.preco * LITROS, 2)}</b></div></div>
        <p>Repara no tracejado dentro do IVA: são <span class="r">${EURO(dd.ivaSobreImp, 3)}</span> por litro de <b>IVA sobre os outros impostos</b>. O IVA calcula-se sobre o preço que já leva o ISP e a taxa de carbono: paga-se imposto sobre imposto.</p>
        <p class="nota-fin">O ISP muda por portaria, às vezes todas as semanas. Valores em vigor desde ${CB.ispVigencia.split("-").reverse().join("/")}: ${cc.notaIsp}. Preço: média nacional da DGEG de ${cc.data.split("-").reverse().join("/")}.</p>`;
    };
    corpo.querySelectorAll(".opcoes .btn").forEach((b) => b.onclick = () => mostra(b.dataset.c, "troca"));
    setTimeout(() => mostra("gasolina", true), temG ? 900 : 0);
    botoesB([["Aprender a ler o gráfico →", passo3]]);
  }
  function passo3() {
    topo();
    fala.innerHTML = `E o preço de cada dia? Aqui está desde 2017. Um ponto por semana, a <b>média do país</b>.`;
    corpo.innerHTML = `${graficoComb()}
      <p>A linha vermelha é a gasolina 95; a preta, o gasóleo. O ISP e a taxa de carbono são valores fixos por litro; só o IVA acompanha o preço. Por isso, quando o preço sobe, a parte do imposto <b>pesa menos</b> em percentagem; quando desce, pesa mais.</p>
      <p class="nota-fin">Este gráfico mostra o preço, não a parte de imposto de cada dia: o repositório só tem o ISP em vigor hoje.</p>`;
    botoesB([["Voltar ao bairro", fechar, true], ["Ver outra vez", () => { $("bmbArte").innerHTML = interiorBomba(); mostrador(CB.gasolina, 0, false); passo1(); }, true]]);
  }
  function fechar() { cena.hidden = true; mapa.querySelectorAll(".ed.ativo").forEach((g) => g.classList.remove("ativo")); }
  $("bmbFechar").onclick = fechar;
  cena.onkeydown = (e) => { if (e.key === "Escape") fechar(); };
  setTimeout(abrir, temG ? 700 : 0);
}
