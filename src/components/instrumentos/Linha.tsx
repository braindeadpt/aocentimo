"use client";

/**
 * Linha — o gráfico de séries do observatório (B-02).
 *
 * d3 calcula (escalas, marcas, traço monotone); o SVG é desenhado à mão
 * e o movimento é GSAP sobre os tokens de duração e easing. Substitui o
 * LineChart mantendo a gramática de interrogação:
 *  · readout fixo por cima — nunca tooltip flutuante;
 *  · rato/toque apontam às marcas; a régua .chart-scrub percorre por
 *    teclado (setas, Home/End, Escape limpa) com aria-valuetext;
 *  · eventos = marcas verticais + faixas, citados numa lista com fonte;
 *  · banda de contexto (prop) como área tracejada + banda de dispersão
 *    automática entre séries irmãs;
 *  · sem dados → EmptyState; equivalente textual em irmão sr-only
 *    ("tabela" com os últimos 24 pontos ou "dl" com o último de cada);
 *  · morph de dados (M-06): quando a série muda, pontos e domínio viajam
 *    — GSAP interpola, nunca corta. prefers-reduced-motion: estado final.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { scaleTime } from "d3-scale";
import { fmtData, fmtNum } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import {
  chaveSeries,
  interpDom,
  interpPts,
  type Dominio,
  type PontoTV,
} from "@/lib/grafico";
import { useArmado } from "@/lib/useArmado";
import {
  carregarGsap,
  dur,
  ease,
  motionActiva,
  stagger,
} from "@/lib/motion/gsap";
import { dataDePeriodo, escalaValor } from "@/lib/viz/escalas";
import { rotuloValor, ticksTempo } from "@/lib/viz/eixos";
import { pathLinha } from "@/lib/viz/formas";
import { m } from "@/lib/messages";

export interface SerieLinha {
  id: string;
  rotulo: string;
  /** pontos {t, v} — t aceita "YYYY-MM-DD", "YYYY-MM", "YYYY-Qn", "YYYY-Sn" */
  pontos: { t: string; v: number }[];
  cor?: string;
}

/** Evento de observatório — entra com fonte/URL quando há citação.
 *  tFim marca medidas com duração (faixa, não linha). */
export interface EventoLinha {
  t: string;
  tFim?: string;
  rotulo: string;
  detalhe?: string;
  fonte?: string;
  url?: string;
}

interface Props {
  series: SerieLinha[];
  unidade: string;
  eventos?: EventoLinha[];
  /** faixa de contexto — área tracejada entre dois valores (ex.: meta 2 %) */
  banda?: { min: number; max: number; rotulo: string };
  /** linha de referência horizontal tracejada em --mark (ex.: mediana) */
  refLinha?: { valor: number; rotulo: string };
  altura?: number;
  /** forma do equivalente textual sr-only */
  equivalente: "tabela" | "dl";
  titulo: string;
  /** selo de frescura — "atrasada" marca a falha no mostrador */
  estado?: "em-dia" | "atrasada" | "sem-sla";
}

/* paleta por defeito: tinta + família dink — cores semânticas
   (accent/keep/warn) têm significado, nunca são cor de série */
const CORES = [
  "var(--ink)",
  "var(--dink-2)",
  "var(--dink-3)",
  "var(--dink-4)",
];

const PAD = { top: 26, right: 132, bottom: 30, left: 46 };
const PAD_SM = { top: 26, right: 8, bottom: 30, left: 46 };
/** abaixo desta largura: legenda em linha por baixo em vez de rótulos de fim */
const COMPACTO = 560;

const r1 = (n: number) => Math.round(n * 10) / 10;

const isoDe = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function Linha({
  series,
  unidade,
  eventos,
  banda,
  refLinha,
  altura = 360,
  equivalente,
  titulo,
  estado,
}: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const { ref: refArmado, armado } = useArmado<HTMLDivElement>(titulo);
  const [w, setW] = useState(720);
  /** índice interrogado na série primária — null = repouso (o último) */
  const [ativo, setAtivo] = useState<number | null>(null);
  /** frame intermédio da morph de dados — null = estado final */
  const [frame, setFrame] = useState<{ dom: Dominio; pts: PontoTV[][] } | null>(
    null
  );

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* revelação DrawSVG — só quando o useArmado legitima (abaixo da dobra
     ou run nova) e o movimento pode correr; o GSAP chega por dynamic
     import — fora do bundle inicial. reduced-motion e SSR nascem no
     traço final e o chunk nunca é pedido. */
  useEffect(() => {
    if (!armado || !motionActiva()) return;
    let morto = false;
    let ctx: { revert(): void } | null = null;
    void carregarGsap().then(({ gsap }) => {
      const alvo = scope.current;
      if (morto || !alvo) return;
      ctx = gsap.context(() => {
        const linhas = alvo.querySelectorAll(".ln-linha");
        if (linhas.length) {
          gsap.fromTo(
            linhas,
            { drawSVG: "0%" },
            {
              drawSVG: "100%",
              duration: dur("longa"),
              ease: ease("entra"),
              stagger: stagger(),
              // a morph seguinte muda o d — o dash inline ficava a medir
              // o comprimento velho e escondia a cauda
              onComplete: () =>
                gsap.set(linhas, {
                  clearProps: "strokeDasharray,strokeDashoffset",
                }),
            }
          );
        }
        const bandas = alvo.querySelectorAll(".lc-banda, .ln-banda-ctx");
        if (bandas.length) {
          gsap.fromTo(
            bandas,
            { opacity: 0 },
            {
              opacity: 1,
              duration: dur("media"),
              delay: dur("longa") * 0.55,
              ease: ease("entra"),
              onComplete: () => gsap.set(bandas, { clearProps: "opacity" }),
            }
          );
        }
      }, alvo);
    });
    return () => {
      morto = true;
      ctx?.revert();
    };
  }, [armado]);

  const compacto = w < COMPACTO;
  const pad = compacto ? PAD_SM : PAD;

  const dados = useMemo(
    () =>
      series
        .map((s, i) => ({
          id: s.id,
          rotulo: s.rotulo,
          cor: s.cor ?? CORES[i % CORES.length],
          pts: s.pontos
            .map((p) => ({ t: dataDePeriodo(p.t).getTime(), v: p.v }))
            .filter((p) => !Number.isNaN(p.t))
            .sort((a, b) => a.t - b.t)
            // datas repetidas (revisões na fonte): fica a última
            .filter(
              (p, i, arr) => i === arr.length - 1 || arr[i + 1].t !== p.t
            ),
        }))
        .filter((d) => d.pts.length > 0),
    [series]
  );

  // domínio com folga proporcional — o zero não entra à força;
  // a linha de referência entra no domínio para nunca ser cortada
  const domBase = useMemo((): Dominio => {
    const ts = dados.flatMap((d) => d.pts.map((p) => p.t));
    const vs = dados.flatMap((d) => d.pts.map((p) => p.v));
    if (refLinha && Number.isFinite(refLinha.valor)) vs.push(refLinha.valor);
    const t0 = Math.min(...ts);
    const t1 = Math.max(...ts);
    const vMin = Math.min(...vs);
    const vMax = Math.max(...vs);
    const span = vMax - vMin || 1;
    return { t0, t1, lo: vMin - span * 0.09, hi: vMax + span * 0.09 };
  }, [dados, refLinha]);

  const dadosPts = useMemo(() => dados.map((d) => d.pts), [dados]);

  // morph M-06 — GSAP interpola domínio e pontos do render actual ao novo
  const chave = chaveSeries(
    dados.map((d) => ({ name: d.rotulo, pts: d.pts }))
  );
  const prevChave = useRef(chave);
  const renderedRef = useRef<{ dom: Dominio; pts: PontoTV[][] } | null>(null);

  useEffect(() => {
    renderedRef.current = frame ?? { dom: domBase, pts: dadosPts };
  });

  useEffect(() => {
    if (prevChave.current === chave) return;
    const de = renderedRef.current;
    const para = { dom: domBase, pts: dadosPts };
    prevChave.current = chave;
    renderedRef.current = para;
    if (!de || de.pts.length === 0 || !motionActiva()) return;
    let morto = false;
    const prog = { k: 0 };
    void carregarGsap().then(({ gsap }) => {
      if (morto) return;
      gsap.to(prog, {
        k: 1,
        duration: dur("media"),
        ease: ease("entra"),
        onUpdate: () =>
          setFrame({
            dom: interpDom(de.dom, para.dom, prog.k),
            pts: para.pts.map((pts, i) =>
              interpPts(de.pts[i] ?? [], pts, prog.k)
            ),
          }),
        onComplete: () => setFrame(null),
      });
    });
    return () => {
      morto = true;
    };
  }, [dados, domBase, dadosPts, chave]);

  const dom = frame?.dom ?? domBase;
  const ptsList = frame?.pts ?? dadosPts;

  const { x, y, xticks, yticks, fim, dispersao, cruzaZero } = useMemo(() => {
    const { t0, t1, lo, hi } = dom;
    const pad_ = pad;
    const plotW = w - pad_.left - pad_.right;
    const plotH = altura - pad_.top - pad_.bottom;
    const xS = scaleTime()
      .domain([new Date(t0), new Date(t1)])
      .range([pad_.left, w - pad_.right]);
    const yS = escalaValor([], [pad_.top + plotH, pad_.top], {
      dominio: [lo, hi],
    });
    const x = (t: number) => r1(xS(new Date(t)));
    const y = (v: number) => r1(yS(v));
    const cruzaZero = lo < 0 && hi > 0;

    // banda de dispersão — spread da família em cada ponto do eixo primário
    let dispersao: string | null = null;
    if (ptsList.length >= 2) {
      const base = ptsList[0];
      const topo: string[] = [];
      const fundo: string[] = [];
      for (const pb of base) {
        let mn = Infinity;
        let mx = -Infinity;
        for (const pts of ptsList) {
          let best = pts[0];
          for (const p of pts)
            if (Math.abs(p.t - pb.t) < Math.abs(best.t - pb.t)) best = p;
          if (best && best.v < mn) mn = best.v;
          if (best && best.v > mx) mx = best.v;
        }
        if (mx > -Infinity && mn < Infinity) {
          topo.push(`${x(pb.t)},${y(mx)}`);
          fundo.unshift(`${x(pb.t)},${y(mn)}`);
        }
      }
      if (topo.length > 1) dispersao = `${topo.join(" ")} ${fundo.join(" ")}`;
    }

    // rótulos de fim — relaxação em duas passagens (empurra para baixo,
    // e se transbordar sobe o bloco inteiro para a área útil)
    const fim = dados
      .map((d, i) => ({
        rotulo: d.rotulo,
        cor: d.cor,
        y: y(ptsList[i]?.[ptsList[i].length - 1]?.v ?? lo),
      }))
      .sort((a, b) => a.y - b.y);
    let prev = -Infinity;
    for (const f of fim) {
      f.y = Math.max(f.y, prev + 15, pad_.top + 6);
      prev = f.y;
    }
    const limite = pad_.top + plotH - 6;
    const excesso = fim.length ? fim[fim.length - 1].y - limite : 0;
    if (excesso > 0) {
      for (let i = fim.length - 1; i >= 0; i--) {
        const teto = i === fim.length - 1 ? limite : fim[i + 1].y - 15;
        fim[i].y = Math.min(fim[i].y, teto);
      }
    }
    return {
      x,
      y,
      xticks: ticksTempo(xS, Math.max(2, Math.floor(plotW / 64))),
      yticks: yS
        .ticks(4)
        .filter((v) => v >= lo && v <= hi)
        .map((v) => ({ y: y(v), rotulo: rotuloValor(v, unidade) })),
      fim,
      dispersao,
      cruzaZero,
    };
  }, [dados, dom, ptsList, w, altura, pad, unidade]);

  /* a referência depende do domínio — mas o domínio já a inclui */
  const yRef = refLinha ? y(refLinha.valor) : null;

  const plotW = w - pad.left - pad.right;
  const plotH = altura - pad.top - pad.bottom;
  const nPts = ptsList[0]?.length ?? 0;
  const idx = Math.min(ativo ?? nPts - 1, Math.max(0, nPts - 1));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setAtivo(Math.round(f * (nPts - 1)));
  };

  // ponto mais próximo do instante interrogado em cada série
  const alvo = ptsList[0]?.[idx]?.t ?? null;
  const lidos =
    alvo === null
      ? null
      : ptsList.map((pts) => {
          let best = pts[0];
          for (const p of pts)
            if (Math.abs(p.t - alvo) < Math.abs(best.t - alvo)) best = p;
          return best;
        });
  const cursorX = alvo !== null ? x(alvo) : null;

  // eventos dentro do domínio — faixa quando a medida tem duração
  const evs = useMemo(
    () =>
      (eventos ?? [])
        .map((e) => ({
          ...e,
          ms: dataDePeriodo(e.t).getTime(),
          msFim: e.tFim ? dataDePeriodo(e.tFim).getTime() : null,
        }))
        .filter((e) => e.ms <= dom.t1 && (e.msFim ?? e.ms) >= dom.t0)
        .sort((a, b) => a.ms - b.ms)
        .map((e, i) => {
          const ex = x(e.ms);
          const exFim = e.msFim !== null ? x(Math.min(e.msFim, dom.t1)) : null;
          const inverte = ex > w - pad.right - 120;
          return { ...e, ex, exFim, inverte, fila: i % 2 };
        }),
    [eventos, dom, x, w, pad.right]
  );

  // regra nº1: sem dados → estado explícito, nunca NaN
  if (dados.length === 0) {
    return <EmptyState titulo="Série indisponível" />;
  }

  const fmtV = (v: number) =>
    unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v);

  return (
    <div
      ref={(el) => {
        scope.current = el;
        refArmado(el);
      }}
      className="relative w-full"
    >
      {/* equivalente textual — um só, irmão do svg (aria-hidden) */}
      {equivalente === "tabela" ? (
        <div className="sr-only">
          <table>
            <caption>{titulo} — valores recentes</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                {dados.map((d) => (
                  <th key={d.id} scope="col">
                    {d.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, i) => {
                const pIdx = dados[0].pts.length - 24 + i;
                const p0 = dados[0].pts[pIdx];
                if (!p0) return null;
                return (
                  <tr key={p0.t}>
                    <td>{isoDe(p0.t)}</td>
                    {dados.map((d) => (
                      <td key={d.id}>
                        {d.pts[pIdx] ? fmtV(d.pts[pIdx].v) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <dl className="sr-only">
          <dt>{titulo}</dt>
          {dados.map((d) => {
            const ult = d.pts[d.pts.length - 1];
            return (
              <dd key={d.id}>
                {d.rotulo}: {fmtV(ult.v)} em {fmtData(isoDe(ult.t))}
              </dd>
            );
          })}
        </dl>
      )}

      {/* readout fixo + régua de teclado */}
      <div className="chart-readout" aria-live="polite">
        {estado === "atrasada" && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="serie-estado atrasada" />
            <span className="chart-readout-t text-warn">{m.chart.atrasada}</span>
          </span>
        )}
        <span className="chart-readout-t">
          {ativo === null ? `${m.chart.ultimo} · ` : ""}
          {alvo !== null ? fmtData(isoDe(alvo)) : ""}
        </span>
        {lidos?.map((p, i) => (
          <span key={dados[i].id} className="inline-flex items-baseline gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 self-center"
              style={{ background: dados[i].cor }}
            />
            <span className="chart-readout-t">{dados[i].rotulo}</span>
            <span className="chart-readout-v">{fmtV(p.v)}</span>
          </span>
        ))}
        <input
          type="range"
          className="chart-scrub"
          min={0}
          max={Math.max(0, nPts - 1)}
          value={idx}
          aria-label={m.chart.scrubAria}
          aria-valuetext={alvo !== null ? fmtData(isoDe(alvo)) : undefined}
          onChange={(e) => setAtivo(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAtivo(null);
          }}
          onBlur={() => setAtivo(null)}
        />
      </div>

      <svg
        viewBox={`0 0 ${w} ${altura}`}
        preserveAspectRatio="none"
        height={altura}
        className="block w-full"
        aria-hidden
        data-viz
      >
        {/* grelha horizontal + eixo y */}
        {yticks.map((tk) => (
          <g key={tk.rotulo}>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={tk.y}
              y2={tk.y}
              stroke="var(--color-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={pad.left - 8}
              y={tk.y + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-muted)"
              fontFamily="var(--font-mono)"
            >
              {tk.rotulo}
            </text>
          </g>
        ))}
        {/* eixo x — marcas por amplitude */}
        {xticks.map((tk) => (
          <text
            key={`${tk.x}-${tk.rotulo}`}
            x={tk.x}
            y={altura - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-muted)"
            fontFamily="var(--font-mono)"
          >
            {tk.rotulo}
          </text>
        ))}
        {/* linha de zero — só quando a série a atravessa */}
        {cruzaZero && (
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--color-line2)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {/* banda de contexto — área tracejada com rótulo */}
        {banda && (
          <g className="ln-banda-ctx">
            <rect
              x={pad.left}
              y={y(banda.max)}
              width={Math.max(0, plotW)}
              height={Math.max(0, y(banda.min) - y(banda.max))}
              fill="var(--seq-4)"
              fillOpacity={0.08}
              stroke="var(--seq-4)"
              strokeOpacity={0.4}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {/* ink, não muted — o rótulo fica DENTRO da banda --seq-4
                e tem de passar AA contra ela */}
            <text
              x={w - pad.right - 4}
              y={y(banda.max) + 11}
              textAnchor="end"
              fontSize={10}
              fill="var(--ink)"
              fontFamily="var(--font-mono)"
            >
              {banda.rotulo}
            </text>
          </g>
        )}
        {/* linha de referência — mediana/comparador tracejado em --mark */}
        {refLinha && yRef !== null && (
          <g>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={yRef}
              y2={yRef}
              stroke="var(--mark)"
              strokeWidth={1}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
            {/* idem — pode cair sobre a banda de contexto */}
            <text
              x={pad.left + 4}
              y={yRef - 4}
              fontSize={10}
              fill="var(--ink)"
              fontFamily="var(--font-mono)"
            >
              {refLinha.rotulo}
            </text>
          </g>
        )}
        {/* eventos — faixa com duração ou linha + quadrado torrado */}
        {evs.map((ev) => (
          <g key={ev.ms}>
            {ev.exFim !== null && (
              <rect
                className="lc-evento-faixa"
                x={ev.ex}
                y={pad.top}
                width={Math.max(1, ev.exFim - ev.ex)}
                height={plotH}
              />
            )}
            <line
              className="lc-evento"
              x1={ev.ex}
              x2={ev.ex}
              y1={pad.top}
              y2={pad.top + plotH}
            />
            <rect
              className="lc-evento-marca"
              x={ev.ex - 3}
              y={pad.top - 3}
              width={6}
              height={6}
            />
            <text
              className="lc-evento-rot"
              x={ev.inverte ? ev.ex - 6 : ev.ex + 6}
              y={pad.top + 10 + ev.fila * 11}
              textAnchor={ev.inverte ? "end" : "start"}
            >
              {ev.rotulo}
            </text>
          </g>
        ))}
        {/* dispersão da família */}
        {dispersao && (
          <polygon
            className="lc-banda"
            points={dispersao}
            fill="var(--seq-2)"
            fillOpacity={0.1}
            stroke="none"
          />
        )}
        {/* linhas — traço monotone, desenho esq→dir via DrawSVG */}
        {dados.map((d, i) => (
          <path
            key={d.id}
            className="ln-linha"
            fill="none"
            stroke={d.cor}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            d={pathLinha(
              (ptsList[i] ?? []).map((p) => [x(p.t), y(p.v)] as [number, number])
            )}
          />
        ))}
        {/* rótulos de fim de linha — só com espaço; cor no tick, nome em tinta */}
        {!compacto &&
          fim.map((f) => (
            <g key={f.rotulo}>
              <line
                x1={w - pad.right + 4}
                x2={w - pad.right + 12}
                y1={f.y}
                y2={f.y}
                stroke={f.cor}
                strokeWidth={2}
              />
              <text
                x={w - pad.right + 16}
                y={f.y + 4}
                fontSize={11}
                fill="var(--ink2)"
                fontFamily="var(--font-mono)"
              >
                {f.rotulo}
              </text>
            </g>
          ))}
        {/* cursor de interrogação */}
        {ativo !== null && cursorX !== null && lidos && (
          <g>
            <line
              x1={cursorX}
              x2={cursorX}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke="var(--color-line2)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {lidos.map((p, i) => (
              <circle
                key={dados[i].id}
                cx={x(p.t)}
                cy={y(p.v)}
                r={3.5}
                fill={dados[i].cor}
              />
            ))}
          </g>
        )}
        {/* zona de hover — rato e toque apontam às marcas */}
        <rect
          x={pad.left}
          y={pad.top}
          width={Math.max(0, plotW)}
          height={Math.max(0, plotH)}
          fill="transparent"
          style={{ touchAction: "pan-y" }}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setAtivo(null)}
        />
      </svg>
      {/* a citação dos eventos — cada anotação abre a fonte oficial */}
      {evs.length > 0 && (
        <ul
          aria-label={m.chart.eventosAria}
          className="mt-1 flex flex-wrap gap-x-5 gap-y-1"
        >
          {evs.map((ev) => (
            <li key={ev.ms} className="flex items-baseline gap-1.5 text-[11px]">
              <span
                aria-hidden
                className="inline-block h-2 w-2 self-center bg-mark"
              />
              {ev.url ? (
                <a
                  href={ev.url}
                  className="font-mono text-muted underline decoration-line2 underline-offset-2 transition-colors hover:text-ink"
                >
                  {ev.rotulo}
                </a>
              ) : (
                <span className="font-mono text-muted">{ev.rotulo}</span>
              )}
              <span className="font-mono text-muted">
                · {fmtData(isoDe(ev.ms))}
                {ev.msFim !== null && `–${fmtData(isoDe(ev.msFim))}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* legenda compacta — nomes já na tabela equivalente */}
      {compacto && (
        <div aria-hidden className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {dados.map((d) => (
            <span
              key={d.id}
              className="flex items-center gap-1.5 text-[11px] text-ink2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span
                className="inline-block h-2 w-2"
                style={{ background: d.cor }}
              />
              {d.rotulo}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
