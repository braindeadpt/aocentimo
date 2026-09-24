import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Isometrico, type CamadaIsometrica } from "./Isometrico";

// S1-02 defeito 3 — cor por tipo de peça: --accent é SÓ para o dinheiro
// que sai do bolso (cortes); o que fica (líquido, «fica») é --keep;
// o bruto e o custo da empresa são neutros. Regressão: o valor do
// bruto e o «chega à conta» renderizavam em vermelho.
// S4: o teste aponta ao Isometrico directo — o molde EuroExplodido
// ficou sem uso de produto e saiu (git guarda-o).

const camadas: CamadaIsometrica[] = [
  {
    id: "bruto",
    forma: "moeda",
    rotulo: "Bruto",
    detalhe: "o ponto de partida",
    tom: "neutro",
    texto: "1 500 €",
  },
  {
    id: "ss",
    forma: "placa",
    rotulo: "Seg. Social",
    detalhe: "11 %",
    tom: "corte",
    texto: "−165 €",
    textoLista: "−165 €",
  },
  {
    id: "irs",
    forma: "placa",
    rotulo: "IRS",
    detalhe: "retenção",
    tom: "corte",
    texto: "−168 €",
    textoLista: "−168 €",
  },
  {
    id: "liquido",
    forma: "disco",
    rotulo: "Chega à conta",
    detalhe: "o líquido",
    tom: "fica",
    texto: "1 167 €",
    textoLista: "1 167 €",
  },
  {
    id: "fica",
    forma: "base",
    rotulo: "Fica",
    detalhe: "depois de tudo",
    tom: "fica",
    texto: "1 123 €",
    textoLista: "1 123 €",
  },
];

const html = renderToStaticMarkup(<Isometrico nome="euro" camadas={camadas} />);

// cada rótulo de valor no svg tem o seu tom — emparelha-se pela ordem:
// bruto, ss, irs, liquido, fica
const tonsSvg = [...html.matchAll(/iso-rot-v iso-tom-(neutro|corte|fica)/g)].map(
  (m) => m[1]
);
const tonsLista = [
  ...html.matchAll(/iso-li-val iso-tom-(neutro|corte|fica)/g),
].map((m) => m[1]);

describe("Isometrico — cor por tipo de peça", () => {
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

  it("nenhuma peça usa o antigo booleano eu-keep nem o nome «Explodido»", () => {
    expect(html).not.toContain("eu-keep");
    // S1-05: o núcleo renomeou-se Isometrico — as classes são iso-*
    expect(html).not.toMatch(/eu-(peca|rot|li|num|chamada)/);
    expect(html).toContain("iso-camada");
  });
});
