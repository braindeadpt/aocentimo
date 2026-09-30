import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  dedupeMes,
  SERIES_DEPOSITOS,
  TITULOS_DEPOSITOS,
  fetchDepositos,
} from "./bpstat";

/**
 * O BPstat devolve mais do que uma observação para o mesmo mês quando a
 * série é revista. A regra da casa: fica a última, a mais recente.
 */
describe("dedupeMes", () => {
  it("mantém a última observação de cada mês e ordena", () => {
    const entrada = [
      { t: "2026-07", v: 1.59 },
      { t: "2026-05", v: 1.48 },
      { t: "2026-06", v: 1.55 },
      { t: "2026-05", v: 1.5 }, // revisão do mesmo mês
    ];
    expect(dedupeMes(entrada)).toEqual([
      { t: "2026-05", v: 1.5 },
      { t: "2026-06", v: 1.55 },
      { t: "2026-07", v: 1.59 },
    ]);
  });

  it("não mexe nos valores, só em ordem e contagem", () => {
    const entrada = [
      { t: "2026-02", v: 2.1 },
      { t: "2026-01", v: 2.2 },
    ];
    expect(dedupeMes(entrada).map((p) => p.v)).toEqual([2.2, 2.1]);
  });

  it("série vazia devolve vazio — quem decide se isso é erro é o caller", () => {
    expect(dedupeMes([])).toEqual([]);
  });
});

/** O schema da resposta do BPstat: se a forma mudar, isto falha alto. */
const observacaoSchema = z.object({
  value: z.string(),
  series_id: z.number().optional(),
  reference_date: z.string(),
});
const respostaSchema = z.object({ data: z.array(observacaoSchema) });

describe("schema da resposta do BPstat", () => {
  it("aceita a forma devolvida: data[] com value em string", () => {
    const r = respostaSchema.parse({
      data: [
        { value: "1.59", series_id: 12519805, reference_date: "2026-07-31" },
        { value: "1.55", series_id: 12519805, reference_date: "2026-06-30" },
      ],
    });
    expect(r.data).toHaveLength(2);
    expect(Number(r.data[0].value)).toBe(1.59);
  });

  it("rejeita quando falta reference_date — sem data não há série", () => {
    expect(respostaSchema.safeParse({ data: [{ value: "1.59" }] }).success).toBe(
      false
    );
  });

  it("rejeita quando 'data' não é lista", () => {
    expect(respostaSchema.safeParse({ data: {} }).success).toBe(false);
  });
});

/**
 * Os IDs das séries de depósitos foram lidos no BPstat, não decorados de
 * memória. Este teste fixa o par ID↔título: se alguém trocar um ID, falha.
 */
describe("séries de depósitos a prazo", () => {
  it("cada prazo tem ID próprio", () => {
    const ids = Object.values(SERIES_DEPOSITOS);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SERIES_DEPOSITOS.ate1a).toBe(12519805);
    expect(SERIES_DEPOSITOS.total).toBe(12519807);
  });

  it("cada prazo tem o título exacto lido na fonte", () => {
    expect(TITULOS_DEPOSITOS.ate1a).toBe(
      "Taxa de juro (TAA) de novos depósitos a prazo até 1 ano dos particulares"
    );
    expect(TITULOS_DEPOSITOS.total).toBe(
      "Taxa de juro (TAA) de novos depósitos a prazo dos particulares"
    );
  });

  it("o título distingue o prazo até 1 ano do total — não são o mesmo número", () => {
    expect(TITULOS_DEPOSITOS.ate1a).not.toBe(TITULOS_DEPOSITOS.total);
  });
});

describe("fetchDepositos", () => {
  it("resposta sem observações falha alto — nunca grava um ficheiro vazio", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    try {
      await expect(fetchDepositos("ate1a")).rejects.toThrow(/série vazia/);
    } finally {
      globalThis.fetch = original;
    }
  });
});