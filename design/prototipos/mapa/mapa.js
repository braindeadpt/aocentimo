/* A planta do bairro. Ruas: Avenida (j 4–5, com o elétrico), Rua de baixo (j 9–10), Transversal (i 7–8).
   Os edifícios ficam do lado de cima de cada rua, com a fachada (parede esquerda) virada para quem olha. */
const RUAS = { av: [4, 5], baixo: [9, 10], trans: [7, 8] };
const MAPA = { i0: -1, i1: 15.6, j0: -.4, j1: 10.8 };

function edificioIso(id, rotulo, svg) {
  return `<g class="ed" data-id="${id}" tabindex="0" role="button" aria-label="${rotulo}">${svg}</g>`;
}
// ponto no chão, na fachada (parede esquerda) de uma caixa, a «u» px do canto
const naFachada = (i, j, dj, u) => P(i + u / LAD, j + dj);

function montarMapa(D) {
  const ed = {}, portas = {}, pinos = [];
  /* ——— chão ——— */
  let chaoSvg = `<polygon points="${pts(P(MAPA.i0, MAPA.j0), P(MAPA.i1, MAPA.j0), P(MAPA.i1, MAPA.j1), P(MAPA.i0, MAPA.j1))}" fill="#e7dfcf" stroke="${K}" stroke-width="3"/>`;
  // quarteirões (terra/pedra clara) e relva nos cantos
  chaoSvg += chao(MAPA.i0, MAPA.j0, MAPA.i1 - MAPA.i0, 3.6 - MAPA.j0, "#ece4d3") + chao(MAPA.i0, 5.4, MAPA.i1 - MAPA.i0, 3.2, "#ece4d3");
  chaoSvg += chao(13.9, 5.6, 1.6, 3, C.relva) + chao(MAPA.i0, MAPA.j0, 1.1, 3.8, C.relva);
  // passeios em calçada
  for (const [a, b] of [[3.6, 4], [5, 5.4], [8.6, 9], [10, 10.4]]) chaoSvg += chao(MAPA.i0, a, MAPA.i1 - MAPA.i0, b - a, "url(#calcadaIso)");
  chaoSvg += chao(6.6, MAPA.j0, .4, MAPA.j1 - MAPA.j0, "url(#calcadaIso)") + chao(8, MAPA.j0, .4, MAPA.j1 - MAPA.j0, "url(#calcadaIso)");
  // as três ruas (pedras) e os carris do elétrico na avenida
  chaoSvg += chao(MAPA.i0, 4, MAPA.i1 - MAPA.i0, 1, "url(#pedrasIso)") + chao(MAPA.i0, 9, MAPA.i1 - MAPA.i0, 1, "url(#pedrasIso)") + chao(7, MAPA.j0, 1, MAPA.j1 - MAPA.j0, "url(#pedrasIso)");
  for (const jj of [4.38, 4.62]) chaoSvg += `<line x1="${f1(P(MAPA.i0, jj)[0])}" y1="${f1(P(MAPA.i0, jj)[1])}" x2="${f1(P(MAPA.i1, jj)[0])}" y2="${f1(P(MAPA.i1, jj)[1])}" stroke="#6f6a61" stroke-width="3"/>`;
  // passadeiras
  for (const [pi, pj, wi, dj, dir] of [[7, 3.62, 1, .36, "i"], [7, 5.02, 1, .36, "i"], [6.62, 4, .36, 1, "j"], [8.02, 4, .36, 1, "j"], [7, 8.62, 1, .36, "i"], [6.62, 9, .36, 1, "j"], [8.02, 9, .36, 1, "j"]])
    for (let k = 0; k < 5; k++) chaoSvg += dir === "i" ? chao(pi + k * .2 + .03, pj, .12, dj, "#fff", 'stroke-width="1.2"') : chao(pi, pj + k * .2 + .03, wi, .12, "#fff", 'stroke-width="1.2"');
  // a praça (calçada em ondas) e o parque da escola
  chaoSvg += chao(5.3, 5.8, 1.3, 2.8, "url(#calcadaIso)");

  /* ——— fila de cima (Avenida) ——— */
  // Fábrica
  {
    const i = .1, j = .8, wi = 2.8, dj = 2.8, h = 128, wE = wi * LAD;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: "url(#tijolo)", topo: "#8a96a8",
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 4, { jw: 26, jh: 38, top: 16, base: 58 })}${placa2(24, -62, 92, "FÁBRICA", C.amarelo, K)}${porta2(126, 40, 56, "#6b7a8f")}<path d="M126 -56 h40" stroke="${K}" stroke-width="1.5"/><path d="M126 -44 h40 M126 -32 h40 M126 -20 h40" stroke="${K}" stroke-width="1" opacity=".5"/>`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 3, { jw: 20, jh: 26 }),
      extraTopo: ({ A, B, C: Cc, D: Dd }) => {
        let s = ""; // três telhados em serra
        for (let k = 0; k < 3; k++) {
          const t0 = k / 3, t1 = (k + 1) / 3, a = [A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0], b = [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1];
          const d = [Dd[0] + (Cc[0] - Dd[0]) * t0, Dd[1] + (Cc[1] - Dd[1]) * t0], c = [Dd[0] + (Cc[0] - Dd[0]) * t1, Dd[1] + (Cc[1] - Dd[1]) * t1];
          s += `<polygon points="${pts(a, [b[0], b[1] - 30], [c[0], c[1] - 30], d)}" fill="#6b7a8f" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${pts(b, [b[0], b[1] - 30], [c[0], c[1] - 30], c)}" class="vidro" stroke="${K}" stroke-width="2.4"/>`;
        }
        const ch = [Dd[0] + 40, Dd[1] + 26]; // chaminé
        s += `<rect x="${ch[0] - 11}" y="${ch[1] - 110}" width="22" height="110" fill="url(#tijolo)" stroke="${K}" stroke-width="2.6"/><ellipse cx="${ch[0]}" cy="${ch[1] - 110}" rx="13" ry="5" fill="${C.pedraEsc}" stroke="${K}" stroke-width="2.4"/>
          <g class="fumo">${[0, 1, 2, 3].map(() => `<circle class="baforada" cx="${ch[0]}" cy="${ch[1] - 120}" r="12" fill="#ece8df" opacity="0"/>`).join("")}</g>`;
        return s;
      },
    });
    ed.fabrica = edificioIso("fabrica", "Fábrica — para onde vai o teu salário?", svg);
    portas.fabrica = naFachada(i, j, dj, 146); pinos.push(["fabrica", P(i + wi / 2, j + dj / 2), 128 + 48, "Salário bruto", D.salario]);
  }
  // Segurança Social
  {
    const i = 3.2, j = 1.6, wi = 1.7, dj = 2, h = 142;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: "#e9eef7", topo: C.pedraEsc,
      esq: (w, hh) => `<path d="M-6 ${-hh} L${w / 2} ${-hh - 34} L${w + 6} ${-hh} Z" fill="${C.pedra}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${w / 2}" cy="${-hh - 13}" r="8" fill="${C.azulClaro}" stroke="${K}" stroke-width="2"/>
        ${grelhaJanelas(w, hh, 1, 3, { jw: 18, jh: 28, top: 12, base: 88, arco: true })}${placa2(10, -84, w - 20, "SEGURANÇA SOCIAL", C.azul, "#fff")}
        ${[0, 1, 2].map((k) => `<rect x="${12 + k * 36}" y="-58" width="10" height="58" fill="${C.pedra}" stroke="${K}" stroke-width="2"/>`).join("")}${porta2(w - 36, 26, 46, C.azul, true)}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 18, jh: 26 }),
    });
    ed.segsocial = edificioIso("segsocial", "Segurança Social — os descontos", svg);
    portas.segsocial = naFachada(i, j, dj, 1.7 * LAD - 23); pinos.push(["segsocial", P(i + wi / 2, j + dj / 2), h + 52, "TSU da empresa", D.tsu]);
  }
  // Finanças
  {
    const i = 5.05, j = 1.6, wi = 1.45, dj = 2, h = 150;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: C.pedra, topo: C.pedraEsc,
      esq: (w, hh) => `<rect x="${w / 2 - 20}" y="${-hh - 36}" width="40" height="36" fill="${C.pedra}" stroke="${K}" stroke-width="2.4"/><circle cx="${w / 2}" cy="${-hh - 18}" r="11" fill="#fff" stroke="${K}" stroke-width="2.2"/><path class="ponteiro" d="M${w / 2} ${-hh - 18} v-8" stroke="${K}" stroke-width="2"/><path class="ponteiro2" d="M${w / 2} ${-hh - 18} h6" stroke="${K}" stroke-width="2"/>
        ${grelhaJanelas(w, hh, 2, 3, { jw: 16, jh: 24, top: 12, base: 70, portadas: "#7c8a6a" })}${placa2(10, -66, w - 20, "FINANÇAS", K, "#fff")}${porta2(w / 2 - 15, 30, 42, "#5a3d27")}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 3, 2, { jw: 16, jh: 22 }),
    });
    ed.financas = edificioIso("financas", "Finanças — os escalões do IRS", svg);
    portas.financas = naFachada(i, j, dj, 1.45 * LAD / 2); pinos.push(["financas", P(i + wi / 2, j + dj / 2), h + 56, "IRS retido / mês", D.irs]);
  }
  // Banco
  {
    const i = 8.5, j = 1.6, wi = 1.8, dj = 2, h = 146;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: C.pedra, topo: C.pedraEsc,
      esq: (w, hh) => `<path d="M-8 ${-hh} L${w / 2} ${-hh - 36} L${w + 8} ${-hh} Z" fill="${C.pedraEsc}" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><text x="${w / 2}" y="${-hh - 9}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="16" fill="${K}">€</text>
        ${placa2(22, -hh + 12, w - 44, "BANCO", "#fff", K)}${[0, 1, 2, 3, 4].map((k) => `<rect x="${10 + k * 26}" y="${-hh + 44}" width="12" height="${hh - 44}" fill="#fff" stroke="${K}" stroke-width="2"/>`).join("")}${porta2(w / 2 - 17, 34, 52, "#2b3a66")}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 18, jh: 28 }),
    });
    ed.banco = edificioIso("banco", "Banco — crédito, juros e a Euribor", svg);
    portas.banco = naFachada(i, j, dj, 1.8 * LAD / 2); pinos.push(["banco", P(i + wi / 2, j + dj / 2), h + 54, "Euribor 12 meses", D.euribor]);
  }
  // Correios
  {
    const i = 10.6, j = 2, wi = 1.45, dj = 1.6, h = 104;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: C.creme, telhado: "duas", rh: 30,
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 2, { jw: 18, jh: 24, top: 10, base: 60, portadas: C.vermelho })}${placa2(12, -58, w - 24, "CORREIOS", C.vermelho, "#fff")}${porta2(w - 38, 28, 40, C.vermelho)}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 1, 2, { jw: 18, jh: 24 }),
    });
    const mc = P(i + .45, j + dj + .22); // marco do correio no passeio
    ed.correios = edificioIso("correios", "Correios — os certificados de aforro", svg + `<g class="marco"><rect x="${mc[0] - 7}" y="${mc[1] - 30}" width="14" height="30" rx="3" fill="${C.vermelho}" stroke="${K}" stroke-width="2.2"/><ellipse cx="${mc[0]}" cy="${mc[1] - 30}" rx="7" ry="3.5" fill="${C.vermelho}" stroke="${K}" stroke-width="2"/></g>`);
    portas.correios = naFachada(i, j, dj, 1.45 * LAD - 24); pinos.push(["correios", P(i + wi / 2, j + dj / 2), h + 50, "Cert. de Aforro", D.ca]);
  }
  // Bomba de gasolina: pala sobre pilares, duas bombas, loja
  {
    const i = 12.4, j = 1.4, wi = 2.4, dj = 2.1;
    let s = chao(i, j, wi, dj, "#d8d2c6");
    const alt = 84, cantos = [P(i + .3, j + .3), P(i + wi - .3, j + .3), P(i + wi - .3, j + dj - .3), P(i + .3, j + dj - .3)];
    s += cantos.slice(0, 2).map((p) => `<rect x="${p[0] - 4}" y="${p[1] - alt}" width="8" height="${alt}" fill="#dcd6cc" stroke="${K}" stroke-width="2"/>`).join("");
    s += caixa(i + .9, j + .7, .35, .35, 26, { fundo: C.vermelho, topo: "#fff" }) + caixa(i + 1.5, j + .7, .35, .35, 26, { fundo: C.vermelho, topo: "#fff" });
    s += cantos.slice(2).map((p) => `<rect x="${p[0] - 4}" y="${p[1] - alt}" width="8" height="${alt}" fill="#dcd6cc" stroke="${K}" stroke-width="2"/>`).join("");
    const up = (p) => [p[0], p[1] - alt];
    s += `<polygon points="${pts(...cantos.map(up))}" fill="${C.amarelo}" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<g transform="matrix(.8944 .4472 0 1 ${f1(up(cantos[3])[0])} ${f1(up(cantos[3])[1])})"><rect x="0" y="0" width="${(wi - .6) * LAD}" height="14" fill="${C.amarelo}" stroke="${K}" stroke-width="2.4"/><text x="${(wi - .6) * LAD / 2}" y="11.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="11" fill="${K}">COMBUSTÍVEIS</text></g>`;
    ed.bomba = edificioIso("bomba", "Bomba de gasolina — quanto do litro é imposto?", s);
    portas.bomba = P(i + 1.2, j + dj); pinos.push(["bomba", P(i + wi / 2 - .3, j + dj / 2), alt + 60, "Gasóleo · hoje", D.gasoleo + " €/L"]); pinos.push(["bomba2", P(i + wi / 2 + .7, j + dj / 2 - .4), alt + 60, "Gasolina 95", D.gasolina + " €/L"]);
  }

  /* ——— fila de baixo (Rua de baixo) ——— */
  // Mercearia do Manuel
  {
    const i = .2, j = 6.2, wi = 1.7, dj = 2.4, h = 112;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: "url(#azVerde)", telhado: "duas", rh: 30, corTelhado: "#c9573a",
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 2, { jw: 18, jh: 24, top: 10, base: 66, varanda: true, flores: true })}${placa2(6, -64, w - 12, "MERCEARIA DO MANUEL", C.creme, K)}<rect x="4" y="-46" width="${w - 8}" height="46" fill="#7a4a2a" stroke="${K}" stroke-width="2.2"/>${toldo2(4, -46, w - 8, C.verde)}<rect x="10" y="-24" width="46" height="22" class="vidro" stroke="${K}" stroke-width="2"/>${porta2(w - 36, 26, 34, "#5a3d27")}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 16, jh: 22 }),
    });
    const cx = P(i + .55, j + dj + .18);
    ed.mercearia = edificioIso("mercearia", "Mercearia — porque está tudo mais caro?", svg + `<g class="fruta">${caixa(i + .25, j + dj + .05, .3, .22, 10, { fundo: "#c99a5b", topo: "#c99a5b" })}${[0, 1, 2].map((k) => `<circle cx="${cx[0] - 12 + k * 9}" cy="${cx[1] - 14 + k * 3}" r="4.5" fill="${C.vermelho}" stroke="${K}" stroke-width="1.6"/>`).join("")}</g>`);
    portas.mercearia = naFachada(i, j, dj, 1.7 * LAD - 23); pinos.push(["mercearia", P(i + wi / 2, j + dj / 2), h + 48, "Cabaz desde 2020", D.cabaz]);
  }
  // Pastelaria
  {
    const i = 2.15, j = 6.4, wi = 1.45, dj = 2.2, h = 104;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: "url(#azRosa)", telhado: "duas", rh: 28,
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 2, { jw: 16, jh: 22, top: 10, base: 62, portadas: C.vermelho })}${placa2(10, -60, w - 20, "PASTELARIA", "#fff", C.vermelho)}${toldo2(4, -42, w - 8, C.vermelho)}<rect x="8" y="-22" width="42" height="20" class="vidro" stroke="${K}" stroke-width="2"/>${porta2(w - 32, 24, 32, "#fff")}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 16, jh: 20 }),
    });
    const cv = P(i + .5, j + dj + .2);
    ed.pastelaria = edificioIso("pastelaria", "Pastelaria — o café e o pastel", svg + `<g class="cavalete"><path d="M${cv[0] - 9} ${cv[1]} l3 -26 M${cv[0] + 9} ${cv[1]} l-3 -26" stroke="#7a4a2a" stroke-width="3"/><rect x="${cv[0] - 12}" y="${cv[1] - 30}" width="24" height="20" rx="2" fill="#26332c" stroke="${K}" stroke-width="2"/></g>`);
    portas.pastelaria = naFachada(i, j, dj, 1.45 * LAD - 20); pinos.push(["pastelaria", P(i + wi / 2, j + dj / 2), h + 46, "Cafés desde 2020", D.cafes]);
  }
  // Casa da Inês — prédio de azulejo azul, quatro andares, varandas, roupa estendida
  {
    const i = 3.8, j = 6.4, wi = 1.35, dj = 2.2, h = 176;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: "url(#azAzul)", telhado: "duas", rh: 30,
      esq: (w, hh) => `${grelhaJanelas(w, hh, 3, 2, { jw: 16, jh: 26, top: 12, base: 50, varanda: true, flores: true })}
        <g class="roupa"><path d="M22 -86 Q${w / 2} -80 ${w - 22} -86" fill="none" stroke="${K}" stroke-width="1.3"/><rect class="peca" x="32" y="-85" width="9" height="13" fill="${C.vermelho}" stroke="${K}" stroke-width="1.4"/><rect class="peca p2" x="46" y="-84" width="11" height="15" fill="${C.amarelo}" stroke="${K}" stroke-width="1.4"/><rect class="peca p3" x="61" y="-85" width="8" height="11" fill="#fff" stroke="${K}" stroke-width="1.4"/></g>
        ${porta2(w / 2 - 14, 28, 42, C.verde, true)}<text x="${w / 2}" y="-46" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9" fill="${K}">24</text>`,
      dir: (w, hh) => grelhaJanelas(w, hh, 4, 2, { jw: 14, jh: 22 }),
      extraTopo: ({ A, B }) => { const g = [A[0] + (B[0] - A[0]) * .6, A[1] + (B[1] - A[1]) * .6 - 18]; return `<g class="gato" transform="translate(${g[0]} ${g[1]})"><path d="M0 0 q-1 -13 7 -14 q8 1 7 14 z" fill="${K}"/><path d="M1.5 -12 l1.5 -5 l3 4 M12.5 -12 l-1.5 -5 l-3 4" fill="${K}"/><path class="cauda" d="M13 -1 q9 -2 8 -12" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/></g>`; },
    });
    ed.casa = edificioIso("casa", "Casa da Inês — o que chega ao fim do mês", svg);
    portas.casa = naFachada(i, j, dj, 1.35 * LAD / 2); pinos.push(["casa", P(i + wi / 2, j + dj / 2), h + 48, "Chega à conta", D.liquido]);
  }
  // Praça: jacarandá, quiosque, banco de jardim, bandeirinhas
  {
    const q = P(6.05, 7.5);
    let s = `<g class="quiosque-g">${caixa(5.75, 7.1, .55, .55, 44, { fundo: C.verdeEsc, topo: C.verde, esq: (w) => `<rect x="4" y="-36" width="${w - 8}" height="16" fill="#fff" stroke="${K}" stroke-width="1.6"/><text x="${w / 2}" y="-24.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="8" fill="${K}">JORNAIS</text>` })}
      <path d="M${q[0] - 30} ${q[1] - 50} Q${q[0]} ${q[1] - 84} ${q[0] + 30} ${q[1] - 50} Z" fill="${C.verde}" stroke="${K}" stroke-width="2.4"/><circle cx="${q[0]}" cy="${q[1] - 70}" r="4" fill="${C.amarelo}" stroke="${K}" stroke-width="1.6"/></g>`;
    const bj = P(5.6, 6.3);
    s += `<g><path d="M${bj[0] - 16} ${bj[1] - 8} l32 16 M${bj[0] - 16} ${bj[1] - 14} l32 16" stroke="${C.verde}" stroke-width="5"/><path d="M${bj[0] - 12} ${bj[1] - 6} v8 M${bj[0] + 12} ${bj[1] + 6} v8" stroke="${K}" stroke-width="2.4"/></g>`;
    const b1 = P(5.4, 5.9), b2 = P(6.5, 8.5);
    s += `<g class="bandeirinhas"><path d="M${b1[0]} ${b1[1] - 70} Q${(b1[0] + b2[0]) / 2} ${(b1[1] + b2[1]) / 2 - 40} ${b2[0]} ${b2[1] - 70}" fill="none" stroke="${K}" stroke-width="1.4"/>${Array.from({ length: 9 }, (_, k) => { const t = (k + .5) / 9, x = b1[0] + (b2[0] - b1[0]) * t, y = b1[1] - 70 + (b2[1] - b1[1]) * t + 30 * 4 * t * (1 - t) * .5 - 0; return `<path class="bandeira" d="M${f1(x - 5)} ${f1(y)} h10 l-5 11 z" fill="${["#e2412a", "#ffc62b", "#2445d6", "#0c8f5c", "#ff8fb7"][k % 5]}" stroke="${K}" stroke-width="1.2" style="transform-origin:${f1(x)}px ${f1(y)}px"/>`; }).join("")}</g>`;
    s += `<path d="M${b1[0]} ${b1[1]} v-72 M${b2[0]} ${b2[1]} v-72" stroke="${K}" stroke-width="2.4"/>`;
    s += jacaranda(...P(6.1, 6.4), 1.15);
    ed.quiosque = edificioIso("quiosque", "Quiosque — os números do país hoje", s);
    portas.quiosque = P(6.05, 7.65); pinos.push(["quiosque", P(6.05, 7.4), 104, "Inflação · 12 meses", D.inflacao]); pinos.push(["quiosque2", P(6.35, 7.9), 40, "Desemprego", D.desemprego]);
  }
  // Escola
  {
    const i = 8.5, j = 6, wi = 2.3, dj = 2.6, h = 118;
    const svg = caixa(i, j, wi, dj, h, {
      fundo: C.ocre, telhado: "duas", rh: 34, corTelhado: "#b8543a",
      esq: (w, hh) => `${grelhaJanelas(w, hh, 1, 4, { jw: 20, jh: 30, top: 12, base: 64 })}${placa2(w / 2 - 44, -62, 88, "ESCOLA", "#fff", K)}<rect x="12" y="-44" width="54" height="30" fill="#264a3a" stroke="${K}" stroke-width="2.4"/><text x="39" y="-30" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="10" fill="#fff">o que é a</text><text x="39" y="-19" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="10" fill="${C.amarelo}">inflação?</text>${porta2(w - 50, 32, 46, C.azul)}`,
      dir: (w, hh) => grelhaJanelas(w, hh, 2, 3, { jw: 18, jh: 24 }),
      extraTopo: ({ A, B }) => { const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 40]; return `<rect x="${m[0] - 10}" y="${m[1] - 16}" width="20" height="18" fill="${C.ocre}" stroke="${K}" stroke-width="2.2"/><circle cx="${m[0]}" cy="${m[1] - 7}" r="5" fill="${C.amarelo}" stroke="${K}" stroke-width="1.6"/>`; },
    });
    ed.escola = edificioIso("escola", "Escola — as palavras do dinheiro", svg);
    portas.escola = naFachada(i, j, dj, 2.3 * LAD - 34); pinos.push(["escola", P(i + wi / 2, j + dj / 2), h + 52, "Pergunta do dia", "inflação?"]);
  }
  // prédios de enchimento com azulejo
  ed.predio1 = caixa(11.2, 6.4, 1.3, 2.2, 150, { fundo: "url(#azVerde)", telhado: "duas", rh: 26, esq: (w, hh) => grelhaJanelas(w, hh, 3, 2, { jw: 15, jh: 24, top: 12, base: 44, varanda: true, flores: true }) + porta2(w / 2 - 12, 24, 36, "#5a3d27", true), dir: (w, hh) => grelhaJanelas(w, hh, 4, 2, { jw: 14, jh: 20 }) });
  ed.predio2 = caixa(12.7, 6.6, 1.2, 2, 124, { fundo: "url(#azRosa)", telhado: "duas", rh: 24, esq: (w, hh) => grelhaJanelas(w, hh, 2, 2, { jw: 15, jh: 24, top: 12, base: 44, portadas: C.verde }) + porta2(w / 2 - 12, 24, 36, C.azul), dir: (w, hh) => grelhaJanelas(w, hh, 3, 2, { jw: 14, jh: 20 }) });
  ed.predio0 = caixa(-.9, 6.6, .95, 2, 132, { fundo: "url(#azAzul)", telhado: "duas", rh: 22, esq: (w, hh) => grelhaJanelas(w, hh, 2, 1, { jw: 16, jh: 24, top: 12, base: 44, varanda: true }), dir: (w, hh) => grelhaJanelas(w, hh, 3, 2, { jw: 14, jh: 20 }) });

  /* ——— árvores e candeeiros ——— */
  const arvoresTras = [arvoreVerde(...P(-.4, 2.2), .9), arvoreVerde(...P(-.5, 3.1), .8), arvoreVerde(...P(2.9, 3.35), .7)].join("");
  const arvoresFrente = [arvoreVerde(...P(14.5, 7), 1), arvoreVerde(...P(14.9, 8.2), .85), arvoreVerde(...P(14.2, 8.4), .75)].join("");
  const candTras = [1.2, 4.6, 9.6, 12].map((ii) => candeeiro(...P(ii, 3.8))).join("");
  const candFrente = [1.6, 4.2, 9.8, 12.8].map((ii) => candeeiro(...P(ii, 8.8))).join("");

  return {
    chao: chaoSvg,
    tras: arvoresTras + candTras + ed.fabrica + ed.segsocial + ed.financas + ed.banco + ed.correios + ed.bomba,
    frente: ed.predio0 + ed.mercearia + ed.pastelaria + ed.casa + ed.quiosque + ed.escola + ed.predio1 + ed.predio2 + arvoresFrente + candFrente,
    portas, pinos,
  };
}

/* ——— o elétrico 28 (anda ao longo de i, na Avenida) ——— */
function eletricoIso() {
  const wi = 2.4, dj = .5, h = 40, i = 0, j = 4.25;
  return caixa(i, j, wi, dj, h, {
    fundo: C.amarelo, topo: "#8f1f1f",
    esq: (w, hh) => `<rect x="0" y="${-hh}" width="${w}" height="${hh * .58}" fill="${C.creme}" stroke="${K}" stroke-width="2.2"/>${Array.from({ length: 6 }, (_, k) => `<rect x="${8 + k * 27}" y="${-hh + 4}" width="19" height="14" rx="2" class="vidro" stroke="${K}" stroke-width="1.8"/>`).join("")}<rect x="-2" y="-4" width="${w + 4}" height="5" fill="#8f1f1f" stroke="${K}" stroke-width="1.8"/>`,
    dir: (w, hh) => `<rect x="0" y="${-hh}" width="${w}" height="${hh * .58}" fill="${C.creme}" stroke="${K}" stroke-width="2.2"/><rect x="4" y="${-hh + 4}" width="${w - 8}" height="14" rx="2" class="vidro" stroke="${K}" stroke-width="1.8"/><circle cx="${w / 2}" cy="-10" r="3" fill="#fff6c9" stroke="${K}" stroke-width="1.4"/>`,
    extraTopo: ({ A, B, C: Cc }) => { const m = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2]; return `<path d="M${m[0]} ${m[1]} l-26 -64" stroke="${K}" stroke-width="2.4"/><rect x="${m[0] + 8}" y="${m[1] - 14}" width="24" height="12" rx="2" fill="${K}"/><text x="${m[0] + 20}" y="${m[1] - 5}" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9" fill="${C.amarelo}">28</text>`; },
  });
}
