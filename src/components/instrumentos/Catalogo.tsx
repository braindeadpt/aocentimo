"use client";

/**
 * Catalogo — o observatório inteiro em pequenos múltiplos (D-05):
 * uma mini-linha por série, filtros por fonte/frequência/estado com
 * botões aria-pressed (multi dentro do grupo, E entre grupos), janela
 * temporal «{n} a · máx» e reordenação com GSAP Flip (só em
 * interacção e só com motionActiva — o chunk nunca entra no inicial).
 * Cada célula liga à página temática da série (ou ao JSON em /api/)
 * e expõe sempre o export «JSON». Equivalente único: <dl> sr-only
 * das séries visíveis com último valor e data.
 */
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Flip } from "gsap/Flip";
import { fmtData, fmtNum } from "@/lib/format";
import { dataDePeriodo, escalaTempo, escalaValor } from "@/lib/viz/escalas";
import { pathLinha } from "@/lib/viz/formas";
import { EmptyState } from "@/components/EmptyState";
import { carregarGsap, dur, ease, motionActiva } from "@/lib/motion/gsap";
import { m, t } from "@/lib/messages";

export type FonteCatalogo = "eurostat" | "bpstat" | "dgeg" | "derivado";
export type EstadoCatalogo = "em-dia" | "atrasada" | "sem-sla";

export interface SerieCatalogo {
  id: string;
  rotulo: string;
  descricao?: string;
  pontos: { t: string; v: number }[];
  /** unidade de exibição já resolvida ("%", "€/L", "índice", …) */
  unidade: string;
  fonte: FonteCatalogo;
  frequencia: "diaria" | "mensal" | "trimestral" | "semestral" | "anual";
  estado: EstadoCatalogo;
  /** página temática da série, ou /api/<id>.json quando não há */
  href: string;
}

type EstadoFlip = ReturnType<typeof Flip.getState>;

const W = 200;
const H = 72;
const PAD = { top: 8, right: 6, bottom: 6, left: 6 };

const fmtV = (v: number, unidade: string) =>
  unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v);

const FREQ_TXT: Record<SerieCatalogo["frequencia"], string> = {
  diaria: m.dados.fDiaria,
  mensal: m.dados.fMensal,
  trimestral: m.dados.fTrimestral,
  semestral: m.dados.fSemestral,
  anual: "anual",
};

const ESTADO_TXT: Record<EstadoCatalogo, string> = {
  "em-dia": m.dados.fEmDia,
  atrasada: m.dados.fAtrasada,
  "sem-sla": m.dados.fSemSla,
};

/** Captura a geometria das células visíveis ANTES da mutação — o
 *  useLayoutEffect seguinte corre o Flip.from. */
async function capturaFlip(
  el: HTMLDivElement | null
): Promise<EstadoFlip | null> {
  if (!el || !motionActiva()) return null;
  const { Flip } = await carregarGsap();
  return Flip.getState(el.querySelectorAll("[data-celula]:not(.hidden)"));
}

/** toggle multi dentro de um grupo de filtros */
function toggleSet<T>(set: Set<T>, v: T): Set<T> {
  const s = new Set(set);
  if (s.has(v)) s.delete(v);
  else s.add(v);
  return s;
}

const FONTE_TXT: Record<FonteCatalogo, string> = {
  eurostat: "Eurostat",
  bpstat: "BdP",
  dgeg: "DGEG",
  derivado: "Derivado",
};

function BotaoFiltro<T>({
  ativo,
  valor,
  onMudar,
  children,
}: {
  ativo: boolean;
  valor: T;
  onMudar: (v: T) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={() => onMudar(valor)}
      className={`border px-2 py-0.5 font-mono text-[11px] transition-colors ${
        ativo
          ? "border-ink bg-ink text-panel"
          : "border-line bg-transparent text-ink2 hover:border-ink2"
      }`}
    >
      {children}
    </button>
  );
}

export function Catalogo({
  series,
  titulo,
  janela = 10,
}: {
  series: SerieCatalogo[];
  titulo: string;
  janela?: number;
}) {
  const grelha = useRef<HTMLDivElement>(null);
  const flipPendente = useRef<EstadoFlip | null>(null);
  const [janelaOn, setJanelaOn] = useState(true);
  const [fFonte, setFFonte] = useState<Set<FonteCatalogo>>(new Set());
  const [fFreq, setFFreq] = useState<Set<string>>(new Set());
  const [fEstado, setFEstado] = useState<Set<EstadoCatalogo>>(new Set());

  /* handlers useCallback — o lint de refs aceita acesso dentro de
     callbacks nomeados (mesmo padrão do GrelhaPainel), não dentro de
     arrows inline no JSX */
  const mudarFonte = useCallback((f: FonteCatalogo) => {
    void (async () => {
      flipPendente.current = await capturaFlip(grelha.current);
      setFFonte((prev) => toggleSet(prev, f));
    })();
  }, []);
  const mudarFreq = useCallback((f: string) => {
    void (async () => {
      flipPendente.current = await capturaFlip(grelha.current);
      setFFreq((prev) => toggleSet(prev, f));
    })();
  }, []);
  const mudarEstado = useCallback((e: EstadoCatalogo) => {
    void (async () => {
      flipPendente.current = await capturaFlip(grelha.current);
      setFEstado((prev) => toggleSet(prev, e));
    })();
  }, []);

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
  }, [fFonte, fFreq, fEstado, janelaOn]);

  const dados = useMemo(() => {
    const todas = series
      .map((s) => ({
        ...s,
        pts: s.pontos
          .map((p) => ({ t: dataDePeriodo(p.t).getTime(), v: p.v }))
          .filter((p) => !Number.isNaN(p.t))
          .sort((a, b) => a.t - b.t),
      }))
      .filter((s) => s.pts.length > 0);
    if (!janelaOn) return todas;
    const maxT = Math.max(...todas.map((d) => d.pts[d.pts.length - 1].t));
    const corte = maxT - janela * 365.25 * 86_400_000;
    return todas.map((d) => {
      const pts = d.pts.filter((p) => p.t >= corte);
      return { ...d, pts: pts.length >= 2 ? pts : d.pts.slice(-2) };
    });
  }, [series, janela, janelaOn]);

  const visiveis = useMemo(
    () =>
      dados.filter(
        (d) =>
          (fFonte.size === 0 || fFonte.has(d.fonte)) &&
          (fFreq.size === 0 || fFreq.has(d.frequencia)) &&
          (fEstado.size === 0 || fEstado.has(d.estado))
      ),
    [dados, fFonte, fFreq, fEstado]
  );

  if (dados.length === 0) return <EmptyState titulo="Série indisponível" />;

  const idsVisiveis = new Set(visiveis.map((d) => d.id));

  const grupo = (
    nome: string,
    filhos: ReactNode
  ) => (
    <div className="flex flex-wrap items-baseline gap-1.5" role="group" aria-label={nome}>
      <span className="kicker-xs text-ink2">{nome}</span>
      {filhos}
    </div>
  );

  return (
    <div className="relative w-full">
      <dl className="sr-only">
        <dt>{titulo}</dt>
        {visiveis.map((d) => {
          const ult = d.pts[d.pts.length - 1];
          return (
            <dd key={d.id}>
              {d.rotulo}: {fmtV(ult.v, d.unidade)} em{" "}
              {fmtData(new Date(ult.t).toISOString().slice(0, 10))} —{" "}
              {FONTE_TXT[d.fonte]}, {FREQ_TXT[d.frequencia]},{" "}
              {ESTADO_TXT[d.estado]}
            </dd>
          );
        })}
      </dl>

      {/* barra de filtros — grupos com rótulo kicker, janela à direita */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {grupo(
            m.dados.fFonte,
            (Object.keys(FONTE_TXT) as FonteCatalogo[]).map((f) => (
              <BotaoFiltro
                key={f}
                ativo={fFonte.has(f)}
                valor={f}
                onMudar={mudarFonte}
              >
                {FONTE_TXT[f]}
              </BotaoFiltro>
            ))
          )}
          {grupo(
            m.dados.fFreq,
            (["diaria", "mensal", "trimestral", "semestral"] as const).map(
              (f) => (
                <BotaoFiltro
                  key={f}
                  ativo={fFreq.has(f)}
                  valor={f}
                  onMudar={mudarFreq}
                >
                  {FREQ_TXT[f]}
                </BotaoFiltro>
              )
            )
          )}
          {grupo(
            m.dados.fEstado,
            (Object.keys(ESTADO_TXT) as EstadoCatalogo[]).map((e) => (
              <BotaoFiltro
                key={e}
                ativo={fEstado.has(e)}
                valor={e}
                onMudar={mudarEstado}
              >
                {ESTADO_TXT[e]}
              </BotaoFiltro>
            ))
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="num text-[11px] text-ink2 tabular-nums" aria-hidden>
            {t(m.dados.visiveis, { n: visiveis.length, total: dados.length })}
          </p>
          <div className="flex gap-1" role="group">
            {[true, false].map((v) => (
              <BotaoFiltro
                key={String(v)}
                ativo={janelaOn === v}
                valor={v}
                onMudar={setJanelaOn}
              >
                {v ? t(m.chart.janelaAnos, { n: janela }) : m.chart.janelaMax}
              </BotaoFiltro>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={grelha}
        className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 lg:grid-cols-4"
      >
        {dados.map((d) => {
          const ys = d.pts.map((p) => p.v);
          const mn = Math.min(...ys);
          const mx = Math.max(...ys);
          const folga = (mx - mn || 1) * 0.08;
          const dom: [number, number] = [mn - folga, mx + folga];
          const x = escalaTempo(
            d.pontos,
            [PAD.left, W - PAD.right]
          );
          const y = escalaValor([], [H - PAD.bottom, PAD.top], {
            dominio: dom,
          });
          const ult = d.pts[d.pts.length - 1];
          const escondida = !idsVisiveis.has(d.id);
          return (
            <div
              key={d.id}
              data-celula
              className={`bg-panel px-3 py-2 ${
                escondida ? "hidden" : "flex flex-col"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <a
                  href={d.href}
                  title={d.descricao ?? d.rotulo}
                  className="kicker-xs min-w-0 flex-1 truncate text-ink2 underline-offset-2 hover:text-accent hover:underline"
                >
                  {d.rotulo}
                </a>
                <p className="num shrink-0 text-xs text-ink tabular-nums whitespace-nowrap">
                  {fmtV(ult.v, d.unidade)}
                </p>
              </div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-1 block w-full"
                aria-hidden
                data-viz
              >
                {dom[0] < 0 && dom[1] > 0 && (
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={y(0)}
                    y2={y(0)}
                    stroke="var(--line)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <path
                  d={pathLinha(
                    d.pts.map(
                      (p) => [x(new Date(p.t)), y(p.v)] as [number, number]
                    )
                  )}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={x(new Date(ult.t))}
                  cy={y(ult.v)}
                  r={2}
                  fill="var(--ink)"
                />
              </svg>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="footnote flex items-center gap-1.5">
                  <span className={`serie-estado ${d.estado}`} aria-hidden />
                  {FREQ_TXT[d.frequencia]} · {ESTADO_TXT[d.estado]}
                </p>
                <a
                  href={`/api/${d.id}.json`}
                  className="num text-[10px] text-ink2 underline-offset-2 hover:text-accent hover:underline"
                >
                  {m.dados.json}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
