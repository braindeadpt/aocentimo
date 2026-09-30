import { describe, it, expect } from "vitest";
import {
  verificarCoerencia,
  coerenciaAtual,
  mesesMencionados,
  type Calendario,
  type IucRegras,
  type ImiRegras,
} from "./coerencia-calendario";
import calendarioJson from "@data/fiscal/calendario-2026.json";
import iucJson from "@data/fiscal/iuc-2026.json";
import imiJson from "@data/fiscal/imi-2026.json";

describe("mesesMencionados", () => {
  it("acha os meses e ignora caixa e duplicados", () => {
    expect(mesesMencionados("paga-se em Maio e NOVEMBRO; maio outra vez")).toEqual([
      "maio",
      "novembro",
    ]);
  });

  it("não acha meses parciais dentro de outras palavras", () => {
    // «março» não está em «comerciar» — \b a impede
    expect(mesesMencionados("comerciar em abril")).toEqual(["abril"]);
    expect(mesesMencionados("sem prazo nenhum")).toEqual([]);
  });
});

/** O estado atual do pack tem de ser coerente — é isto que o CI trava. */
describe("coerência do pack atual (calendário ↔ IUC/IMI)", () => {
  const violacoes = coerenciaAtual();

  it("nenhum prazo do calendário contradiz as regras do IUC e do IMI", () => {
    expect(violacoes).toEqual([]);
  });

  it("apanharia o erro histórico: IUC de fevereiro com regime do mês da matrícula", () => {
    // Reconstrução do que a 2.ª auditoria corrigiu: iuc-1 a dizer
    // «paga-se tudo em fevereiro» com o regime do mês da matrícula.
    const calendarioAntigo: Calendario = {
      ...(calendarioJson as unknown as Calendario),
      prazos: [
        {
          id: "iuc-1",
          titulo: "IUC — 1.ª prestação (ou total se ≤ 100 €)",
          mes: "2026-02",
          descricao:
            "Novo em 2026: o IUC deixa o mês da matrícula. Até 100 € paga-se tudo em fevereiro; acima disso podes dividir — fevereiro e outubro.",
        },
      ],
    };
    const v = verificarCoerencia(
      calendarioAntigo,
      iucJson as unknown as IucRegras,
      imiJson as unknown as ImiRegras
    );
    const comFevereiro = v.filter((x) => x.includes("fevereiro"));
    expect(comFevereiro.length).toBeGreaterThan(0);
  });

  it("apanharia um IMI que mencione um mês fora das prestações do art. 120.º", () => {
    const calendarioMentiroso: Calendario = {
      ...(calendarioJson as unknown as Calendario),
      prazos: [
        {
          id: "imi-2",
          titulo: "IMI — 2.ª prestação (se > 500 €)",
          mes: "2026-08",
          descricao: "Segunda prestação de três, paga em julho.",
        },
      ],
    };
    const v = verificarCoerencia(
      calendarioMentiroso,
      iucJson as unknown as IucRegras,
      imiJson as unknown as ImiRegras
    );
    expect(v.some((x) => x.startsWith("imi"))).toBe(true);
  });

  it("aceita o calendário do IUC corrigido (mês da matrícula, com negações)", () => {
    const corrigido: Calendario = {
      ...(calendarioJson as unknown as Calendario),
      prazos: [
        {
          id: "iuc-1",
          titulo: "IUC — pagamento no mês da matrícula (ou total se ≤ 100 €)",
          mes: "2026-02",
          descricao:
            "Em 2026 o IUC continua a pagar-se no mês da matrícula — não há mudança em fevereiro. O novo regime só vale a partir de 2027.",
        },
      ],
    };
    const v = verificarCoerencia(
      corrigido,
      iucJson as unknown as IucRegras,
      imiJson as unknown as ImiRegras
    );
    expect(v).toEqual([]);
  });

  it("exige atualização quando o calendário passar para outro ano", () => {
    const futuro: Calendario = {
      ...((calendarioJson as unknown as Calendario)),
      ano: 2027,
    };
    const v = verificarCoerencia(
      futuro,
      iucJson as unknown as IucRegras,
      imiJson as unknown as ImiRegras
    );
    expect(v.some((x) => x.includes("atualizar"))).toBe(true);
  });
});
