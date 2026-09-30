import { describe, it, expect, afterEach } from "vitest";
import { avaliar, periodoEsperado, registrarSla, apagarSla } from "./freshness";

const AGORA = new Date("2026-09-16T12:00:00Z");

const fonte = (serieAte: string, frequencia = "mensal", id = "x") => ({
  id,
  fonte: "F",
  url: "",
  recolhidoEm: "",
  serieAte,
  frequencia,
});

describe("periodoEsperado", () => {
  it("mensal com SLA 2 períodos: em 16 set espera junho (julho ainda não venceu)", () => {
    // fim de julho + 2 meses = 30 set > 16 set; junho venceu a 31 ago
    expect(periodoEsperado("mes", 2, AGORA)).toBe("2026-06");
  });

  it("diária com SLA 3d: espera o dia de há 3-4 dias", () => {
    const p = periodoEsperado("dia", 3, AGORA);
    expect(p >= "2026-09-12" && p <= "2026-09-13").toBe(true);
  });

  it("trimestral com SLA 2 trimestres: espera 2025-Q4 (Q3-2026 vence a 30 set)", () => {
    expect(periodoEsperado("trimestre", 2, AGORA)).toBe("2025-10");
  });

  it("semestral com SLA 2 semestres: espera 2025-S1", () => {
    expect(periodoEsperado("semestre", 2, AGORA)).toBe("2025-01");
  });
});

describe("avaliar", () => {
  it("série no período esperado está em dia", () => {
    const r = avaliar([fonte("2026-06")], AGORA);
    expect(r.series[0].estado).toBe("em-dia");
    expect(r.estado).toBe("ok");
  });

  it("série de 2025-12 está atrasada 6 meses e falha o relatório", () => {
    const r = avaliar([fonte("2025-12")], AGORA);
    expect(r.series[0].estado).toBe("atrasada");
    expect(r.series[0].atrasoPeriodos).toBe(6);
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

  it("trimestral: fim de 2026-Q1 (ISO) está em dia; fim de 2025-Q3 atrasa", () => {
    const emDia = avaliar([fonte("2026-03-31", "trimestral")], AGORA);
    const velha = avaliar([fonte("2025-09-30", "trimestral")], AGORA);
    expect(emDia.series[0].estado).toBe("em-dia");
    expect(emDia.series[0].esperadoAte).toBe("2025-12-31");
    expect(velha.series[0].estado).toBe("atrasada");
    expect(velha.series[0].atrasoPeriodos).toBe(1);
  });

  it("semestral: fim de 2025-S2 (ISO) está em dia; fim de 2024-S2 atrasa", () => {
    const emDia = avaliar([fonte("2025-12-31", "semestral")], AGORA);
    const velha = avaliar([fonte("2024-12-31", "semestral")], AGORA);
    expect(emDia.series[0].estado).toBe("em-dia");
    expect(emDia.series[0].esperadoAte).toBe("2025-06-30");
    expect(velha.series[0].estado).toBe("atrasada");
  });

  it("trimestral com rótulo de 1.º mês (fiscal-isp) também funciona", () => {
    const r = avaliar([fonte("2026-07", "trimestral")], AGORA);
    expect(r.series[0].estado).toBe("em-dia");
  });

  it("frequência sem SLA definido marca sem-sla, não falha", () => {
    const r = avaliar([fonte("2020-01", "vigencia-declarada")], AGORA);
    expect(r.series[0].estado).toBe("sem-sla");
    expect(r.estado).toBe("ok");
  });
});

/**
 * O SLA por série serve para as fontes oficiais que não publicam à
 * cadência da sua frequência. Sem isto, uma série anual com três anos de
 * atraso marca «atrasada» e o gate parte sozinho, sem ninguém ter falhado
 * em nada — que é o pior sítio para o watchdog estar.
 *
 * Usa `registarSla` para pôr uma excepção a sério num id de teste, em vez
 * de deixar o mapa de produção com um exemplo fictício.
 */
describe("SLA por série", () => {
  afterEach(() => apagarSla("serie-de-teste"));

  it("sem excepção, uma série anual de 2022 está atrasada (regra: 1 período)", () => {
    const r = avaliar([fonte("2022", "anual", "serie-de-teste")], AGORA);
    expect(r.series[0].estado).toBe("atrasada");
  });

  it("com excepção de 4 períodos, a mesma série passa a estar em dia", () => {
    registrarSla("serie-de-teste", { periodos: 4, gran: "ano" });
    const r = avaliar([fonte("2022", "anual", "serie-de-teste")], AGORA);
    expect(r.series[0].estado).toBe("em-dia");
    expect(r.estado).toBe("ok");
  });

  it("a excepção vence a regra pela frequência", () => {
    // mensal tem SLA de 2 períodos; com excepção de 6, um dado de 4 meses
    // deixa de contar como atrasado
    const semExcepcao = avaliar([fonte("2026-05", "mensal", "outra")], AGORA);
    expect(semExcepcao.series[0].estado).toBe("atrasada");

    registrarSla("serie-de-teste", { periodos: 6, gran: "mes" });
    const comExcepcao = avaliar([fonte("2026-05", "mensal", "serie-de-teste")], AGORA);
    expect(comExcepcao.series[0].estado).toBe("em-dia");
  });

  it("a excepção não afasta as outras séries", () => {
    registrarSla("serie-de-teste", { periodos: 6, gran: "mes" });
    const r = avaliar(
      [fonte("2026-05", "mensal", "serie-de-teste"), fonte("2025-12", "mensal", "outra")],
      AGORA
    );
    expect(r.series[0].estado).toBe("em-dia");
    expect(r.series[1].estado).toBe("atrasada");
    expect(r.estado).toBe("atrasado");
  });

  it("uma excepção mais apertada também pode falhar mais cedo", () => {
    registrarSla("serie-de-teste", { periodos: 1, gran: "mes" });
    const r = avaliar([fonte("2026-05", "mensal", "serie-de-teste")], AGORA);
    expect(r.series[0].estado).toBe("atrasada");
  });
});
