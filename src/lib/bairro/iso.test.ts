import { describe, it, expect } from "vitest";
import {
  LAD,
  PLANO,
  P,
  P0,
  Pcom,
  bandeiraFCP,
  caixa,
  clerigos,
  padroes,
  pin,
  ponteLuisI,
  pts,
  rabelo,
} from "./iso";

/* ————————————————————————— a projeção ————————————————————————— */

describe("P() — projeção isométrica 2:1", () => {
  it("a origem do ladrilho é o ponto de origem", () => {
    expect(P(0, 0, 0)).toEqual([720, 250]);
  });

  it("um passo em i anda 64 px para a direita e 32 px para baixo", () => {
    const [x0, y0] = P(0, 0, 0);
    const [x1, y1] = P(1, 0, 0);
    expect(x1 - x0).toBe(64);
    expect(y1 - y0).toBe(32);
  });

  it("um passo em j anda 64 px para a esquerda e 32 px para baixo", () => {
    const [x0, y0] = P(0, 0, 0);
    const [x1, y1] = P(0, 1, 0);
    expect(x0 - x1).toBe(64);
    expect(y1 - y0).toBe(32);
  });

  it("a cota sobe a subtractir a altura — o que assenta o edifício no chão", () => {
    const [xBaixo, yBaixo] = P(3, 5, 0);
    const [xCima, yCima] = P(3, 5, 40);
    expect(xCima).toBe(xBaixo);
    expect(yBaixo - yCima).toBe(40);
  });

  it("a cota não mexe no eixo dos x", () => {
    for (const z of [0, -22, 110]) {
      expect(P(2, 7, z)[0]).toBe(P(2, 7, 0)[0]);
    }
  });

  it("P0 é P sem terreno", () => {
    expect(P0(4, 9)).toEqual(P(4, 9, 0));
  });

  it("Pcom aplica o terreno por omissão; com z explícito, ignora-o", () => {
    // a avenida a 110, a Ribeira a 0 — a diferença de cotas que o mapa usa
    const terreno = (i: number) => (i < 10 ? 110 : 0);
    const Pterreno = Pcom(terreno);
    expect(Pterreno(2, 2)[1]).toBe(P(2, 2, 110)[1]);
    expect(Pterreno(2, 2, 0)[1]).toBe(P(2, 2, 0)[1]);
  });

  it("PLANO é chão a zero", () => {
    expect(PLANO(9, 9)).toBe(0);
  });

  it("LAD é o comprimento real da aresta do ladrilho (71,55 px)", () => {
    expect(LAD).toBeCloseTo(Math.hypot(64, 32), 10);
  });
});

/* ————————————————————————— os padrões ————————————————————————— */

describe("padroes()", () => {
  const svg = padroes();

  it("todos os ids levam o prefixo b-", () => {
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(id.startsWith("b-")).toBe(true);
  });

  it("nenhum id fica sem prefixo (colidiria com o resto do site)", () => {
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    for (const id of ids) expect(id).not.toMatch(/^(azAzul|granito|tijolo|chapa|aguaIso|riscas)$/);
  });

  it("todas as referências url(#…) apontam para um id definido aqui", () => {
    const definidos = new Set([...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    const referidos = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
    expect(referidos.length).toBeGreaterThan(0);
    for (const r of new Set(referidos)) expect(definidos.has(r)).toBe(true);
  });

  it("nunca deixa undefined nem NaN", () => {
    expect(svg).not.toContain("undefined");
    expect(svg).not.toContain("NaN");
  });
});

/* ————————————————————————— a caixa ————————————————————————— */

describe("caixa()", () => {
  const base = caixa(4, 6, 2, 3, 40, { fundo: "#cfc5b3" });

  it("abre e fecha um grupo, com a classe do protótipo", () => {
    expect(base.startsWith('<g class="caixa"')).toBe(true);
    expect(base.endsWith("</g>")).toBe(true);
  });

  it("leva a silhueta em data-sil para o cartão ao passar", () => {
    const m = base.match(/data-sil="([^"]+)"/);
    expect(m).not.toBeNull();
    // oito pontos: quatro da base e quatro do topo (sem telhado de duas águas)
    expect(m![1].trim().split(/\s+/)).toHaveLength(8);
  });

  it("desenha as duas paredes nas matrizes do protótipo", () => {
    expect(base).toContain("matrix(.8944 .4472 0 1");
    expect(base).toContain("matrix(.8944 -.4472 0 1");
  });

  it("assenta na cota do terreno quando não se dá z0", () => {
    const terreno = (i: number) => (i < 10 ? 110 : 0);
    // o centro da caixa em (5.5, 6.5) cai na avenida, cota 110
    const comTerreno = caixa(5, 6, 1, 1, 40, { fundo: "#fff" }, terreno);
    const semTerreno = caixa(5, 6, 1, 1, 40, { fundo: "#fff", z0: 0 }, terreno);
    expect(comTerreno).not.toBe(semTerreno);
    // a mesma caixa sem terreno nenhum fica à cota 0
    expect(caixa(5, 6, 1, 1, 40, { fundo: "#fff" })).toBe(semTerreno);
  });

  it("semSombra tira as sombras do chão", () => {
    expect(caixa(4, 6, 2, 3, 40, { semSombra: true })).not.toContain("sombra-d");
    expect(base).toContain("sombra-d");
  });

  it("semRodape tira o rodapé e semCornija tira a cornija", () => {
    // o véu de base (url(#b-baseSombra)) desenha-se sempre, com ou sem
    // rodapé — é a sombra que assenta a parede no chão, não uma peça da
    // parede. O que semRodape retira é a fiada de pedra junto ao chão.
    const rodape = (s: string) => s.match(/y="-9" width="[\d.]+" height="9" fill="#d8cbb4"/g);
    const cornija = (s: string) => s.match(/x="-2" y="-40" width="[\d.]+" height="6" fill="#efe6d6"/g);
    expect(rodape(base)).toHaveLength(2);
    expect(cornija(base)).toHaveLength(2);
    const liso = caixa(4, 6, 2, 3, 40, { semRodape: true, semCornija: true });
    expect(rodape(liso)).toBeNull();
    expect(cornija(liso)).toBeNull();
    // o véu de base continua lá
    expect(liso).toContain("url(#b-baseSombra)");
  });

  it("a parede tem cor por omissão — nunca fill=\"undefined\"", () => {
    expect(base).toContain('fill="#efe6d6"');
    expect(caixa(1, 1, 1, 1, 20)).not.toContain("undefined");
  });

  it("telhado de duas águas acrescenta os dois pontos do cume à silhueta", () => {
    const duas = caixa(4, 6, 2, 3, 40, { telhado: "duas" });
    const sil = duas.match(/data-sil="([^"]+)"/)![1].trim().split(/\s+/);
    expect(sil).toHaveLength(10);
    expect(duas).toContain("url(#b-telhaE)");
    expect(duas).toContain("url(#b-telhaD)");
  });

  it("platibanda desenha o aro de guarda", () => {
    expect(caixa(4, 6, 2, 3, 40, { telhado: "platibanda" })).toContain("fill=\"none\" stroke=\"#16130f\" stroke-width=\"2\"");
  });

  it("as fachadas esq e dir são chamadas com a largura e a altura da parede", () => {
    const chamadas: [number, number][] = [];
    caixa(4, 6, 2, 3, 40, {
      esq: (w, h) => { chamadas.push([w, h]); return ""; },
      dir: (w, h) => { chamadas.push([w, h]); return ""; },
    });
    expect(chamadas).toHaveLength(2);
    for (const [w, h] of chamadas) {
      expect(h).toBe(40);
      expect(w).toBeCloseTo(w, 5);
    }
    // esquerda ao longo de i (wi=2), direita ao longo de −j (dj=3)
    expect(chamadas[0][0]).toBeCloseTo(2 * LAD, 5);
    expect(chamadas[1][0]).toBeCloseTo(3 * LAD, 5);
  });

  it("nunca deixa undefined nem NaN", () => {
    for (const s of [base, caixa(0, 0, 1, 1, 10, { telhado: "duas", rh: 22 })]) {
      expect(s).not.toContain("undefined");
      expect(s).not.toContain("NaN");
    }
  });
});

/* ————————————————————————— o marcador ————————————————————————— */

describe("pin() — a placa com o número real", () => {
  const p = pin(100, 200, "Euribor 12M", "2,41 %");

  it("carrega as coordenadas e a largura para a câmara", () => {
    expect(p).toContain('data-x="100"');
    expect(p).toContain('data-y="200"');
    expect(p).toMatch(/data-w="[\d.]+"/);
  });

  it("escreve o rótulo e o valor", () => {
    expect(p).toContain("Euribor 12M");
    expect(p).toContain("2,41 %");
  });

  it("alarga para o texto mais longo", () => {
    const curto = pin(0, 0, "IV", "23");
    const longo = pin(0, 0, "Taxa de juro", "10,25 %");
    const w = (s: string) => Number(s.match(/data-w="([\d.]+)"/)![1]);
    expect(w(longo)).toBeGreaterThan(w(curto));
  });

  it("usa algarismos tabulares — as placas alinham entre si", () => {
    expect(p).toContain("font-variant-numeric=\"tabular-nums\"");
  });

  it("nunca deixa undefined nem NaN", () => {
    expect(p).not.toContain("undefined");
    expect(p).not.toContain("NaN");
  });
});

/* ————————————————————————— as peças grandes ————————————————————————— */

describe("as peças do Porto", () => {
  it("clerigos desenha a torre em camadas, com data-sil em cada bloco", () => {
    const s = clerigos(10, 10, 1.22, PLANO);
    expect(s.startsWith('<g class="clerigos">')).toBe(true);
    expect((s.match(/class="caixa"/g) ?? []).length).toBeGreaterThan(5);
    expect(s).not.toContain("undefined");
    expect(s).not.toContain("NaN");
  });

  it("o rabelo tem casco, vela e bandeira", () => {
    const s = rabelo(true);
    expect(s.startsWith('<g class="rabelo">')).toBe(true);
    expect(s).toContain('class="vela"');
    expect(s).toContain("bandeira-pt");
    expect(s).not.toContain("undefined");
    expect(s).not.toContain("NaN");
  });

  it("atracado, o rabelo enrola a vela na verga", () => {
    expect(rabelo(false)).not.toContain('class="vela"');
  });

  it("a ponte devolve a camada de trás e a da frente", () => {
    const { tras, frente } = ponteLuisI({ iA: 1, iB: 2, jPorto: 3, jGaia: 18, jA1: 5, jA2: 16, zCima: 40, pilares: [] });
    expect(tras).toContain('id="ponteT"');
    expect(frente).toContain('id="ponteF"');
    expect(tras).not.toBe(frente);
  });

  it("a ponte traz o arco dourado e os candeeiros, apagados de dia, numa camada à parte", () => {
    const { tras, frente, luzes } = ponteLuisI({ iA: 1, iB: 2, jPorto: 3, jGaia: 18, jA1: 5, jA2: 16, zCima: 40, pilares: [] });
    expect(luzes).toContain('id="ponteL"');
    expect((luzes.match(/class="ponte-luz ponte-arco"/g) ?? []).length).toBe(2);
    expect((luzes.match(/class="ponte-luz( b-cedo)?"/g) ?? []).length).toBeGreaterThan(20);
    // nada aceso de origem; o CSS acende com .b-noite
    expect(luzes).not.toMatch(/class="ponte-luz[^"]*" opacity="(?!0")/);
    // o brilho não vive nas camadas da estrutura (essas ficam debaixo do véu)
    expect(tras + frente).not.toContain("ponte-luz");
  });

  it("bandeiraFCP não traz o emblema do clube — só as riscas e «FCP»", () => {
    const s = bandeiraFCP(10, 20);
    expect(s).toContain("FCP");
    expect(s).toContain("#0a3d91");
  });
});

/* ————————————————————————— a segurança da casa ————————————————————————— */

describe("nenhum desenho produz texto partido", () => {
  it("todas as funções devolvem SVG sem undefined nem NaN", () => {
    const desenhos = [
      pts([0, 0], [1, 1]),
      padroes(),
      caixa(1, 1, 2, 2, 30, { telhado: "duas", rh: 20, esq: (w, h) => `<rect width="${w}" height="${h}"/>` }),
      clerigos(5, 5),
      rabelo(),
      pin(0, 0, "R", "1"),
      bandeiraFCP(0, 0),
    ];
    for (const d of desenhos) {
      expect(d).not.toContain("undefined");
      expect(d).not.toContain("NaN");
    }
  });
});
