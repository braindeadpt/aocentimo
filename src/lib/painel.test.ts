import { describe, expect, it } from "vitest";
import {
  comporPainel,
  cortarJanela,
  linhaFecha,
  linhasPainel,
  validarVizinhanca,
  PAINEL_COLUNAS,
  PAINEL_SPAN,
  type CartaoTamanho,
  type CodificacaoPainel,
  type TamanhoPainel,
} from "@/lib/painel";
import { cartoesDados, cartoesHome } from "@/lib/paineis";

const C = (o: CartaoTamanho = {}): CartaoTamanho => o;

/** soma de spans por linha — a grelha só fecha a 6 */
const linhasDe = (tams: TamanhoPainel[]) =>
  linhasPainel(tams).map((l) => l.reduce((a, t) => a + PAINEL_SPAN[t], 0));

describe("comporPainel — packing sem órfãos", () => {
  it("seis cartões com um herói L: [L][M+S][S+S+S]", () => {
    const tams = comporPainel([
      C({ tamanho: "L", tamanhos: ["L"] }),
      C({ tamanho: "M" }),
      C({ tamanho: "S" }),
      C({ tamanho: "S" }),
      C({ tamanho: "S" }),
      C({ tamanho: "S" }),
    ]);
    expect(tams).toEqual(["L", "M", "S", "S", "S", "S"]);
    expect(linhasDe(tams!)).toEqual([
      PAINEL_COLUNAS,
      PAINEL_COLUNAS,
      PAINEL_COLUNAS,
    ]);
  });

  it("sete cartões sem L: duas linhas M+S e uma S+S+S", () => {
    const tams = comporPainel([
      C({ tamanho: "M" }),
      C({ tamanho: "S" }),
      C({ tamanho: "M" }),
      C({ tamanho: "S" }),
      C({ tamanho: "S" }),
      C({ tamanho: "S" }),
      C({ tamanho: "S" }),
    ]);
    expect(tams).toEqual(["M", "S", "M", "S", "S", "S", "S"]);
    expect(linhasDe(tams!)).toEqual([
      PAINEL_COLUNAS,
      PAINEL_COLUNAS,
      PAINEL_COLUNAS,
    ]);
  });

  it("o órfão da última linha resolve-se por rearranjo de tamanhos", () => {
    // 5 cartões que preferem M — a linha ingénua seria [M][M][M]
    // com o último sozinho; o packing baixa-os para fechar a grelha
    const tams = comporPainel([C(), C(), C(), C(), C()]);
    expect(tams).not.toBeNull();
    for (const linha of linhasPainel(tams!)) {
      expect(linhaFecha(linha)).toBe(true);
    }
    // nenhuma linha com um único cartão que não a encha
    for (const linha of linhasPainel(tams!)) {
      if (linha.length === 1) expect(linha[0]).toBe("L");
    }
  });

  it("um cartão sozinho só fecha se puder ser L", () => {
    expect(comporPainel([C({ tamanhos: ["L"] })])).toEqual(["L"]);
    expect(comporPainel([C({ tamanhos: ["S"] })])).toBeNull();
    expect(comporPainel([C({ tamanhos: ["M"] })])).toBeNull();
  });

  it("respeita os tamanhos permitidos — nunca atribui fora da lista", () => {
    const tams = comporPainel([
      C({ tamanhos: ["S"] }),
      C({ tamanhos: ["S"] }),
      C({ tamanhos: ["S"] }),
      C({ tamanhos: ["S"] }),
      C({ tamanhos: ["S"] }),
      C({ tamanhos: ["S"] }),
    ]);
    expect(tams).toEqual(["S", "S", "S", "S", "S", "S"]);
  });

  it("configuração impossível devolve null, nunca um órfão", () => {
    // 2 cartões que só aceitam M: [M][M] deixaria dois órfãos
    expect(
      comporPainel([C({ tamanhos: ["M"] }), C({ tamanhos: ["M"] })])
    ).toBeNull();
  });

  it("é determinista", () => {
    const entrada = [C(), C({ tamanho: "L", tamanhos: ["L"] }), C(), C()];
    expect(comporPainel(entrada)).toEqual(comporPainel(entrada));
  });
});

describe("validarVizinhanca — codificações nunca repetidas em seguida", () => {
  const seq = (...c: CodificacaoPainel[]) => validarVizinhanca(c);

  it("aprova a alternância completa", () => {
    expect(seq("linha", "pontos", "linha", "tracos", "isometrico", "linha")).toEqual([]);
  });

  it("reprova dois seguidos com a mesma codificação", () => {
    const faltas = seq("linha", "linha", "tracos", "linha", "linha");
    expect(faltas).toEqual([
      { a: 0, b: 1, codificacao: "linha" },
      { a: 3, b: 4, codificacao: "linha" },
    ]);
  });
});

describe("cortarJanela — o recorte do Segmentado", () => {
  const serie = Array.from({ length: 120 }, (_, i) => ({
    t: `${2016 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`,
    v: i,
  }));

  it("«max» devolve a janela servida (≈10 anos)", () => {
    expect(cortarJanela(serie, "max")).toHaveLength(serie.length);
  });

  it("janelas mais curtas são sufixos da série", () => {
    const um = cortarJanela(serie, "1a");
    const cinco = cortarJanela(serie, "5a");
    expect(um.length).toBeGreaterThan(0);
    expect(cinco.length).toBeGreaterThan(um.length);
    expect(serie.slice(-um.length)).toEqual(um);
    expect(ultimoDe(um).t).toBe(ultimoDe(serie).t);
  });
});

const ultimoDe = <T,>(s: T[]) => s[s.length - 1];

describe("a configuração real — home e /dados", () => {
  for (const [nome, cartoes] of [
    ["home", cartoesHome()],
    ["dados", cartoesDados()],
  ] as const) {
    it(`${nome}: nenhum par seguido repete a codificação`, () => {
      expect(
        validarVizinhanca(cartoes.map((c) => c.codificacao)),
        cartoes.map((c) => `${c.id}:${c.codificacao}`).join(" · ")
      ).toEqual([]);
    });

    it(`${nome}: a grelha fecha todas as linhas — zero órfãos`, () => {
      const tams = comporPainel(cartoes);
      expect(tams).not.toBeNull();
      const linhas = linhasPainel(tams!);
      expect(linhas.every(linhaFecha)).toBe(true);
    });

    it(`${nome}: cada cartão declara codificação e casca de frescura`, () => {
      for (const c of cartoes) {
        expect(c.codificacao).toBeTruthy();
        if (c.codificacao === "isometrico" && c.isometrico.tipo === "vazio")
          continue;
        const casca =
          c.codificacao === "linha"
            ? {
                estado: c.linha.estado,
                meta: [`leitura ${c.linha.leitura}`],
              }
            : c.codificacao === "pontos"
              ? c.pontos.casca
              : c.codificacao === "tracos"
                ? c.tracos.casca
                : c.codificacao === "anel"
                  ? c.anel.casca
                  : c.isometrico.tipo === "estrutura"
                    ? c.isometrico.casca
                    : null;
        expect(casca).not.toBeNull();
        if (!casca) continue;
        expect(casca.estado).toBeTruthy();
        // frescura em texto: orbe + «leitura {período}» sempre
        expect(casca.meta?.[0]).toMatch(/^leitura /);
      }
    });

    it(`${nome}: cartões com série comparam por omissão à mediana de 10 anos`, () => {
      // a comparação declarada vence a omissão: UE27 no desemprego/gap,
      // o nível de 2015 na casa-vs-trabalho — todos os outros dizem a
      // mediana de 10 anos no texto do nível 1
      const insightDe = (c: (typeof cartoes)[number]) =>
        c.codificacao === "linha"
          ? c.linha.insight
          : c.codificacao === "pontos"
            ? c.pontos.insight
            : c.codificacao === "tracos"
              ? c.tracos.insight
              : c.codificacao === "anel"
                ? c.anel.insight
                : c.isometrico.tipo === "estrutura"
                  ? c.isometrico.insight
                  : null;
      for (const c of cartoes) {
        const insight = insightDe(c);
        if (insight === null) continue; // vazio
        if (c.id === "desemprego-gap" || c.id === "desemprego") {
          expect(insight).toContain("europeia");
        } else if (c.id === "casa-em-salarios") {
          expect(insight).toContain("nível de 2015");
        } else {
          expect(insight).toContain("mediana de 10 anos");
        }
      }
    });
  }
});
