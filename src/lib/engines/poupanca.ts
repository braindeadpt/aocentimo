export interface ResultadoPoupanca {
  capitalFinalBruto: number;
  jurosBrutos: number;
  imposto: number;
  capitalFinalLiquido: number;
  taxaLiquida: number;
  valorReal: number; // deflacionado pela inflação anual indicada
}

/**
 * Juro composto com capitalização anual e tributação sobre os juros
 * (retencção liberatória, por defeito 28 %).
 */
export function simularPoupanca(
  capital: number,
  anos: number,
  taxaBrutaAnual: number,
  taxaImposto = 0.28,
  inflacaoAnual = 0
): ResultadoPoupanca {
  const liquida = taxaBrutaAnual * (1 - taxaImposto);
  const finalBruto = capital * Math.pow(1 + taxaBrutaAnual, anos);
  const finalLiquido = capital * Math.pow(1 + liquida, anos);
  const valorReal = finalLiquido / Math.pow(1 + inflacaoAnual, anos);

  return {
    capitalFinalBruto: finalBruto,
    jurosBrutos: finalBruto - capital,
    imposto: (finalBruto - capital) * taxaImposto,
    capitalFinalLiquido: finalLiquido,
    taxaLiquida: liquida,
    valorReal,
  };
}

/**
 * Certificados de Aforro Série F: taxa base + prémio de permanência por ano.
 * `premios` = [{anos: "2.º ao 5.º", pp}] — aqui passamos a tabela já em
 * [{de, ate, pp}] para o cálculo.
 */
export function taxaCAPorAno(
  ano: number,
  taxaBase: number,
  premios: { de: number; ate: number; pp: number }[]
): number {
  for (const p of premios) {
    if (ano >= p.de && ano <= p.ate) return taxaBase + p.pp / 100;
  }
  return taxaBase;
}
