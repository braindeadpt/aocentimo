import { describe, expect, it } from "vitest";
import {
  GLOSSARIO,
  mencoesEm,
  relacionados,
  termoPorSlug,
} from "./glossario";

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
});
