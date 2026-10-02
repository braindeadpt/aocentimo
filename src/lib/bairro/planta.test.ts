import { describe, it, expect } from "vitest";
import { MUNDO } from "./iso";
import { ESCD, HP, JM, MAPA, TERRENO, edificioIso, eletricoIso, margemGaia, montarMapa, type MarcadoresBairro } from "./planta";

/* Os valores que `dadosBairro()` entrega. São TEXTO JÁ FORMATADO: a planta
   não formata nada. Ver a nota no topo de planta.ts. */
const D: MarcadoresBairro = {
  salario: "1 200 €",
  tsu: "23,75 %",
  irs: "96 €",
  liquido: "1 044 €",
  cabaz: "+18 %",
  cafes: "+21 %",
  euribor: "2,41 %",
  ca: "3,00 %",
  gasoleo: "1,589",
  gasolina: "1,729",
  gasoleoUn: "1,589\u202F€/L",
  gasolinaUn: "1,729\u202F€/L",
  inflacao: "+2,1 %",
  desemprego: "6,4 %",
};

/** Os onze edifícios com cena, pela ordem do quadro §2.3 do pack. */
const EDIFICIOS = ["fabrica", "segsocial", "financas", "banco", "correios", "bomba", "mercearia", "pastelaria", "casa", "quiosque", "escola"] as const;

describe("TERRENO", () => {
  it("a Avenida está a 110", () => {
    expect(TERRENO(2, 2)).toBe(HP);
  });

  it("a Ribeira e a praça estão a 0", () => {
    expect(TERRENO(2, JM + 1)).toBe(0);
    expect(TERRENO(6, 7.9)).toBe(0);
  });

  it("o Douro está a −22", () => {
    expect(TERRENO(2, 12)).toBe(-22);
  });

  it("as escadinhas descem da Avenida à Ribeira, sem degraus", () => {
    const zAlto = TERRENO(7.5, ESCD.j0);
    const zBaixo = TERRENO(7.5, ESCD.j1);
    expect(zAlto).toBeCloseTo(HP, 6);
    expect(zBaixo).toBeCloseTo(0, 6);
    // monotonia decrescente ao longo de todo o lance
    let anterior = Infinity;
    for (let j = ESCD.j0; j <= ESCD.j1; j += 0.1) {
      const z = TERRENO(7.5, j);
      expect(z).toBeLessThanOrEqual(anterior + 1e-9);
      anterior = z;
    }
  });

  it("a junta é a mesma em toda a planta, exceto nas escadinhas", () => {
    // j = 5,4 está acima do muro (JM = 6,6) — é Avenida, dos dois lados
    expect(TERRENO(0, ESCD.j0)).toBe(HP);
    expect(TERRENO(14, ESCD.j0)).toBe(HP);
    // j = 7 está abaixo do muro — é Ribeira, dos dois lados
    expect(TERRENO(0, 7)).toBe(0);
    expect(TERRENO(14, 7)).toBe(0);
    // o único sítio onde a cota muda é dentro do lance das escadinhas
    expect(TERRENO(7.5, ESCD.j0)).toBeCloseTo(HP, 6);
  });

  it("é uma função pura — o mesmo ponto dá sempre a mesma cota", () => {
    for (const [i, j] of [[0, 0], [7.5, 6], [12, 11], [3, 3]] as const) {
      expect(TERRENO(i, j)).toBe(TERRENO(i, j));
    }
  });
});

describe("edificioIso", () => {
  it("cada edifício leva data-id, é focável e tem nome acessível", () => {
    const svg = edificioIso("banco", "Banco — crédito, juros e a Euribor", "<rect/>");
    expect(svg).toContain('data-id="banco"');
    expect(svg).toContain('tabindex="0"');
    expect(svg).toContain('role="button"');
    expect(svg).toContain('aria-label="Banco — crédito, juros e a Euribor"');
  });
});

describe("montarMapa", () => {
  const m = montarMapa(D);

  it("devolve as camadas que a câmara mexe a velocidades diferentes", () => {
    for (const camada of ["chao", "tras", "frente", "vida", "agua", "gaia"] as const) {
      expect(typeof m[camada]).toBe("string");
      expect(m[camada].length).toBeGreaterThan(0);
    }
    expect(m.ponte.tras).toContain('id="ponteT"');
    expect(m.ponte.frente).toContain('id="ponteF"');
  });

  it("tem os onze edifícios, cada um com data-id e nome acessível", () => {
    const todo = m.tras + m.frente;
    const ids = [...todo.matchAll(/data-id="([^"]+)"/g)].map((x) => x[1]);
    for (const e of EDIFICIOS) {
      expect(ids).toContain(e);
    }
    // onze, e não doze: nenhum edifício repetido
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada edifício é focável pelo teclado", () => {
    const total = (m.tras + m.frente).match(/tabindex="0"/g) ?? [];
    expect(total).toHaveLength(EDIFICIOS.length);
  });

  it("todos os onze têm porta — é por ela que a câmara foca", () => {
    for (const e of EDIFICIOS) {
      expect(Object.keys(m.portas)).toContain(e);
      const [x, y] = m.portas[e];
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("os marcadores trazem os valores JÁ FORMATADOS, sem formatar aqui", () => {
    for (const [id, , , rotulo, valor] of m.pinos) {
      expect(typeof id).toBe("string");
      expect(typeof rotulo).toBe("string");
      // o valor é o que veio do servidor, carácter a carácter
      expect(m.pinos.length).toBeGreaterThan(10);
      expect(valor.length).toBeGreaterThan(0);
      expect(valor).not.toBe("undefined");
      expect(valor).not.toBe("NaN");
    }
  });

  it("cada marcador tem o valor que D traz para aquele edifício", () => {
    const porId = Object.fromEntries(m.pinos.map(([id, , , , v]) => [id, v]));
    expect(porId.fabrica).toBe(D.salario);
    expect(porId.segsocial).toBe(D.tsu);
    expect(porId.financas).toBe(D.irs);
    expect(porId.banco).toBe(D.euribor);
    expect(porId.correios).toBe(D.ca);
    expect(porId.casa).toBe(D.liquido);
    expect(porId.quiosque).toBe(D.inflacao);
    expect(porId.quiosque2).toBe(D.desemprego);
  });

  it("os dois marcadores da bomba levam o preço por litro, com a unidade feita pelo servidor", () => {
    const porId = Object.fromEntries(m.pinos.map(([id, , , , v]) => [id, v]));
    expect(porId.bomba).toBe(D.gasoleoUn);
    expect(porId.bomba2).toBe(D.gasolinaUn);
  });

  it("mudar um valor muda só o marcador desse edifício", () => {
    const outro = montarMapa({ ...D, salario: "1 500 €" });
    const de = (mm: typeof m, id: string) => mm.pinos.find((p) => p[0] === id)![4];
    expect(de(outro, "fabrica")).toBe("1 500 €");
    expect(de(outro, "financas")).toBe(de(m, "financas"));
  });

  it("o totem da bomba escreve os valores recebidos no SVG", () => {
    expect(m.tras).toContain(D.gasoleo);
    expect(m.tras).toContain(D.gasolina);
  });

  it("as Pattern refs levam o prefixo b- e existem em padroes()", () => {
    const todo = m.chao + m.tras + m.frente + m.gaia + m.ponte.tras + m.ponte.frente;
    const refs = [...todo.matchAll(/url\(#([^)]+)\)/g)].map((x) => x[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const r of new Set(refs)) expect(r.startsWith("b-")).toBe(true);
  });

  it("nunca deixa undefined nem NaN em nenhuma camada", () => {
    for (const camada of [m.chao, m.tras, m.frente, m.vida, m.agua, m.gaia, m.ponte.tras, m.ponte.frente]) {
      expect(camada).not.toContain("undefined");
      expect(camada).not.toContain("NaN");
    }
  });

  it("desenha o Clérigos, a ponte e as casas da Ribeira", () => {
    expect(m.tras).toContain('class="clerigos"');
    // a ponte vem em duas camadas: a de trás e a da frente, para a câmara
    // as mexer a velocidades diferentes
    expect(m.ponte.tras).toContain('id="ponteT"');
    expect(Object.values(m.ponte)[1]).toContain('id="ponteF"');
    expect(m.frente).toContain('id="gRibeira"');
    expect(m.gaia).toContain('class="gaia"');
    expect(m.gaia).toContain("VINHO DO PORTO");
  });

  it("cada árvore e cada candeeiro assenta dentro da caixa do mundo — nunca no canto (0,0)", () => {
    // o defeito do jardim: coordenadas de grelha (i, j ≤ ~20) escritas
    // sem o Pt() davam translate(14.5 7.2) — dentro da caixa, mas no
    // canto. O mundo só tem peças a centenas de px da origem: a prova é
    // a distância, não o rectângulo.
    const todo = m.chao + m.tras + m.frente + m.vida + m.agua + m.gaia + m.ponte.tras + m.ponte.frente;
    const grupos = [
      ...todo.matchAll(/<g class="(?:arvore|candeeiro)" transform="translate\((-?[\d.]+) (-?[\d.]+)\)/g),
    ];
    expect(grupos.length).toBeGreaterThan(0);
    for (const g of grupos) {
      const x = +g[1];
      const y = +g[2];
      expect(x, `x=${x} fora da caixa do mundo`).toBeGreaterThanOrEqual(MUNDO.x);
      expect(x, `x=${x} fora da caixa do mundo`).toBeLessThanOrEqual(MUNDO.x + MUNDO.w);
      expect(y, `y=${y} fora da caixa do mundo`).toBeGreaterThanOrEqual(MUNDO.y);
      expect(y, `y=${y} fora da caixa do mundo`).toBeLessThanOrEqual(MUNDO.y + MUNDO.h);
      expect(
        Math.hypot(x, y),
        `translate(${x} ${y}) é coordenada de grelha sem Pt()`
      ).toBeGreaterThan(150);
    }
  });

  it("nada do mapa passa dos limites que o protótipo define", () => {
    expect(MAPA.i0).toBeLessThan(0);
    expect(MAPA.i1).toBeGreaterThan(15);
    expect(JM).toBeGreaterThan(0);
  });
});

describe("a gente do bairro — as pessoas do mapa (P1-gente)", () => {
  const m = montarMapa(D);
  /* Tudo o que desenha gente, numa string só: as camadas da planta (a
     fila da Segurança Social vive dentro do edifício, em `tras`) mais os
     três grupos de `gente` que o mundo distribui por movA, movB e gCeu. */
  const gente = [m.chao, m.tras, m.frente, m.vida, m.agua, m.gaia, m.ponte.tras, m.ponte.frente, m.gente?.avenida ?? "", m.gente?.cais ?? "", m.gente?.ceu ?? ""].join("");

  it("há pelo menos 14 pessoas — a contagem do protótipo (3 fila + 8 elenco + pescador + 2 miúdos)", () => {
    const n = (gente.match(/<g class="pessoa"/g) ?? []).length;
    expect(n).toBeGreaterThanOrEqual(14);
  });

  it("as oito do elenco estão no mapa, uma vez cada, com data-pessoa", () => {
    for (const k of ["ines", "manuel", "arminda", "goncalo", "rui", "marta", "diana", "pedro"] as const) {
      const n = (gente.match(new RegExp(`data-pessoa="${k}"`, "g")) ?? []).length;
      expect(n, `data-pessoa="${k}"`).toBe(1);
    }
    // e o contrato é no grupo da pessoa, não num invólucro qualquer
    for (const x of gente.matchAll(/data-pessoa="([^"]+)"/g)) {
      expect(gente.slice(Math.max(0, x.index - 40), x.index)).toContain('class="pessoa"');
    }
  });

  it("passantes e miúdos não levam data-pessoa — e os miúdos ficam com a classe que a noite esconde", () => {
    const total = (gente.match(/<g class="pessoa"/g) ?? []).length;
    const nomeadas = (gente.match(/data-pessoa="/g) ?? []).length;
    expect(total - nomeadas).toBe(14 - 8);
    expect((gente.match(/class="miudo"/g) ?? []).length).toBe(2);
  });

  it("o pescador leva a cana e a boia", () => {
    expect(m.gente?.cais ?? "").toContain("b-boia");
  });

  it("cada pessoa nasce dentro da caixa do mundo e longe do canto (0,0)", () => {
    /* o mesmo defeito das árvores do jardim: um translate com (i, j) de
       grelha em vez de Pt() fica «dentro» da caixa mas no canto — a
       prova é a distância à origem, não o rectângulo */
    const grupos = [
      ...gente.matchAll(
        /<g[^>]*transform="translate\((-?[\d.]+) (-?[\d.]+)\) scale\([^"]*\)">\s*<g class="pessoa"/g
      ),
    ];
    expect(grupos.length, "não encontrei os invólucros translate+scale das pessoas").toBeGreaterThanOrEqual(14);
    for (const g of grupos) {
      const x = +g[1];
      const y = +g[2];
      expect(x, `x=${x} fora da caixa do mundo`).toBeGreaterThanOrEqual(MUNDO.x);
      expect(x, `x=${x} fora da caixa do mundo`).toBeLessThanOrEqual(MUNDO.x + MUNDO.w);
      expect(y, `y=${y} fora da caixa do mundo`).toBeGreaterThanOrEqual(MUNDO.y);
      expect(y, `y=${y} fora da caixa do mundo`).toBeLessThanOrEqual(MUNDO.y + MUNDO.h);
      expect(Math.hypot(x, y), `translate(${x} ${y}) é coordenada de grelha sem Pt()`).toBeGreaterThan(150);
    }
  });

  it("não há duas pessoas exactamente no mesmo sítio", () => {
    const posicoes = [
      ...gente.matchAll(
        /<g[^>]*transform="translate\((-?[\d.]+) (-?[\d.]+)\) scale\([^"]*\)">\s*<g class="pessoa"/g
      ),
    ].map((g) => `${g[1]} ${g[2]}`);
    expect(new Set(posicoes).size).toBe(posicoes.length);
  });
});

describe("as peças soltas", () => {
  it("o elétrico 22 é uma caixa deitada na Avenida", () => {
    const s = eletricoIso();
    expect(s).toContain('class="caixa"');
    expect(s).toContain(">22<");
    expect(s).not.toContain("undefined");
  });

  it("a margem de Gaia tem os três armazéns", () => {
    const s = margemGaia();
    expect(s).toContain("VINHO DO PORTO");
    expect(s).toContain("CAVES");
    expect(s).not.toContain("undefined");
  });
});
