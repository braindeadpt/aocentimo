import { describe, expect, it } from "vitest";
import { dadosClerigos } from "./dados-norte";
import { fmtNum } from "@/lib/format";
import * as T from "./textos-norte";

describe("Torre dos Clérigos — o Norte na economia", () => {
  const D = dadosClerigos();

  it("traz os números aprovados a 2026-10-12, sem nenhum em falta", () => {
    expect(D.pib).toEqual({ ano: 2024, milhoesEur: 85749, pesoPct: 29.6 });
    expect(D.exportacoes?.milhoesEur).toBe(26637);
    expect(fmtNum(D.exportacoes!.pesoPct, 1)).toBe("33,7");
    expect(D.industria).toEqual({ ano: 2025, milhares: 418.4, pesoPct: 23.2 });
    expect(D.texteisPct).toBe(87.4);
    expect(D.porHabitante).toEqual({ ano: 2024, norte: 23280, pais: 27063 });
  });

  it("cada número tem fonte na linha do fundo", () => {
    expect(D.fonte).toContain("INE, Contas Regionais");
    expect(D.fonte).toContain("Comércio Internacional");
    expect(D.fonte).toContain("Inquérito ao Emprego");
  });

  it("a copy aprovada não leva números escritos à mão", () => {
    expect(T.nteFala1).not.toMatch(/\d/);
    expect(T.ntePibTexto("X", "Y")).toBe(
      "O Norte produziu <b>X milhões de euros</b> em Y: perto de 3 em cada 10 euros de Portugal."
    );
  });
});
