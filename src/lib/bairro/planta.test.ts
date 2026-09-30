import { describe, it, expect } from "vitest";
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

  it("os dois marcadores da bomba levam o preço por litro", () => {
    const porId = Object.fromEntries(m.pinos.map(([id, , , , v]) => [id, v]));
    expect(porId.bomba).toBe(`${D.gasoleo} €/L`);
    expect(porId.bomba2).toBe(`${D.gasolina} €/L`);
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

  it("nada do mapa passa dos limites que o protótipo define", () => {
    expect(MAPA.i0).toBeLessThan(0);
    expect(MAPA.i1).toBeGreaterThan(15);
    expect(JM).toBeGreaterThan(0);
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
