"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  avaliarLimitesMacroprudenciais,
  simularPrestacaoMista,
  type AvaliacaoMacroprudencial,
  type FaixaEtariaMutuario,
  type RegimeTaxaCredito,
  type RegrasCreditoHabitacao,
  type ResultadoPrestacaoMista,
} from "@/lib/engines/prestacao";
import {
  construirUrl,
  lerBool,
  lerEnum,
  lerFloat,
  lerInt,
  useLeituraUrl,
} from "@/lib/url-state";

export type PrazoEuribor = "3m" | "6m" | "12m";
export type AnosFixosMista = 2 | 5 | 10;

export interface InfoEuriborPrazo {
  valor: number | null;
  serieAte: string | null;
  mediana: number | null;
}

export type TabelaPrazosEuribor = Record<PrazoEuribor, InfoEuriborPrazo>;

/**
 * O contrato de crédito partilhado pelos três níveis de /credito (V4):
 * o nível 1 lê a resposta (a prestação e o total), o nível 2 mexe nas
 * réguas e vê o mapa juro↔capital, o nível 3 confirma linha a linha —
 * tudo sobre o MESMO capital, prazo, Euribor, spread e modalidade de taxa.
 *
 * Regra nº 1: `euribor` pode ser null (o BPstat falhou) — nesse caso
 * em taxa variável ou mista `sim`/`base` são null e as peças mostram a
 * falha, nunca um número inventado.
 */
interface EstadoCredito {
  capital: number;
  anos: number;
  /** Euribor em vigor na régua — null quando a fonte falhou */
  euribor: number | null;
  spread: number;
  /** Modalidade de taxa: variável, mista ou fixa */
  regimeTaxa: RegimeTaxaCredito;
  /** Anos iniciais de taxa fixa quando regimeTaxa === "mista" */
  anosFixos: AnosFixosMista;
  /** TAN fixa em percentagem (ex.: 2.8 = 2,8 %) para taxa mista ou fixa */
  tanFixa: number;
  /** Rendimento líquido mensal do agregado (€) para cálculo da DSTI */
  rendimentoLiquido: number;
  /** Escalão etário do titular para limite de maturidade BdP */
  faixaEtaria: FaixaEtariaMutuario;
  /** Regras oficiais de crédito à habitação vindas do servidor */
  regrasCredito: RegrasCreditoHabitacao;
  /** Avaliação dos limites macroprudenciais do Banco de Portugal */
  macroprudencial: AvaliacaoMacroprudencial | null;
  /** Prazo da Euribor selecionado ("3m", "6m" ou "12m") */
  prazoEuribor: PrazoEuribor;
  /** Dados dos três prazos de Euribor (3M, 6M, 12M) */
  taxasEuribor: TabelaPrazosEuribor;
  /** o choque de +1 p.p. — um interruptor, não uma nota de rodapé */
  choque: boolean;
  /** taxa efectiva = euribor + choque */
  eurEf: number | null;
  /** a simulação com o choque aplicado */
  sim: ResultadoPrestacaoMista | null;
  /** a simulação sem choque — o custo do choque mede-se contra ela */
  base: ResultadoPrestacaoMista | null;
  setCapital: (v: number) => void;
  setAnos: (v: number) => void;
  setEuribor: (v: number | null) => void;
  setSpread: (v: number) => void;
  setRegimeTaxa: (r: RegimeTaxaCredito) => void;
  setAnosFixos: (a: AnosFixosMista) => void;
  setTanFixa: (t: number) => void;
  setRendimentoLiquido: (v: number) => void;
  setFaixaEtaria: (f: FaixaEtariaMutuario) => void;
  setChoque: (v: boolean) => void;
  setPrazoEuribor: (p: PrazoEuribor) => void;
  /** URL limpo com o estado partilhável para o <BotaoCopiar> */
  urlPartilha: string;
}

const Ctx = createContext<EstadoCredito | null>(null);

const TABELA_PADRAO: TabelaPrazosEuribor = {
  "3m": { valor: null, serieAte: null, mediana: null },
  "6m": { valor: null, serieAte: null, mediana: null },
  "12m": { valor: null, serieAte: null, mediana: null },
};

export function CreditoProvider({
  euriborInicial = null,
  taxasEuribor = TABELA_PADRAO,
  regrasCredito,
  children,
}: {
  /** último valor da Euribor do BPstat — null = fonte em falha */
  euriborInicial?: number | null;
  /** tabela com valores e metadados dos prazos 3M, 6M e 12M */
  taxasEuribor?: TabelaPrazosEuribor;
  /** regras legais e macroprudenciais curadas em data/fiscal/credito-habitacao.json */
  regrasCredito: RegrasCreditoHabitacao;
  children: ReactNode;
}) {
  const [prazoEuribor, setPrazoEuriborState] = useState<PrazoEuribor>("12m");
  const [capital, setCapital] = useState(200000);
  const [anos, setAnos] = useState(30);
  const [regimeTaxa, setRegimeTaxa] = useState<RegimeTaxaCredito>("variavel");
  const [anosFixos, setAnosFixos] = useState<AnosFixosMista>(5);
  const [tanFixa, setTanFixa] = useState(2.8);
  const [rendimentoLiquido, setRendimentoLiquido] = useState(2000);
  const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtariaMutuario>("31a35");

  // o valor inicial segue o prazo seleccionado (12M por omissão) ou euriborInicial
  const valor12m = taxasEuribor["12m"]?.valor;
  const taxaInicial =
    valor12m !== null && valor12m !== undefined ? valor12m : euriborInicial;

  const [euribor, setEuribor] = useState<number | null>(
    taxaInicial !== null ? Math.round(taxaInicial * 100) / 100 : null
  );
  const [spread, setSpread] = useState(1.0);
  const [choque, setChoque] = useState(false);

  const setPrazoEuribor = useCallback(
    (p: PrazoEuribor) => {
      setPrazoEuriborState(p);
      const novo = taxasEuribor[p]?.valor;
      if (novo !== null && novo !== undefined) {
        setEuribor(Math.round(novo * 100) / 100);
      }
    },
    [taxasEuribor]
  );

  // Leitura segura do estado por URL (Pilar 1 — T12)
  useLeituraUrl((sp) => {
    const cap = lerInt(sp.get("capital"), 10000, 1500000);
    if (cap !== undefined) setCapital(cap);
    const a = lerInt(sp.get("anos"), 5, 40);
    if (a !== undefined) setAnos(a);
    const s = lerFloat(sp.get("spread"), 0, 5);
    if (s !== undefined) setSpread(s);
    const reg = lerEnum(sp.get("regime"), ["variavel", "mista", "fixa"] as const);
    if (reg) setRegimeTaxa(reg);
    const af = lerInt(sp.get("anosFixos"), 2, 10);
    if (af === 2 || af === 5 || af === 10) setAnosFixos(af);
    const tf = lerFloat(sp.get("tanFixa"), 0, 15);
    if (tf !== undefined) setTanFixa(tf);
    const rend = lerInt(sp.get("rendimento"), 500, 30000);
    if (rend !== undefined) setRendimentoLiquido(rend);
    const fe = lerEnum(sp.get("faixa"), ["ate30", "31a35", "mais35"] as const);
    if (fe) setFaixaEtaria(fe);
    const pz = lerEnum(sp.get("prazo"), ["3m", "6m", "12m"] as const);
    if (pz) setPrazoEuribor(pz);
    if (sp.has("choque")) setChoque(lerBool(sp.get("choque")));
    const e = lerFloat(sp.get("euribor"), -1, 10);
    if (e !== undefined) setEuribor(e);
  });

  const eurEf = euribor === null ? null : euribor + (choque ? 1 : 0);

  const sim = useMemo(() => {
    const prazoMeses = anos * 12;
    if (regimeTaxa === "fixa") {
      return simularPrestacaoMista(
        capital,
        prazoMeses,
        anos,
        tanFixa / 100,
        (eurEf ?? 0) / 100,
        spread / 100
      );
    }
    if (eurEf === null) return null;
    const fixos = regimeTaxa === "mista" ? anosFixos : 0;
    return simularPrestacaoMista(
      capital,
      prazoMeses,
      fixos,
      tanFixa / 100,
      eurEf / 100,
      spread / 100
    );
  }, [capital, anos, regimeTaxa, anosFixos, tanFixa, eurEf, spread]);

  // a base serve para ler o custo do choque em euros
  const base = useMemo(() => {
    const prazoMeses = anos * 12;
    if (regimeTaxa === "fixa") {
      return simularPrestacaoMista(
        capital,
        prazoMeses,
        anos,
        tanFixa / 100,
        (euribor ?? 0) / 100,
        spread / 100
      );
    }
    if (euribor === null) return null;
    const fixos = regimeTaxa === "mista" ? anosFixos : 0;
    return simularPrestacaoMista(
      capital,
      prazoMeses,
      fixos,
      tanFixa / 100,
      euribor / 100,
      spread / 100
    );
  }, [capital, anos, regimeTaxa, anosFixos, tanFixa, euribor, spread]);

  const macroprudencial = useMemo(() => {
    if (!sim) return null;
    // Em taxa mista, o teste macroprudencial avalia também a taxa variável posterior se superior
    const tanRef =
      regimeTaxa === "mista"
        ? Math.max(sim.tanFixa, sim.tanVariavel)
        : sim.tan;
    return avaliarLimitesMacroprudenciais({
      capital,
      prazoAnos: anos,
      tanAtual: tanRef,
      rendimentoLiquidoMensal: rendimentoLiquido,
      faixaEtaria,
      regimeTaxa,
      limites: regrasCredito.recomendacaoMacroprudencialBdP,
    });
  }, [
    sim,
    regimeTaxa,
    capital,
    anos,
    rendimentoLiquido,
    faixaEtaria,
    regrasCredito,
  ]);

  const urlPartilha = useMemo(() => {
    return construirUrl(
      "/credito",
      {
        capital,
        anos,
        spread,
        regime: regimeTaxa,
        anosFixos: regimeTaxa === "mista" ? anosFixos : undefined,
        tanFixa: regimeTaxa !== "variavel" ? tanFixa : undefined,
        rendimento: rendimentoLiquido,
        faixa: faixaEtaria,
        prazo: prazoEuribor,
        choque,
      },
      {
        capital: 200000,
        anos: 30,
        spread: 1.0,
        regime: "variavel",
        anosFixos: 5,
        tanFixa: 2.8,
        rendimento: 2000,
        faixa: "31a35",
        prazo: "12m",
        choque: false,
      }
    );
  }, [
    capital,
    anos,
    spread,
    regimeTaxa,
    anosFixos,
    tanFixa,
    rendimentoLiquido,
    faixaEtaria,
    prazoEuribor,
    choque,
  ]);

  const valor = useMemo<EstadoCredito>(
    () => ({
      capital,
      anos,
      euribor,
      spread,
      regimeTaxa,
      anosFixos,
      tanFixa,
      rendimentoLiquido,
      faixaEtaria,
      regrasCredito,
      macroprudencial,
      prazoEuribor,
      taxasEuribor,
      choque,
      eurEf,
      sim,
      base,
      setCapital,
      setAnos,
      setEuribor,
      setSpread,
      setRegimeTaxa,
      setAnosFixos,
      setTanFixa,
      setRendimentoLiquido,
      setFaixaEtaria,
      setChoque,
      setPrazoEuribor,
      urlPartilha,
    }),
    [
      capital,
      anos,
      euribor,
      spread,
      regimeTaxa,
      anosFixos,
      tanFixa,
      rendimentoLiquido,
      faixaEtaria,
      regrasCredito,
      macroprudencial,
      prazoEuribor,
      taxasEuribor,
      choque,
      eurEf,
      sim,
      base,
      setPrazoEuribor,
      urlPartilha,
    ]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCredito(): EstadoCredito {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCredito fora do CreditoProvider");
  return c;
}
