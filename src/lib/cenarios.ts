/**
 * cenarios — a grelha salarial canónica (V4, S1-09).
 *
 * Para as réguas de salário funcionarem no cliente sem o motor fiscal
 * completo, o build gera uma tabela de cenários canónicos — solteiro,
 * sem dependentes, continente, sem subsídio de alimentação e sem IRS
 * Jovem — e o cliente mostra os pontos EXACTOS da tabela. Nunca se
 * interpola um valor que o motor não calculou.
 *
 * A grelha: o salário mínimo nacional em vigor e depois MÚLTIPLOS
 * EXACTOS de 50 € até 6 000 € — inclui sempre pontos redondos como
 * 1 500 € (o cenário de abertura do site). N pontos, não uma fórmula.
 *
 * Gerada por `scripts/derive/cenarios.ts` → `data/derived/
 * cenarios-salario.json`; os server components passam-na por props
 * (client components não importam data/*.json).
 */

import smn from "@data/fiscal/smn.json";
import { reciboMensal } from "./engines/recibo";
import { simularSalario } from "./engines/irs";
import { TSU_ENTIDADE, TSU_TRABALHADOR } from "./engines/seg-social";
import type { TabelaId } from "./engines/retencao";
import { repartir } from "./pontos";
import { BRUTO_CANONICO } from "./canonico";

export const ANO_CENARIO = 2026;
export const PASSO_GRELHA = 50;
export const FIM_GRELHA = 6000;

/** cêntimos de cada euro de custo — real com decimais; pontos inteiros
    somam sempre 100 (maior resto) */
export interface CentimosCenario {
  tsu: number;
  irs: number;
  ss: number;
  fica: number;
}

export interface LinhaCenario {
  bruto: number;
  /** custo total para a entidade /mês */
  custo: number;
  /** TSU da entidade /mês */
  tsu: number;
  /** Segurança Social do trabalhador /mês */
  ss: number;
  /** retenção na fonte de IRS /mês */
  irs: number;
  /** chega à conta /mês */
  liquido: number;
  /** taxa efetiva de retenção (irs/bruto) */
  taxaEfetiva: number;
  /** tabela de retenção aplicada */
  tabela: TabelaId;
  /** cêntimos reais de cada euro de custo */
  centimos: CentimosCenario;
  /** pontos inteiros — o desenho conta estes; Σ = 100 */
  pontos: CentimosCenario;
  /** simulação anual do motor (14 meses; médias a 12) */
  ano14: {
    brutoAnualTotal: number;
    ssAnual: number;
    irsAnual: number;
    liquidoAnual: number;
    liquidoMensal14: number;
    liquidoMensal12: number;
    taxaEfetiva: number;
    taxaMarginal: number;
    pesoEstado: number;
  };
}

export interface CenariosSalario {
  meta: {
    ano: number;
    perfil: string;
    smn: number;
    /** bruto de abertura — o cenário canónico da história */
    brutoRef: number;
    /** taxas TSU do motor — para rótulos sem importar o motor */
    taxas: { tsu: number; ss: number };
    passo: number;
    inicio: number;
    fim: number;
    n: number;
  };
  linhas: LinhaCenario[];
}

/** os pontos exactos da régua: SMN e depois múltiplos de 50 € ≤ fim */
export function grelhaSalarial(fim = FIM_GRELHA): number[] {
  const base = smn.regioes.continente;
  const pontos = [base];
  for (
    let v = Math.ceil((base + 1) / PASSO_GRELHA) * PASSO_GRELHA;
    v <= fim;
    v += PASSO_GRELHA
  ) {
    pontos.push(v);
  }
  return pontos;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function gerarCenarios(ano = ANO_CENARIO): CenariosSalario {
  const grelha = grelhaSalarial();
  const linhas: LinhaCenario[] = grelha.map((bruto) => {
    const r = reciboMensal({ bruto, ano });
    const a = simularSalario([bruto], 0, ano);
    const porEuro = 100 / r.custoEmpresa;
    const centimos: CentimosCenario = {
      tsu: r2(r.tsuEntidade * porEuro),
      irs: r2(r.retencao * porEuro),
      ss: r2(r.ss * porEuro),
      fica: r2(r.liquido * porEuro),
    };
    const rep = repartir([
      { valor: r.tsuEntidade },
      { valor: r.retencao },
      { valor: r.ss },
      { valor: r.liquido },
    ]);
    return {
      bruto,
      custo: r.custoEmpresa,
      tsu: r.tsuEntidade,
      ss: r.ss,
      irs: r.retencao,
      liquido: r.liquido,
      taxaEfetiva: r.taxaEfetiva,
      tabela: r.tabela,
      centimos,
      pontos: {
        tsu: rep.partes[0].pontos,
        irs: rep.partes[1].pontos,
        ss: rep.partes[2].pontos,
        fica: rep.partes[3].pontos,
      },
      ano14: {
        brutoAnualTotal: a.brutoAnualTotal,
        ssAnual: a.ssAnual,
        irsAnual: a.irsAnual,
        liquidoAnual: a.liquidoAnual,
        liquidoMensal14: a.liquidoMensal14,
        liquidoMensal12: a.liquidoMensal12,
        taxaEfetiva: a.taxaEfetiva,
        taxaMarginal: a.taxaMarginal,
        pesoEstado: a.pesoEstado,
      },
    };
  });

  return {
    meta: {
      ano,
      perfil:
        "solteiro, sem dependentes, continente, sem subsídio de alimentação, sem IRS Jovem",
      smn: smn.regioes.continente,
      brutoRef: BRUTO_CANONICO,
      taxas: { tsu: TSU_ENTIDADE, ss: TSU_TRABALHADOR },
      passo: PASSO_GRELHA,
      inicio: grelha[0],
      fim: grelha[grelha.length - 1],
      n: grelha.length,
    },
    linhas,
  };
}
