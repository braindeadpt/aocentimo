"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Odometer } from "@/components/Odometer";
import { fmtLitro, fmtNum, fmtPeriodo } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { dataDePeriodo, escalaTempo, escalaValor } from "@/lib/viz/escalas";
import { ticksTempo } from "@/lib/viz/eixos";
import { pathLinha, type Ponto } from "@/lib/viz/formas";
import { regioesEntre } from "@/lib/viz/entre";

/**
 * Leitura — o cartão-instrumento da Direcção V3: um objecto completo
 * (breadcrumb + «leitura {período}» + selo no cabeçalho; insight serifado,
 * valor mono a contar e gráfico no corpo; fonte/página/JSON no rodapé).
 *
 * O gráfico é uma frase, não um eixo: linha principal em --accent,
 * referência a cinzento (série real ou linha de mediana tracejada),
 * a área entre as duas hachurada — acento por cima, keep por baixo —
 * valores nos extremos, UMA anotação com chamada tracejada, três
 * ticks de tempo. Sem eixo Y, sem grelha.
 *
 * SSR: todo o markup final nasce no HTML (a geometria mede-se em px
 * via ResizeObserver como no LineChart — sem JS fica a vista SSR,
 * sem distorção). Em hover/focus-within o cartão inverte para papel:
 * as cores são vars locais --l-*, a transição é --dur-curta. Ao entrar
 * no viewport (useArmado → .leitura-on) a linha desenha-se esq→dir,
 * a hachura e os extremos assentam, a anotação desenha-se por último.
 * Reduced-motion = estado final, inversão instantânea (bloco global).
 */

export interface PontoLeitura {
  t: string;
  v: number;
}

export type FormatoLeitura = "pct" | "pct1" | "litro" | "num";

export type ReferenciaLeitura =
  | { pontos: PontoLeitura[]; rotulo: string }
  | { valor: number; rotulo: string };

export type EstadoLeitura = "em-dia" | "atrasada" | "sem-sla";

export interface RotulosLeitura {
  leitura: string;
  fonte: string;
  pagina: string;
  json: string;
  estados: Record<EstadoLeitura, string>;
  /** template do aria-label do gráfico — «{insight} — série de {de}
      a {ate}, último {valor}» (o único equivalente textual) */
  aria: string;
}

export interface LeituraProps {
  /** breadcrumb mono do cabeçalho — "PREÇOS / CABAZ · EUROSTAT" */
  breadcrumb: string;
  /** nome da página temática — texto do link «→» do rodapé */
  titulo: string;
  /** uma frase afirmativa em serifada — o insight do cartão */
  insight: string;
  valor: number;
  unidade: string;
  /** formato dos rótulos de valor — registo serializável (props de
      cliente não podem ser funções) */
  formato: FormatoLeitura;
  /** histórico (até ~10 anos) — não o spark de 24 do painel */
  serie: PontoLeitura[];
  /** segunda série (--ink2) ou linha horizontal de valor (--mark) */
  referencia?: ReferenciaLeitura;
  /** UM extremo real da série, calculado no servidor */
  anotacao?: { t: string; rotulo: string };
  /** período da leitura já formatado (fmtPeriodo) */
  leitura: string;
  estado: EstadoLeitura;
  fonteNome: string;
  fonteUrl: string;
  href: string;
  hrefJson: string;
  rotulos: RotulosLeitura;
  /** variante em largura total — o Leitura-herói do painel */
  amplo?: boolean;
}

const FORMATOS: Record<
  FormatoLeitura,
  { fmt: (v: number) => string; casas: number; sufixo: string }
> = {
  pct: { fmt: (v) => `${fmtNum(v, 2)} %`, casas: 2, sufixo: " %" },
  pct1: { fmt: (v) => `${fmtNum(v, 1)} %`, casas: 1, sufixo: " %" },
  litro: { fmt: fmtLitro, casas: 3, sufixo: " €/L" },
  num: { fmt: (v) => fmtNum(v), casas: 2, sufixo: "" },
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const grampo = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function Leitura({
  breadcrumb,
  titulo,
  insight,
  valor,
  unidade,
  formato,
  serie,
  referencia,
  anotacao,
  leitura,
  estado,
  fonteNome,
  fonteUrl,
  href,
  hrefJson,
  rotulos,
  amplo = false,
}: LeituraProps) {
  const F = FORMATOS[formato];
  const idHach = useId();
  const { ref, arm } = useArmado<HTMLElement>(`leitura:${titulo}`);

  // a geometria é em px reais — como no LineChart: viewBox medido por
  // ResizeObserver para os rótulos saírem nítidos a qualquer largura;
  // o SSR calcula num default por variante (markup completo no HTML)
  const caixaRef = useRef<HTMLDivElement>(null);
  const [caixa, setCaixa] = useState({
    w: amplo ? 1080 : 560,
    h: amplo ? 240 : 176,
  });
  useEffect(() => {
    const el = caixaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setCaixa({
        w: Math.max(1, Math.round(e.contentRect.width)),
        h: Math.max(1, Math.round(e.contentRect.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = caixa;
  const FMT = F.fmt;

  // ————— dados → pontos —————
  const refSerie =
    referencia && "pontos" in referencia && referencia.pontos.length > 1
      ? referencia
      : null;
  const refLinha =
    referencia && "valor" in referencia ? referencia : null;

  const ultimo = serie[serie.length - 1];
  const primeiro = serie[0];

  // gutter direito proporcional aos rótulos que lá vivem
  const MONO_CH = 6.9;
  const rotFim = FMT(ultimo?.v ?? valor);
  const rotRefFim = refSerie
    ? `${refSerie.rotulo} ${FMT(refSerie.pontos[refSerie.pontos.length - 1].v)}`
    : "";
  const padR = Math.max(
    70,
    rotFim.length * MONO_CH + 18,
    rotRefFim.length * MONO_CH + 18
  );
  const pad = { t: 30, r: padR, b: 22, l: 8 };

  const temGrafico = serie.length >= 2;

  const x = escalaTempo(serie, [pad.l, W - pad.r]);
  const valores = serie.map((p) => p.v);
  if (refSerie) valores.push(...refSerie.pontos.map((p) => p.v));
  if (refLinha) valores.push(refLinha.valor);
  let lo = Math.min(...valores);
  let hi = Math.max(...valores);
  const span = hi - lo || 1;
  lo -= span * 0.1;
  hi += span * 0.1;
  const y = escalaValor([lo, hi], [H - pad.b, pad.t], {
    dominio: [lo, hi],
  });

  const pts: Ponto[] = temGrafico
    ? serie.map((p) => [r1(x(dataDePeriodo(p.t))), r1(y(p.v))])
    : [];
  const refPts: Ponto[] = refSerie
    ? refSerie.pontos.map((p) => [r1(x(dataDePeriodo(p.t))), r1(y(p.v))])
    : refLinha
      ? [
          [pad.l, r1(y(refLinha.valor))],
          [W - pad.r, r1(y(refLinha.valor))],
        ]
      : [];

  const dLinha = pathLinha(pts);
  const dRef = refSerie ? pathLinha(refPts) : "";
  const regioes = refPts.length >= 2 ? regioesEntre(pts, refPts) : [];

  // exactamente 3 ticks: pede-se ao helper até dar ≥3 e espaçam-se
  // (o passo escolhido pelo ticksTempo pode render só 2 marcas na
  // janela — p.ex. 10 anos cai no passo de 5 anos)
  let ticks: { x: number; rotulo: string }[] = [];
  if (temGrafico) {
    for (const n of [3, 4, 6, 9, 12]) {
      const tks = ticksTempo(x, n);
      if (tks.length >= 3) {
        ticks =
          tks.length === 3
            ? tks
            : [tks[0], tks[Math.floor(tks.length / 2)], tks[tks.length - 1]];
        break;
      }
      ticks = tks;
    }
  }

  // ————— anotação: ponto real + chamada tracejada até ao rótulo —————
  const pontoAnot = anotacao
    ? serie.find((p) => p.t === anotacao.t)
    : undefined;
  const ax = pontoAnot ? x(dataDePeriodo(pontoAnot.t)) : 0;
  const ay = pontoAnot ? y(pontoAnot.v) : 0;
  const rotAcima = ay > H / 2; // extremo baixo → rótulo por cima
  const ancor =
    ax < W * 0.28 ? "start" : ax > W * 0.72 ? "end" : "middle";
  const lx = grampo(
    ax + (ancor === "start" ? 4 : ancor === "end" ? -4 : 0),
    pad.l + 4,
    W - pad.r - 4
  );
  const ly = rotAcima ? ay - 30 : ay + 34;

  // rótulo da referência constante — por cima da linha, âncora na
  // direita do plot; se colidir com o rótulo de fim da principal,
  // desce para debaixo da linha de mediana
  const yLinhaRef = refLinha ? y(refLinha.valor) : 0;
  const yFimMain = pts.length ? pts[pts.length - 1][1] : 0;
  const yFimRef = refPts.length ? refPts[refPts.length - 1][1] : 0;
  const refColide = Math.abs(yLinhaRef - yFimMain) < 16;
  const yRotRefLinha = refColide ? yLinhaRef + 19 : yLinhaRef - 7;
  // série de referência: rótulo de fim afasta-se do da principal
  const dyFim = yFimRef - yFimMain;
  const yRotRefFim =
    Math.abs(dyFim) < 14 ? yFimRef + (dyFim < 0 ? -9 : 15) : yFimRef + 4;

  const ariaLabel = temGrafico
    ? rotulos.aria
        .replace("{insight}", insight)
        .replace("{de}", fmtPeriodo(primeiro.t))
        .replace("{ate}", fmtPeriodo(ultimo.t))
        .replace("{valor}", `${fmtNum(valor, F.casas)} ${unidade}`)
    : insight;

  return (
    <article
      ref={ref}
      className={`leitura ${amplo ? "leitura-amplo" : ""} ${arm("leitura-on")}`}
    >
      <header className="leitura-head">
        <p className="leitura-breadcrumb">{breadcrumb}</p>
        <p className="leitura-meta num">
          <span>
            {rotulos.leitura} {leitura}
          </span>
          <span className="leitura-estado">
            <span aria-hidden className={`serie-estado ${estado}`} />
            {rotulos.estados[estado]}
          </span>
        </p>
      </header>

      <div className="leitura-corpo">
        <p className="leitura-insight">{insight}</p>
        <p className="leitura-valor num">
          <Odometer valor={valor} casas={F.casas} sufixo={F.sufixo} />
        </p>

        {temGrafico && (
          <div ref={caixaRef} className="lq-graf">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={ariaLabel}
              className="block h-full w-full"
            >
              <defs>
                <pattern
                  id={`${idHach}a`}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="var(--l-accent)"
                    strokeWidth="2.2"
                    opacity="0.18"
                  />
                </pattern>
                <pattern
                  id={`${idHach}k`}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="var(--l-keep)"
                    strokeWidth="2.2"
                    opacity="0.18"
                  />
                </pattern>
              </defs>

              {/* a área entre as duas — a distância à referência é o dado */}
              {regioes.map((r, i) => (
                <path
                  key={i}
                  className="lq-hatch"
                  d={r.d}
                  fill={`url(#${idHach}${r.acima ? "a" : "k"})`}
                  stroke="none"
                />
              ))}

              {/* referência constante — a mediana tracejada a torrado */}
              {refLinha && (
                <line
                  className="lq-refmark"
                  x1={pad.l}
                  x2={W - pad.r}
                  y1={yLinhaRef}
                  y2={yLinhaRef}
                  stroke="var(--l-mark)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
              )}
              {refLinha && (
                <text
                  className="lq-txt lq-ref-rotulo"
                  x={W - pad.r - 6}
                  y={yRotRefLinha}
                  textAnchor="end"
                >
                  {refLinha.rotulo} · {FMT(refLinha.valor)}
                </text>
              )}

              {/* eixo do tempo — 3 ticks, sem grelha */}
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={H - pad.b}
                y2={H - pad.b}
                stroke="var(--l-line)"
                strokeWidth={1}
              />
              {ticks.map((tk) => (
                <g key={tk.rotulo}>
                  <line
                    x1={tk.x}
                    x2={tk.x}
                    y1={H - pad.b}
                    y2={H - pad.b + 4}
                    stroke="var(--l-line2)"
                    strokeWidth={1}
                  />
                  <text
                    className="lq-txt"
                    x={tk.x}
                    y={H - 7}
                    textAnchor="middle"
                  >
                    {tk.rotulo}
                  </text>
                </g>
              ))}

              {/* série de referência — cinzenta por baixo */}
              {dRef && (
                <path
                  className="lq-ref"
                  d={dRef}
                  fill="none"
                  stroke="var(--l-ink2)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  pathLength={1}
                />
              )}

              {/* a linha principal — a cor de sinal do cartão */}
              <path
                className="lq-line"
                d={dLinha}
                fill="none"
                stroke="var(--l-accent)"
                strokeWidth={2}
                strokeLinejoin="round"
                pathLength={1}
              />

              {/* valores nos extremos das linhas */}
              <text
                className="lq-txt lq-ext lq-ext-main"
                x={pts[0][0] + 1}
                y={pts[0][1] - 9}
                textAnchor="start"
              >
                {FMT(primeiro.v)}
              </text>
              <text
                className="lq-txt lq-ext lq-ext-main"
                x={W - pad.r + 10}
                y={yFimMain + 4}
                textAnchor="start"
              >
                {rotFim}
              </text>
              {refSerie && (
                <text
                  className="lq-txt lq-ext"
                  x={W - pad.r + 10}
                  y={yRotRefFim}
                  textAnchor="start"
                >
                  {rotRefFim}
                </text>
              )}

              {/* UMA anotação — o extremo real, chamada tracejada */}
              {anotacao && pontoAnot && (
                <g
                  className="lq-anot"
                  style={
                    { "--ax": `${ax}px`, "--ay": `${ay}px` } as React.CSSProperties
                  }
                >
                  <rect
                    x={ax - 3}
                    y={ay - 3}
                    width={6}
                    height={6}
                    fill="var(--l-accent)"
                  />
                  <line
                    x1={ax}
                    y1={ay + (rotAcima ? -6 : 6)}
                    x2={lx}
                    y2={ly + (rotAcima ? 4 : -6)}
                    stroke="var(--l-ink2)"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                  <text
                    className="lq-anot-rot"
                    x={lx}
                    y={ly}
                    textAnchor={ancor}
                  >
                    {anotacao.rotulo}
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      <footer className="leitura-foot">
        <p className="leitura-fonte">
          {rotulos.fonte}:{" "}
          {fonteUrl ? (
            <a
              href={fonteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lq-link"
            >
              {fonteNome}
            </a>
          ) : (
            fonteNome
          )}
        </p>
        <p className="leitura-acoes">
          <Link href={href} className="lq-link" aria-label={titulo}>
            {rotulos.pagina} →
          </Link>
          <a href={hrefJson} className="lq-link">
            {rotulos.json}
          </a>
        </p>
      </footer>
    </article>
  );
}
