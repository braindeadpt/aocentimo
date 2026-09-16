export interface LinhaAmortizacao {
  mes: number;
  prestacao: number;
  juro: number;
  capital: number;
  divida: number;
}

export interface ResultadoPrestacao {
  prestacao: number;
  jurosTotais: number;
  custoTotal: number;
  tan: number;
  linhas: LinhaAmortizacao[];
}

/**
 * Sistema de amortização francês (prestação constante).
 * P = C · i / (1 − (1+i)^−n), i = taxa anual nominal / 12.
 */
export function simularPrestacao(
  capital: number,
  prazoMeses: number,
  euribor: number,
  spread: number
): ResultadoPrestacao {
  const tan = euribor + spread;
  const i = tan / 12;
  const n = Math.round(prazoMeses);

  const prestacao = i === 0 ? capital / n : (capital * i) / (1 - Math.pow(1 + i, -n));

  let divida = capital;
  let jurosTotais = 0;
  const linhas: LinhaAmortizacao[] = [];

  for (let mes = 1; mes <= n; mes++) {
    const juro = divida * i;
    const amortizado = prestacao - juro;
    divida = Math.max(0, divida - amortizado);
    jurosTotais += juro;
    linhas.push({ mes, prestacao, juro, capital: amortizado, divida });
  }

  return {
    prestacao,
    jurosTotais,
    custoTotal: capital + jurosTotais,
    tan,
    linhas,
  };
}
