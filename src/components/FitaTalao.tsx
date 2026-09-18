"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PapelDefs } from "@/components/Papel";
import { FITA, geometriaFita } from "@/lib/fita";
import { furos, r1 } from "@/lib/materia";
import { useValorAnimado } from "@/lib/useValorAnimado";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";

/**
 * Medidas da fita, mensais — calculadas UMA vez no servidor
 * (simularSalario na página) e passadas por props. Nenhum componente
 * importa o motor fiscal nem os JSON de data/fiscal — que assim nunca
 * chegam ao bundle do browser.
 */
export interface MedidasEuro {
  custo: number; // custo mensal para a empresa (bruto + TSU entidade)
  tsu: number; // TSU da entidade patronal
  irs: number; // retenção de IRS
  ss: number; // TSU do trabalhador
  liquido: number; // o que chega à conta
  estado: number; // tsu + irs + ss
  taxaTsu: number; // taxa da entidade (rótulos)
  taxaSs: number; // taxa do trabalhador (rótulos)
}

/**
 * FitaTalao — a peça-assinatura do AO CÊNTIMO (M-05).
 *
 * A fita do salário sai da impressora de cima para baixo e, em cada
 * linha de perfuração, o pedaço da direita rasga-se e cai: a LARGURA
 * da fita é o dinheiro, numa só escala para todo o desenho. O que
 * sobra no fim é teu.
 *
 * Matéria (M-01): o notch e o pedaço partilham a MESMA polyline de
 * rasgo (rasgoCantoPts, semente derivada do valor) — o buraco e o que
 * saiu correspondem por construção. Perfuração a sério por máscara: o
 * furo mostra o fundo da página, não uma cor pintada.
 *
 * Sequência (M-02): uma partitura só — cabeça → wipe → rasgos em
 * cascata pela posição da perfuração → valores impressos (M-03,
 * revelar) → realce do troço final. Estados base = finais.
 *
 * Interrogação: readout FIXO por cima; rato/toque apontam a troços e
 * pedaços; a régua percorre as 7 paradas por teclado (setas, Home/End,
 * Escape). O SVG é aria-hidden — o equivalente é a tabela sr-only.
 */
export function FitaTalao({
  className,
  destaque,
  medidas,
}: {
  className?: string;
  /** índice da parada em foco no scrolly; as outras recuam */
  destaque?: number | null;
  medidas: MedidasEuro;
}) {
  const { custo, tsu, irs, ss, liquido, estado, taxaTsu, taxaSs } = medidas;
  const [hover, setHover] = useState<number | "estado" | null>(null);
  const ativo: number | "estado" | null = hover ?? destaque ?? null;

  const geo = useMemo(
    () => geometriaFita(custo, [tsu, irs, ss], liquido),
    [custo, tsu, irs, ss, liquido]
  );

  const maskId = "fita-mask";
  const revId = "fita-rev";

  // paradas da interrogação — a mesma viagem do Fluxo: 6 pontos + o
  // total do Estado na posição final da régua
  const paradas = useMemo(
    () => [
      { nome: m.fluxo.empresa, valor: fmtEUR0(custo), v: custo },
      {
        nome: t(m.fluxo.tsu, { taxa: fmtPct(taxaTsu, 2) }),
        valor: `−${fmtEUR0(tsu)}`,
        v: tsu,
      },
      { nome: m.fluxo.brutoLabel, valor: fmtEUR0(custo - tsu), v: custo - tsu },
      { nome: m.fluxo.irs, valor: `−${fmtEUR0(irs)}`, v: irs },
      {
        nome: t(m.fluxo.ss, { taxa: fmtPct(taxaSs, 0) }),
        valor: `−${fmtEUR0(ss)}`,
        v: ss,
      },
      { nome: m.fluxo.tu, valor: fmtEUR0(liquido), v: liquido },
      {
        nome: t(m.fluxo.estado, { valor: fmtEUR0(estado) }),
        valor: fmtEUR0(estado),
        v: estado,
      },
    ],
    [custo, tsu, irs, ss, liquido, estado, taxaTsu, taxaSs]
  );

  // qual elemento responde a cada parada: t0 empresa · p0 tsu · t1 bruto
  // · p1 irs · p2 ss · t3 contigo · estado = os três pedaços
  const ALVO = ["t0", "p0", "t1", "p1", "p2", "t3", "estado"] as const;
  const PARADA_PECA = [1, 3, 4]; // pedaço i ↔ parada da régua (tsu/irs/ss)
  const PEDACOS = ["p0", "p1", "p2"];
  const acesa = (alvo: string) =>
    ativo === null ||
    ALVO[ativo === "estado" ? 6 : ativo] === alvo ||
    (ativo === "estado" && PEDACOS.includes(alvo));

  const leitura =
    ativo === null
      ? { t: `${m.fluxo.empresa} ${fmtEUR0(custo)}`, v: `${m.fluxo.tu} ${fmtEUR0(liquido)}` }
      : ativo === "estado"
        ? {
            t: t(m.fluxo.estado, { valor: fmtEUR0(estado) }),
            v: `${fmtPct(estado / custo)} ${m.chart.doCusto}`,
          }
        : {
            t: paradas[ativo].nome,
            v: `${paradas[ativo].valor} · ${fmtPct(paradas[ativo].v / custo)} ${m.chart.doCusto}`,
          };

  // a etiqueta de um pedaço arrancado, ao lado de onde caiu
  const etiqueta = (i: number) => {
    const p = geo.pecas[i];
    const nome = [t(m.fluxo.tsu, { taxa: fmtPct(taxaTsu, 2) }), m.fluxo.irs, t(m.fluxo.ss, { taxa: fmtPct(taxaSs, 0) })][i];
    return { p, nome };
  };

  // reimpressão: dados novos = fita nova — o grupo animado remonta-se
  const runId = `${r1(custo)}-${r1(tsu)}-${r1(irs)}-${r1(ss)}-${r1(liquido)}`;

  if (!geo.ok) {
    return <EmptyState titulo="Simulação indisponível" className={className} />;
  }

  const { X0, TOPO, HP, DIR, WIPE_MS } = FITA;
  const yUltimo = geo.ys[geo.ys.length - 1];
  const delayFim = Math.round(
    ((yUltimo - TOPO) / (geo.yFim - TOPO)) * WIPE_MS
  );

  return (
    <div className={className}>
      <PapelDefs />

      {/* equivalente tabular — a viagem do euro em texto */}
      <div className="sr-only">
        <table>
          <caption>
            {t(m.fita.aria, {
              custo: fmtEUR0(custo),
              tsu: fmtEUR0(tsu),
              irs: fmtEUR0(irs),
              ss: fmtEUR0(ss),
              liquido: fmtEUR0(liquido),
            })}
          </caption>
          <tbody>
            {paradas.slice(0, 6).map((p) => (
              <tr key={p.nome}>
                <th scope="row">{p.nome}</th>
                <td>{p.valor}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">{m.fluxo.estadoLabel}</th>
              <td>{fmtEUR0(estado)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* readout fixo — a parada em leitura; a régua percorre as 7
          paradas por teclado (setas, Home/End, Escape limpa) */}
      <div className="chart-readout" aria-live="polite">
        <span className="chart-readout-t">{leitura.t}</span>
        <span className="chart-readout-v">{leitura.v}</span>
        <input
          type="range"
          className="chart-scrub"
          min={0}
          max={6}
          value={ativo === null ? 6 : ativo === "estado" ? 6 : ativo}
          aria-label={m.chart.scrubAria}
          aria-valuetext={leitura.t}
          onChange={(e) => {
            const i = Number(e.target.value);
            setHover(i >= 6 ? "estado" : i);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setHover(null);
          }}
          onBlur={() => setHover(null)}
        />
      </div>

      <svg
        viewBox="0 0 560 680"
        aria-hidden="true"
        className="mt-3 w-full"
      >
        <defs>
          {/* máscara da fita — os furos são buracos a sério: mostra-se
              o fundo da página através deles */}
          <mask id={maskId}>
            <path d={geo.fita} fill="#fff" />
            {geo.perfs.flatMap((p) =>
              furos(p.w, { espacamento: 13, margem: 10 }).map((cx) => (
                <circle
                  key={`${p.y}-${cx}`}
                  cx={r1(X0 + cx)}
                  cy={p.y}
                  r={1.9}
                  fill="#000"
                />
              ))
            )}
          </mask>
          {/* o wipe — a fita emerge porque o clip desce de cima para
              baixo; os pedaços ficam FORA do clip (voam para a pilha) */}
          <clipPath id={revId}>
            <rect className="fita-wipe" x="0" y="0" width="560" height="740" />
          </clipPath>
        </defs>

        <g key={runId}>
          {/* cabeça de impressão — marca o topo antes da fita sair */}
          <g className="fita-cabeca">
            <rect
              x={X0 - 14}
              y={TOPO - 26}
              width={geo.larguras[0] + 28}
              height={18}
              fill="var(--overlay)"
              stroke="var(--line2)"
            />
            <rect
              x={X0 - 6}
              y={TOPO - 12}
              width={geo.larguras[0] + 12}
              height={4}
              fill="var(--line2)"
            />
            <text
              x={X0 + geo.larguras[0] + 34}
              y={TOPO - 12}
              className="fluxo-label"
              fill="var(--muted)"
            >
              {m.fita.emissao}
            </text>
          </g>

          {/* a fita, sob o wipe — papel + textura + furos + impressão */}
          <g clipPath={`url(#${revId})`}>
            <g mask={`url(#${maskId})`}>
              <path d={geo.fita} fill="var(--talao-paper)" />
              <path d={geo.fita} fill="url(#papel-tom-y)" />
              <path d={geo.fita} fill="url(#papel-fibra)" />
              <path d={geo.fita} fill="url(#papel-espessura-x)" />
              {/* o troço final — papel do que fica, dentro da silhueta */}
              <rect
                x={geo.tira.x}
                y={geo.tira.y}
                width={geo.tira.w}
                height={geo.tira.h}
                fill="var(--papel-fica)"
              />
              <rect
                x={geo.tira.x}
                y={geo.tira.y}
                width={geo.tira.w}
                height={geo.tira.h}
                fill="url(#papel-fibra)"
              />
            </g>

            {/* impressão — tinta sobre o papel, fora da máscara */}
            <g className={`fita-passo ${acesa("t0") ? "" : "fita-off"}`}>
              <text
                x={X0 + 14}
                y={TOPO + 30}
                className="fluxo-label"
                fill="var(--talao-ink)"
                opacity={0.62}
              >
                {m.fluxo.empresa.toUpperCase()}
              </text>
              <Impresso
                x={X0 + 14}
                y={TOPO + 62}
                valor={custo}
                atraso={140}
                className="fluxo-valor"
                fill="var(--talao-ink)"
              />
            </g>

            <g className={`fita-passo ${acesa("t1") ? "" : "fita-off"}`}>
              <text
                x={X0 + 14}
                y={geo.ys[0] + HP + 26}
                className="fluxo-label"
                fill="var(--talao-ink)"
                opacity={0.62}
              >
                {m.fluxo.brutoLabel.toUpperCase()}
              </text>
              <Impresso
                x={X0 + 14}
                y={geo.ys[0] + HP + 56}
                valor={custo - tsu}
                atraso={geo.pecas[0].delay}
                className="fluxo-valor-mini"
                fill="var(--talao-ink)"
              />
            </g>

            <g className={`fita-passo ${acesa("t3") ? "" : "fita-off"}`}>
              <text
                x={X0 + 14}
                y={geo.tira.y + HP + 22}
                className="fluxo-label"
                fill="var(--papel-fica-tinta)"
                opacity={0.72}
              >
                {m.fita.ficaContigo}
              </text>
              <Impresso
                x={X0 + 14}
                y={geo.tira.y + HP + 66}
                valor={liquido}
                atraso={delayFim}
                className="fluxo-valor"
                fill="var(--papel-fica-tinta)"
              />
              <text
                x={X0 + 14}
                y={geo.tira.y + HP + 88}
                className="fluxo-label"
                fill="var(--papel-fica-tinta)"
                opacity={0.8}
              >
                {`${fmtPct(liquido / custo, 1).replace(" %", "")} ${m.fita.centimos}`}
              </text>
            </g>
          </g>

          {/* pedaços arrancados — fora do wipe: voam para a pilha */}
          {geo.pecas.map((p, i) =>
            p.zero ? (
              <g
                key={i}
                className={`fita-passo fita-atraso ${acesa(`p${i}`) ? "" : "fita-off"}`}
                style={{ "--d": `${p.delay}ms` } as CSSProperties}
                onPointerEnter={() => setHover(PARADA_PECA[i])}
                onPointerLeave={() => setHover(null)}
              >
                <text
                  x={DIR}
                  y={p.fy + 26}
                  className="fluxo-valor-mini"
                  fill="var(--keep)"
                >
                  0 €
                </text>
                <text
                  x={DIR}
                  y={p.fy + 44}
                  className="fluxo-label"
                  fill="var(--muted)"
                >
                  {`${etiqueta(i).nome} — ${m.fita.naoToca}`}
                </text>
              </g>
            ) : (
              <g
                key={i}
                className={`fita-passo fita-pedaco ${acesa(`p${i}`) ? "" : "fita-off"}`}
                style={
                  {
                    "--ax": `${p.ax}px`,
                    "--ay": `${p.ay}px`,
                    "--fx": `${p.fx}px`,
                    "--fy": `${p.fy}px`,
                    "--r": `${p.rot}deg`,
                    "--d": `${p.delay}ms`,
                  } as CSSProperties
                }
                onPointerEnter={() => setHover(PARADA_PECA[i])}
                onPointerLeave={() => setHover(null)}
              >
                <path
                  d={p.path}
                  transform="translate(3,4)"
                  fill="rgba(24,17,6,1)"
                  className="fita-sombra"
                  style={{ "--d": `${p.delay}ms` } as CSSProperties}
                />
                <path d={p.path} fill="var(--papel-sai)" />
                <path d={p.path} fill="url(#papel-fibra)" />
              </g>
            )
          )}

          {/* etiquetas da pilha — aparecem quando o pedaço aterra */}
          {geo.pecas.map(
            (p, i) =>
              !p.zero && (
                <g
                  key={`e${i}`}
                  className={`fita-passo fita-atraso ${acesa(`p${i}`) ? "" : "fita-off"}`}
                  style={{ "--d": `${p.delay + 420}ms` } as CSSProperties}
                  onPointerEnter={() => setHover(PARADA_PECA[i])}
                  onPointerLeave={() => setHover(null)}
                >
                  <text
                    x={DIR + p.w + 14}
                    y={p.fy + 26}
                    className="fluxo-valor-mini"
                    fill="var(--accent)"
                  >
                    {`−${fmtEUR0(p.v)}${p.naoProp ? " †" : ""}`}
                  </text>
                  <text
                    x={DIR + p.w + 14}
                    y={p.fy + 44}
                    className="fluxo-label"
                    fill="var(--muted)"
                  >
                    {etiqueta(i).nome}
                  </text>
                </g>
              )
          )}

          {/* realce do troço final — acende por fim */}
          <g
            className={`fita-passo fita-brilho ${acesa("t3") ? "" : "fita-off"}`}
            style={{ "--d": `${delayFim + 500}ms` } as CSSProperties}
          >
            <rect
              x={geo.tira.x - 3}
              y={geo.tira.y - 3}
              width={geo.tira.w + 6}
              height={geo.tira.h + 6}
              fill="none"
              stroke="var(--papel-fica-tinta)"
              strokeWidth={6}
              opacity={0.16}
            />
            <rect
              x={geo.tira.x - 1.5}
              y={geo.tira.y - 1.5}
              width={geo.tira.w + 3}
              height={geo.tira.h + 3}
              fill="none"
              stroke="var(--papel-fica-tinta)"
              strokeWidth={1.5}
              opacity={0.85}
            />
          </g>

          {/* o total arrancado — resume a pilha; interrogável (estado) */}
          <g
            className={`fita-passo fita-atraso ${acesa("estado") ? "" : "fita-off"}`}
            style={{ "--d": `${delayFim + 320}ms` } as CSSProperties}
            onPointerEnter={() => setHover("estado")}
            onPointerLeave={() => setHover(null)}
          >
            <text
              x={DIR}
              y={geo.yFim + 4}
              className="fluxo-valor-mini"
              fill="var(--accent)"
            >
              {t(m.fita.arrancados, { valor: fmtEUR0(estado) })}
            </text>
            <text
              x={DIR}
              y={geo.yFim + 24}
              className="fluxo-label"
              fill="var(--muted)"
            >
              {m.fita.antesDaConta}
            </text>
          </g>
        </g>
      </svg>

      {geo.pecas.some((p) => p.naoProp) && (
        <p className="footnote mt-1">† {m.fita.naoProp}</p>
      )}

      {/* portas para os capítulos — o caminho de teclado; ao foco,
          acendem as paradas correspondentes */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
        <Link
          href="/impostos"
          className="kicker text-ink2 transition-colors hover:text-accent"
          onMouseEnter={() => setHover("estado")}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover("estado")}
          onBlur={() => setHover(null)}
        >
          {m.fluxo.linkEstado} →
        </Link>
        <Link
          href="/salario"
          className="kicker text-ink2 transition-colors hover:text-keep"
          onMouseEnter={() => setHover(5)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(5)}
          onBlur={() => setHover(null)}
        >
          {m.fluxo.linkTu} →
        </Link>
        <Link href="/casa" className="kicker text-ink2 transition-colors hover:text-accent">
          {m.fluxo.linkBanco} →
        </Link>
        <Link href="/precos" className="kicker text-ink2 transition-colors hover:text-accent">
          {m.fluxo.linkBomba} →
        </Link>
      </div>
    </div>
  );
}

/** valor impresso na fita — conta de 0 quando o troço emerge (M-03
    revelar + atraso da partitura); aria-hidden via o SVG pai */
function Impresso({
  x,
  y,
  valor,
  atraso = 0,
  className,
  fill,
}: {
  x: number;
  y: number;
  valor: number;
  atraso?: number;
  className?: string;
  fill?: string;
}) {
  const v = useValorAnimado(valor, { dur: 600, revelar: true, atraso });
  return (
    <text x={x} y={y} className={className} fill={fill}>
      {fmtEUR0(v)}
    </text>
  );
}
