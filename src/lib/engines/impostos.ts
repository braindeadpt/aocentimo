export interface DecomposicaoCombustivel {
  precoFinal: number;
  iva: number;
  isp: number;
  carbono: number;
  impostos: number;
  produto: number; // custo + margens (o que resta)
  pesoImpostos: number;
}

/**
 * Decomposição do preço de combustível por litro.
 * O IVA incide sobre o preço final (que já inclui ISP e carbono) —
 * a chamada "tributação em cascata": paga-se IVA sobre imposto.
 */
export function decomporCombustivel(
  precoLitro: number,
  isp: number,
  carbono: number,
  taxaIva = 0.23
): DecomposicaoCombustivel {
  const iva = precoLitro - precoLitro / (1 + taxaIva);
  const impostos = iva + isp + carbono;
  const produto = precoLitro - impostos;

  return {
    precoFinal: precoLitro,
    iva,
    isp,
    carbono,
    impostos,
    produto,
    pesoImpostos: impostos / precoLitro,
  };
}

export interface IvaProduto {
  precoFinal: number;
  iva: number;
  semIva: number;
  pesoIva: number;
}

/** Parcela de IVA contida num preço final. */
export function ivaContido(precoFinal: number, taxaIva: number): IvaProduto {
  const iva = precoFinal - precoFinal / (1 + taxaIva);
  return {
    precoFinal,
    iva,
    semIva: precoFinal - iva,
    pesoIva: iva / precoFinal,
  };
}
