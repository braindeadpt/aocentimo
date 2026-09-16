export interface ResultadoPoupanca {
  capitalFinalBruto: number;
  jurosBrutos: number;
  imposto: number;
  capitalFinalLiquido: number;
  taxaLiquida: number;
  valorReal: number; // deflacionado pela inflação anual indicada
}

export interface PremioPermanencia {
  de: number;
  ate: number;
  pp: number; // pontos percentuais a somar à taxa base
}

/**
 * Depósito a prazo: capitalização anual, imposto retido sobre os juros
 * creditados em cada ano (retenção liberatória — ver data/fiscal/capitais.json).
 * A taxa de imposto é obrigatória: nunca há defaults fiscais no código.
 */
export function simularPoupanca(
  capital: number,
  anos: number,
  taxaBrutaAnual: number,
  taxaImposto: number,
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

/** Taxa anual de CA num dado ano de vida do certificado (base + prémio). */
export function taxaCAPorAno(
  ano: number,
  taxaBase: number,
  premios: PremioPermanencia[]
): number {
  for (const p of premios) {
    if (ano >= p.de && ano <= p.ate) return taxaBase + p.pp / 100;
  }
  return taxaBase;
}

/**
 * Certificados de Aforro Série F: juros vencem e capitalizam
 * trimestralmente; a retenção incide sobre cada vencimento. O prémio de
 * permanência soma-se à taxa base conforme o ano de vida do certificado.
 */
export function simularCA(
  capital: number,
  anos: number,
  taxaBase: number,
  premios: PremioPermanencia[],
  taxaImposto: number,
  inflacaoAnual = 0
): ResultadoPoupanca {
  let capBruto = capital;
  let capLiquido = capital;
  let imposto = 0;

  const trimestres = Math.round(anos * 4);
  for (let t = 1; t <= trimestres; t++) {
    const ano = Math.ceil(t / 4);
    const taxa = taxaCAPorAno(ano, taxaBase, premios);
    const juro = capLiquido * (taxa / 4);
    capBruto *= 1 + taxa / 4;
    capLiquido += juro * (1 - taxaImposto);
    imposto += juro * taxaImposto;
  }

  return {
    capitalFinalBruto: capBruto,
    jurosBrutos: capBruto - capital,
    imposto,
    capitalFinalLiquido: capLiquido,
    taxaLiquida: capLiquido / capital - 1,
    valorReal: capLiquido / Math.pow(1 + inflacaoAnual, anos),
  };
}
