import { describe, it, expect } from "vitest";
import { avaliar, periodoEsperado } from "./freshness";

const AGORA = new Date("2026-09-16T12:00:00Z");

const fonte = (serieAte: string, frequencia = "mensal") => ({
  id: "x",
  fonte: "F",
  url: "",
  recolhidoEm: "",
  serieAte,
  frequencia,
});

describe("periodoEsperado", () => {
  it("mensal com SLA 45d: em 16 set espera julho (agosto ainda não venceu)", () => {
    expect(periodoEsperado("mes", 45, AGORA)).toBe("2026-07");
  });

  it("diária com SLA 3d: espera o dia de há 3-4 dias", () => {
    const p = periodoEsperado("dia", 3, AGORA);
    expect(p >= "2026-09-12" && p <= "2026-09-13").toBe(true);
  });
});

describe("avaliar", () => {
  it("série no período esperado está em dia", () => {
    const r = avaliar([fonte("2026-07")], AGORA);
    expect(r.series[0].estado).toBe("em-dia");
    expect(r.estado).toBe("ok");
  });

  it("série de 2025-12 está atrasada ~7 meses e falha o relatório", () => {
    const r = avaliar([fonte("2025-12")], AGORA);
    expect(r.series[0].estado).toBe("atrasada");
    expect(r.series[0].atrasoPeriodos).toBe(7);
    expect(r.estado).toBe("atrasado");
  });

  it("série à frente do esperado não é penalizada", () => {
    const r = avaliar([fonte("2026-08")], AGORA);
    expect(r.series[0].estado).toBe("em-dia");
  });

  it("diária velha falha; diária de ontem passa", () => {
    const velha = avaliar([fonte("2026-09-01", "diaria")], AGORA);
    const nova = avaliar([fonte("2026-09-15", "diaria")], AGORA);
    expect(velha.series[0].estado).toBe("atrasada");
    expect(nova.series[0].estado).toBe("em-dia");
  });

  it("frequência sem SLA definido marca sem-sla, não falha", () => {
    const r = avaliar([fonte("2020-01", "vigencia-declarada")], AGORA);
    expect(r.series[0].estado).toBe("sem-sla");
    expect(r.estado).toBe("ok");
  });
});
