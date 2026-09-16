import irs2025 from "@data/fiscal/irs-2025.json";
import irs2026 from "@data/fiscal/irs-2026.json";
import ss from "@data/fiscal/ss.json";

export interface EscalaoIRS {
  ate: number | null;
  taxa: number;
  taxaMedia: number | null;
  parcelaAbater?: number;
}

export interface RegrasIRS {
  ano: number;
  ias: number;
  deducaoEspecificaFixa: number;
  despesasGeraisPorTitular: number;
  deducaoPorDependente: number;
  minimoExistencia: {
    valorReferencia: number;
    limite1Escalao: number;
    taxa1Escalao: number;
    limiteDespesasGerais: number;
    naoAplicaAcimaPorTitular: number;
  };
  solidariedade: { de: number; ate: number | null; taxa: number }[];
  escaloes: EscalaoIRS[];
}

export const REGRAS_IRS: Record<number, RegrasIRS> = {
  2025: irs2025 as RegrasIRS,
  2026: irs2026 as RegrasIRS,
};

export const SS_TRABALHADOR = ss.trabalhador.taxa;
export const SS_ENTIDADE = ss.entidadePatronal.taxa;

/** Imposto progressivo por fatias sobre o rendimento coletável. */
export function impostoPorEscaloes(rc: number, regras: RegrasIRS): number {
  let restante = rc;
  let anterior = 0;
  let total = 0;
  for (const e of regras.escaloes) {
    const limite = e.ate ?? Infinity;
    const fatia = Math.min(restante, limite - anterior);
    if (fatia <= 0) break;
    total += fatia * e.taxa;
    restante -= fatia;
    anterior = limite;
  }
  for (const s of regras.solidariedade) {
    if (rc > s.de) {
      const topo = s.ate ?? Infinity;
      total += (Math.min(rc, topo) - s.de) * s.taxa;
    }
  }
  return total;
}

export function escalaoMarginal(rc: number, regras: RegrasIRS): EscalaoIRS {
  for (const e of regras.escaloes) {
    if (e.ate === null || rc <= e.ate) return e;
  }
  return regras.escaloes[regras.escaloes.length - 1];
}

/** Abatimento por mínimo de existência, art. 70.º CIRS (por titular). */
export function abatimentoMinimoExistencia(rb: number, de: number, regras: RegrasIRS): number {
  const me = regras.minimoExistencia;
  const vr = me.valorReferencia;
  const limiteDG = me.limiteDespesasGerais / me.taxa1Escalao; // 250 / taxa 1.º
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

export interface ResultadoTitular {
  brutoAnual: number;
  deducaoEspecifica: number;
  abatimentoME: number;
  coletavel: number;
  ss: number;
}

export interface ResultadoSalario {
  titulares: ResultadoTitular[];
  brutoAnualTotal: number;
  ssAnual: number;
  coletavelTributado: number; // base a que se aplicam os escalões (após quociente)
  irsBruto: number;
  deducoesColeta: number;
  irsAnual: number;
  liquidoAnual: number;
  liquidoMensal14: number;
  liquidoMensal12: number;
  taxaEfetiva: number;
  taxaMarginal: number;
  custoEmpresaAnual: number;
  pesoEstado: number; // (IRS + SS trabalhador + TSU) / custo empresa
}

/**
 * IRS anual estimado para rendimentos de trabalho dependente (cat. A, continente).
 * Aproximação documentada: dedução específica fixa (ou contribuições, se maior),
 * abatimento por mínimo de existência, escalões com quociente conjugal,
 * deduções à coleta de despesas gerais e dependentes.
 */
export function simularSalario(
  brutosMensais: number[],
  dependentes: number,
  ano = 2026,
  meses = 14
): ResultadoSalario {
  const regras = REGRAS_IRS[ano];
  if (!regras) throw new Error(`Regras de IRS para ${ano} não disponíveis`);

  const brutosAnuais = brutosMensais.map((b) => b * meses);
  const rbTotal = brutosAnuais.reduce((a, b) => a + b, 0);
  const nTitulares = brutosAnuais.length;
  const me = regras.minimoExistencia;

  const aplicaME = rbTotal <= me.naoAplicaAcimaPorTitular * nTitulares;

  const titulares: ResultadoTitular[] = brutosAnuais.map((rb) => {
    const contrib = rb * SS_TRABALHADOR;
    const de = Math.max(regras.deducaoEspecificaFixa, contrib);
    const abat = aplicaME ? abatimentoMinimoExistencia(rb, de, regras) : 0;
    const coletavel = Math.max(0, rb - de - abat);
    return { brutoAnual: rb, deducaoEspecifica: de, abatimentoME: abat, coletavel, ss: contrib };
  });

  const coletavelTotal = titulares.reduce((a, t) => a + t.coletavel, 0);
  const coletavelTributado = nTitulares === 2 ? coletavelTotal / 2 : coletavelTotal;
  let irsBruto = impostoPorEscaloes(coletavelTributado, regras);
  if (nTitulares === 2) irsBruto *= 2;

  const deducoesColeta =
    regras.despesasGeraisPorTitular * nTitulares +
    regras.deducaoPorDependente * dependentes;

  const irsAnual = Math.max(0, irsBruto - deducoesColeta);
  const ssAnual = titulares.reduce((a, t) => a + t.ss, 0);
  const liquidoAnual = rbTotal - ssAnual - irsAnual;
  const custoEmpresa = rbTotal * (1 + SS_ENTIDADE);

  return {
    titulares,
    brutoAnualTotal: rbTotal,
    ssAnual,
    coletavelTributado,
    irsBruto,
    deducoesColeta,
    irsAnual,
    liquidoAnual,
    liquidoMensal14: liquidoAnual / meses,
    liquidoMensal12: liquidoAnual / 12,
    taxaEfetiva: rbTotal > 0 ? irsAnual / rbTotal : 0,
    taxaMarginal: escalaoMarginal(coletavelTributado, regras).taxa,
    custoEmpresaAnual: custoEmpresa,
    pesoEstado: custoEmpresa > 0 ? (irsAnual + ssAnual + rbTotal * SS_ENTIDADE) / custoEmpresa : 0,
  };
}
