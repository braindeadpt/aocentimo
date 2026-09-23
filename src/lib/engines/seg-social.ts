import ss from "@data/fiscal/ss.json";

/** Taxas TSU — fonte e vigência em data/fiscal/ss.json. */
export const TSU_TRABALHADOR = ss.trabalhador.taxa;
export const TSU_ENTIDADE = ss.entidadePatronal.taxa;

export interface Contribuicoes {
  trabalhador: number; // sai do recibo (11 %)
  entidade: number; // custo invisível para o trabalhador (23,75 %)
  total: number;
  custoEmpresa: number; // bruto + TSU entidade
}

/**
 * Contribuições para a Segurança Social sobre um bruto mensal de trabalho
 * dependente (conta de outrem, continente).
 */
export function contribuicoes(bruto: number): Contribuicoes {
  const trabalhador = bruto * TSU_TRABALHADOR;
  const entidade = bruto * TSU_ENTIDADE;
  return {
    trabalhador,
    entidade,
    total: trabalhador + entidade,
    custoEmpresa: bruto + entidade,
  };
}

/**
 * O que um euro de salário custa e o que fica antes de IRS —
 * a base do "peso do Estado" no custo total do trabalho.
 */
export function custoDoTrabalho(bruto: number): {
  custoEmpresa: number;
  bruto: number;
  ssTrabalhador: number;
  ssEntidade: number;
  antesDeIrs: number;
  pesoSS: number; // SS total / custo empresa
} {
  const c = contribuicoes(bruto);
  return {
    custoEmpresa: c.custoEmpresa,
    bruto,
    ssTrabalhador: c.trabalhador,
    ssEntidade: c.entidade,
    antesDeIrs: bruto - c.trabalhador,
    pesoSS: c.custoEmpresa > 0 ? c.total / c.custoEmpresa : 0,
  };
}
