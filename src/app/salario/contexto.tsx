"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
// o motor fiscal NÃO entra no first-load de /salario (decisão do dono,
// S1-09): chega por import() dinâmico quando um controlo sai do perfil
// canónico — daqui só saem TIPOS, que desaparecem na compilação
import type {
  ResultadoRecibo,
  FormaPagamentoSA,
  reciboMensal,
} from "@/lib/engines/recibo";
import type { simularSalario } from "@/lib/engines/irs";
import type { CenariosSalario, LinhaCenario } from "@/lib/cenarios";
import type { SituacaoRetencao } from "@/lib/engines/retencao";
import { fmtData } from "@/lib/format";

/**
 * O estado da página /salario num contexto (sessão 3A): o <Pagina>
 * divide a calculadora em três níveis — a régua e o herói no nível 1,
 * os controlos, o talão e as leituras no nível 2, as contas por
 * extenso no nível 3 — e as peças partilham o mesmo estado apesar de
 * viverem em props diferentes do template. O provedor embrulha a
 * página inteira; cada peça cliente consome `useSalario`.
 */

export type Situacao = "solteiro" | "casado2" | "casado1";
const PARA_RETENCAO: Record<Situacao, SituacaoRetencao> = {
  solteiro: "naoCasado",
  casado2: "casadoDoisTitulares",
  casado1: "casadoUnicoTitular",
};

type MotorFiscal = {
  reciboMensal: typeof reciboMensal;
  simularSalario: typeof simularSalario;
};

/** recibo sintético a partir da linha da tabela — o perfil canónico
    nunca precisa do motor no cliente */
const deLinha = (l: LinhaCenario): ResultadoRecibo => ({
  bruto: l.bruto,
  saTotal: 0,
  saIsento: 0,
  saTributavel: 0,
  ss: l.ss,
  retencao: l.irs,
  taxaEfetiva: l.taxaEfetiva,
  tabela: l.tabela,
  liquido: l.liquido,
  tsuEntidade: l.tsu,
  custoEmpresa: l.custo,
});

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Fração do ano → o dia da liberdade fiscal em três formas:
    iso ("2026-05-14"), curto ("14 mai") e completo ("14 mai 2026"). */
export function diaLiberdade(
  fracao: number,
  ano: number
): { iso: string; curto: string; completo: string } {
  const d = new Date(Date.UTC(ano, 0, 1));
  d.setUTCDate(d.getUTCDate() + Math.round(fracao * 365));
  const iso = d.toISOString().slice(0, 10);
  return {
    iso,
    curto: `${d.getUTCDate()} ${MESES_CURTOS[d.getUTCMonth()]}`,
    completo: fmtData(iso),
  };
}

/** config da régua do bruto — strings e marcador chegam do servidor
    (client components não leem messages nem data) */
export interface ReguaSalario {
  rotulo: string;
  marcador: { valor: number; rotulo: string } | null;
  presets: { rotulo: string; valor: number }[];
  descricao?: string;
  /** a razão de cada extremo — junta-se à nota do limite da régua
      («limite — 920 € · o salário mínimo») */
  limites?: { min?: string; max?: string };
}

export interface SalarioEstado {
  ano: number;
  cenarios: CenariosSalario;
  saIsento: Record<FormaPagamentoSA, number>;
  irsJovemIsencao: readonly number[];
  seloNaoRetido: string;
  regua: ReguaSalario;

  bruto: number;
  setBruto: (v: number) => void;
  situacao: Situacao;
  setSituacao: (v: Situacao) => void;
  conjuge: number;
  setConjuge: (v: number) => void;
  dependentes: number;
  setDependentes: (v: number) => void;
  saPorDia: number;
  setSaPorDia: (v: number) => void;
  formaSA: FormaPagamentoSA;
  setFormaSA: (v: FormaPagamentoSA) => void;
  anoJovem: number;
  setAnoJovem: (v: number) => void;

  /** o recibo do mês — linha canónica ou motor (quando já carregado) */
  recibo: ResultadoRecibo;
  /** a leitura anual a 14 meses — mesma fonte que o recibo */
  resultado: LinhaCenario["ano14"];
  /** isenção do subsídio na forma de pagamento actual */
  limiteSA: number;
  /** fora do perfil canónico e o motor ainda não chegou — os números
      mostrados são os últimos calculados (a linha canónica do bruto) */
  motorACarregar: boolean;
}

const Ctx = createContext<SalarioEstado | null>(null);

export function ProvedorSalario({
  ano,
  cenarios,
  saIsento,
  irsJovemIsencao,
  seloNaoRetido,
  regua,
  children,
}: {
  ano: number;
  /** tabela canónica gerada no build — a régua só pára nestes pontos;
      no perfil canónico os números vêm daqui, nunca interpolados */
  cenarios: CenariosSalario;
  /** isenção do subs. alimentação por forma de pagamento — data/fiscal
      chega por props do servidor */
  saIsento: Record<FormaPagamentoSA, number>;
  /** % isenta por ano de gozo do IRS Jovem */
  irsJovemIsencao: readonly number[];
  /** o carimbo neutro do IRS zero — messages/pt.json →
      salario.naoRetido (1D-02) */
  seloNaoRetido: string;
  regua: ReguaSalario;
  children: ReactNode;
}) {
  // o bruto inicial é o do cenário canónico — a mesma história da home
  const [bruto, setBruto] = useState(cenarios.meta.brutoRef);
  const [situacao, setSituacao] = useState<Situacao>("solteiro");
  const [conjuge, setConjuge] = useState(cenarios.meta.brutoRef);
  const [dependentes, setDependentes] = useState(0);
  const [saPorDia, setSaPorDia] = useState(0);
  const [formaSA, setFormaSA] = useState<FormaPagamentoSA>("cartao");
  const [anoJovem, setAnoJovem] = useState(0);

  // fora do perfil canónico (solteiro, 0 dependentes, sem SA, sem IRS
  // Jovem) o recibo precisa do motor — que chega por import() dinâmico,
  // fora do first-load de /salario
  const foraDoCan =
    situacao !== "solteiro" ||
    dependentes !== 0 ||
    saPorDia !== 0 ||
    anoJovem !== 0;

  const [motor, setMotor] = useState<MotorFiscal | null>(null);
  useEffect(() => {
    if (!foraDoCan || motor) return;
    let vivo = true;
    Promise.all([
      import("@/lib/engines/recibo"),
      import("@/lib/engines/irs"),
    ]).then(([rec, irs]) => {
      if (vivo)
        setMotor({
          reciboMensal: rec.reciboMensal,
          simularSalario: irs.simularSalario,
        });
    });
    return () => {
      vivo = false;
    };
  }, [foraDoCan, motor]);

  // a régua só emite pontos da grelha — a linha existe sempre
  const linhaBase =
    cenarios.linhas.find((l) => l.bruto === bruto) ?? cenarios.linhas[0];

  // enquanto o motor carrega mostra-se o último valor calculado: o
  // motor só é null antes do primeiro import(), e até aí tudo o que
  // esteve no ecrã veio da linha canónica — mostrá-la é mostrar o
  // último valor, sem saltar nem ficar em branco
  const recibo = useMemo<ResultadoRecibo>(() => {
    if (!foraDoCan || !motor) return deLinha(linhaBase);
    return motor.reciboMensal({
      bruto,
      situacao: PARA_RETENCAO[situacao],
      dependentes,
      saPorDia,
      formaSA,
      anoIrsJovem: anoJovem,
      ano,
    });
  }, [
    foraDoCan,
    linhaBase,
    motor,
    bruto,
    situacao,
    dependentes,
    saPorDia,
    formaSA,
    anoJovem,
    ano,
  ]);

  // Em "casado único titular" o cônjuge sem rendimentos conta para o
  // quociente conjugal (÷2) mas não tem dedução específica própria.
  const resultado = useMemo<LinhaCenario["ano14"]>(() => {
    if (!foraDoCan || !motor) return linhaBase.ano14;
    const brutos =
      situacao === "solteiro"
        ? [bruto]
        : situacao === "casado2"
          ? [bruto, conjuge]
          : [bruto, 0];
    return motor.simularSalario(brutos, dependentes, ano);
  }, [foraDoCan, linhaBase, motor, bruto, conjuge, situacao, dependentes, ano]);

  const valor: SalarioEstado = {
    ano,
    cenarios,
    saIsento,
    irsJovemIsencao,
    seloNaoRetido,
    regua,
    bruto,
    setBruto,
    situacao,
    setSituacao,
    conjuge,
    setConjuge,
    dependentes,
    setDependentes,
    saPorDia,
    setSaPorDia,
    formaSA,
    setFormaSA,
    anoJovem,
    setAnoJovem,
    recibo,
    resultado,
    limiteSA: saIsento[formaSA],
    motorACarregar: foraDoCan && !motor,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSalario(): SalarioEstado {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSalario fora do ProvedorSalario");
  return c;
}
