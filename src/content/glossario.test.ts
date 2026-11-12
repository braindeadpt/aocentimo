import { describe, expect, it } from "vitest";
import {
  GLOSSARIO,
  mencoesEm,
  relacionados,
  termoPorSlug,
} from "./glossario";
import { DEMOS } from "./demos";
import {
  FICHA,
  FRASE,
  GRUPO_DE,
} from "../app/aprender/conteudo";

describe("glossario", () => {
  it("tem slugs únicos em todos os termos", () => {
    const slugs = GLOSSARIO.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("termoPorSlug encontra e falha honestamente", () => {
    expect(termoPorSlug("taeg")?.termo).toBe("TAEG");
    expect(termoPorSlug("inexistente")).toBeUndefined();
  });

  it("mencoesEm encontra menções literais a outros termos", () => {
    const tan = termoPorSlug("tan")!;
    const slugs = mencoesEm(tan.definicao, tan.slug).map((m) => m.slug);
    expect(slugs).toEqual(expect.arrayContaining(["euribor", "spread", "taeg"]));
  });

  it("mencoesEm exclui o próprio termo e não sobrepõe spans", () => {
    const euribor = termoPorSlug("euribor")!;
    const spans = mencoesEm(`${euribor.definicao} ${euribor.exemplo}`, euribor.slug);
    expect(spans.some((m) => m.slug === "euribor")).toBe(false);
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i].inicio).toBeGreaterThanOrEqual(spans[i - 1].fim);
    }
  });

  it("relacionados é bidirecional e nunca inclui o próprio termo", () => {
    // tan menciona taeg → taeg ganha tan mesmo sem o mencionar
    expect(relacionados("taeg").map((t) => t.slug)).toContain("tan");
    for (const t of GLOSSARIO) {
      expect(relacionados(t.slug).map((r) => r.slug)).not.toContain(t.slug);
    }
  });

  it("reconhece 28 % com fino inseparável (U+202F), espaço ou colado, sem falsos positivos", () => {
    expect(mencoesEm("pagam 28\u202f% de imposto").map((m) => m.slug)).toContain(
      "retencao-capitais"
    );
    expect(mencoesEm("taxa de 28 % ou 28%.").map((m) => m.slug)).toEqual([
      "retencao-capitais",
      "retencao-capitais",
    ]);
    expect(mencoesEm("sujeito a retenção liberatória").map((m) => m.slug)).toContain(
      "retencao-capitais"
    );
    expect(mencoesEm("subiu 128\u202f% ou 2,28\u202f%").map((m) => m.slug)).not.toContain(
      "retencao-capitais"
    );
    expect(relacionados("retencao-capitais").map((t) => t.slug)).toEqual(
      expect.arrayContaining(["ppr", "englobamento"])
    );
  });

  it("tem 42 termos no total com todos os 19 novos termos essenciais presentes", () => {
    expect(GLOSSARIO.length).toBe(42);
    const slugs = GLOSSARIO.map((t) => t.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "homologo",
        "pib",
        "populacao-ativa",
        "indice-precos-habitacao",
        "ias",
        "rendimento-coletavel",
        "irs-jovem",
        "duodecimos",
        "subsidio-alimentacao",
        "adse",
        "imt",
        "imposto-selo",
        "imi",
        "isv-iuc",
        "taxa-mista",
        "taxa-esforco",
        "mais-valias",
        "servicos-minimos-bancarios",
        "fundo-garantia-depositos",
      ])
    );
  });

  it("cada termo do glossário tem correspondência em GRUPO_DE, FRASE e FICHA", () => {
    for (const t of GLOSSARIO) {
      expect(GRUPO_DE[t.slug], `Falta GRUPO_DE para ${t.slug}`).toBeDefined();
      expect(FRASE[t.slug], `Falta FRASE para ${t.slug}`).toBeDefined();
      expect(FICHA[t.slug], `Falta FICHA para ${t.slug}`).toBeDefined();
    }
  });

  it("demos interativas existem para homologo, taxa-esforco e duodecimos", () => {
    expect(DEMOS["homologo"]).toBeDefined();
    expect(DEMOS["taxa-esforco"]).toBeDefined();
    expect(DEMOS["duodecimos"]).toBeDefined();
  });
});
