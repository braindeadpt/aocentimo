/**
 * Núcleo puro do simulador de Pequena Empresa (PME / Sociedade por Quotas) —
 * sem imports de @data/fiscal/*.json para poder ser importado em componentes
 * "use client" sem arrastar JSONs fiscais para o bundle do cliente.
 */

export type RegiaoPme = "continente" | "acores" | "madeira";

export interface RegrasIrcPuro {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  taxasGerais: Record<RegiaoPme, number>;
  pmeSmallMidCap: {
    limiteMateriaColetavelReduzida: number;
    taxaReduzidaPrimeiroEscalao: Record<RegiaoPme, number>;
    taxaExcedente: Record<RegiaoPme, number>;
    baseLegal: string;
    nota: string;
  };
  interiorPme: {
    limiteMateriaColetavelReduzida: number;
    taxaReduzidaPrimeiroEscalao: Record<RegiaoPme, number>;
    baseLegal: string;
    nota: string;
  };
  derramaMunicipal: {
    taxaMaximaLegal: number;
    baseLegal: string;
    nota: string;
  };
  dividendosPessoasSingulares: {
    taxaLiberatoria: number;
    baseLegalRetencao: string;
    opcaoEnglobamento: {
      coeficienteEnglobamento: number;
      baseLegal: string;
      nota: string;
    };
  };
}

export interface EscalaoIrsPuro {
  ate: number | null;
  taxa: number;
}

export interface RegrasPmePuro {
  irc: RegrasIrcPuro;
  tsuTrabalhador: number;
  tsuEntidade: number;
  ivaNormalContinente: number;
  irs: {
    deducaoEspecificaFixa: number;
    despesasGeraisPorTitular: number;
    minimoExistencia: {
      valorReferencia: number;
      limite1Escalao: number;
      taxa1Escalao: number;
      limiteDespesasGerais: number;
      naoAplicaAcimaPorTitular: number;
    };
    escaloes: EscalaoIrsPuro[];
  };
}

export interface InputPme {
  /** Faturação mensal da empresa sem IVA (€/mês). */
  faturacaoMensalSemIva: number;
  /** Compras de mercadorias e custos dedutíveis mensais sem IVA (€/mês). */
  custosMensaisSemIva: number;
  /** Remuneração bruta mensal do sócio-gerente (€/mês, paga 14 meses/ano). */
  remuneracaoGerenteMensal: number;
  /** Região fiscal da sede (Continente, Açores ou Madeira). */
  regiao?: RegiaoPme;
  /** PME em território do Interior (art. 41.º-B EBF: 12,5 % nos primeiros 50 000 €). */
  interior?: boolean;
  /** Taxa média de IVA nas vendas (por omissão 23 %; ex.: 13 % ou 6 % na mercearia). */
  taxaIvaVendas?: number;
  /** Taxa média de IVA dedutível nas compras (por omissão igual a taxaIvaVendas). */
  taxaIvaCompras?: number;
  /** Taxa de derrama municipal (0 a 1,5 %; por omissão 1,5 %). */
  taxaDerramaMunicipal?: number;
  /** Opção na distribuição de dividendos: "liberatoria" (28 %) ou "englobamento" (50 % art. 40.º-A CIRS). */
  modoDividendos?: "liberatoria" | "englobamento";
}

export interface ResultadoPme {
  regiao: RegiaoPme;
  // (a) IVA na caixa (mensal e anual)
  faturacaoAnualSemIva: number;
  custosAnuaisSemIva: number;
  ivaLiquidadoMensal: number;
  ivaDedutivelMensal: number;
  ivaEntregueEstadoMensal: number;
  ivaLiquidadoAnual: number;
  ivaDedutivelAnual: number;
  ivaEntregueEstadoAnual: number;
  // (b) Sócio-gerente (14 meses)
  brutoGerenteAnual: number;
  tsuEmpresaGerenteAnual: number;
  ssGerenteAnual: number;
  irsGerenteAnual: number;
  liquidoSalarioGerenteAnual: number;
  custoTotalGerenteEmpresaAnual: number;
  // (c) Lucro da PME e IRC
  materiaColetavel: number;
  fatiaTaxaReduzida: number;
  fatiaTaxaGeral: number;
  taxaIrcReduzidaAplicada: number;
  taxaIrcGeralAplicada: number;
  ircBase: number;
  derramaMunicipal: number;
  ircTotal: number;
  taxaEfetivaIrc: number;
  lucroLiquidoEmpresa: number;
  // (d) Distribuição de dividendos vs. retenção na empresa
  impostoDividendosLiberatoria: number;
  dividendosLiquidosLiberatoria: number;
  impostoDividendosEnglobamento: number;
  dividendosLiquidosEnglobamento: number;
  impostoDividendosEscolhido: number;
  dividendosLiquidosEscolhido: number;
  // Totais consolidados (gerente + sócio)
  totalLiquidoSocioComDividendos: number;
  totalImpostosEContribuicoesSemIva: number;
}

function impostoEscaloesPuro(
  rc: number,
  escaloes: EscalaoIrsPuro[],
  fatorRegiao = 1
): number {
  let restante = Math.max(0, rc);
  let anterior = 0;
  let total = 0;
  for (const e of escaloes) {
    const limite = e.ate ?? Infinity;
    const fatia = Math.min(restante, limite - anterior);
    if (fatia <= 0) break;
    total += fatia * (e.taxa * fatorRegiao);
    restante -= fatia;
    anterior = limite;
  }
  return total;
}

function abatimentoMEPuro(
  rb: number,
  de: number,
  me: RegrasPmePuro["irs"]["minimoExistencia"]
): number {
  if (rb <= 0 || rb > me.naoAplicaAcimaPorTitular) return 0;
  const vr = me.valorReferencia;
  const limiteDG = me.limiteDespesasGerais / me.taxa1Escalao;
  const L = vr - limiteDG / 3.6 + me.limite1Escalao / 3.6;
  let abatimento: number;
  if (rb <= vr) {
    abatimento = vr - (de + limiteDG);
  } else if (rb <= L) {
    abatimento = vr - 2.6 * (rb - vr) - (de + limiteDG);
  } else {
    abatimento = L - me.limite1Escalao - 1.35 * (rb - L) - de;
  }
  return Math.max(0, Math.min(abatimento, rb - de));
}

export function simularPmePuro(
  input: InputPme,
  regras: RegrasPmePuro
): ResultadoPme {
  const regiao = input.regiao ?? "continente";
  const interior = input.interior ?? false;
  const taxaIvaVendas = input.taxaIvaVendas ?? regras.ivaNormalContinente;
  const taxaIvaCompras = input.taxaIvaCompras ?? taxaIvaVendas;
  const taxaDerrama = Math.max(
    0,
    Math.min(
      regras.irc.derramaMunicipal.taxaMaximaLegal,
      input.taxaDerramaMunicipal ?? regras.irc.derramaMunicipal.taxaMaximaLegal
    )
  );
  const modoDividendos = input.modoDividendos ?? "liberatoria";

  const fatMensal = Math.max(0, input.faturacaoMensalSemIva);
  const custMensal = Math.max(0, input.custosMensaisSemIva);
  const remMensal = Math.max(0, input.remuneracaoGerenteMensal);

  // (a) IVA na caixa: IVA liquidado − IVA dedutível
  const faturacaoAnualSemIva = fatMensal * 12;
  const custosAnuaisSemIva = custMensal * 12;
  const ivaLiquidadoMensal = fatMensal * taxaIvaVendas;
  const ivaDedutivelMensal = custMensal * taxaIvaCompras;
  const ivaEntregueEstadoMensal = Math.max(
    0,
    ivaLiquidadoMensal - ivaDedutivelMensal
  );
  const ivaLiquidadoAnual = ivaLiquidadoMensal * 12;
  const ivaDedutivelAnual = ivaDedutivelMensal * 12;
  const ivaEntregueEstadoAnual = ivaEntregueEstadoMensal * 12;

  // (b) Sócio-gerente (14 meses)
  const brutoGerenteAnual = remMensal * 14;
  const tsuEmpresaGerenteAnual = brutoGerenteAnual * regras.tsuEntidade;
  const ssGerenteAnual = brutoGerenteAnual * regras.tsuTrabalhador;
  const custoTotalGerenteEmpresaAnual =
    brutoGerenteAnual + tsuEmpresaGerenteAnual;

  const fatorIrsRegiao = regiao === "acores" ? 0.7 : 1;
  const deGerente =
    brutoGerenteAnual > 0
      ? Math.max(regras.irs.deducaoEspecificaFixa, ssGerenteAnual)
      : 0;
  const abatGerente = abatimentoMEPuro(
    brutoGerenteAnual,
    deGerente,
    regras.irs.minimoExistencia
  );
  const coletavelGerente = Math.max(0, brutoGerenteAnual - deGerente - abatGerente);
  const irsBrutoGerente = impostoEscaloesPuro(
    coletavelGerente,
    regras.irs.escaloes,
    fatorIrsRegiao
  );
  const irsGerenteAnual =
    brutoGerenteAnual > 0
      ? Math.max(0, irsBrutoGerente - regras.irs.despesasGeraisPorTitular)
      : 0;
  const liquidoSalarioGerenteAnual =
    brutoGerenteAnual - ssGerenteAnual - irsGerenteAnual;

  // (c) Lucro tributável e IRC (art. 87.º n.º 2 CIRC na redação da Lei 64/2025)
  const materiaColetavel = Math.max(
    0,
    faturacaoAnualSemIva - custosAnuaisSemIva - custoTotalGerenteEmpresaAnual
  );
  const limiteRed = regras.irc.pmeSmallMidCap.limiteMateriaColetavelReduzida;
  const taxaIrcReduzidaAplicada = interior
    ? regras.irc.interiorPme.taxaReduzidaPrimeiroEscalao[regiao]
    : regras.irc.pmeSmallMidCap.taxaReduzidaPrimeiroEscalao[regiao];
  const taxaIrcGeralAplicada = regras.irc.pmeSmallMidCap.taxaExcedente[regiao];

  const fatiaTaxaReduzida = Math.min(materiaColetavel, limiteRed);
  const fatiaTaxaGeral = Math.max(0, materiaColetavel - limiteRed);
  const ircBase =
    fatiaTaxaReduzida * taxaIrcReduzidaAplicada +
    fatiaTaxaGeral * taxaIrcGeralAplicada;
  const derramaMunicipal = materiaColetavel * taxaDerrama;
  const ircTotal = ircBase + derramaMunicipal;
  const taxaEfetivaIrc =
    materiaColetavel > 0 ? ircTotal / materiaColetavel : 0;
  const lucroLiquidoEmpresa = Math.max(0, materiaColetavel - ircTotal);

  // (d) Dividendos: Taxa liberatória (28 %; 19,6 % nos Açores) vs. Englobamento em 50 % (art. 40.º-A CIRS)
  const taxaLib =
    regras.irc.dividendosPessoasSingulares.taxaLiberatoria * fatorIrsRegiao;
  const impostoDividendosLiberatoria = lucroLiquidoEmpresa * taxaLib;
  const dividendosLiquidosLiberatoria =
    lucroLiquidoEmpresa - impostoDividendosLiberatoria;

  const coefEnglobamento =
    regras.irc.dividendosPessoasSingulares.opcaoEnglobamento
      .coeficienteEnglobamento;
  const coletavelComDividendos =
    coletavelGerente + lucroLiquidoEmpresa * coefEnglobamento;
  const irsTotalComDividendos = Math.max(
    0,
    impostoEscaloesPuro(
      coletavelComDividendos,
      regras.irs.escaloes,
      fatorIrsRegiao
    ) - regras.irs.despesasGeraisPorTitular
  );
  const impostoDividendosEnglobamento = Math.max(
    0,
    irsTotalComDividendos - irsGerenteAnual
  );
  const dividendosLiquidosEnglobamento =
    lucroLiquidoEmpresa - impostoDividendosEnglobamento;

  const impostoDividendosEscolhido =
    modoDividendos === "englobamento"
      ? impostoDividendosEnglobamento
      : impostoDividendosLiberatoria;
  const dividendosLiquidosEscolhido =
    modoDividendos === "englobamento"
      ? dividendosLiquidosEnglobamento
      : dividendosLiquidosLiberatoria;

  const totalLiquidoSocioComDividendos =
    liquidoSalarioGerenteAnual + dividendosLiquidosEscolhido;
  const totalImpostosEContribuicoesSemIva =
    tsuEmpresaGerenteAnual +
    ssGerenteAnual +
    irsGerenteAnual +
    ircTotal +
    impostoDividendosEscolhido;

  return {
    regiao,
    faturacaoAnualSemIva,
    custosAnuaisSemIva,
    ivaLiquidadoMensal,
    ivaDedutivelMensal,
    ivaEntregueEstadoMensal,
    ivaLiquidadoAnual,
    ivaDedutivelAnual,
    ivaEntregueEstadoAnual,
    brutoGerenteAnual,
    tsuEmpresaGerenteAnual,
    ssGerenteAnual,
    irsGerenteAnual,
    liquidoSalarioGerenteAnual,
    custoTotalGerenteEmpresaAnual,
    materiaColetavel,
    fatiaTaxaReduzida,
    fatiaTaxaGeral,
    taxaIrcReduzidaAplicada,
    taxaIrcGeralAplicada,
    ircBase,
    derramaMunicipal,
    ircTotal,
    taxaEfetivaIrc,
    lucroLiquidoEmpresa,
    impostoDividendosLiberatoria,
    dividendosLiquidosLiberatoria,
    impostoDividendosEnglobamento,
    dividendosLiquidosEnglobamento,
    impostoDividendosEscolhido,
    dividendosLiquidosEscolhido,
    totalLiquidoSocioComDividendos,
    totalImpostosEContribuicoesSemIva,
  };
}
