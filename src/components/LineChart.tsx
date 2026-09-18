"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fmtData, fmtNum } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { chaveSeries, interpDom, interpPts, type Dominio, type PontoTV } from "@/lib/grafico";
import { easeEntra } from "@/lib/useValorAnimado";
import { m } from "@/lib/messages";

interface SerieIn {
  name: string;
  /** [data ISO "YYYY-MM-DD" ou "YYYY-MM", valor] */
  data: [string, number][];
  cor?: string;
}

/** Evento de observatório — só entra com fonte e URL (regra nº 1
 *  aplicada a anotações). Curadoria em data/fiscal/eventos.json. */
export interface EventoAn {
  /** data ISO do evento */
  t: string;
  /** fim ISO — medidas com duração desenham faixa, não linha */
  tFim?: string;
  rotulo: string;
  detalhe?: string;
  fonte: string;
  url: string;
}

interface Props {
  series: SerieIn[];
  height?: number;
  /** Sufixo dos valores do eixo e do readout ("%", "€", …). */
  unidade?: string;
  /** Anotações de evento — marcadas no eixo e listadas por baixo. */
  eventos?: EventoAn[];
  /** Selo de frescura — "atrasada" marca a falha no mostrador. */
  estado?: "em-dia" | "atrasada" | "sem-sla";
}

/* paleta por defeito SEM cores semânticas: tinta + rampa azul-aço.
   accent/keep/warn têm significado (sai / fica / aviso) — nunca são
   cor de série arbitrária. Séries ordinais (Euribor por prazo, escalões)
   passam a rampa seq-1…4 explicitamente via `cor`. */
const CORES = [
  "var(--color-ink)",
  "var(--color-seq-2)",
  "var(--color-seq-4)",
  "var(--color-muted)",
];

const PAD = { top: 26, right: 132, bottom: 30, left: 46 };
/** ecrã estreito: sem rótulos de fim — o espaço é todo para a curva */
const PAD_SM = { top: 26, right: 8, bottom: 30, left: 46 };
/** abaixo desta largura: legenda em linha por baixo em vez de rótulos de fim */
const COMPACTO = 560;
/** duração da morph de dados — o token --dur-media em ms */
const DUR_MORPH = 600;

/** 1 casa decimal chega — o SVG está em unidades de pixel. */
const r1 = (n: number) => Math.round(n * 10) / 10;

function toMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/** Ticks "redondos" — 1/2/5×10ⁿ, à maneira de gráfico editorial. */
function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step * 1e-9; v += step) ticks.push(v);
  return { ticks, lo, hi };
}

function yearTicks(t0: number, t1: number, maxTicks: number): number[] {
  const y0 = new Date(t0).getUTCFullYear();
  const y1 = new Date(t1).getUTCFullYear();
  const n = y1 - y0 + 1;
  const step = Math.ceil(n / maxTicks);
  const ticks: number[] = [];
  for (let y = y0; y <= y1; y += step) ticks.push(Date.UTC(y, 0, 1));
  return ticks;
}

/**
 * Gráfico de linhas editorial — SVG próprio, sem biblioteca.
 * Rótulos no fim da linha (à maneira do FT); em ecrã estreito, legenda em
 * linha por baixo. A banda sombreada entre o mínimo e o máximo das séries
 * codifica dispersão — é dado (o spread da família), não ornamento.
 *
 * Sequência de entrada (uma vez, à entrada no viewport): cada série
 * desenha-se por stroke-dashoffset, escalonada por --stagger; a banda
 * esbate-se depois do traço. Quando os dados mudam, os pontos e o
 * domínio interpolam — nunca há corte (M-06).
 *
 * Gramática de interrogação (a mesma nos quatro instrumentos):
 * · o readout fixo por cima mostra sempre o ponto em leitura — nunca um
 *   tooltip flutuante que tapa dados;
 * · rato e toque apontam às marcas; a régua do readout percorre por
 *   teclado (setas, Home/End, Escape limpa) e por arrasto preciso;
 * · sem dados → EmptyState; o equivalente tabular fica em tabela irmã;
 * · eventos entram só com fonte e URL — a lista por baixo é a citação
 *   acessível (o SVG é aria-hidden).
 * `prefers-reduced-motion`: estado final já.
 *
 * Responsivo sem salto: o <svg> tem caixa CSS final (w-full × height) e
 * viewBox com preserveAspectRatio="none" — o primeiro paint preenche já o
 * contentor; o ResizeObserver recalcula a geometria em px antes do paint,
 * corrigindo qualquer deformação transitória. A alternativa (viewBox com
 * aspecto fixo) mudava a altura renderizada consoante a largura — CLS.
 */
export function LineChart({
  series,
  height = 360,
  unidade = "",
  eventos,
  estado,
}: Props) {
  const yFormat = (v: number) => (unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v));
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(720);
  /** índice interrogado na série primária — null = repouso (mostra o último) */
  const [ativo, setAtivo] = useState<number | null>(null);
  /** armadura do desenho: idle → on → done (done = traço normal) */
  const [fase, setFase] = useState<"idle" | "on" | "done">("idle");
  /** frame intermédio da morph de dados — null = estado final */
  const [frame, setFrame] = useState<{ dom: Dominio; pts: PontoTV[][] } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // desenho animado — uma vez, à entrada no viewport; cada linha leva o
  // seu comprimento em --lc-len e o índice em --lc-delay (o CSS escala
  // por --stagger). Sem JS/reduced-motion: nunca arma → estado final já
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    el.querySelectorAll<SVGPolylineElement>(".lc-line").forEach((l) =>
      l.style.setProperty("--lc-len", `${l.getTotalLength()}`)
    );
    el.classList.add("lc-armed");
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setFase("on");
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const compacto = w < COMPACTO;
  const pad = compacto ? PAD_SM : PAD;

  const dados = useMemo(
    () =>
      series
        .map((s, i) => ({
          name: s.name,
          cor: s.cor ?? CORES[i % CORES.length],
          pts: s.data
            .map(([t, v]) => ({ t: toMs(t), v }))
            .sort((a, b) => a.t - b.t)
            // datas repetidas (revisões na fonte): fica a última
            .filter((p, i, arr) => i === arr.length - 1 || arr[i + 1].t !== p.t),
        }))
        .filter((d) => d.pts.length > 0),
    [series]
  );

  // o domínio nasce dos dados com folga proporcional — não do
  // arredondamento do passo (niceTicks arredondava o lo para baixo e
  // deixava metade do plot vazia). O zero não entra à força: numa série
  // de taxas, quando a série o atravessa vê-se a linha; quando não,
  // não rouba espaço.
  const domBase = useMemo((): Dominio => {
    const ts = dados.flatMap((d) => d.pts.map((p) => p.t));
    const vs = dados.flatMap((d) => d.pts.map((p) => p.v));
    const t0 = Math.min(...ts);
    const t1 = Math.max(...ts);
    const vMin = Math.min(...vs);
    const vMax = Math.max(...vs);
    const span = vMax - vMin || 1;
    return { t0, t1, lo: vMin - span * 0.09, hi: vMax + span * 0.09 };
  }, [dados]);

  const dadosPts = useMemo(() => dados.map((d) => d.pts), [dados]);

  // ——— morph de dados (M-06e): o ecrã nunca corta — quando a série
  // muda, pontos e domínio viajam da posição actual à nova ———
  const chave = chaveSeries(dados);
  const prevChave = useRef(chave);
  const renderedRef = useRef<{ dom: Dominio; pts: PontoTV[][] } | null>(null);

  // o que está no ecrã agora (o último frame ou o estado final) — é de
  // onde a próxima morph parte, mesmo a meio de outra
  useEffect(() => {
    renderedRef.current = frame ?? { dom: domBase, pts: dadosPts };
  });

  useEffect(() => {
    if (prevChave.current === chave) return;
    const de = renderedRef.current;
    const para = { dom: domBase, pts: dadosPts };
    prevChave.current = chave;
    renderedRef.current = para;
    if (!de || de.pts.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / DUR_MORPH);
      const e = easeEntra(k);
      setFrame({
        dom: interpDom(de.dom, para.dom, e),
        pts: para.pts.map((pts, i) => interpPts(de.pts[i] ?? [], pts, e)),
      });
      if (k < 1) raf = requestAnimationFrame(tick);
      else setFrame(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dados, domBase, dadosPts, chave]);

  const dom = frame?.dom ?? domBase;
  const ptsList = frame?.pts ?? dadosPts;

  const { escala, xticks, yticks, fim, banda, cruzaZero } = useMemo(() => {
    const { t0, t1, lo, hi } = dom;
    const ticks = niceTicks(lo, hi).ticks.filter((v) => v >= lo && v <= hi);
    const cruzaZero = lo < 0 && hi > 0;
    const plotW = w - pad.left - pad.right;
    const x = (t: number) =>
      r1(pad.left + ((t - t0) / (t1 - t0 || 1)) * plotW);
    const y = (v: number) =>
      r1(pad.top + (1 - (v - lo) / (hi - lo || 1)) * (height - pad.top - pad.bottom));

    // banda de dispersão — entre o mínimo e o máximo da família em cada
    // ponto do eixo primário: o spread é dado, não decoração
    let banda: string | null = null;
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
      if (topo.length > 1) banda = `${topo.join(" ")} ${fundo.join(" ")}`;
    }

    // posição dos rótulos de fim de linha — relaxação em duas passagens:
    // empurra para baixo, e se a fila transbordar o fim do gráfico,
    // sobe o bloco inteiro para dentro da área útil
    const fim = dados
      .map((d, i) => ({
        name: d.name,
        cor: d.cor,
        y: y(ptsList[i]?.[ptsList[i].length - 1]?.v ?? lo),
        v: ptsList[i]?.[ptsList[i].length - 1]?.v,
      }))
      .sort((a, b) => a.y - b.y);
    let prev = -Infinity;
    for (const f of fim) {
      f.y = Math.max(f.y, prev + 15, pad.top + 6);
      prev = f.y;
    }
    const limite = pad.top + (height - pad.top - pad.bottom) - 6;
    const excesso = fim.length ? fim[fim.length - 1].y - limite : 0;
    if (excesso > 0) {
      for (let i = fim.length - 1; i >= 0; i--) {
        const teto = i === fim.length - 1 ? limite : fim[i + 1].y - 15;
        fim[i].y = Math.min(fim[i].y, teto);
      }
    }
    return {
      escala: { x, y },
      xticks: yearTicks(t0, t1, Math.max(2, Math.floor(plotW / 56))),
      yticks: ticks,
      fim,
      banda,
      cruzaZero,
    };
  }, [dados, dom, ptsList, w, height, pad]);

  const { x, y } = escala;
  const plotW = w - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
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

  // eventos dentro do domínio — faixa quando a medida tem duração,
  // linha quando é um dia. O rótulo alterna entre duas filas e inverte
  // para dentro quando chega ao fim do plot
  const evs = useMemo(
    () =>
      (eventos ?? [])
        .map((e) => ({ ...e, ms: toMs(e.t), msFim: e.tFim ? toMs(e.tFim) : null }))
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

  // regra nº1 a nível de componente: sem dados → estado explícito, nunca NaN
  if (dados.length === 0) {
    return <EmptyState titulo="Série indisponível" />;
  }

  return (
    <div ref={wrap} className="relative w-full">
      {/* equivalente tabular para leitores de ecrã — últimos 24 pontos;
          irmão do <svg> (aria-hidden): role="img" no wrapper escondia a
          tabela — descendentes de role="img" não são expostos */}
      <div className="sr-only">
        <table>
        <caption>Valores recentes do gráfico</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            {dados.map((d) => (
              <th key={d.name} scope="col">{d.name}</th>
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
                <td>{new Date(p0.t).toISOString().slice(0, 10)}</td>
                {dados.map((d) => (
                  <td key={d.name}>
                    {d.pts[pIdx] ? yFormat(d.pts[pIdx].v) : "—"}
                  </td>
                ))}
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {/* readout fixo — o mostrador: o valor interrogado vive aqui,
          nunca num tooltip flutuante; a régua é o controlo de teclado */}
      <div className="chart-readout" aria-live="polite">
        {estado === "atrasada" && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="serie-estado atrasada" />
            <span className="chart-readout-t text-warn">{m.chart.atrasada}</span>
          </span>
        )}
        <span className="chart-readout-t">
          {ativo === null ? `${m.chart.ultimo} · ` : ""}
          {alvo !== null ? fmtData(new Date(alvo).toISOString().slice(0, 10)) : ""}
        </span>
        {lidos?.map((p, i) => (
          <span key={dados[i].name} className="inline-flex items-baseline gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 self-center"
              style={{ background: dados[i].cor }}
            />
            <span className="chart-readout-t">{dados[i].name}</span>
            <span className="chart-readout-v">{yFormat(p.v)}</span>
          </span>
        ))}
        <input
          type="range"
          className="chart-scrub"
          min={0}
          max={Math.max(0, nPts - 1)}
          value={idx}
          aria-label={m.chart.scrubAria}
          aria-valuetext={
            alvo !== null ? fmtData(new Date(alvo).toISOString().slice(0, 10)) : undefined
          }
          onChange={(e) => setAtivo(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAtivo(null);
          }}
          onBlur={() => setAtivo(null)}
        />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        height={height}
        className={`block w-full ${
          fase === "on" ? "lc-armed lc-on" : fase === "done" ? "lc-done" : ""
        }`}
        aria-hidden
      >
        {/* grelha horizontal + eixo y */}
        {yticks.map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={pad.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-muted)"
              fontFamily="var(--font-mono)"
            >
              {yFormat(v)}
            </text>
          </g>
        ))}
        {/* eixo x — anos */}
        {xticks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={height - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-muted)"
            fontFamily="var(--font-mono)"
          >
            {new Date(t).getUTCFullYear()}
          </text>
        ))}
        {/* linha de zero — só quando a série a atravessa: é a fronteira
            histórica das taxas negativas, não uma referência forçada */}
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
        {/* eventos — o carimbo do observatório: faixa quando a medida tem
            duração (IVA zero), linha tracejada + quadrado torrado quando
            é um dia. A citação completa vive na lista por baixo */}
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
        {/* banda de dispersão — a distância entre o melhor e o pior da família */}
        {banda && (
          <polygon className="lc-banda" points={banda} fill="var(--color-seq-2)" fillOpacity={0.1} stroke="none" />
        )}
        {/* linhas */}
        {dados.map((d, i) => (
          <polyline
            key={d.name}
            className="lc-line"
            fill="none"
            stroke={d.cor}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={(ptsList[i] ?? []).map((p) => `${x(p.t)},${y(p.v)}`).join(" ")}
            style={{ "--lc-delay": i } as React.CSSProperties}
            onAnimationEnd={
              i === dados.length - 1 && fase === "on"
                ? () => setFase("done")
                : undefined
            }
          />
        ))}
        {/* rótulos de fim de linha — só com espaço; em compacto há legenda */}
        {!compacto &&
          fim.map((f) => (
            <text
              key={f.name}
              x={w - pad.right + 8}
              y={f.y + 4}
              fontSize={11}
              fill={f.cor}
              fontFamily="var(--font-mono)"
            >
              {f.name}
            </text>
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
              <circle key={i} cx={x(p.t)} cy={y(p.v)} r={3.5} fill={dados[i].cor} />
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
      {/* a citação dos eventos — cada anotação é um link para a fonte
          (o SVG é aria-hidden: sem esta lista o evento não existia para
          leitores de ecrã nem para quem quer verificar) */}
      {evs.length > 0 && (
        <ul aria-label={m.chart.eventosAria} className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
          {evs.map((ev) => (
            <li key={ev.ms} className="flex items-baseline gap-1.5 text-[11px]">
              <span aria-hidden className="inline-block h-2 w-2 self-center bg-mark" />
              <a
                href={ev.url}
                className="font-mono text-muted underline decoration-line2 underline-offset-2 transition-colors hover:text-ink"
              >
                {ev.rotulo}
              </a>
              <span className="font-mono text-muted">
                · {fmtData(new Date(ev.ms).toISOString().slice(0, 10))}
                {ev.msFim !== null &&
                  `–${fmtData(new Date(ev.msFim).toISOString().slice(0, 10))}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* legenda em linha por baixo — regime compacto (nomes já na tabela) */}
      {compacto && (
        <div aria-hidden className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {dados.map((d) => (
            <span
              key={d.name}
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: d.cor, fontFamily: "var(--font-mono)" }}
            >
              <span className="inline-block h-2 w-2" style={{ background: d.cor }} />
              {d.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
