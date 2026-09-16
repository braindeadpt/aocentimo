import { simularPrestacao } from "./prestacao";

export interface CustosCredito {
  /** Comissões iniciais: dossier, avaliação, registos, imposto de selo (€, uma vez). */
  iniciais?: number;
  /** Custos recorrentes: seguros obrigatórios, comissão de conta (€/mês). */
  mensais?: number;
}

export interface ResultadoTaeg {
  prestacao: number;
  prestacaoComCustos: number; // prestação + custos mensais
  tan: number;
  taeg: number; // taxa anual efetiva — inclui todos os custos
  mtic: number; // montante total imputado ao consumidor
  jurosTotais: number;
  custosTotais: number;
}

/**
 * TAEG por bisseção: a taxa mensal i que iguala o capital efetivamente
 * recebido (capital − custos iniciais) ao valor presente de todos os
 * pagamentos (prestação + custos mensais). TAEG = (1+i)^12 − 1.
 *
 * MTIC = tudo o que o consumidor paga: prestações + custos mensais +
 * custos iniciais.
 */
export function simularTaeg(
  capital: number,
  prazoMeses: number,
  euribor: number,
  spread: number,
  custos: CustosCredito = {}
): ResultadoTaeg {
  const iniciais = custos.iniciais ?? 0;
  const mensais = custos.mensais ?? 0;
  const n = Math.round(prazoMeses);

  const base = simularPrestacao(capital, prazoMeses, euribor, spread);
  const pagamento = base.prestacao + mensais;
  const recebido = capital - iniciais;

  // f(i) = valor presente dos pagamentos − capital recebido
  const f = (i: number) => {
    if (i === 0) return n * pagamento - recebido;
    return (pagamento * (1 - Math.pow(1 + i, -n))) / i - recebido;
  };

  let lo = 0;
  let hi = 0.05; // 5 %/mês — tecto mais que suficiente
  if (f(lo) <= 0) {
    hi = 0; // pagamentos não cobrem o capital — custos impossíveis
  } else {
    while (f(hi) > 0 && hi < 1) hi *= 2;
    for (let k = 0; k < 80; k++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid;
      else hi = mid;
    }
  }
  const i = (lo + hi) / 2;

  const mtic = n * pagamento + iniciais;
  return {
    prestacao: base.prestacao,
    prestacaoComCustos: pagamento,
    tan: base.tan,
    taeg: Math.pow(1 + i, 12) - 1,
    mtic,
    jurosTotais: base.jurosTotais,
    custosTotais: mtic - capital,
  };
}
