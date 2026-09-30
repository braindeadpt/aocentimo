/* ——— As cinco cenas que faltavam: Segurança Social, Casa da Inês, Pastelaria, Quiosque, Escola ———
   Todas usam cenaBase() e graficoLinhas(). Números só do repositório (DADOS.mais, DADOS.merc, DADOS.sal). */
const MX = DADOS.mais;
const trimestre = (t) => `${t.slice(-1)}.º trimestre de ${t.slice(0, 4)}`;
const setaVar = (v, casas = 1, un = "%") => `${v > 0 ? "▲ +" : v < 0 ? "▼ −" : ""}${eur(Math.abs(v), casas)}${SEP}${un}`;
const painelSenha = (id, x, y, txt) => `<g><rect x="${x}" y="${y}" width="120" height="50" rx="7" fill="#26282b" stroke="${K}" stroke-width="2.6"/><text x="${x + 60}" y="${y + 16}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="9" letter-spacing=".14em" fill="#c9c4b8">SENHA</text><text id="${id}" x="${x + 60}" y="${y + 41}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="22" fill="#ff5a3c">${txt}</text></g>`;
const moedaSvg = (x, y, r = 11) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#f0a468" stroke="${K}" stroke-width="2.2"/><text y="${(r * .36).toFixed(1)}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="${(r * .95).toFixed(1)}" fill="${K}">€</text></g>`;

/* ═══ SEGURANÇA SOCIAL · senha A · os descontos ═══ */
function cenaSegSocial() {
  const c = cenaBase("ss", "Segurança Social · senha A · os descontos", "Dentro da Segurança Social: o guiché A, a funcionária, a Inês com o recibo e um grande mealheiro comum onde caem as moedas dos descontos dela e da empresa.");
  const S = DADOS.sal, M = MX.ss, total = S.ss + S.tsu;
  const desenho = () => {
    let s = `<defs><pattern id="ssAz" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#f7f9ff"/><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" fill="none" stroke="#2445d6" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#2445d6"/></pattern></defs>`;
    s += paredeChao("#eef1f6", "#d6ccb7", "SEGURANÇA SOCIAL", "#2445d6") + `<rect x="0" y="300" width="640" height="110" fill="url(#ssAz)"/><rect x="0" y="296" width="640" height="8" fill="#d8cbb4" stroke="${K}" stroke-width="2"/>`;
    s += painelSenha("ssPainel", 500, 70, "A 106");
    s += `<g id="ssFunc" transform="translate(190 330) scale(1.02)">${pessoa({ pele: "a", cabelo: "bob", corCabelo: "#8a5a2b", roupa: "#2445d6", calcas: "#2b3a55", gola: "#fff", oculos: "quadrados" })}</g>`;
    s += `<rect x="80" y="290" width="230" height="120" fill="#e7d3b0" stroke="${K}" stroke-width="3"/><rect x="72" y="280" width="246" height="14" rx="3" fill="#2445d6" stroke="${K}" stroke-width="2.6"/><rect x="170" y="310" width="50" height="30" rx="4" fill="#fff" stroke="${K}" stroke-width="2.2"/><text x="195" y="332" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="18" fill="${K}">A</text>`;
    // o mealheiro comum
    s += `<g id="ssMeal"><path d="M380 404 V200 q0 -18 18 -22 h124 q18 4 18 22 V404 q0 10 -10 10 H390 q-10 0 -10 -10z" fill="#eef7fb" stroke="${K}" stroke-width="3"/><rect x="430" y="168" width="60" height="14" rx="4" fill="#26282b"/>
      <rect id="ssNivel" x="383" y="404" width="154" height="0" fill="#f0a468" opacity=".85"/><text x="460" y="440" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="13" fill="${K}">o bolo comum</text><text id="ssMealTxt" x="460" y="230" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="20" fill="${K}"></text></g>`;
    s += `<g id="ssInes" transform="translate(340 440) scale(.92)">${pessoa(ELENCO.ines)}<rect x="16" y="-66" width="18" height="24" fill="#fff" stroke="${K}" stroke-width="1.8"/></g>`;
    s += `<g id="ssMoedas"></g>`;
    return s;
  };
  const chuva = (quantas, cor, x0) => { if (!temG) return; const g = c.arte.querySelector("#ssMoedas"); for (let k = 0; k < quantas; k++) { const m = document.createElementNS(NS, "g"); m.innerHTML = moedaSvg(0, 0, 10); m.firstChild.querySelector("circle").setAttribute("fill", cor); g.appendChild(m); gsap.fromTo(m, { x: x0, y: 180, opacity: 1 }, { x: 400 + Math.random() * 120, y: 380 - Math.random() * 30, duration: .9, delay: k * .12, ease: "power2.in", onComplete: () => gsap.to(m, { opacity: 0, duration: .3, delay: .3 }) }); } };
  const nivel = (v, anima) => { const h = 200 * v / 900, el = c.arte.querySelector("#ssNivel"); c.arte.querySelector("#ssMealTxt").textContent = v ? EURO(v, 2) : ""; if (anima && temG) gsap.to(el, { attr: { y: 404 - h, height: h }, duration: 1.2, delay: .6 }); else { el.setAttribute("y", 404 - h); el.setAttribute("height", h); } };
  c.abrir(desenho()); c.fonte(DADOS.fontes.ssCena); const [x, y] = pontoEcra("segsocial"); ir(x, y - 60, 480, true, .9);
  const passo1 = () => { c.topo(); c.fala(`Bom dia! Os <b>descontos</b> são no balcão A. A Inês trouxe o recibo de vencimento.`); c.corpo(""); c.botoes([["Chamar a senha A 107", () => c.senha("ssPainel", "A 107", "#ssFunc .braco-d", passo2)]]); };
  const passo2 = () => { c.topo(); c.fala(`A Inês ganha <b>${EURO(S.bruto)}</b> brutos por mês. Um palpite:`); c.corpo(`<p class="pergunta-fin">Somando o que ela desconta e o que a empresa paga por ela, quanto entra na Segurança Social <b>por mês</b>?</p>`);
    const pal = c.palpite("ssPal", 0, 900, 5, 200, (v) => EURO(v), "O teu palpite em euros por mês"); c.botoes([["Mostrar a resposta", () => passo3(+pal.value)]]); };
  const passo3 = (palpite) => {
    c.topo(); chuva(6, "#f0a468", 340); setTimeout(() => chuva(10, "#ffc62b", 120), temG ? 700 : 0); nivel(total, true);
    c.fala(`<b>${juizoPalpite(palpite, total, 15, 60)}</b> Entram <span class="a">${EURO(total, 2)}</span> por mês: ${EURO(total * 14, 2)} por ano.`);
    c.corpo(`<div class="recibo"><b class="t-cab">RECIBO DA INÊS · 1 mês</b>
        <span class="t-l"><span>Salário bruto</span><span>${eur(S.bruto, 2)}</span></span>
        <span class="t-l"><span>Segurança Social (${pctT(M.trab)})</span><span>−${eur(S.ss, 2)}</span></span>
        <span class="t-sep"></span><span class="t-sub">e o que não aparece no recibo</span>
        <span class="t-l"><span>A empresa paga por cima (${pctT(M.emp)})</span><span>+${eur(S.tsu, 2)}</span></span>
        <span class="t-sep"></span><span class="t-l t-tot"><b>Para a Segurança Social</b><b>${eur(total, 2)} €</b></span></div>
      <p>A Inês vê no recibo os <b>${EURO(S.ss, 2)}</b> que lhe descontam. Mas a empresa paga mais <span class="a">${EURO(S.tsu, 2)}</span> por ela, a chamada TSU, que nunca aparece no recibo. Por isso a Inês custa à empresa <b>${EURO(S.custo, 2)}</b> por mês, e não ${EURO(S.bruto)}.</p>
      <p>Este dinheiro vai para um bolo comum que paga, por exemplo, as pensões de quem já não trabalha e os subsídios de desemprego, de doença e parentais.</p>`);
    c.botoes([["E o Pedro, a recibos verdes? →", passo4]]);
  };
  const passo4 = () => {
    c.topo();
    const fat = S.bruto, rel = Math.max(fat * M.catb.rr, M.catb.baseMinIas * M.ias), ssP = rel * M.catb.taxa;
    const por100I = [M.trab * 100, M.emp * 100], por100P = ssP / fat * 100;
    c.fala(`O Pedro trabalha a <b>recibos verdes</b>. Não tem empresa: paga tudo sozinho.`);
    c.corpo(`<p>Se o Pedro faturar os mesmos <b>${EURO(fat)}</b> por mês, desconta ${pctT(M.catb.taxa)} sobre ${Math.round(M.catb.rr * 100)}${SEP}% do que fatura: <span class="a">${EURO(ssP, 2)}</span> por mês, pagos por ele, de 3 em 3 meses. No primeiro ano de atividade está isento.</p>
      <div class="barras-quem" role="img" aria-label="Por cada 100 euros: a Inês desconta ${eur(por100I[0], 2)} e a empresa paga ${eur(por100I[1], 2)}; o Pedro paga ${eur(por100P, 2)} sozinho.">
        <span class="bq-n">Inês</span><span class="bq-b"><i class="eu" style="width:${por100I[0] * 2}%">ela ${eur(por100I[0], 2)}</i><i class="emp" style="width:${por100I[1] * 2}%">empresa ${eur(por100I[1], 2)}</i></span>
        <span class="bq-n">Pedro</span><span class="bq-b"><i class="eu" style="width:${por100P * 2}%">ele ${eur(por100P, 2)}</i></span>
        <span></span><span class="bq-leg">em cada 100 € de salário ou de faturação</span></div>
      <p>Por cada 100 €, entram mais na Segurança Social pela Inês (${eur(por100I[0] + por100I[1], 2)} €) do que pelo Pedro (${eur(por100P, 2)} €). Mas a Inês só sente os ${eur(por100I[0], 2)} € que lhe descontam; o Pedro sente tudo, porque paga do próprio bolso.</p>
      <p class="nota-fin">Recibos verdes: rendimento relevante de ${Math.round(M.catb.rr * 100)}${SEP}% do faturado em serviços, com base mínima de ${eur(M.catb.baseMinIas, 1)} × IAS (${EURO(M.catb.baseMinIas * M.ias, 2)}). Isenção nos primeiros ${M.catb.isencao} meses.</p>`);
    c.botoes([["Voltar ao bairro", c.fechar, true], ["Ver outra vez", () => { c.abrir(desenho()); passo1(); }, true]]);
  };
  setTimeout(passo1, temG ? 700 : 0);
}

/* ═══ CASA DA INÊS · o preço das casas ═══ */
function cenaCasa() {
  const c = cenaBase("casa", "Casa da Inês · o preço das casas", "A sala da Inês com a janela para a Ribeira: na mesa, uma casa em miniatura e, ao lado, uma pilha de recibos de vencimento que cresce.");
  const C0 = MX.casa, raz = C0.razao, ult = raz.at(-1), hpiU = C0.hpi.find((p) => p.t === ult.t) || C0.hpi.at(-1);
  const lci = C0.hpi.map((p) => { const r = raz.find((q) => q.t === p.t); return r ? { t: p.t, v: p.v / r.v * 100 } : null; }).filter(Boolean);
  const lciU = lci.at(-1), meses = Math.round(ult.v);
  const desenho = () => {
    let s = paredeChao("#fdf1dc", "#b98552", "CASA DA INÊS", "#0c8f5c");
    s += `<g><rect x="360" y="70" width="240" height="170" fill="#9fd6f3" stroke="${K}" stroke-width="4"/><path d="M360 200 q60 -30 120 -10 t120 -12 V240 H360z" fill="#4f9bc4"/><path d="M372 190 l18 -24 h30 l14 24 M470 180 l22 -30 h40 l18 30" fill="#e2412a" stroke="${K}" stroke-width="2"/><rect x="376" y="150" width="30" height="40" fill="#e9a13b" stroke="${K}" stroke-width="1.6"/><rect x="480" y="146" width="44" height="40" fill="#7fb3d9" stroke="${K}" stroke-width="1.6"/><path d="M480 70 V240 M360 155 H600" stroke="#fff" stroke-width="6"/><path d="M480 70 V240 M360 155 H600" stroke="${K}" stroke-width="1.6"/></g>`;
    s += `<rect x="40" y="300" width="560" height="16" rx="4" fill="#8a5a2b" stroke="${K}" stroke-width="2.6"/><path d="M70 316 v94 M570 316 v94" stroke="${K}" stroke-width="8"/>`;
    // a casa em miniatura e a pilha de recibos
    s += `<g id="casaMini" transform="translate(180 300)"><path d="M-60 0 V-60 L0 -100 L60 -60 V0z" fill="#fff6e3" stroke="${K}" stroke-width="3"/><path d="M-68 -56 L0 -106 L68 -56" fill="none" stroke="#c9573a" stroke-width="8" stroke-linecap="round"/><rect x="-14" y="-36" width="28" height="36" fill="#2445d6" stroke="${K}" stroke-width="2.2"/><rect x="-46" y="-50" width="20" height="18" fill="var(--vidro)" stroke="${K}" stroke-width="2"/><rect x="26" y="-50" width="20" height="18" fill="var(--vidro)" stroke="${K}" stroke-width="2"/></g>`;
    s += `<g id="casaPilha" transform="translate(330 300)"><rect class="pilha" x="-36" y="0" width="72" height="0" fill="#fff" stroke="${K}" stroke-width="2.4"/><g class="riscas"></g><text class="pilha-txt" x="0" y="-8" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="16" fill="${K}"></text><text x="0" y="36" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="12" fill="${K}">meses de trabalho</text></g>`;
    s += `<g id="casaInes" transform="translate(520 440) scale(-.95 .95)">${pessoa(ELENCO.ines)}</g>`;
    return s;
  };
  const pilha = (n, anima) => { const g = c.arte.querySelector("#casaPilha"), r = g.querySelector(".pilha"), t = g.querySelector(".pilha-txt"), h = n * .9;
    const aplica = (hh, nn) => { r.setAttribute("y", -hh); r.setAttribute("height", hh); t.setAttribute("y", -hh - 8); t.textContent = Math.round(nn); g.querySelector(".riscas").innerHTML = Array.from({ length: Math.floor(hh / 6) }, (_, k) => `<path d="M-34 ${-(k + 1) * 6} h68" stroke="#d8cbb4" stroke-width="1"/>`).join(""); };
    if (anima && temG) { const o = { h: +r.getAttribute("height"), n: +t.textContent || 0 }; gsap.to(o, { h, n, duration: 1.4, ease: "power2.out", onUpdate: () => aplica(o.h, o.n) }); } else aplica(h, n); };
  c.abrir(desenho()); c.fonte(DADOS.fontes.casaCena); pilha(100, false); const [x, y] = pontoEcra("casa"); ir(x, y - 60, 480, true, .9);
  const passo1 = () => { c.topo(); c.fala(`Imagina que, em <b>2015</b>, uma casa custava o mesmo que <b>100 meses</b> de trabalho.`); c.corpo(`<p class="pergunta-fin">Hoje, a mesma casa custa o mesmo que quantos meses de trabalho?</p>`);
    const pal = c.palpite("casaPal", 60, 300, 1, 130, (v) => v + " meses", "O teu palpite em meses"); c.botoes([["Mostrar a resposta", () => passo2(+pal.value)]]); };
  const passo2 = (palpite) => { c.topo(); pilha(meses, true);
    c.fala(`<b>${juizoPalpite(palpite, meses, 5, 20)}</b> Hoje custa <span class="r">${meses} meses</span>: quase o dobro.`);
    c.corpo(`<p>Desde 2015, os preços das casas subiram <span class="r">${setaVar(hpiU.v - 100, 0)}</span>. O custo do trabalho, o que as empresas pagam por cada hora trabalhada, subiu <b>${setaVar(lciU.v - 100, 0)}</b>. As casas correram muito mais depressa do que o custo do trabalho.</p>
      <p class="nota-fin">«Meses de trabalho» é uma forma de ler a razão entre dois índices oficiais (preços da habitação ÷ custo do trabalho, 2015 = 100). Não é o salário líquido de ninguém. Último dado: ${trimestre(ult.t)}.</p>`);
    c.botoes([["Aprender a ler o gráfico →", passo3]]); };
  const passo3 = () => { c.topo();
    c.fala(`Duas linhas que partem do <b>mesmo 100</b>. A distância entre elas é o que mudou.`);
    c.corpo(`${graficoLinhas({ series: [{ pts: C0.hpi, cor: "#e2412a", larg: 3.2, rotulo: "preço das casas" }, { pts: lci, cor: "#16130f", larg: 2.6, traco: "6 4", rotulo: "custo do trabalho" }], faixa: [0, 1], faixaCor: "#ffc2b3",
        y: { min: 50, max: Math.ceil(hpiU.v / 50) * 50, passo: 50, fmt: (v) => v, realce: 100 }, anoPasso: 2,
        marcas: [{ s: 0, k: -1, texto: Math.round(hpiU.v), cor: "#e2412a", dx: -8, dy: -12, ancora: "end", corTexto: "#c7361f" }, { s: 1, k: -1, texto: Math.round(lciU.v), cor: "#fff", dx: -8, dy: 22, ancora: "end" }],
        aria: `Desde 2015, o índice de preços das casas passou de 100 para ${Math.round(hpiU.v)}; o custo do trabalho, de 100 para ${Math.round(lciU.v)}.` })}
      <p>Em 2015 as duas linhas estavam juntas, em 100. Hoje o preço das casas vale <span class="r">${Math.round(hpiU.v)}</span> e o custo do trabalho <b>${Math.round(lciU.v)}</b>. A mancha entre as duas é a parte da subida das casas que o custo do trabalho não acompanhou.</p>`);
    c.botoes([["Voltar ao bairro", c.fechar, true], ["Ver outra vez", () => { c.abrir(desenho()); pilha(100, false); passo1(); }, true]]); };
  setTimeout(passo1, temG ? 700 : 0);
}

/* ═══ PASTELARIA · comer fora ═══ */
function cenaPastelaria() {
  const c = cenaBase("past", "Pastelaria · o café e o pastel", "A pastelaria por dentro: a vitrine com pastéis de nata e bolas de Berlim, a máquina de café, a empregada ao balcão e o quadro com o preço de antes e de hoje.");
  const P = MX.past, r11 = razaoIdx(P.cp11), r01 = R_COMIDA, base = 2;
  const desenho = () => {
    let s = paredeChao("url(#pastAz)", "#e4dccb", "PASTELARIA", "#e2412a");
    s = `<defs><pattern id="pastAz" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff0f4"/><circle cx="8" cy="8" r="3.2" fill="none" stroke="#e2412a" stroke-width="1.2"/></pattern></defs>` + s;
    // o quadro de ardósia com os preços
    s += `<g><rect x="60" y="70" width="200" height="120" rx="6" fill="#26332c" stroke="#8a5a2b" stroke-width="8"/><text x="160" y="100" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="22" fill="#fff">café + pastel</text>
      <text x="160" y="134" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="20" fill="#cfe6d6">${mesCurto(MERC.T0)}: ${EURO(base, 2)}</text><text id="pastHoje" x="160" y="170" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="26" fill="#ffd34d">hoje: ?</text></g>`;
    // a máquina de café
    s += `<g><rect x="430" y="150" width="130" height="110" rx="8" fill="#b9c1c9" stroke="${K}" stroke-width="3"/><rect x="444" y="164" width="102" height="30" rx="4" fill="#26282b"/><path d="M460 200 v20 M530 200 v20" stroke="${K}" stroke-width="5"/><rect x="452" y="226" width="20" height="18" rx="3" fill="#fff" stroke="${K}" stroke-width="2"/><rect x="520" y="226" width="20" height="18" rx="3" fill="#fff" stroke="${K}" stroke-width="2"/><path class="vapor" d="M462 220 q-6 -10 0 -18 q6 -8 0 -16" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"/></g>`;
    // a empregada atrás do balcão
    s += `<g id="pastEmp" transform="translate(330 330) scale(1.02)">${pessoa({ pele: "d", cabelo: "rabo", corCabelo: "#1d1410", roupa: "#fff", calcas: "#2b3a55", avental: "#e2412a" })}</g>`;
    // a vitrine com pastéis de nata e bolas de Berlim
    s += `<rect x="60" y="290" width="520" height="120" fill="#f3e6cf" stroke="${K}" stroke-width="3"/><rect x="80" y="244" width="480" height="60" rx="6" fill="#dff2fb" fill-opacity=".6" stroke="${K}" stroke-width="2.6"/>`;
    for (let k = 0; k < 6; k++) s += `<g transform="translate(${110 + k * 44} 290)"><ellipse cx="0" cy="-10" rx="16" ry="9" fill="#e9b24c" stroke="${K}" stroke-width="2"/><ellipse cx="0" cy="-12" rx="11" ry="5" fill="#f7d774" stroke="${K}" stroke-width="1.4"/><circle cx="-3" cy="-13" r="1.8" fill="#8a4a2b"/><circle cx="4" cy="-11" r="1.5" fill="#8a4a2b"/></g>`;
    for (let k = 0; k < 4; k++) s += `<g transform="translate(${390 + k * 40} 290)"><ellipse cx="0" cy="-12" rx="16" ry="12" fill="#e9b24c" stroke="${K}" stroke-width="2"/><path d="M-14 -12 h28" stroke="#fff6e3" stroke-width="4"/></g>`;
    s += `<g><rect x="590" y="366" width="36" height="24" rx="3" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M626 372 q10 0 8 10 q-2 6 -8 6" fill="none" stroke="${K}" stroke-width="2"/><ellipse cx="608" cy="392" rx="24" ry="5" fill="#fff" stroke="${K}" stroke-width="2"/></g>`;
    return s;
  };
  c.abrir(desenho()); c.fonte(DADOS.fontes.pastCena); if (temG) gsap.to(c.arte.querySelector(".vapor"), { y: -6, opacity: .2, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
  const [x, y] = pontoEcra("pastelaria"); ir(x, y - 60, 480, true, .9);
  const passo1 = () => { c.topo(); c.fala(`Um café e um pastel de nata! Em ${mesLongo(MERC.T0)}, digamos que custavam <b>${EURO(base, 2)}</b>.`); c.corpo(`<p class="pergunta-fin">Quanto custam hoje o mesmo café e o mesmo pastel?</p><p class="nota-fin">Os ${EURO(base, 2)} são um exemplo. O que é real é quanto subiram os preços.</p>`);
    const pal = c.palpite("pastPal", 2, 4, .05, 2.4, (v) => EURO(v, 2), "O teu palpite em euros"); c.botoes([["Mostrar a resposta", () => passo2(+pal.value)]]); };
  const passo2 = (palpite) => { c.topo(); const hoje = base * r11, el = c.arte.querySelector("#pastHoje"), o = { v: base };
    if (temG) gsap.to(o, { v: hoje, duration: 1.2, ease: "power2.out", onUpdate: () => el.textContent = "hoje: " + EURO(o.v, 2) }); else el.textContent = "hoje: " + EURO(hoje, 2);
    c.fala(`<b>${juizoPalpite(palpite, hoje, .05, .2)}</b> Hoje custam <span class="r">${EURO(hoje, 2)}</span>: ${pctVar(r11)}.`);
    const fora = rebase(P.cp11, MERC.T0), casa = rebase(MERC.comida, MERC.T0);
    c.corpo(`<p>Comer fora subiu mais do que comer em casa. Desde ${mesLongo(MERC.T0)}, os restaurantes e cafés subiram <span class="r">${pctVar(r11)}</span>; a comida da mercearia, <b>${pctVar(r01)}</b>.</p>
      ${graficoLinhas({ series: [{ pts: fora, cor: "#e2412a", larg: 3.2, rotulo: "comer fora" }, { pts: casa, cor: "#16130f", larg: 2.6, traco: "6 4", rotulo: "comer em casa" }], y: { min: 90, max: Math.ceil(Math.max(...fora.map((p) => p.v)) / 10) * 10, passo: 10, fmt: (v) => v, realce: 100 },
        marcas: [{ s: 0, k: -1, texto: Math.round(fora.at(-1).v), cor: "#e2412a", dx: -8, dy: -12, ancora: "end", corTexto: "#c7361f" }, { s: 1, k: -1, texto: Math.round(casa.at(-1).v), cor: "#fff", dx: -8, dy: 22, ancora: "end" }],
        aria: `Com 100 em ${mesLongo(MERC.T0)}, comer fora vale hoje ${Math.round(fora.at(-1).v)} e comer em casa ${Math.round(casa.at(-1).v)}.` })}
      <p class="nota-fin">«Comer fora» é o índice europeu de restaurantes e alojamento, onde entram os cafés e também os hotéis.</p>`);
    c.botoes([["E o IVA do café? →", passo3]]); };
  const passo3 = () => { c.topo(); const hoje = base * r11, iva = hoje * P.ivaRest / (1 + P.ivaRest), ivaPao = hoje * TX.Reduzida / (1 + TX.Reduzida);
    c.fala(`No café, o IVA é de <span class="r">${pctT(P.ivaRest)}</span>: mais do dobro do pão da mercearia.`);
    c.corpo(`<p>Dos <b>${EURO(hoje, 2)}</b> do café e do pastel, <span class="r">${EURO(iva, 2)}</span> são IVA. A restauração paga a taxa intermédia, ${pctT(P.ivaRest)}. Se fosse a taxa do pão, ${pctT(TX.Reduzida)}, seriam ${EURO(ivaPao, 2)}.</p>
      <p class="nota-fin">Taxas do continente, do Código do IVA.</p>`);
    c.botoes([["Voltar ao bairro", c.fechar, true], ["Ver outra vez", () => { c.abrir(desenho()); passo1(); }, true]]); };
  setTimeout(passo1, temG ? 700 : 0);
}

/* ═══ QUIOSQUE · o país hoje ═══ */
function cenaQuiosque() {
  const c = cenaBase("quiosque", "Quiosque da praça · o país hoje", "O quiosque da praça com os jornais pendurados, o vendedor e a primeira página do Jornal do Bairro com os números do país.");
  const Q = MX.quiosque, u = Q.une.at(-1), j = Q.jov.at(-1), e = Q.ue.at(-1), smn0 = Q.smnSerie[0];
  const desenho = () => {
    let s = paredeChao("#dff2e6", "#e4dccb", "QUIOSQUE DA PRAÇA", "#07613d");
    s += `<g><path d="M120 110 L320 70 L520 110 z" fill="#0c8f5c" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><rect x="140" y="110" width="360" height="300" fill="#07613d" stroke="${K}" stroke-width="3"/><rect x="170" y="140" width="300" height="160" fill="#f7f5f0" stroke="${K}" stroke-width="2.4"/>`;
    for (let k = 0; k < 5; k++) s += `<g transform="translate(${186 + k * 58} 152)"><rect width="46" height="60" fill="#fff" stroke="${K}" stroke-width="1.6"/><rect x="4" y="4" width="38" height="8" fill="${["#e2412a", "#2445d6", "#16130f", "#ffc62b", "#0c8f5c"][k]}"/><path d="M5 18 h36 M5 24 h36 M5 30 h24" stroke="${K}" stroke-width="1" opacity=".4"/></g>`;
    s += `<g id="quiVend" transform="translate(320 400) scale(1)">${pessoa({ pele: "c", cabelo: "curto", corCabelo: "#cfc9c1", roupa: "#ffc62b", calcas: "#2b3a55", bigode: true, oculos: true })}</g>`;
    s += `<rect x="150" y="320" width="340" height="90" fill="#0c8f5c" stroke="${K}" stroke-width="3"/><rect x="170" y="330" width="120" height="70" fill="#fff" stroke="${K}" stroke-width="2"/><text x="230" y="350" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9.5" fill="${K}">JORNAL DO BAIRRO</text><text id="quiManchete" x="230" y="376" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="15" fill="#e2412a"></text><text x="230" y="392" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="8.5" fill="${K}">dos jovens sem emprego</text></g>`;
    s += `<g transform="translate(560 440) scale(-.9 .9)">${pessoa(ELENCO.goncalo)}</g>`;
    return s;
  };
  c.abrir(desenho()); c.fonte(DADOS.fontes.quiosqueCena); const [x, y] = pontoEcra("quiosque"); ir(x, y - 60, 480, true, .9);
  const passo1 = () => { c.topo(); c.fala(`O Gonçalo passa pelo quiosque. A manchete de hoje é sobre os <b>jovens</b>.`); c.corpo(`<p class="pergunta-fin">Em cada <b>100 jovens</b> com menos de 25 anos que querem trabalhar, quantos não encontram emprego em Portugal?</p>`);
    const pal = c.palpite("quiPal", 0, 50, 1, 8, (v) => v + " em 100", "O teu palpite"); c.botoes([["Ler a manchete", () => passo2(+pal.value)]]); };
  const passo2 = (palpite) => { c.topo(); const n = Math.round(j.v); c.arte.querySelector("#quiManchete").textContent = `${eur(j.v, 1)}${SEP}%`;
    c.fala(`<b>${juizoPalpite(palpite, n, 1, 4)}</b> São cerca de <span class="r">${n} em cada 100</span> (${eur(j.v, 1)}${SEP}%, ${mesLongo(j.t)}).`);
    c.corpo(`<div class="jornal"><b class="j-cab">JORNAL DO BAIRRO · o país em números</b>
        <div class="j-n"><span class="j-v r">${eur(u.v, 1)}${SEP}%</span><span><b>Desemprego</b> · ${mesLongo(u.t)}. Em cada 100 pessoas que trabalham ou procuram trabalho, cerca de ${Math.round(u.v)} procuram sem encontrar. Na UE: ${eur(e.v, 1)}${SEP}%.</span></div>
        <div class="j-n"><span class="j-v r">${eur(j.v, 1)}${SEP}%</span><span><b>Desemprego jovem</b> (menos de 25 anos): ${eur(j.v / u.v, 1)} vezes o total.</span></div>
        <div class="j-n"><span class="j-v ${Q.pib.v >= 0 ? "g" : "r"}">${setaVar(Q.pib.v)}</span><span><b>Economia (PIB)</b> · ${trimestre(Q.pib.t)}: o país produziu ${eur(Math.abs(Q.pib.v), 1)}${SEP}% ${Q.pib.v >= 0 ? "mais" : "menos"} do que no mesmo trimestre do ano anterior.</span></div>
        <div class="j-n"><span class="j-v r">${setaVar(DADOS.inflacao)}</span><span><b>Inflação</b> · ${mesLongo(MERC.T1)}: os preços estão ${eur(DADOS.inflacao, 1)}${SEP}% mais altos do que há um ano.</span></div>
        <div class="j-n"><span class="j-v">${eur(Q.conf.v, 1)}</span><span><b>Confiança dos consumidores</b> · ${mesLongo(Q.conf.t)}: ${Q.conf.v < 0 ? "há mais pessimistas do que otimistas" : "há mais otimistas do que pessimistas"} (0 seria empate).</span></div>
        <div class="j-n"><span class="j-v">${EURO(Q.smn)}</span><span><b>Salário mínimo</b> em 2026, no continente. Em ${smn0.ano} era ${EURO(smn0.valor)}.</span></div></div>`);
    c.botoes([["Aprender a ler o gráfico →", passo3]]); };
  const passo3 = () => { c.topo();
    c.fala(`Três linhas: os <span class="r">jovens</span>, o <b>total</b> e a média da <span class="a">UE</span>.`);
    c.corpo(`${graficoLinhas({ series: [{ pts: Q.jov, cor: "#e2412a", larg: 3, rotulo: "jovens" }, { pts: Q.une, cor: "#16130f", larg: 2.8, rotulo: "Portugal" }, { pts: Q.ue, cor: "#2445d6", larg: 2.4, traco: "6 4", rotulo: "UE" }],
        y: { min: 0, max: Math.ceil(Math.max(...Q.jov.map((p) => p.v)) / 5) * 5, passo: 5, fmt: (v) => v + SEP + "%" },
        marcas: [{ s: 0, k: -1, texto: `${eur(j.v, 1)}${SEP}%`, cor: "#e2412a", dx: -8, dy: -12, ancora: "end", corTexto: "#c7361f" }, { s: 1, k: -1, texto: `${eur(u.v, 1)}${SEP}%`, cor: "#fff", dx: -8, dy: 20, ancora: "end" }],
        aria: `Taxa de desemprego desde 2019: jovens ${eur(j.v, 1)} %, Portugal ${eur(u.v, 1)} %, União Europeia ${eur(e.v, 1)} %, em ${mesLongo(u.t)}.` })}
      <p>A taxa de desemprego conta só quem <b>procura</b> trabalho, dividido por todos os que trabalham ou procuram. Quem estuda e não procura não entra na conta. Por isso «${Math.round(j.v)}${SEP}% dos jovens» não quer dizer «${Math.round(j.v)}${SEP}% de todos os jovens».</p>`);
    c.botoes([["Voltar ao bairro", c.fechar, true], ["Ver outra vez", () => { c.abrir(desenho()); passo1(); }, true]]); };
  setTimeout(passo1, temG ? 700 : 0);
}

/* ═══ ESCOLA · aprender a ler gráficos ═══ */
function cenaEscola() {
  const c = cenaBase("escola", "Escola · aprender a ler gráficos", "Uma sala de aula: a professora Diana ao quadro verde, com um gráfico desenhado a giz, e o Gonçalo na carteira.");
  const com = MERC.comida.slice(-13), tot = MERC.total;
  const desenho = () => {
    let s = paredeChao("#fff6d6", "#c9a36b", "ESCOLA", "#e6a93a", "#16130f");
    s += `<g><rect x="90" y="70" width="360" height="200" rx="6" fill="#264a3a" stroke="#8a5a2b" stroke-width="10"/><path d="M120 240 H420 M120 240 V100" stroke="#fff" stroke-width="2.4" opacity=".85"/><path id="escGiz" d="M130 220 L170 210 L210 214 L250 190 L290 180 L330 150 L370 140 L410 110" fill="none" stroke="#ffd34d" stroke-width="3.4" stroke-linecap="round"/><text x="420" y="98" text-anchor="end" font-family="Caveat" font-weight="700" font-size="20" fill="#fff">o que mostra o eixo?</text><rect x="100" y="270" width="340" height="8" fill="#8a5a2b"/></g>`;
    s += `<g id="escDiana" transform="translate(500 380) scale(1.05)">${pessoa(ELENCO.diana)}</g>`;
    s += `<g><rect x="150" y="360" width="140" height="10" fill="#b98552" stroke="${K}" stroke-width="2.4"/><path d="M160 370 v40 M280 370 v40" stroke="${K}" stroke-width="4"/></g><g transform="translate(220 400) scale(.9)">${pessoa(ELENCO.goncalo)}</g>`;
    return s;
  };
  // dois mini-gráficos com os mesmos números: eixo desde zero e eixo cortado
  const mini = (pts, desdeZero) => { const vs = pts.map((p) => p.v), lo = desdeZero ? 0 : Math.floor(Math.min(...vs)), hi = desdeZero ? Math.ceil(Math.max(...vs) / 20) * 20 : Math.ceil(Math.max(...vs));
    const x = (k) => 30 + 170 * k / (pts.length - 1), y = (v) => 110 - 95 * (v - lo) / (hi - lo);
    return `<svg viewBox="0 0 210 130" role="img" aria-label="Eixo de ${lo} a ${hi}" font-family="Archivo"><path d="M30 15 V110 H200" fill="none" stroke="#16130f" stroke-width="1.6"/><text x="26" y="${y(hi) + 4}" text-anchor="end" font-size="10" fill="#6e675e">${hi}</text><text x="26" y="${y(lo) + 4}" text-anchor="end" font-size="10" fill="#6e675e" font-weight="800">${lo}</text>
      <path d="${pts.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")}" fill="none" stroke="#e2412a" stroke-width="3"/><text x="115" y="126" text-anchor="middle" font-size="10" fill="#6e675e">${mesCurto(pts[0].t)} → ${mesCurto(pts.at(-1).t)}</text></svg>`; };
  c.abrir(desenho()); c.fonte(DADOS.fontes.escolaCena); const [x, y] = pontoEcra("escola"); ir(x, y - 60, 480, true, .9);
  const subida = (com.at(-1).v / com[0].v - 1) * 100;
  const passo1 = () => { c.topo(); c.fala(`Bom dia, turma! Hoje a professora <b>Diana</b> ensina a ler gráficos. Primeira pergunta:`);
    c.corpo(`<p class="pergunta-fin">Estes dois gráficos mostram o preço da comida no último ano. Em qual deles os preços subiram <b>mais</b>?</p><div class="minis"><figure><figcaption>Gráfico A</figcaption>${mini(com, true)}</figure><figure><figcaption>Gráfico B</figcaption>${mini(com, false)}</figure></div>`);
    c.botoes([["No A", () => passo2(false), true], ["No B", () => passo2(false), true], ["Subiram o mesmo", () => passo2(true), true]]); };
  const passo2 = (certo) => { c.topo();
    c.fala(`${certo ? "<b>Muito bem!</b>" : "<b>Apanhado!</b>"} São os <b>mesmos números</b>: os preços subiram ${eur(subida, 1)}${SEP}% nos dois.`);
    c.corpo(`<div class="minis"><figure><figcaption>A · o eixo começa no 0</figcaption>${mini(com, true)}</figure><figure><figcaption>B · o eixo começa em ${Math.floor(Math.min(...com.map((p) => p.v)))}</figcaption>${mini(com, false)}</figure></div>
      <p>No B, o eixo não começa no zero: corta o fundo e faz a mesma subida parecer uma montanha. Não é mentira, mas engana. <b>Primeira regra: olha sempre para onde começa o eixo.</b></p>`);
    c.botoes([["Segunda lição: num mês ou num ano? →", passo3]]); };
  const passo3 = () => { c.topo(); const a = tot.at(-1), b = tot.at(-2), h = tot.find((p) => p.t === (+a.t.slice(0, 4) - 1) + a.t.slice(4)); const mm = (a.v / b.v - 1) * 100, yy = (a.v / h.v - 1) * 100;
    c.fala(`Dois jornais, ${mesLongo(a.t)}. Um diz «os preços <b>${mm >= 0 ? "subiram" : "desceram"} ${eur(Math.abs(mm), 1)}${SEP}%</b>». O outro diz «<b>subiram ${eur(yy, 1)}${SEP}%</b>». Quem mente?`);
    c.corpo(`<p><b>Ninguém.</b> Comparam com meses diferentes:</p>
      <div class="calc"><div class="linha"><span>Comparado com o <b>mês anterior</b> (${mesCurto(b.t)}): variação em cadeia</span><b>${mm >= 0 ? "+" : "−"}${eur(Math.abs(mm), 1)}${SEP}%</b></div>
        <div class="linha"><span>Comparado com o <b>mesmo mês do ano passado</b> (${mesCurto(h.t)}): variação homóloga</span><b class="r">+${eur(yy, 1)}${SEP}%</b></div></div>
      <p><b>Segunda regra: pergunta sempre «comparado com quando?».</b> A inflação que ouves nas notícias é quase sempre a homóloga, a de um ano inteiro.</p>`);
    c.botoes([["Terceira lição: as palavras →", passo4]]); };
  const passo4 = () => { c.topo();
    const pal = [["Índice", "Uma régua de preços: 100 é o ponto de partida; 135 quer dizer 35 % mais caro.", "mercearia"], ["Homólogo", "Comparado com o mesmo mês (ou trimestre) do ano anterior.", "quiosque"], ["Nominal e real", "Nominal são os euros que vês; real é o que esses euros compram.", "correios"],
      ["Escalão", "Uma gaveta do IRS: a taxa só se aplica ao que está lá dentro.", "financas"], ["Spread", "A parte fixa da taxa de um empréstimo, que o banco cobra por cima da Euribor.", "banco"], ["TSU", "O que a empresa paga à Segurança Social por cima do teu salário, e que não vês no recibo.", "segsocial"]];
    c.fala(`<b>Terceira regra: sabe o que as palavras querem dizer.</b> Toca numa palavra para ires ao sítio do bairro onde ela vive.`);
    c.corpo(`<div class="glossario">${pal.map(([t, d, ed]) => `<button type="button" class="palavra" data-ed="${ed}"><b>${t}</b><span>${d}</span><em>ver em: ${INFO[ed].t} →</em></button>`).join("")}</div>`).querySelectorAll(".palavra").forEach((b) => b.onclick = () => { c.fechar(); entrar(b.dataset.ed); });
    c.botoes([["Voltar ao bairro", c.fechar, true], ["Ver outra vez", () => { c.abrir(desenho()); passo1(); }, true]]); };
  setTimeout(passo1, temG ? 700 : 0);
}
