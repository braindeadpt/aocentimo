"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  repartePorEscaloes,
  escalaoMarginal,
  simularSalario,
  REGRAS_IRS,
  type FatiaEscalao,
} from "@/lib/engines/irs";

/**
 * O estado do nível 1 de /irs num contexto (sessão 3A): a régua do
 * salário bruto anual, os recipientes que enchem e a frase simples
 * vivem em sítios diferentes do <Pagina> — o provedor partilha o
 * `bruto` e as contas derivadas entre eles. Os níveis 2 e 3 têm
 * estado próprio (o acerto e o IRS Jovem são simuladores
 * independentes).
 *
 * 4B-02: a régua mede o BRUTO anual — o número que a pessoa conhece
 * do contrato. O motor converte-o em coletável (dedução específica +
 * mínimo de existência, perfil canónico: um titular, 14 meses) antes
 * dos escalões — nunca se pergunta o coletável, que é o número do
 * fisco, não o da pessoa. O termo «rendimento coletável» vive no
 * nível 2, com o exemplo numérico.
 */

export interface ReguaBruto {
  min: number;
  max: number;
  passo: number;
  rotulo: string;
  marcador: { valor: number; rotulo: string } | null;
  descricao?: string;
  limites?: { min?: string; max?: string };
}

export interface IrsEstado {
  ano: number;
  regua: ReguaBruto;
  /** salário bruto anual — o número da régua, o do contrato */
  bruto: number;
  setBruto: (v: number) => void;
  /** rendimento coletável anual — derivado do bruto pelo motor
      (dedução específica + mínimo de existência); é sobre ele que os
      escalões trabalham */
  rc: number;
  fatias: FatiaEscalao[];
  marginal: ReturnType<typeof escalaoMarginal>;
  /** a coleta real, fatia a fatia */
  coleta: number;
  taxaMedia: number;
  /** o que o mito cobraria — tudo à taxa do último escalão tocado */
  mito: number;
  /** taxa de solidariedade — para a nota de pé dos recipientes */
  solidariedade: { de: number; taxa: number }[];
}

const Ctx = createContext<IrsEstado | null>(null);

export function ProvedorIrs({
  ano,
  regua,
  brutoInicial,
  children,
}: {
  ano: number;
  regua: ReguaBruto;
  /** o bruto anual do cenário canónico — a régua abre no mesmo
      salário que abre /salario (1 500 € × 14 meses) */
  brutoInicial: number;
  children: ReactNode;
}) {
  const regras = REGRAS_IRS[ano];
  const [bruto, setBruto] = useState(brutoInicial);

  // bruto anual → coletável tributado: a mesma conta de /salario,
  // pelo motor (14 meses, um titular, sem dependentes)
  const rc = useMemo(
    () => simularSalario([bruto / 14], 0, ano).coletavelTributado,
    [bruto, ano]
  );

  const fatias = useMemo(() => repartePorEscaloes(rc, regras), [rc, regras]);
  const marginal = escalaoMarginal(rc, regras);
  const coleta = fatias.reduce((a, f) => a + f.imposto, 0);
  const taxaMedia = rc > 0 ? coleta / rc : 0;
  const mito = rc * marginal.taxa;

  const valor: IrsEstado = {
    ano,
    regua,
    bruto,
    setBruto,
    rc,
    fatias,
    marginal,
    coleta,
    taxaMedia,
    mito,
    solidariedade: regras.solidariedade,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useIrs(): IrsEstado {
  const c = useContext(Ctx);
  if (!c) throw new Error("useIrs fora do ProvedorIrs");
  return c;
}
