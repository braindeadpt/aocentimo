import deducoes from "@data/fiscal/deducoes-2026.json";
import ppr from "@data/fiscal/ppr.json";
import { REGRAS_IRS, simularSalario, ResultadoSalario } from "./irs";
import { retencaoNaFonte } from "./retencao";

/**
 * IRS anual completo — o acerto de contas: deduções à coleta por
 * categoria com tetos próprios, limite global do art. 78.º e comparação
 * com o que retiveste ao longo do ano (retenção × 14 meses).
 */

interface CatDed {
  pct?: number;
  limite: number;
}

interface RegrasDeducoes {
  ano: number;
  fonte: string;
  fonteUrl: string;
  categorias: Record<
    "saude" | "educacao" | "rendas" | "lares" | "ivaFatura" | "pensoesAlimentos",
    CatDed
  >;
  limiteGlobal: {
    max: number;
    min: number;
    majoraçãoPorDependente: number;
    aPartirDeDependentes: number;
  };
}

const REGRAS_DED = deducoes as RegrasDeducoes;
export const REGRAS_PPR = ppr;

export interface DespesasInput {
  saude: number;
  educacao: number;
  rendas: number;
  lares: number;
  ivaFatura: number; // valor da dedução já apurada no e-Fatura
  pprEntregas: number;
  idadeTitular?: number; // para o teto do PPR
}

export interface LinhaDeducao {
  categoria: string;
  despesa: number;
  deducao: number; // após teto da categoria
  limite: number;
}

export interface ResultadoIrsAnual extends ResultadoSalario {
  linhasDeducao: LinhaDeducao[];
  deducaoPpr: number;
  limiteGlobal: number; // ∞ se não aplicável
  dentroDoLimiteGlobal: number;
  retidoAno: number; // retenção estimada × 14
  reembolsoEstimado: number; // positivo = devolvem-te; negativo = pagas
}

/** Teto da dedução PPR por idade (art. 21.º EBF). */
export function limitePpr(idade: number): number {
  const l = REGRAS_PPR.deducao.limitesPorIdade.find((x) => x.ate === null || idade <= x.ate);
  return l?.limite ?? 0;
}

/**
 * Limite global das deduções (art. 78.º): sem limite no 1.º escalão;
 * 1 000 € acima do limiar do último; interpolação entre 2 500 e 1 000 €.
 */
export function limiteGlobalDeducoes(rc: number, dependentes: number, ano = 2026): number {
  const regras = REGRAS_IRS[ano];
  const primeiro = regras.escaloes[0].ate ?? 0;
  const ultimo = regras.escaloes[regras.escaloes.length - 2].ate ?? Infinity;
  const lg = REGRAS_DED.limiteGlobal;

  let base: number;
  if (rc <= primeiro) base = Infinity;
  else if (rc > ultimo) base = lg.min;
  else base = lg.min + (lg.max - lg.min) * ((ultimo - rc) / (ultimo - primeiro));

  if (dependentes >= lg.aPartirDeDependentes)
    base *= 1 + lg.majoraçãoPorDependente * dependentes;
  return base;
}

/**
 * IRS anual de um titular (não casado) com deduções detalhadas.
 * O limite global não abrange despesas gerais nem dependentes.
 */
export function simularIrsAnual(
  brutoMensal: number,
  dependentes: number,
  despesas: DespesasInput,
  ano = 2026
): ResultadoIrsAnual {
  const base = simularSalario([brutoMensal], dependentes, ano);
  const regras = REGRAS_IRS[ano];
  const cats = REGRAS_DED.categorias;

  const linhas: LinhaDeducao[] = (
    [
      ["Saúde", despesas.saude, cats.saude],
      ["Educação", despesas.educacao, cats.educacao],
      ["Rendas", despesas.rendas, cats.rendas],
      ["Lares e apoio", despesas.lares, cats.lares],
      ["IVA das faturas", despesas.ivaFatura, cats.ivaFatura],
    ] as [string, number, CatDed][]
  ).map(([categoria, despesa, c]) => ({
    categoria,
    despesa,
    deducao: c.pct !== undefined ? Math.min(despesa * c.pct, c.limite) : Math.min(despesa, c.limite),
    limite: c.limite,
  }));

  const dedPpr = Math.min(
    despesas.pprEntregas * REGRAS_PPR.deducao.pct,
    limitePpr(despesas.idadeTitular ?? 30)
  );

  const dentroDoLimite = linhas.reduce((a, l) => a + l.deducao, 0) + dedPpr;
  const lg = limiteGlobalDeducoes(base.coletavelTributado, dependentes, ano);
  const dentroFinal = Math.min(dentroDoLimite, lg);

  // fora do limite global: despesas gerais + dependentes (já no simularSalario)
  const foraDoLimite =
    regras.despesasGeraisPorTitular + regras.deducaoPorDependente * dependentes;

  const irsAnual = Math.max(0, base.irsBruto - dentroFinal - foraDoLimite);
  const retido =
    retencaoNaFonte(brutoMensal, "naoCasado", dependentes, ano).retencao * 14;

  return {
    ...base,
    irsAnual,
    deducoesColeta: dentroFinal + foraDoLimite,
    liquidoAnual: base.brutoAnualTotal - base.ssAnual - irsAnual,
    linhasDeducao: linhas,
    deducaoPpr: dedPpr,
    limiteGlobal: lg,
    dentroDoLimiteGlobal: dentroFinal,
    retidoAno: retido,
    reembolsoEstimado: retido - irsAnual,
  };
}
