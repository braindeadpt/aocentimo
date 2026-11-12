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

/** Um ano da vida de uma poupança — para a caderneta e a divergência. */
export interface PontoPoupanca {
  ano: number;
  /** saldo líquido no fim do ano — já sem imposto */
  saldo: number;
  /** poder de compra desse saldo, em euros de hoje */
  real: number;
  /** juro bruto ganho NESSE ano */
  juro: number;
  /** imposto retido NESSE ano */
  imposto: number;
}

const ponto = (
  ano: number,
  saldo: number,
  juro: number,
  imposto: number,
  inflacaoAnual: number
): PontoPoupanca => ({
  ano,
  saldo,
  real: saldo / Math.pow(1 + inflacaoAnual, ano),
  juro,
  imposto,
});

/**
 * Trajectória anual do depósito a prazo — juro composto anual, imposto
 * retido sobre cada vencimento. O último ponto bate com
 * `simularPoupanca(...).capitalFinalLiquido` / `valorReal`.
 */
export function trajetoriaDeposito(
  capital: number,
  anos: number,
  taxaBrutaAnual: number,
  taxaImposto: number,
  inflacaoAnual = 0
): PontoPoupanca[] {
  const out: PontoPoupanca[] = [];
  let cap = capital;
  for (let a = 1; a <= Math.round(anos); a++) {
    const juro = cap * taxaBrutaAnual;
    const imp = juro * taxaImposto;
    cap += juro - imp;
    out.push(ponto(a, cap, juro, imp, inflacaoAnual));
  }
  return out;
}

/**
 * Trajectória anual de CA Série F — capitaliza trimestralmente como
 * `simularCA`, emite um ponto por ano civil do certificado.
 */
export function trajetoriaCA(
  capital: number,
  anos: number,
  taxaBase: number,
  premios: PremioPermanencia[],
  taxaImposto: number,
  inflacaoAnual = 0
): PontoPoupanca[] {
  const out: PontoPoupanca[] = [];
  let cap = capital;
  let juroAno = 0;
  let impostoAno = 0;
  const trimestres = Math.round(anos * 4);
  for (let t = 1; t <= trimestres; t++) {
    const ano = Math.ceil(t / 4);
    const taxa = taxaCAPorAno(ano, taxaBase, premios);
    const juro = cap * (taxa / 4);
    cap += juro * (1 - taxaImposto);
    juroAno += juro;
    impostoAno += juro * taxaImposto;
    if (t % 4 === 0) {
      out.push(ponto(ano, cap, juroAno, impostoAno, inflacaoAnual));
      juroAno = 0;
      impostoAno = 0;
    }
  }
  // anos fraccionados: emite o ponto parcial se o trimestre final não fechou o ano
  if (trimestres % 4 !== 0) {
    const a = Math.ceil(trimestres / 4);
    out.push({ ano: a, saldo: cap, real: cap / Math.pow(1 + inflacaoAnual, anos), juro: juroAno, imposto: impostoAno });
  }
  return out;
}

/**
 * Trajectória anual de CTPC — juros anuais com taxa crescente + prémio
 * PIB do 2.º ano em diante, como `simularCTPC`.
 */
export function trajetoriaCTPC(
  capital: number,
  anos: number,
  taxasPorAno: number[],
  premio: number,
  taxaImposto: number,
  inflacaoAnual = 0
): PontoPoupanca[] {
  const out: PontoPoupanca[] = [];
  let cap = capital;
  const n = Math.min(Math.round(anos), taxasPorAno.length);
  for (let a = 1; a <= n; a++) {
    const taxa = taxasPorAno[a - 1] + (a >= 2 ? premio : 0);
    const juro = cap * taxa;
    const imp = juro * taxaImposto;
    cap += juro - imp;
    out.push(ponto(a, cap, juro, imp, inflacaoAnual));
  }
  return out;
}

/**
 * Trajectória anual dos Certificados do Tesouro (série 5) — juros anuais
 * com taxa fixa por ano de vida e, ao contrário da CA e dos CTPC,
 * **sem capitalização**: cada juro incide sobre o capital subscrito, não
 * sobre o acumulado, porque os juros são creditados no IBAN ano a ano.
 * O `saldo` de cada ponto é por isso o que o bolso tem fora — capital mais
 * os juros já recebidos, líquidos — e não uma conta que cresce a juro
 * composto. Ver data/fiscal/ct.json.
 */
export function trajetoriaCT(
  capital: number,
  taxasPorAno: number[],
  taxaImposto: number,
  inflacaoAnual = 0
): PontoPoupanca[] {
  const out: PontoPoupanca[] = [];
  let recebido = 0;
  for (let a = 1; a <= taxasPorAno.length; a++) {
    const juro = capital * taxasPorAno[a - 1];
    const imp = juro * taxaImposto;
    recebido += juro - imp;
    out.push(ponto(a, capital + recebido, juro, imp, inflacaoAnual));
  }
  return out;
}

/** O colchão: nominal parado, o real a escorregar para a inflação. */
export function trajetoriaColchao(
  capital: number,
  anos: number,
  inflacaoAnual = 0
): PontoPoupanca[] {
  const out: PontoPoupanca[] = [];
  for (let a = 1; a <= Math.round(anos); a++) {
    out.push(ponto(a, capital, 0, 0, inflacaoAnual));
  }
  return out;
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

/**
 * Certificados do Tesouro Poupança Crescimento (7 anos, juros anuais):
 * taxa fixa crescente por ano de vida; do 2.º ano soma-se o prémio de
 * remuneração ligado ao PIB (40 % do crescimento real, máx. 1,2 %).
 * Ver data/fiscal/ca.json → ctpc.
 */
export function simularCTPC(
  capital: number,
  anos: number,
  taxasPorAno: number[],
  premio: number,
  taxaImposto: number,
  inflacaoAnual = 0
): ResultadoPoupanca {
  const n = Math.min(Math.round(anos), taxasPorAno.length);
  let capBruto = capital;
  let capLiquido = capital;
  let imposto = 0;

  for (let a = 1; a <= n; a++) {
    const taxa = taxasPorAno[a - 1] + (a >= 2 ? premio : 0);
    const juro = capLiquido * taxa;
    capBruto *= 1 + taxa;
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

/**
 * Certificados do Tesouro — série 5: dez anos, taxa fixa por ano de vida,
 * juros anuais e **sem capitalização**. Cada ano o juro incide sobre o
 * capital subscrito; o capital só volta ao fim do prazo, ao valor nominal.
 *
 * Por isso o resultado não é uma compoundagem disfarçada: a diferença entre
 * este motor e `simularCTPC` para os mesmos números é real e grande, e é
 * exactamente o que a pessoa que subscreve vai ter no banco.
 */
export function simularCT(
  capital: number,
  anos: number,
  taxasPorAno: number[],
  taxaImposto: number,
  inflacaoAnual = 0
): ResultadoPoupanca {
  const n = Math.min(Math.round(anos), taxasPorAno.length);
  let jurosBrutos = 0;
  let imposto = 0;

  for (let a = 0; a < n; a++) {
    const juro = capital * taxasPorAno[a];
    jurosBrutos += juro;
    imposto += juro * taxaImposto;
  }

  const liquido = capital + jurosBrutos - imposto;
  return {
    capitalFinalBruto: capital + jurosBrutos,
    jurosBrutos,
    imposto,
    capitalFinalLiquido: liquido,
    taxaLiquida: liquido / capital - 1,
    valorReal: liquido / Math.pow(1 + inflacaoAnual, n),
  };
}

/**
 * Resgate antecipado dos Certificados do Tesouro, como a ficha técnica
 * escreve: só a partir de um ano, e **perde-se a totalidade dos juros
 * decorridos desde o último vencimento** até à data do resgate. O capital
 * volta ao valor nominal.
 *
 * `anosDecorridos` é o tempo que passou desde a subscrição, em anos
 * completos e uma fracção: o resgate pode acontecer a meio do ano, e é
 * esse meio ano que se perde por inteiro. Resgatar no dia do vencimento
 * não custa juro nenhum — o crédito foi feito nesse dia.
 *
 * O que se devolve é o capital mais os juros já *vencidos* (isto é, os dos
 * anos completos anteriores), e não o que estaria a correr até à data.
 */
export function resgateAntecipadoCT(
  capital: number,
  anosDecorridos: number,
  taxasPorAno: number[],
  taxaImposto: number
): {
  /** Capital mais os juros já vencidos, líquidos — o que entra na conta. */
  valorRecebido: number;
  /** Juros do ano em curso que se perdem por resgatar agora. */
  jurosPerdidos: number;
  /** Anos que o certificado ainda tinha para correr. */
  anosQueFaltavam: number;
} {
  const decorridos = Math.max(0, anosDecorridos);
  const anosCompletos = Math.min(Math.floor(decorridos), taxasPorAno.length);
  const fracao = decorridos - anosCompletos;

  let recebido = 0;
  for (let a = 0; a < anosCompletos; a++) {
    recebido += capital * taxasPorAno[a] * (1 - taxaImposto);
  }

  // Só se perde o juro se já passou algum tempo desde o último vencimento.
  // Resgatar no dia do vencimento não custa nada: o juro foi creditado.
  const anoEmCurso = anosCompletos + 1;
  const jurosPerdidos =
    fracao > 0 && anoEmCurso <= taxasPorAno.length
      ? capital * taxasPorAno[anoEmCurso - 1] * (1 - taxaImposto)
      : 0;

  return {
    valorRecebido: capital + recebido,
    jurosPerdidos,
    anosQueFaltavam: Math.max(0, taxasPorAno.length - decorridos),
  };
}

/**
 * Trajectória anual com entregas periódicas mensais (`reforcoMensal`).
 *
 * Regras legais de subscrição e limites dos produtos IGCP (Portaria 149-A/2023
 * e RCM 141-A/2026):
 * - Depósito e Colchão aceitam qualquer reforço mensal.
 * - CA Série F exige mínimo de 100 € por subscrição e tem tecto legal de
 *   50 000 € de capital subscrito acumulado por titular (`maximoEurosCA`).
 *   O que exceder 50 000 € de entregas (ou reforços abaixo de 100 €) fica
 *   na conta à ordem sem render juros de CA.
 * - CT Série 5 exige mínimo de 1 000 € por subscrição e não capitaliza juros:
 *   reforços mensais abaixo de 1 000 € não geram novas subscrições de CT
 *   (ficam fora do certificado, à ordem); a partir de 1 000 €/mês, cada
 *   ano de entregas abre uma tranche que vence juros anuais simples pela
 *   tabela de taxas a partir do ano seguinte.
 */
export function trajetoriaComReforco(opts: {
  produto: "dep" | "ca" | "ct" | "colchao";
  capitalInicial: number;
  reforcoMensal: number;
  anos: number;
  taxaImposto: number;
  inflacaoAnual?: number;
  taxaDeposito?: number;
  taxaCA?: number;
  premiosCA?: PremioPermanencia[];
  minimoSubscricaoCA?: number;
  maximoEurosCA?: number;
  taxasCT?: number[];
  minimoSubscricaoCT?: number;
  maximoEurosCT?: number;
}): PontoPoupanca[] {
  const {
    produto,
    capitalInicial,
    reforcoMensal,
    anos,
    taxaImposto,
    inflacaoAnual = 0,
    taxaDeposito = 0,
    taxaCA = 0,
    premiosCA = [],
    minimoSubscricaoCA = 100,
    maximoEurosCA = 50000,
    taxasCT = [],
    minimoSubscricaoCT = 1000,
    maximoEurosCT = 1000000,
  } = opts;

  const refMes = Math.max(0, reforcoMensal);
  const nAnos = Math.max(1, Math.round(anos));

  if (produto === "colchao") {
    const out: PontoPoupanca[] = [];
    for (let a = 1; a <= nAnos; a++) {
      const saldo = capitalInicial + refMes * 12 * a;
      out.push(ponto(a, saldo, 0, 0, inflacaoAnual));
    }
    return out;
  }

  if (produto === "dep") {
    if (refMes === 0) {
      return trajetoriaDeposito(
        capitalInicial,
        nAnos,
        taxaDeposito,
        taxaImposto,
        inflacaoAnual
      );
    }
    const out: PontoPoupanca[] = [];
    let saldo = capitalInicial;
    for (let a = 1; a <= nAnos; a++) {
      const entregasAno = refMes * 12;
      // Entregas mensais distribuídas ao longo do ano rendem em média meio ano no ano de entrada
      const baseMedia = saldo + entregasAno * 0.5;
      const juro = baseMedia * taxaDeposito;
      const imp = juro * taxaImposto;
      saldo += entregasAno + juro - imp;
      out.push(ponto(a, saldo, juro, imp, inflacaoAnual));
    }
    return out;
  }

  if (produto === "ca") {
    const nCA = Math.min(nAnos, 15);
    const capSub0 = Math.min(capitalInicial, maximoEurosCA);
    const fora0 = Math.max(0, capitalInicial - capSub0);
    if (refMes === 0 && fora0 === 0) {
      return trajetoriaCA(
        capSub0,
        nCA,
        taxaCA,
        premiosCA,
        taxaImposto,
        inflacaoAnual
      );
    }

    // Cada tranche trimestral tem o seu próprio relógio de permanência (trimestrescorridos)
    const tranches: { saldo: number; trimestres: number }[] =
      capSub0 > 0 ? [{ saldo: capSub0, trimestres: 0 }] : [];
    let subscritoTotal = capSub0;
    let foraCA = fora0;
    const out: PontoPoupanca[] = [];

    for (let a = 1; a <= nCA; a++) {
      let juroAno = 0;
      let impAno = 0;
      for (let q = 1; q <= 4; q++) {
        // 1. Vencimento trimestral das tranches já subscritas
        for (const tr of tranches) {
          tr.trimestres += 1;
          const anoVida = Math.ceil(tr.trimestres / 4);
          const taxa = taxaCAPorAno(anoVida, taxaCA, premiosCA);
          const juro = tr.saldo * (taxa / 4);
          const imp = juro * taxaImposto;
          tr.saldo += juro - imp;
          juroAno += juro;
          impAno += imp;
        }
        // 2. Entregas dos 3 meses do trimestre (se cada entrega ≥ mínimo de subscrição 100 €)
        if (refMes > 0) {
          const entregaTrim = refMes * 3;
          if (refMes >= minimoSubscricaoCA && subscritoTotal < maximoEurosCA) {
            const cabe = Math.min(entregaTrim, maximoEurosCA - subscritoTotal);
            if (cabe >= minimoSubscricaoCA) {
              tranches.push({ saldo: cabe, trimestres: 0 });
              subscritoTotal += cabe;
              foraCA += entregaTrim - cabe;
            } else {
              foraCA += entregaTrim;
            }
          } else {
            foraCA += entregaTrim;
          }
        }
      }
      const saldoTotal =
        tranches.reduce((s, tr) => s + tr.saldo, 0) + foraCA;
      out.push(ponto(a, saldoTotal, juroAno, impAno, inflacaoAnual));
    }
    return out;
  }

  // produto === "ct" (Certificados do Tesouro Série 5)
  const prazoCT = taxasCT.length || 10;
  const nCT = Math.min(nAnos, prazoCT);
  const capSub0 =
    capitalInicial >= minimoSubscricaoCT
      ? Math.min(capitalInicial, maximoEurosCT)
      : 0;
  const fora0 = capitalInicial - capSub0;

  if (refMes === 0 && fora0 === 0) {
    return trajetoriaCT(
      capSub0,
      taxasCT.slice(0, nCT),
      taxaImposto,
      inflacaoAnual
    );
  }

  // Sem capitalização: cada tranche anual subscrita vence juros simples pela sua idade
  const tranchesCT: { capital: number; anosVida: number }[] =
    capSub0 > 0 ? [{ capital: capSub0, anosVida: 0 }] : [];
  let subscritoCT = capSub0;
  let foraCT = fora0;
  let jurosLiquidosAcum = 0;
  const out: PontoPoupanca[] = [];

  for (let a = 1; a <= nCT; a++) {
    let juroAno = 0;
    let impAno = 0;
    for (const tr of tranchesCT) {
      if (tr.anosVida < taxasCT.length) {
        const taxa = taxasCT[tr.anosVida];
        const juro = tr.capital * taxa;
        const imp = juro * taxaImposto;
        juroAno += juro;
        impAno += imp;
        jurosLiquidosAcum += juro - imp;
        tr.anosVida += 1;
      }
    }
    if (refMes > 0) {
      const entregaAno = refMes * 12;
      // Em CT Série 5 cada subscrição exige no mínimo 1 000 € (1 000 unidades)
      if (refMes >= minimoSubscricaoCT && subscritoCT < maximoEurosCT) {
        const cabe = Math.min(entregaAno, maximoEurosCT - subscritoCT);
        if (cabe >= minimoSubscricaoCT) {
          tranchesCT.push({ capital: cabe, anosVida: 0 });
          subscritoCT += cabe;
          foraCT += entregaAno - cabe;
        } else {
          foraCT += entregaAno;
        }
      } else {
        foraCT += entregaAno;
      }
    }
    const saldoTotal = subscritoCT + foraCT + jurosLiquidosAcum;
    out.push(ponto(a, saldoTotal, juroAno, impAno, inflacaoAnual));
  }
  return out;
}

/**
 * Resumo final (`ResultadoPoupanca`) a partir de `trajetoriaComReforco`,
 * contabilizando o total investido (`capitalInicial + reforcoMensal * 12 * anosEf`).
 */
export function simularComReforco(
  opts: Parameters<typeof trajetoriaComReforco>[0]
): ResultadoPoupanca & { totalEntregas: number; capitalSubscritoProduto: number } {
  const pts = trajetoriaComReforco(opts);
  const nEf = pts.length;
  const refMes = Math.max(0, opts.reforcoMensal);
  const totalEntregas = opts.capitalInicial + refMes * 12 * nEf;
  const jurosBrutos = pts.reduce((s, p) => s + p.juro, 0);
  const imposto = pts.reduce((s, p) => s + p.imposto, 0);
  const ultimo = pts[pts.length - 1];
  const liquido = ultimo ? ultimo.saldo : totalEntregas;
  const real =
    ultimo ? ultimo.real : totalEntregas / Math.pow(1 + (opts.inflacaoAnual ?? 0), nEf);

  let capitalSubscritoProduto = totalEntregas;
  if (opts.produto === "ca") {
    const maxCA = opts.maximoEurosCA ?? 50000;
    const minCA = opts.minimoSubscricaoCA ?? 100;
    const cap0 = Math.min(opts.capitalInicial, maxCA);
    const entregasValidas = refMes >= minCA ? refMes * 12 * nEf : 0;
    capitalSubscritoProduto = Math.min(maxCA, cap0 + entregasValidas);
  } else if (opts.produto === "ct") {
    const maxCT = opts.maximoEurosCT ?? 1000000;
    const minCT = opts.minimoSubscricaoCT ?? 1000;
    const cap0 =
      opts.capitalInicial >= minCT ? Math.min(opts.capitalInicial, maxCT) : 0;
    const entregasValidas = refMes >= minCT ? refMes * 12 * nEf : 0;
    capitalSubscritoProduto = Math.min(maxCT, cap0 + entregasValidas);
  }

  return {
    capitalFinalBruto: totalEntregas + jurosBrutos,
    jurosBrutos,
    imposto,
    capitalFinalLiquido: liquido,
    taxaLiquida: totalEntregas > 0 ? liquido / totalEntregas - 1 : 0,
    valorReal: real,
    totalEntregas,
    capitalSubscritoProduto,
  };
}

