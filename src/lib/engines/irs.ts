import adseJson from "@data/fiscal/adse.json";
import irs2025 from "@data/fiscal/irs-2025.json";
import irs2026 from "@data/fiscal/irs-2026.json";
import irsJovem from "@data/fiscal/irs-jovem.json";
import regioes2026 from "@data/fiscal/regioes-autonomas-2026.json";
import { TSU_TRABALHADOR, TSU_ENTIDADE } from "./seg-social";

export type RegiaoIrs = "continente" | "acores" | "madeira";
const TAXA_ADSE_IRS = adseJson.beneficiariosTitulares.taxaDesconto;

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

export const SS_TRABALHADOR = TSU_TRABALHADOR;
export const SS_ENTIDADE = TSU_ENTIDADE;

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

/** Uma fatia do rendimento coletável dentro de um escalão. */
export interface FatiaEscalao {
  n: number; // 1.º, 2.º, …
  de: number;
  ate: number | null;
  taxa: number;
  /** quanto do rendimento cai neste escalão (0 = o rendimento não chega aqui) */
  fatia: number;
  /** imposto desta fatia (fatia × taxa) */
  imposto: number;
  /** ocupação do escalão: 0–1 (o último, sem teto, fica sempre < 1) */
  ocupacao: number;
}

/**
 * Reparte o rendimento coletável pelos escalões — a peça do "enchimento":
 * cada escalão é um recipiente que só cobra a sua fatia. A soma dos
 * `imposto` bate com `impostoPorEscaloes` (sem a taxa de solidariedade,
 * que é sobre o total).
 */
export function repartePorEscaloes(rc: number, regras: RegrasIRS): FatiaEscalao[] {
  let restante = rc;
  let anterior = 0;
  return regras.escaloes.map((e, i) => {
    const limite = e.ate ?? Infinity;
    const capacidade = limite - anterior;
    const fatia = Math.min(Math.max(restante, 0), capacidade);
    restante -= fatia;
    // o último escalão não tem teto — a "ocupação" mede-se contra a
    // largura do escalão anterior (referência de leitura, não teto real)
    const ref = capacidade === Infinity ? rc - anterior || 1 : capacidade;
    const f: FatiaEscalao = {
      n: i + 1,
      de: anterior,
      ate: e.ate,
      taxa: e.taxa,
      fatia,
      imposto: fatia * e.taxa,
      ocupacao: fatia / ref,
    };
    anterior = limite;
    return f;
  });
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
  adseAnual?: number;
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

export interface OpcoesSalario {
  /** Ano de gozo do IRS Jovem no 1.º titular (1–10; 0 ou omitido = sem IRS Jovem). */
  anoIrsJovem?: number;
  /** Parte anual isenta do subsídio de alimentação (soma ao líquido e ao custo empresa, sem SS/IRS/TSU). */
  saIsentoAnual?: number;
  /** Parte anual tributável do subsídio de alimentação (soma ao bruto sujeito do 1.º titular: SS + IRS + TSU). */
  saTributavelAnual?: number;
  /** Subsistema ADSE no 1.º titular (3,5 % × 14 meses — DL 118/83 art. 46.º). */
  adse?: boolean;
  /** Região fiscal: nos Açores aplica a redução oficial de 30 % sobre as taxas dos escalões (DLR 15-A/2021/A). */
  regiao?: RegiaoIrs;
}

export function regrasIrsRegionais(
  regras: RegrasIRS,
  regiao: RegiaoIrs = "continente"
): RegrasIRS {
  if (regiao !== "acores") return regras;
  const fator = 1 - regioes2026.irs.acores.reducaoGeralEscaloesPct;
  return {
    ...regras,
    escaloes: regras.escaloes.map((e) => ({
      ...e,
      taxa: Number((e.taxa * fator).toFixed(6)),
      taxaMedia: e.taxaMedia !== null ? Number((e.taxaMedia * fator).toFixed(6)) : null,
    })),
    solidariedade: regras.solidariedade.map((s) => ({
      ...s,
      taxa: Number((s.taxa * fator).toFixed(6)),
    })),
  };
}

/**
 * IRS anual estimado para rendimentos de trabalho dependente (cat. A, continente e Açores).
 * Aproximação documentada: dedução específica fixa (ou contribuições, se maior),
 * abatimento por mínimo de existência, escalões com quociente conjugal,
 * deduções à coleta de despesas gerais e dependentes. Suporta opcionalmente
 * IRS Jovem no 1.º titular (art. 12.º-B CIRS, até 55×IAS com englobamento
 * para determinação da taxa — art. 22.º n.º 4), subsídio de alimentação anual,
 * ADSE (3,5 % × 14 meses) e redução regional dos Açores (−30 % nos escalões).
 */
export function simularSalario(
  brutosMensais: number[],
  dependentes: number,
  ano = 2026,
  meses = 14,
  opts: OpcoesSalario = {}
): ResultadoSalario {
  const regrasBase = REGRAS_IRS[ano];
  if (!regrasBase) throw new Error(`Regras de IRS para ${ano} não disponíveis`);
  const regras = regrasIrsRegionais(regrasBase, opts.regiao ?? "continente");

  const saTrib = opts.saTributavelAnual ?? 0;
  const saIsento = opts.saIsentoAnual ?? 0;
  const anoGozo = opts.anoIrsJovem ?? 0;
  const comAdse = opts.adse ?? false;

  const brutosAnuais = brutosMensais.map(
    (b, i) => b * meses + (i === 0 ? saTrib : 0)
  );
  const rbTotal = brutosAnuais.reduce((a, b) => a + b, 0);
  const nTitulares = brutosAnuais.length;
  const me = regrasBase.minimoExistencia;

  const aplicaME = rbTotal <= me.naoAplicaAcimaPorTitular * nTitulares;

  const titulares: ResultadoTitular[] = brutosAnuais.map((rb) => {
    const contrib = rb * SS_TRABALHADOR;
    const de = Math.max(regrasBase.deducaoEspecificaFixa, contrib);
    const abat = aplicaME ? abatimentoMinimoExistencia(rb, de, regrasBase) : 0;
    const coletavel = Math.max(0, rb - de - abat);
    return { brutoAnual: rb, deducaoEspecifica: de, abatimentoME: abat, coletavel, ss: contrib };
  });

  const pctJovem =
    anoGozo >= 1 && anoGozo <= irsJovem.anosMax
      ? irsJovem.isencaoPorAno[anoGozo - 1]
      : 0;
  const limiteJovem = irsJovem.limiteIsencaoIas * regrasBase.ias;
  const isentoJovem =
    pctJovem > 0 && brutosAnuais.length > 0
      ? Math.min(pctJovem * brutosAnuais[0], limiteJovem)
      : 0;

  const coletavelTotal = titulares.reduce((a, t) => a + t.coletavel, 0);
  const coletavelTaxa = nTitulares === 2 ? coletavelTotal / 2 : coletavelTotal;
  const coletavelEfetivo = titulares.reduce(
    (a, t, i) => a + (i === 0 ? Math.max(0, t.coletavel - isentoJovem) : t.coletavel),
    0
  );
  const coletavelTributado =
    nTitulares === 2 ? coletavelEfetivo / 2 : coletavelEfetivo;

  let irsBruto: number;
  if (isentoJovem > 0) {
    // Art. 22.º n.º 4 CIRS: o rendimento isento engloba para determinar a taxa média
    const impostoTaxa = impostoPorEscaloes(coletavelTaxa, regras);
    const taxaMedia = coletavelTaxa > 0 ? impostoTaxa / coletavelTaxa : 0;
    irsBruto = taxaMedia * coletavelTributado * (nTitulares === 2 ? 2 : 1);
  } else {
    irsBruto = impostoPorEscaloes(coletavelTributado, regras);
    if (nTitulares === 2) irsBruto *= 2;
  }

  const deducoesColeta =
    regras.despesasGeraisPorTitular * nTitulares +
    regras.deducaoPorDependente * dependentes;

  const irsAnual = Math.max(0, irsBruto - deducoesColeta);
  const ssAnual = titulares.reduce((a, t) => a + t.ss, 0);
  const adseAnual =
    comAdse && brutosMensais.length > 0
      ? brutosMensais[0] * meses * TAXA_ADSE_IRS
      : 0;
  const liquidoAnual = rbTotal + saIsento - ssAnual - adseAnual - irsAnual;
  const custoEmpresa = rbTotal * (1 + SS_ENTIDADE) + saIsento;

  return {
    titulares,
    brutoAnualTotal: rbTotal,
    ssAnual,
    ...(comAdse ? { adseAnual } : {}),
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
    pesoEstado:
      custoEmpresa > 0
        ? (irsAnual + ssAnual + adseAnual + rbTotal * SS_ENTIDADE) / custoEmpresa
        : 0,
  };
}
