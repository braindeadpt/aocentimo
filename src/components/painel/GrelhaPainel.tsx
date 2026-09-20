"use client";

/**
 * GrelhaPainel — a camada interactiva do painel (C-02): cada
 * instrumento expande inline para a Linha completa da série.
 *
 *  · rótulo = <button aria-expanded>; «página →» fica no expandido;
 *  · GSAP Flip via carregarGsap() — só em interacção e só com
 *    motionActiva(); em reduced-motion expande sem tween e o chunk
 *    nunca é pedido;
 *  · Escape ou 2.º clique fecha; um só expandido de cada vez;
 *  · #painel=<id> abre ao carregar (nasce expandido, sem animação) e
 *    faz scroll até à célula; abrir/fechar escreve history.replaceState;
 *  · a Linha chega por next/dynamic — fora do bundle inicial;
 *  · nada anima ao carregar (M-09) — o painel colapsado é o SSR.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Flip } from "gsap/Flip";
import { Source } from "@/components/Source";
import type { EstadoSerie } from "@/components/Spark";
import type { EventoLinha } from "@/components/instrumentos/Linha";
import { fmtNum, fmtPeriodo } from "@/lib/format";
import { m } from "@/lib/messages";
import { carregarGsap, dur, ease, motionActiva } from "@/lib/motion/gsap";
import { dataDePeriodo } from "@/lib/viz/escalas";

const Linha = dynamic(
  () => import("@/components/instrumentos/Linha").then((mo) => mo.Linha),
  { ssr: false, loading: () => <div className="h-72" aria-hidden /> }
);

/** dados serializáveis de um instrumento — montados no servidor */
export interface ItemPainel {
  id: string;
  /** rótulo curto do botão (messages.painel.rotulos) */
  rotulo: string;
  /** título completo para a Linha expandida */
  rotuloCompleto: string;
  descricao?: string;
  /** rota temática — futura leva data-futuro */
  href: string;
  futuro: boolean;
  estado: string;
  fonte: string;
  url?: string;
  rotuloAte: string;
  /** unidade para a Linha ("%", "€/L", "€/kWh", "" para saldo) */
  unidadeLinha: string;
  /** histórico completo lido no servidor de data/sources */
  serie: { t: string; v: number }[];
  eventos?: EventoLinha[];
  refLinha?: { valor: number; rotulo: string };
}

type EstadoFlip = ReturnType<typeof Flip.getState>;

const CtxPainel = createContext<{
  aberto: string | null;
  alternar: (id: string) => void;
}>({ aberto: null, alternar: () => {} });

const usePainel = () => useContext(CtxPainel);

const ESTADO_TXT: Record<string, string> = {
  "em-dia": m.painel.estadoEmDia,
  atrasada: m.painel.estadoAtrasada,
  "sem-sla": m.painel.estadoSemSla,
};

const RECORTES = [
  { k: "1a", rotulo: m.painel.periodo1a, anos: 1 },
  { k: "5a", rotulo: m.painel.periodo5a, anos: 5 },
  { k: "max", rotulo: m.painel.periodoMax, anos: null },
] as const;

type Recorte = (typeof RECORTES)[number]["k"];

/** o conteúdo expandido: selector de período + Linha completa com
 *  banda mín–máx histórica, referência tracejada e eventos */
function Expandido({ item }: { item: ItemPainel }) {
  const [recorte, setRecorte] = useState<Recorte>("5a");

  const pts = useMemo(() => {
    const anos = RECORTES.find((r) => r.k === recorte)?.anos;
    if (anos == null || item.serie.length === 0) return item.serie;
    const fim = dataDePeriodo(item.serie[item.serie.length - 1].t);
    const lim = new Date(fim);
    lim.setFullYear(lim.getFullYear() - anos);
    const c = lim.getTime();
    return item.serie.filter((p) => dataDePeriodo(p.t).getTime() >= c);
  }, [item.serie, recorte]);

  const banda = useMemo(() => {
    if (!item.serie.length) return undefined;
    const vs = item.serie.map((p) => p.v);
    const lo = Math.min(...vs);
    const hi = Math.max(...vs);
    return {
      min: lo,
      max: hi,
      rotulo: `${m.painel.bandaHistorica} · ${fmtNum(lo)}–${fmtNum(hi)}`,
    };
  }, [item.serie]);

  return (
    <div id={`exp-${item.id}`} className="mt-3 border-t border-line pt-3">
      <div
        className="mb-2 flex flex-wrap items-center gap-1"
        role="group"
        aria-label="Período do gráfico"
      >
        {RECORTES.map(({ k, rotulo }) => (
          <button
            key={k}
            type="button"
            aria-pressed={recorte === k}
            onClick={() => setRecorte(k)}
            className={`num border px-2 py-0.5 text-xs transition-colors ${
              recorte === k
                ? "border-ink text-ink"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      <Linha
        series={[{ id: item.id, rotulo: item.rotuloCompleto, pontos: pts }]}
        unidade={item.unidadeLinha}
        eventos={item.eventos}
        banda={banda}
        refLinha={item.refLinha}
        equivalente="tabela"
        titulo={item.rotuloCompleto}
        altura={300}
        estado={item.estado as EstadoSerie}
      />
      {item.descricao && <p className="footnote mt-2">{item.descricao}</p>}
      <p className="footnote mt-1 flex items-center gap-1.5">
        <span className={`serie-estado ${item.estado}`} aria-hidden />
        {m.painel.leitura} {fmtPeriodo(item.rotuloAte)} ·{" "}
        {ESTADO_TXT[item.estado] ?? item.estado}
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-4">
        <Source nome={item.fonte} url={item.url} />
        <Link
          href={item.href}
          {...(item.futuro ? { "data-futuro": "", prefetch: false } : {})}
          className="num text-xs text-ink2 underline decoration-line2 underline-offset-2 hover:text-accent"
        >
          {m.painel.pagina}
        </Link>
      </p>
    </div>
  );
}

/** um instrumento do painel: botão de rótulo + conteúdo colapsado
 *  (children, renderizados no servidor) + expansão */
export function InstrumentoPainel({
  item,
  children,
}: {
  item: ItemPainel;
  children: ReactNode;
}) {
  const { aberto, alternar } = usePainel();
  const ab = aberto === item.id;
  return (
    <div className="bg-panel p-3 md:px-4">
      <button
        type="button"
        aria-expanded={ab}
        aria-controls={`exp-${item.id}`}
        onClick={() => alternar(item.id)}
        title={item.descricao}
        className="kicker-xs flex w-full items-baseline justify-between gap-2 text-left underline decoration-line2 underline-offset-2 transition-colors hover:text-accent"
      >
        <span>{item.rotulo}</span>
        <span aria-hidden className="num text-muted">
          {ab ? "−" : "+"}
        </span>
      </button>
      {children}
      {ab && <Expandido item={item} />}
    </div>
  );
}

/** a célula da grelha — expande para a largura total quando um dos
 *  seus instrumentos está aberto (combustíveis partilham a célula) */
export function CelulaGrelha({
  ids,
  base,
  children,
}: {
  ids: string[];
  /** classes de span em colapso (ex.: "md:col-span-3 lg:col-span-4") */
  base: string;
  children: ReactNode;
}) {
  const { aberto } = usePainel();
  const ab = aberto !== null && ids.includes(aberto);
  return (
    <div
      data-celula
      data-ids={ids.join(" ")}
      className={`${base} ${ab ? "md:col-span-6 lg:col-span-12" : ""}`}
    >
      {children}
    </div>
  );
}

export function GrelhaPainel({ children }: { children: ReactNode }) {
  const grelha = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const flipPendente = useRef<EstadoFlip | null>(null);

  /* #painel=<id> — nasce expandido (sem animação: flipPendente fica
     null) e faz scroll até à célula */
  useEffect(() => {
    const alvo = /painel=([\w-]+)/.exec(window.location.hash)?.[1];
    if (!alvo) return;
    const cel = grelha.current?.querySelector(`[data-ids~="${alvo}"]`);
    if (!cel) return;
    setAberto(alvo);
    requestAnimationFrame(() =>
      cel.scrollIntoView({ block: "start" })
    );
  }, []);

  const alternar = useCallback(
    (id: string) => {
      const prox = aberto === id ? null : id;
      /* Flip: captura a geometria ANTES do render e anima no
         useLayoutEffect seguinte — só quando o movimento pode correr */
      const capturar = async () => {
        if (motionActiva() && grelha.current) {
          const { Flip } = await carregarGsap();
          if (grelha.current) {
            flipPendente.current = Flip.getState(
              grelha.current.querySelectorAll("[data-celula]")
            );
          }
        }
        setAberto(prox);
        window.history.replaceState(
          null,
          "",
          prox
            ? `#painel=${prox}`
            : window.location.pathname + window.location.search
        );
      };
      void capturar();
    },
    [aberto]
  );

  useLayoutEffect(() => {
    const st = flipPendente.current;
    flipPendente.current = null;
    if (!st || !motionActiva()) return;
    void carregarGsap().then(({ Flip }) => {
      Flip.from(st, {
        duration: dur("media"),
        ease: ease("entra"),
        absolute: true,
        nested: true,
      });
    });
  }, [aberto]);

  return (
    <CtxPainel.Provider value={{ aberto, alternar }}>
      <div
        ref={grelha}
        className="grid grid-cols-1 gap-px bg-line md:grid-cols-6 lg:grid-cols-12"
        onKeyDown={(e) => {
          if (e.key === "Escape" && aberto) alternar(aberto);
        }}
      >
        {children}
      </div>
    </CtxPainel.Provider>
  );
}
