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
  custoCompraPuro,
  type CompradoresJovens,
  type RegrasImt,
  type ResultadoCompra,
  type TipoCompra,
} from "@/lib/engines/imt-puro";
import {
  simularPrestacao,
  type RegrasCreditoHabitacao,
  type ResultadoPrestacao,
} from "@/lib/engines/prestacao";
import {
  construirUrl,
  lerBool,
  lerEnum,
  lerFloat,
  lerInt,
  useLeituraUrl,
} from "@/lib/url-state";

/**
 * A compra partilhada pelos três níveis de /casa (V4): o nível 1 lê o
 * dinheiro do dia da escritura, o nível 2 mexe nas réguas e vê a
 * escritura imprimir-se camada a camada, o nível 3 confirma tabelas —
 * tudo sobre o MESMO preço, entrada e contrato.
 *
 * Regra nº 1: `euribor` pode ser null (o BPstat falhou) — nesse caso
 * `prest` é null e a prestação mostra a falha, nunca um número
 * inventado.
 */
interface EstadoCasa {
  preco: number;
  tipo: TipoCompra;
  jovem: boolean;
  compradoresJovens: CompradoresJovens;
  garantiaPublica: boolean;
  garantiaPublicaElegivel: boolean;
  entrada: number;
  /** entrada grampeada ao preço — nunca se entra com mais do que a casa */
  entradaEf: number;
  /** entrada mínima recomendada pelo BdP sem Garantia Pública (10 % HPP, 20 % secundária) */
  entradaMinimaBdP: number;
  /** rácio financiamento/preço (LTV) */
  ltvAtual: number;
  /** limite máximo de LTV recomendado pelo BdP (0.90 HPP, 0.80 secundária) */
  ltvMaximoBdP: number;
  anos: number;
  euribor: number | null;
  spread: number;
  credito: number;
  compra: ResultadoCompra;
  prest: ResultadoPrestacao | null;
  /** simulação de referência com 10 % de entrada (LTV 90 %) para comparar o custo da Garantia 100 % */
  prestSemGarantia90: ResultadoPrestacao | null;
  regrasImt: RegrasImt;
  regrasCredito: RegrasCreditoHabitacao;
  /** o que sai do bolso no dia da escritura: entrada + impostos + registos */
  dinheiroEntrada: number;
  /** o total da escritura: preço + todos os custos */
  realEscritura: number;
  setPreco: (v: number) => void;
  setTipo: (v: TipoCompra) => void;
  setJovem: (v: boolean) => void;
  setCompradoresJovens: (v: CompradoresJovens) => void;
  setGarantiaPublica: (v: boolean) => void;
  setEntrada: (v: number) => void;
  setAnos: (v: number) => void;
  setEuribor: (v: number | null) => void;
  setSpread: (v: number) => void;
  /** URL limpo com o estado partilhável para o <BotaoCopiar> */
  urlPartilha: string;
}

const Ctx = createContext<EstadoCasa | null>(null);

export function CasaProvider({
  euriborInicial,
  regrasImt,
  regrasCredito,
  children,
}: {
  /** último valor da Euribor 3M do BPstat — null = fonte em falha */
  euriborInicial: number | null;
  /** regras de IMT + IS + registos passadas pelo servidor */
  regrasImt: RegrasImt;
  /** regras de crédito habitação (LTV BdP + Garantia Pública Jovem) passadas pelo servidor */
  regrasCredito: RegrasCreditoHabitacao;
  children: ReactNode;
}) {
  const [preco, setPreco] = useState(200000);
  const [tipo, setTipo] = useState<TipoCompra>("hpp");
  const [compradoresJovens, setCompradoresJovensState] =
    useState<CompradoresJovens>("nenhum");
  const [garantiaPublica, setGarantiaPublicaState] = useState(false);
  const [entrada, setEntradaState] = useState(20000);
  const [anos, setAnos] = useState(30);
  const [euribor, setEuribor] = useState<number | null>(
    euriborInicial !== null ? Math.round(euriborInicial * 100) / 100 : null
  );
  const [spread, setSpread] = useState(1.0);

  // Leitura segura do estado por URL (Pilar 1 — T12)
  useLeituraUrl((sp) => {
    const p = lerInt(sp.get("preco"), 20000, 3000000);
    if (p !== undefined) setPreco(p);
    const ent = lerInt(sp.get("entrada"), 0, 3000000);
    if (ent !== undefined) setEntradaState(ent);
    const tp = lerEnum(sp.get("tipo"), ["hpp", "secundaria"] as const);
    if (tp) setTipo(tp);
    const cj = lerEnum(sp.get("jovens"), ["nenhum", "todos", "umDeDois"] as const);
    if (cj) {
      setCompradoresJovensState(cj);
    } else if (sp.has("jovem")) {
      setCompradoresJovensState(lerBool(sp.get("jovem")) ? "todos" : "nenhum");
    }
    if (sp.has("garantia")) {
      setGarantiaPublicaState(lerBool(sp.get("garantia")));
    }
    const a = lerInt(sp.get("anos"), 5, 40);
    if (a !== undefined) setAnos(a);
    const s = lerFloat(sp.get("spread"), 0, 5);
    if (s !== undefined) setSpread(s);
    const e = lerFloat(sp.get("euribor"), -1, 10);
    if (e !== undefined) setEuribor(e);
  });

  const jovem = compradoresJovens !== "nenhum";

  const setJovem = useCallback((v: boolean) => {
    setCompradoresJovensState(v ? "todos" : "nenhum");
  }, []);

  const setCompradoresJovens = useCallback((v: CompradoresJovens) => {
    setCompradoresJovensState(v);
  }, []);

  const ltvMaximoBdP =
    tipo === "hpp"
      ? regrasCredito.recomendacaoMacroprudencialBdP.ltv.hpp
      : regrasCredito.recomendacaoMacroprudencialBdP.ltv.outrosFins;

  const entradaMinimaBdP = Math.round(preco * (1 - ltvMaximoBdP));

  const garantiaPublicaElegivel =
    tipo === "hpp" && preco <= regrasCredito.garantiaPublicaJovem.precoMax;

  const setGarantiaPublica = useCallback(
    (ligar: boolean) => {
      setGarantiaPublicaState(ligar);
      if (ligar) {
        setEntradaState(0);
      } else {
        setEntradaState((atual) => (atual === 0 ? entradaMinimaBdP : atual));
      }
    },
    [entradaMinimaBdP]
  );

  const setEntrada = useCallback((v: number) => {
    setEntradaState(v);
    if (v > 0) {
      setGarantiaPublicaState(false);
    }
  }, []);

  const entradaEf = Math.min(Math.max(0, entrada), Math.max(0, preco));
  const credito = Math.max(0, preco - entradaEf);
  const ltvAtual = preco > 0 ? credito / preco : 0;

  const compra = useMemo(
    () =>
      custoCompraPuro(preco, regrasImt, {
        tipo,
        compradoresJovens,
        montanteCredito: credito,
      }),
    [preco, regrasImt, tipo, compradoresJovens, credito]
  );

  const prest = useMemo(
    () =>
      euribor === null
        ? null
        : simularPrestacao(credito, anos * 12, euribor / 100, spread / 100),
    [credito, anos, euribor, spread]
  );

  const prestSemGarantia90 = useMemo(
    () =>
      euribor === null
        ? null
        : simularPrestacao(
            Math.max(0, preco - entradaMinimaBdP),
            anos * 12,
            euribor / 100,
            spread / 100
          ),
    [preco, entradaMinimaBdP, anos, euribor, spread]
  );

  const urlPartilha = useMemo(() => {
    return construirUrl(
      "/casa",
      {
        preco,
        entrada,
        tipo,
        jovens: compradoresJovens !== "nenhum" ? compradoresJovens : undefined,
        garantia: garantiaPublica,
        anos,
        spread,
      },
      {
        preco: 200000,
        entrada: 20000,
        tipo: "hpp",
        jovens: undefined,
        garantia: false,
        anos: 30,
        spread: 1.0,
      }
    );
  }, [preco, entrada, tipo, compradoresJovens, garantiaPublica, anos, spread]);

  const valor = useMemo<EstadoCasa>(
    () => ({
      preco,
      tipo,
      jovem,
      compradoresJovens,
      garantiaPublica: garantiaPublica && garantiaPublicaElegivel,
      garantiaPublicaElegivel,
      entrada,
      entradaEf,
      entradaMinimaBdP,
      ltvAtual,
      ltvMaximoBdP,
      anos,
      euribor,
      spread,
      credito,
      compra,
      prest,
      prestSemGarantia90,
      regrasImt,
      regrasCredito,
      dinheiroEntrada: entradaEf + compra.totalCustos,
      realEscritura: preco + compra.totalCustos,
      setPreco,
      setTipo,
      setJovem,
      setCompradoresJovens,
      setGarantiaPublica,
      setEntrada,
      setAnos,
      setEuribor,
      setSpread,
      urlPartilha,
    }),
    [
      preco,
      tipo,
      jovem,
      compradoresJovens,
      garantiaPublica,
      garantiaPublicaElegivel,
      entrada,
      entradaEf,
      entradaMinimaBdP,
      ltvAtual,
      ltvMaximoBdP,
      anos,
      euribor,
      spread,
      credito,
      compra,
      prest,
      prestSemGarantia90,
      regrasImt,
      regrasCredito,
      setJovem,
      setCompradoresJovens,
      setGarantiaPublica,
      setEntrada,
      urlPartilha,
    ]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCasa(): EstadoCasa {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCasa fora do CasaProvider");
  return c;
}
