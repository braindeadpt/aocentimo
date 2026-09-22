import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EuroExplodido, type PassoEuro, type RotulosEuro } from "./EuroExplodido";

// S1-02 defeito 3 — cor por tipo de peça: --accent é SÓ para o dinheiro
// que sai do bolso (cortes); o que fica (líquido, «fica») é --keep;
// o bruto e o custo da empresa são neutros. Regressão: o valor do
// bruto e o «chega à conta» renderizavam em vermelho.

const rotulos: RotulosEuro = {
  titulo: "O TEU EURO",
  nota: "cenário",
  breadcrumb: "O TEU DINHEIRO",
  meta: "",
  brutoRotulo: "Bruto",
  brutoDetalhe: "o ponto de partida",
  ficamTe: "ficam-te",
  porMes: "por mês",
  fontes: "Fontes",
  simulador: "Simulador",
};

const passos: PassoEuro[] = [
  {
    id: "ss",
    rotulo: "Seg. Social",
    detalhe: "11 %",
    euros: 165,
    corte: true,
    fonteNome: "ss",
  },
  {
    id: "irs",
    rotulo: "IRS",
    detalhe: "retenção",
    euros: 168,
    corte: true,
    fonteNome: "irs",
  },
  {
    id: "liquido",
    rotulo: "Chega à conta",
    detalhe: "o líquido",
    euros: 1167,
    fonteNome: "motor",
  },
  {
    id: "fica",
    rotulo: "Fica",
    detalhe: "depois de tudo",
    euros: 1123,
    fonteNome: "motor",
  },
];

const html = renderToStaticMarkup(
  <EuroExplodido passos={passos} rotulos={rotulos} bruto={1500} />
);

// cada rótulo de valor no svg tem o seu tom — emparelha-se pela ordem:
// bruto, ss, irs, liquido, fica
const tonsSvg = [...html.matchAll(/eu-rot-v eu-tom-(neutro|corte|fica)/g)].map(
  (m) => m[1]
);
const tonsLista = [...html.matchAll(/eu-li-val eu-tom-(neutro|corte|fica)/g)].map(
  (m) => m[1]
);

describe("EuroExplodido — cor por tipo de peça", () => {
  it("o bruto é neutro — não sai nem fica", () => {
    expect(tonsSvg[0]).toBe("neutro");
  });

  it("os cortes (SS, IRS) são «corte» — vermelho, sai do bolso", () => {
    expect(tonsSvg[1]).toBe("corte");
    expect(tonsSvg[2]).toBe("corte");
  });

  it("«chega à conta» e «fica» são «fica» — verde, dinheiro que fica", () => {
    expect(tonsSvg[3]).toBe("fica");
    expect(tonsSvg[4]).toBe("fica");
  });

  it("a lista-equivalente tem os mesmos tons, na mesma ordem", () => {
    // o bruto não entra na lista (é o todo, não um passo)
    expect(tonsLista).toEqual(["corte", "corte", "fica", "fica"]);
  });

  it("nenhuma peça usa o antigo booleano eu-keep", () => {
    expect(html).not.toContain("eu-keep");
  });
});
