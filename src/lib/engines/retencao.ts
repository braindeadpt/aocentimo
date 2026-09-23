import retencao2026 from "@data/fiscal/retencao-2026.json";

/**
 * Retenção na fonte mensal — modelo de taxas marginais progressivas em vigor
 * desde jul/2023 (Despacho n.º 233-A/2026 para 2026, continente, trabalho
 * dependente sem deficiência).
 *
 * retencao = max(0, R × taxaMarginal − parcelaAbater − parcelaAdicDep × nDep)
 *
 * Nas linhas de transição do mínimo de existência a parcela a abater é uma
 * fórmula: taxa × fator × (limiar − R) — garante continuidade no limite.
 * Com 3+ dependentes a taxa marginal desce 1 p.p. (parcelas inalteradas).
 */

export interface ParcelaFormula {
  taxa: number;
  fator: number;
  limiar: number;
}

export interface LinhaRetencao {
  ate: number | null;
  taxaMarginal: number;
  parcelaAbater?: number;
  parcelaAbaterFormula?: ParcelaFormula;
}

export interface TabelaRetencao {
  aplica: string[];
  parcelaAdicionalDependente: number;
  linhas: LinhaRetencao[];
}

export interface RegrasRetencao {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  formula: string;
  regras: {
    tresOuMaisDependentes: { reducaoTaxaMarginal: number };
  };
  tabelas: Record<"I" | "II" | "III", TabelaRetencao>;
}

export const REGRAS_RETENCAO: Record<number, RegrasRetencao> = {
  2026: retencao2026 as RegrasRetencao,
};

export type SituacaoRetencao =
  | "naoCasado"
  | "casadoDoisTitulares"
  | "casadoUnicoTitular";

export type TabelaId = "I" | "II" | "III";

/** Tabela aplicável: III para casado único titular; II só a não casado com dependentes. */
export function tabelaAplicavel(
  situacao: SituacaoRetencao,
  dependentes: number
): TabelaId {
  if (situacao === "casadoUnicoTitular") return "III";
  if (situacao === "naoCasado" && dependentes > 0) return "II";
  return "I";
}

export interface ResultadoRetencao {
  tabela: TabelaId;
  taxaMarginal: number; // já com a redução de 1 p.p. se 3+ dependentes
  parcelaAbater: number;
  retencao: number; // €/mês, ≥ 0
  taxaEfetiva: number;
  escalaoAte: number | null;
}

/**
 * Retenção mensal sobre um bruto de trabalho dependente (continente, 2026).
 * Não cobre: deficiência, pensões, Açores/Madeira, trabalho suplementar,
 * opção por taxa inteira superior — situações fora do âmbito declarado no JSON.
 */
export function retencaoNaFonte(
  brutoMensal: number,
  situacao: SituacaoRetencao,
  dependentes = 0,
  ano = 2026
): ResultadoRetencao {
  const regras = REGRAS_RETENCAO[ano];
  if (!regras) throw new Error(`Tabelas de retenção para ${ano} não disponíveis`);

  const tabelaId = tabelaAplicavel(situacao, dependentes);
  const tabela = regras.tabelas[tabelaId];
  const linha = tabela.linhas.find((l) => l.ate === null || brutoMensal <= l.ate);
  if (!linha) throw new Error(`Remuneração ${brutoMensal} fora das tabelas`);

  const reducao =
    dependentes >= 3 ? regras.regras.tresOuMaisDependentes.reducaoTaxaMarginal : 0;
  const taxaMarginal = Math.max(0, linha.taxaMarginal - reducao);

  const parcelaAbater =
    linha.parcelaAbater ??
    (linha.parcelaAbaterFormula
      ? linha.parcelaAbaterFormula.taxa *
        linha.parcelaAbaterFormula.fator *
        (linha.parcelaAbaterFormula.limiar - brutoMensal)
      : 0);

  const retencao = Math.max(
    0,
    brutoMensal * taxaMarginal -
      parcelaAbater -
      tabela.parcelaAdicionalDependente * dependentes
  );

  return {
    tabela: tabelaId,
    taxaMarginal,
    parcelaAbater,
    retencao,
    taxaEfetiva: brutoMensal > 0 ? retencao / brutoMensal : 0,
    escalaoAte: linha.ate,
  };
}
