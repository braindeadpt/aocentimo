"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Cartao } from "@/components/Cartao";
import { Odometer } from "@/components/Odometer";
import { Valor } from "@/components/Valor";
import { comUnidade, fmtLitro, fmtNum, fmtPeriodo } from "@/lib/format";
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
 *
 * S1-06: a casca (cabeçalho · corpo · rodapé, inversão e container
 * query) é o <Cartao> partilhado — a anatomia Ledger fixa. O Leitura
 * fica com o que é seu: a linha anotada e o valor herói.
 */

export interface PontoLeitura {
  t: string;
  v: number;
}

export type FormatoLeitura = "pct" | "pct1" | "litro" | "num" | "pp" | "kwh";

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
  { fmt: (v: number) => string; casas: number; unidade: string }
> = {
  // a ponte número→unidade é sempre o fino inseparável (comUnidade,
  // U+202F); `unidade` vai sem espaço — quem a compõe põe o FINO
  pct: { fmt: (v) => comUnidade(fmtNum(v, 2), "%"), casas: 2, unidade: "%" },
  pct1: { fmt: (v) => comUnidade(fmtNum(v, 1), "%"), casas: 1, unidade: "%" },
  litro: { fmt: fmtLitro, casas: 3, unidade: "€/L" },
  num: { fmt: (v) => fmtNum(v), casas: 2, unidade: "" },
  pp: { fmt: (v) => comUnidade(fmtNum(v, 1), "p.p."), casas: 1, unidade: "p.p." },
  kwh: {
    fmt: (v) => comUnidade(fmtNum(v, 4), "€/kWh"),
    casas: 4,
    unidade: "€/kWh",
  },
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

  // ————— rótulos do svg: caixas estimadas, nunca dois se tocam —————
  // o modelo é o do anti-colisão da anotação: mono 11 px ≈ 6,9 px por
  // carácter; a caixa vai da baseline −13 a +4 (com folga)
  const TEXTO = { sobe: 13, desce: 4 };
  interface CaixaRot {
    l: number;
    r: number;
    t: number;
    b: number;
  }
  const caixaDe = (
    cx: number,
    cy: number,
    w: number,
    anchor: "start" | "middle" | "end" = "start"
  ): CaixaRot => {
    const l =
      anchor === "end" ? cx - w : anchor === "middle" ? cx - w / 2 : cx;
    return { l, r: l + w, t: cy - TEXTO.sobe, b: cy + TEXTO.desce };
  };
  /** folga entre caixas por eixo — 0 = tocam-se */
  const folga = (a: CaixaRot, b: CaixaRot) => ({
    x: Math.max(0, b.l - a.r, a.l - b.r),
    y: Math.max(0, a.t - b.b, b.t - a.b),
  });

  // exactamente 3 ticks, nunca a menos de ~46 px — «jul 26» e «set 26»
  // lado a lado tocavam-se em cartões estreitos; sem espaço para o do
  // meio ficam só os extremos (rótulos nunca se sobrepõem)
  const TICK_GAP = 46;
  let ticks: { x: number; rotulo: string }[] = [];
  if (temGrafico) {
    for (const n of [3, 4, 6, 9, 12]) {
      const tks = ticksTempo(x, n);
      if (tks.length < 3) {
        ticks = tks;
        continue;
      }
      const ini = tks[0];
      const fim = tks[tks.length - 1];
      const midX = (ini.x + fim.x) / 2;
      const meios = tks
        .slice(1, -1)
        .filter(
          (tk) => tk.x - ini.x >= TICK_GAP && fim.x - tk.x >= TICK_GAP
        );
      if (!meios.length) {
        ticks = [ini, fim];
        break;
      }
      const meio = meios.reduce((a, b) =>
        Math.abs(b.x - midX) < Math.abs(a.x - midX) ? b : a
      );
      ticks = [ini, meio, fim];
      break;
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

  // caixas dos rótulos fixos — extremos da série, fim da referência,
  // faixa dos ticks de tempo. Nenhum outro rótulo lhes pode tocar.
  const yFimMain = pts.length ? pts[pts.length - 1][1] : 0;
  const yFimRef = refPts.length ? refPts[refPts.length - 1][1] : 0;
  const cxExtIni = pts.length
    ? caixaDe(pts[0][0] + 1, pts[0][1] - 9, FMT(primeiro.v).length * MONO_CH)
    : null;
  const cxExtFim = caixaDe(
    W - pad.r + 10,
    yFimMain + 4,
    rotFim.length * MONO_CH
  );
  // série de referência: rótulo de fim afasta-se do da principal
  const dyFim = yFimRef - yFimMain;
  const yRotRefFim =
    Math.abs(dyFim) < 14 ? yFimRef + (dyFim < 0 ? -9 : 15) : yFimRef + 4;
  const cxRefFim = refSerie
    ? caixaDe(W - pad.r + 10, yRotRefFim, rotRefFim.length * MONO_CH)
    : null;
  // a faixa do eixo do tempo — nenhum rótulo de valor lhe entra
  const faixaTicks: CaixaRot = { l: 0, r: W, t: H - 22, b: H };

  // rótulo da referência constante — por cima da linha, encostado à
  // direita do plot; se não couber sem tocar noutro rótulo desce para
  // debaixo da linha; se nem assim couber não se desenha (abaixo do
  // limiar do cartão a CSS já o troca pela linha de texto)
  const rotRefLinha = refLinha
    ? `${refLinha.rotulo} · ${FMT(refLinha.valor)}`
    : "";
  const wRotRefLinha = rotRefLinha.length * MONO_CH;
  const xRotRefLinha = Math.max(pad.l + 2, W - pad.r - 6 - wRotRefLinha);
  const yLinhaRef = refLinha ? y(refLinha.valor) : 0;
  let yRotRefLinha = 0; // 0 = sem lugar limpo → não renderiza
  if (refLinha) {
    const obstaculos = [
      ...(cxExtIni ? [cxExtIni] : []),
      cxExtFim,
      ...(cxRefFim ? [cxRefFim] : []),
      faixaTicks,
    ];
    for (const cand of [yLinhaRef - 7, yLinhaRef + 19]) {
      const c = caixaDe(xRotRefLinha, cand, wRotRefLinha);
      if (obstaculos.every((o) => folga(c, o).x > 2 || folga(c, o).y > 2)) {
        yRotRefLinha = cand;
        break;
      }
    }
  }

  // posição do rótulo da anotação — anti-colisão contra TODOS os
  // rótulos fixos (extremos, referência, ticks): a menos de ~26 px
  // nos dois eixos o rótulo afasta-se na horizontal para o lado com
  // margem; sem margem, separa-se na vertical — a chamada acompanha.
  const wAnot = anotacao ? anotacao.rotulo.length * MONO_CH + 6 : 0;
  const lxMin =
    pad.l +
    4 +
    (ancor === "end" ? wAnot : ancor === "middle" ? wAnot / 2 : 0);
  const lxMax = Math.max(
    lxMin,
    W - pad.r - 4 - (ancor === "start" ? wAnot : ancor === "middle" ? wAnot / 2 : 0)
  );
  let lx = grampo(
    ax + (ancor === "start" ? 4 : ancor === "end" ? -4 : 0),
    lxMin,
    lxMax
  );
  let ly = grampo(rotAcima ? ay - 30 : ay + 34, TEXTO.sobe + 2, H - pad.b - 10);
  if (anotacao && pontoAnot) {
    const GAP_ROT = 26;
    const cxAnot = () => caixaDe(lx, ly, wAnot, ancor);
    const fixos = [
      ...(cxExtIni ? [cxExtIni] : []),
      cxExtFim,
      ...(cxRefFim ? [cxRefFim] : []),
      ...(yRotRefLinha !== 0
        ? [caixaDe(xRotRefLinha, yRotRefLinha, wRotRefLinha)]
        : []),
      faixaTicks,
    ];
    for (const alvo of fixos) {
      // colisão = proximidade nos DOIS eixos; um eixo já separado
      // ≥ GAP_ROT é afastamento suficiente
      if (folga(cxAnot(), alvo).x >= GAP_ROT || folga(cxAnot(), alvo).y >= GAP_ROT)
        continue;
      // 1) empurra na horizontal para o lado com margem
      const alvoAEsquerda =
        (alvo.l + alvo.r) / 2 <= (cxAnot().l + cxAnot().r) / 2;
      lx = alvoAEsquerda
        ? Math.min(lxMax, lx + (GAP_ROT - (cxAnot().l - alvo.r)))
        : Math.max(lxMin, lx - (GAP_ROT - (alvo.l - cxAnot().r)));
      if (folga(cxAnot(), alvo).x >= GAP_ROT) continue;
      // 2) sem margem — separa na vertical, no lado onde está
      const base =
        ly <= (alvo.t + alvo.b) / 2
          ? alvo.t - GAP_ROT - TEXTO.desce
          : alvo.b + GAP_ROT + TEXTO.sobe;
      ly = grampo(base, TEXTO.sobe + 2, H - pad.b - 10);
    }
  }

  const ariaLabel = temGrafico
    ? rotulos.aria
        .replace("{insight}", insight)
        .replace("{de}", fmtPeriodo(primeiro.t))
        .replace("{ate}", fmtPeriodo(ultimo.t))
        .replace("{valor}", comUnidade(fmtNum(valor, F.casas), unidade))
    : insight;

  return (
    <Cartao
      ref={ref}
      amplo={amplo}
      className={arm("leitura-on")}
      breadcrumb={breadcrumb}
      meta={[`${rotulos.leitura} ${leitura}`]}
      estado={estado}
      estadoRotulo={rotulos.estados[estado]}
      fonte={{
        rotulo: rotulos.fonte,
        itens: [{ nome: fonteNome, url: fonteUrl }],
      }}
      acoes={[
        { href, rotulo: `${rotulos.pagina} →`, ariaLabel: titulo },
        { href: hrefJson, rotulo: rotulos.json, externo: true },
      ]}
    >
      <p className="leitura-insight">{insight}</p>
      <p className="leitura-valor num">
        <Valor
          numero={<Odometer valor={valor} casas={F.casas} />}
          unidade={F.unidade || undefined}
        />
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
            {refLinha && yRotRefLinha !== 0 && (
              <text
                className="lq-txt lq-ref-rotulo"
                x={xRotRefLinha}
                y={yRotRefLinha}
                textAnchor="start"
              >
                {rotRefLinha}
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
              className="lq-txt lq-ext lq-ext-main lq-ext-ini"
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

      {/* em cartão estreito os rótulos posicionados do gráfico
          tornam-se texto — só a anotação-insight fica no svg
          (@container .leitura no globals); a linha resume os
          extremos e a referência, sem copy nova */}
      {temGrafico && (
        <p className="lq-legenda">
          {FMT(primeiro.v)} {fmtPeriodo(primeiro.t)} → {rotFim}{" "}
          {fmtPeriodo(ultimo.t)}
          {refLinha && <> · {rotRefLinha}</>}
          {refSerie && <> · {rotRefFim}</>}
        </p>
      )}
    </Cartao>
  );
}
