import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { comUnidade, fmtEUR0 } from "@/lib/format";
import { m } from "@/lib/messages";
import { HeroMoeda } from "./HeroMoeda";
import {
  equivalenteLinha,
  juizoDoPalpite,
  partesDaLinha,
  textoVeredicto,
  varsVeredicto,
  type HeroStrings,
  type LinhaHero,
} from "./HeroMoedaCliente";

// S2-01 — o herói da home: a moeda de 100 cêntimos.
// Contratos testados: a linha da grelha → as quatro partes do campo
// (ordem, tons, detalhes), o juízo do palpite com os limiares do
// protótipo (≤2 certeiro · ≤8 perto · senão longe) e o SSR do herói
// completo (h1 LCP com o custo, moeda SVG, <details> com a resposta).

// as strings de produção — o teste testa também que a copy do
// pt.json cobre todos os {placeholders} que o componente usa
const s: HeroStrings = {
  ...m.home.hero,
  kicker: m.guess.kicker,
  revelar: m.guess.botao,
  marcadorRealidade: m.guess.realidade,
  marcadorMinimo: m.regua.minimo,
  reguaDica: m.regua.dica,
  limiteMin: m.regua.limiteRazaoMin,
  limiteMax: m.regua.limiteRazaoMax,
};

// as linhas reais da grelha (data/derived/cenarios-salario.json)
const L1500: LinhaHero = {
  bruto: 1500,
  custo: 1856.25,
  tsu: 356.25,
  irs: 168.17,
  ss: 165,
  liquido: 1166.83,
  centimos: { tsu: 19.19, irs: 9.06, ss: 8.89, fica: 62.86 },
};
const L920: LinhaHero = {
  bruto: 920,
  custo: 1138.5,
  tsu: 218.5,
  irs: 0,
  ss: 101.2,
  liquido: 818.8,
  centimos: { tsu: 19.19, irs: 0, ss: 8.89, fica: 71.92 },
};

describe("partesDaLinha — tabela → partes do campo", () => {
  const partes = partesDaLinha(L1500, s);

  it("quatro partes na ordem dos montes: saem à esquerda, fica à direita", () => {
    expect(partes.map((p) => p.id)).toEqual(["tsu", "irs", "ss", "fica"]);
    expect(partes.map((p) => p.tom)).toEqual(["sai", "sai", "sai", "fica"]);
  });

  it("os valores são os cêntimos reais com decimais", () => {
    expect(partes.map((p) => p.valor)).toEqual([19.19, 9.06, 8.89, 62.86]);
  });

  it("o detalhe é o €/mês da parte; rótulos e curtos vêm das strings", () => {
    expect(partes[0].rotulo).toBe("TSU da empresa");
    expect(partes[0].rotuloCurto).toBe("TSU");
    expect(partes[0].detalhe).toBe(`${fmtEUR0(356.25)}/mês`);
    expect(partes[3].rotulo).toBe("Chegam à tua conta");
    expect(partes[3].detalhe).toBe(`${fmtEUR0(1166.83)}/mês`);
  });

  it("ao salário mínimo o IRS vale 0 — o campo mostra «não te toca»", () => {
    const smn = partesDaLinha(L920, s);
    expect(smn[1].valor).toBe(0);
    // o componente decide o texto pelo valor — a linha entrega-o a 0
    expect(smn[1].tom).toBe("sai");
  });
});

describe("veredicto do palpite", () => {
  const real = L1500.centimos.fica; // 62,86

  it("juízo pelos limiares do protótipo (|d|≤2 certeiro, ≤8 perto)", () => {
    expect(juizoDoPalpite(63, real)).toBe("certeiro"); // 0,14
    expect(juizoDoPalpite(61, real)).toBe("certeiro"); // 1,86
    expect(juizoDoPalpite(55, real)).toBe("perto"); // 7,86
    expect(juizoDoPalpite(50, real)).toBe("longe"); // 12,86
    expect(juizoDoPalpite(0, real)).toBe("longe");
    expect(juizoDoPalpite(100, real)).toBe("longe");
  });

  it("com palpite: «Disseste X; são Y — Z a mais/a menos»", () => {
    const c = (v: string) => comUnidade(v, "c");
    expect(textoVeredicto(50, real, s)).toBe(
      `Longe. Disseste ${c("50")}; são ${c("62,86")} — ${c("12,86")} a menos.`
    );
    expect(textoVeredicto(80, real, s)).toBe(
      `Longe. Disseste ${c("80")}; são ${c("62,86")} — ${c("17,14")} a mais.`
    );
    expect(textoVeredicto(63, real, s)).toContain("Certeiro.");
  });

  it("sem palpite: a frase neutra com os dois lados do euro", () => {
    const c = (v: string) => comUnidade(v, "c");
    expect(textoVeredicto(null, real, s)).toBe(
      `De cada euro, ${c("62,86")} chegam-te à conta. Os outros ${c("37,14")} saem antes.`
    );
  });

  it("em extenso escreve «cêntimos» (região viva)", () => {
    const fala = textoVeredicto(50, real, s, true);
    expect(fala).toContain("50 cêntimos");
    expect(fala).toContain("62,86 cêntimos");
  });

  it("as variáveis mudam de sinal conforme o palpite passa o real", () => {
    expect(varsVeredicto(70, real, s).direcao).toBe("a mais");
    expect(varsVeredicto(50, real, s).direcao).toBe("a menos");
  });
});

describe("equivalenteLinha", () => {
  it("diz os quatro valores e o bruto — o equivalente textual único", () => {
    const eq = equivalenteLinha(L1500, s);
    expect(eq).toContain(`bruto de ${fmtEUR0(1500)}`);
    expect(eq).toContain("62,86 cêntimos chegam à tua conta");
    expect(eq).toContain("19,19 vão para a TSU");
    expect(eq).toContain("9,06 para o IRS retido");
    expect(eq).toContain("8,89 para a Segurança Social");
  });
});

describe("SSR do HeroMoeda", () => {
  const html = renderToStaticMarkup(<HeroMoeda />);

  it("o h1 é a pergunta com o custo canónico — o LCP nasce final", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('id="hm-pergunta"');
    expect(html).toContain("A tua empresa gasta");
    expect(html).toContain(fmtEUR0(1856.25));
    expect(html).toContain("De cada euro, quantos cêntimos te chegam?");
    expect(html).toContain('aria-labelledby="hm-pergunta"');
  });

  it("a moeda SSR está lá (svg) e o palco começa sem data-pronto", () => {
    expect(html).toContain("cc-palco");
    expect(html).toContain("cc-svg");
    expect(html).not.toContain("data-pronto");
  });

  it("o <details> sem JS traz a resposta completa — os quatro valores", () => {
    expect(html).toContain("<details");
    expect(html).toContain("A resposta, sem adivinhar");
    expect(html).toContain("62,86");
    expect(html).toContain("19,19");
    expect(html).toContain("9,06");
    expect(html).toContain("8,89");
  });

  it("a régua do bruto serve a grelha e os presets; o equivalente existe", () => {
    expect(html).toContain("O teu bruto");
    expect(html).toContain("salário mínimo");
    expect(html).toContain("O teu palpite");
    expect(html).toContain("data-cc-equivalente");
  });

  it("a fonte e a nota «1 ponto = 1 cêntimo» estão no rodapé", () => {
    expect(html).toContain("Motores AO CÊNTIMO");
    expect(html).toContain("1 ponto = 1 cêntimo");
    expect(html).toContain("diariodarepublica.pt");
  });
});
