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
  ModoDuodecimos,
  reciboMensal,
} from "@/lib/engines/recibo";
import type { simularSalario, RegiaoIrs } from "@/lib/engines/irs";
import type {
  reciboPensaoMensal,
  simularPensao,
  TabelaPensaoId,
} from "@/lib/engines/pensao";
import type { CenariosSalario, LinhaCenario } from "@/lib/cenarios";
import type { SituacaoRetencao, TabelaId } from "@/lib/engines/retencao";
import { fmtData } from "@/lib/format";
import {
  construirUrl,
  lerBool,
  lerEnum,
  lerFloat,
  lerInt,
  snapValor,
  useLeituraUrl,
} from "@/lib/url-state";

/**
 * O estado da página /salario num contexto (sessão 3A + T11): o <Pagina>
 * divide a calculadora em três níveis — a régua e o herói no nível 1,
 * os controlos, o talão e as leituras no nível 2, as contas por
 * extenso no nível 3 — e as peças partilham o mesmo estado apesar de
 * viverem em props diferentes do template. O provedor embrulha a
 * página inteira; cada peça cliente consome `useSalario`.
 */

export type Situacao = "solteiro" | "casado2" | "casado1";
export type TipoRendimento = "trabalho" | "pensao";

const PARA_RETENCAO: Record<Situacao, SituacaoRetencao> = {
  solteiro: "naoCasado",
  casado2: "casadoDoisTitulares",
  casado1: "casadoUnicoTitular",
};

type MotorFiscal = {
  reciboMensal: typeof reciboMensal;
  simularSalario: typeof simularSalario;
  reciboPensaoMensal: typeof reciboPensaoMensal;
  simularPensao: typeof simularPensao;
};

export type ReciboSalarioOuPensao = Omit<ResultadoRecibo, "tabela"> & {
  tabela: TabelaId | TabelaPensaoId;
};

/** recibo sintético a partir da linha da tabela — o perfil canónico
    nunca precisa do motor no cliente */
const deLinha = (l: LinhaCenario): ReciboSalarioOuPensao => ({
  bruto: l.bruto,
  duodecimosBruto: 0,
  saTotal: 0,
  saIsento: 0,
  saTributavel: 0,
  ss: l.ss,
  adse: 0,
  retencao: l.irs,
  retencaoDuodecimos: 0,
  taxaEfetiva: l.taxaEfetiva,
  tabela: l.tabela,
  liquido: l.liquido,
  liquidoSemDuodecimos: l.liquido,
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
      («limite — 920 € · o salário mínimo») */
  limites?: { min?: string; max?: string };
}

export interface SalarioEstado {
  ano: number;
  cenarios: CenariosSalario;
  saIsento: Record<FormaPagamentoSA, number>;
  irsJovemIsencao: readonly number[];
  seloNaoRetido: string;
  regua: ReguaSalario;
  smnRegioes: Record<RegiaoIrs, number>;
  adseRegras: { taxaDesconto: number; limiarSalvaguardaPensoes: number };
  pensaoDeducaoEspecifica: number;
  acoresReducaoIrsPct: number;

  tipoRendimento: TipoRendimento;
  setTipoRendimento: (v: TipoRendimento) => void;
  regiao: RegiaoIrs;
  setRegiao: (v: RegiaoIrs) => void;
  duodecimos: ModoDuodecimos;
  setDuodecimos: (v: ModoDuodecimos) => void;
  adse: boolean;
  setAdse: (v: boolean) => void;

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
  recibo: ReciboSalarioOuPensao;
  /** a leitura anual a 14 meses — mesma fonte que o recibo */
  resultado: LinhaCenario["ano14"] & { adseAnual?: number };
  /** isenção do subsídio na forma de pagamento actual */
  limiteSA: number;
  /** fora do perfil canónico e o motor ainda não chegou — os números
      mostrados são os últimos calculados (a linha canónica do bruto) */
  motorACarregar: boolean;
  /** URL limpo com o estado partilhável para o <BotaoCopiar> */
  urlPartilha: string;
}

const Ctx = createContext<SalarioEstado | null>(null);

/** O subsídio de alimentação vence apenas nos dias de trabalho efectivo:
 *  aproximação documentada de 11 meses × 22 dias úteis = 242 dias/ano
 *  (exclui o mês de férias e os subsídios de férias e de Natal). */
const DIAS_SA_ANO = 11 * 22;

export function ProvedorSalario({
  ano,
  cenarios,
  saIsento,
  irsJovemIsencao,
  seloNaoRetido,
  regua,
  smnRegioes,
  adseRegras,
  pensaoDeducaoEspecifica,
  acoresReducaoIrsPct,
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
  smnRegioes: Record<RegiaoIrs, number>;
  adseRegras: { taxaDesconto: number; limiarSalvaguardaPensoes: number };
  pensaoDeducaoEspecifica: number;
  acoresReducaoIrsPct: number;
  children: ReactNode;
}) {
  // o bruto inicial é o do cenário canónico — a mesma história da home
  const [bruto, setBruto] = useState(cenarios.meta.brutoRef);
  const [tipoRendimento, setTipoRendimento] = useState<TipoRendimento>("trabalho");
  const [regiao, setRegiao] = useState<RegiaoIrs>("continente");
  const [duodecimos, setDuodecimos] = useState<ModoDuodecimos>("14");
  const [adse, setAdse] = useState(false);
  const [situacao, setSituacao] = useState<Situacao>("solteiro");
  const [conjuge, setConjuge] = useState(cenarios.meta.brutoRef);
  const [dependentes, setDependentes] = useState(0);
  const [saPorDia, setSaPorDia] = useState(0);
  const [formaSA, setFormaSA] = useState<FormaPagamentoSA>("cartao");
  const [anoJovem, setAnoJovem] = useState(0);

  // Abrir em /salario#pensao seleciona automaticamente o modo Pensão de reforma (Cat. H)
  useEffect(() => {
    const lerHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#pensao") {
        setTipoRendimento("pensao");
      }
    };
    lerHash();
    window.addEventListener("hashchange", lerHash);
    return () => window.removeEventListener("hashchange", lerHash);
  }, []);

  // Leitura segura do estado por URL (Pilar 1 — T12)
  useLeituraUrl((sp) => {
    const bRaw = lerInt(sp.get("bruto"), cenarios.meta.inicio, cenarios.meta.fim);
    if (bRaw !== undefined) {
      const grelha = cenarios.linhas.map((l) => l.bruto);
      setBruto(snapValor(bRaw, grelha));
    }
    const m = lerEnum(sp.get("modo"), ["trabalho", "pensao"] as const);
    if (m) {
      setTipoRendimento(m);
    } else if (lerBool(sp.get("pensao"))) {
      setTipoRendimento("pensao");
    }
    const reg = lerEnum(sp.get("regiao"), ["continente", "madeira", "acores"] as const);
    if (reg) setRegiao(reg);
    const duo = lerEnum(sp.get("duod"), ["14", "50", "100"] as const);
    if (duo) setDuodecimos(duo);
    if (sp.has("adse")) {
      setAdse(lerBool(sp.get("adse")));
    }
    const sit = lerEnum(sp.get("sit") ?? sp.get("situacao"), ["solteiro", "casado2", "casado1"] as const);
    if (sit) setSituacao(sit);
    const cRaw = lerInt(sp.get("conjuge"), cenarios.meta.inicio, cenarios.meta.fim);
    if (cRaw !== undefined) {
      const grelha = cenarios.linhas.map((l) => l.bruto);
      setConjuge(snapValor(cRaw, grelha));
    }
    const dep = lerInt(sp.get("dep") ?? sp.get("dependentes"), 0, 10);
    if (dep !== undefined) setDependentes(dep);
    const sa = lerFloat(sp.get("sa"), 0, 30);
    if (sa !== undefined) setSaPorDia(sa);
    const fsa = lerEnum(sp.get("formaSa") ?? sp.get("formaSA"), ["cartao", "dinheiro"] as const);
    if (fsa) setFormaSA(fsa);
    const jov = lerInt(sp.get("jovem") ?? sp.get("anoJovem"), 0, 10);
    if (jov !== undefined) setAnoJovem(jov);
  });

  // fora do perfil canónico (solteiro, 0 dependentes, sem SA, sem IRS
  // Jovem, trabalho Cat. A, continente, 14 meses, sem ADSE) o recibo precisa do motor —
  // que chega por import() dinâmico, fora do first-load de /salario
  const foraDoCan =
    situacao !== "solteiro" ||
    dependentes !== 0 ||
    saPorDia !== 0 ||
    anoJovem !== 0 ||
    tipoRendimento !== "trabalho" ||
    regiao !== "continente" ||
    duodecimos !== "14" ||
    adse;

  const [motor, setMotor] = useState<MotorFiscal | null>(null);
  useEffect(() => {
    if (!foraDoCan || motor) return;
    let vivo = true;
    Promise.all([
      import("@/lib/engines/recibo"),
      import("@/lib/engines/irs"),
      import("@/lib/engines/pensao"),
    ]).then(([rec, irs, pen]) => {
      if (vivo)
        setMotor({
          reciboMensal: rec.reciboMensal,
          simularSalario: irs.simularSalario,
          reciboPensaoMensal: pen.reciboPensaoMensal,
          simularPensao: pen.simularPensao,
        });
    });
    return () => {
      vivo = false;
    };
  }, [foraDoCan, motor]);

  // a régua só emite pontos da grelha — a linha existe sempre
  const linhaBase =
    cenarios.linhas.find((l) => l.bruto === bruto) ?? cenarios.linhas[0];

  // enquanto o motor carrega mostra-se o último valor calculado
  const recibo = useMemo<ReciboSalarioOuPensao>(() => {
    if (!foraDoCan || !motor) return deLinha(linhaBase);
    if (tipoRendimento === "pensao") {
      const rp = motor.reciboPensaoMensal({
        bruto,
        situacao: PARA_RETENCAO[situacao],
        dependentes,
        adse,
        duodecimos,
        ano,
      });
      return {
        bruto: rp.bruto,
        duodecimosBruto: rp.duodecimosMensal,
        saTotal: 0,
        saIsento: 0,
        saTributavel: 0,
        ss: 0,
        adse: rp.adse,
        retencao: rp.retencao,
        retencaoDuodecimos: rp.retencaoDuodecimos,
        taxaEfetiva: rp.taxaEfetiva,
        tabela: rp.tabela,
        liquido: rp.liquido,
        liquidoSemDuodecimos: rp.liquidoSemDuodecimos,
        tsuEntidade: 0,
        custoEmpresa: rp.brutoComDuodecimos,
      };
    }
    return motor.reciboMensal({
      bruto,
      situacao: PARA_RETENCAO[situacao],
      dependentes,
      saPorDia,
      formaSA,
      anoIrsJovem: anoJovem,
      adse,
      duodecimos,
      ano,
    });
  }, [
    foraDoCan,
    linhaBase,
    motor,
    tipoRendimento,
    bruto,
    situacao,
    dependentes,
    saPorDia,
    formaSA,
    anoJovem,
    adse,
    duodecimos,
    ano,
  ]);

  // Em "casado único titular" o cônjuge sem rendimentos conta para o
  // quociente conjugal (÷2) mas não tem dedução específica própria.
  const resultado = useMemo<LinhaCenario["ano14"] & { adseAnual?: number }>(() => {
    if (!foraDoCan || !motor) return linhaBase.ano14;
    const brutos =
      situacao === "solteiro"
        ? [bruto]
        : situacao === "casado2"
          ? [bruto, conjuge]
          : [bruto, 0];
    if (tipoRendimento === "pensao") {
      return motor.simularPensao(brutos, dependentes, ano, 14, {
        adse,
        regiao,
      });
    }
    const limDia = saIsento[formaSA];
    const saIsentoAnual = Math.min(saPorDia, limDia) * DIAS_SA_ANO;
    const saTributavelAnual = Math.max(0, saPorDia - limDia) * DIAS_SA_ANO;
    return motor.simularSalario(brutos, dependentes, ano, 14, {
      anoIrsJovem: anoJovem,
      saIsentoAnual,
      saTributavelAnual,
      adse,
      regiao,
    });
  }, [
    foraDoCan,
    linhaBase,
    motor,
    tipoRendimento,
    bruto,
    conjuge,
    situacao,
    dependentes,
    saPorDia,
    formaSA,
    saIsento,
    anoJovem,
    adse,
    regiao,
    ano,
  ]);

  const urlPartilha = useMemo(() => {
    return construirUrl(
      "/salario",
      {
        bruto,
        modo: tipoRendimento,
        regiao,
        duod: duodecimos,
        adse,
        sit: situacao,
        conjuge: situacao === "casado2" ? conjuge : undefined,
        dep: dependentes,
        sa: saPorDia,
        formaSa: saPorDia > 0 ? formaSA : undefined,
        jovem: anoJovem,
      },
      {
        bruto: cenarios.meta.brutoRef,
        modo: "trabalho",
        regiao: "continente",
        duod: "14",
        adse: false,
        sit: "solteiro",
        conjuge: cenarios.meta.brutoRef,
        dep: 0,
        sa: 0,
        formaSa: "cartao",
        jovem: 0,
      }
    );
  }, [
    bruto,
    tipoRendimento,
    regiao,
    duodecimos,
    adse,
    situacao,
    conjuge,
    dependentes,
    saPorDia,
    formaSA,
    anoJovem,
    cenarios.meta.brutoRef,
  ]);

  const valor: SalarioEstado = {
    ano,
    cenarios,
    saIsento,
    irsJovemIsencao,
    seloNaoRetido,
    regua,
    smnRegioes,
    adseRegras,
    pensaoDeducaoEspecifica,
    acoresReducaoIrsPct,
    tipoRendimento,
    setTipoRendimento,
    regiao,
    setRegiao,
    duodecimos,
    setDuodecimos,
    adse,
    setAdse,
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
    urlPartilha,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSalario(): SalarioEstado {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSalario fora do ProvedorSalario");
  return c;
}
