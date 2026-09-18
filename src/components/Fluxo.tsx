"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";

/**
 * Medidas da escada do euro, mensais — calculadas UMA vez no servidor
 * (src/app/page.tsx, via simularSalario) e passadas por props. Os
 * componentes recebem números prontos: nenhum importa o motor fiscal
 * nem os JSON de data/fiscal — que assim nunca chegam ao bundle do
 * browser.
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
 * A escada do euro — a assinatura do AO CÊNTIMO.
 * Waterfall editorial: o que a empresa paga desce em degraus — cada
 * corte do Estado é uma barra suspensa — até sobrar o líquido.
 * Salário de 1 500 €, solteiro, 2026, valores mensais.
 * Largura = presença; nenhum rótulo toca uma barra.
 *
 * Gramática de interrogação (a mesma nos quatro instrumentos): o
 * readout fixo por cima mostra o degrau em leitura; rato e toque
 * apontam às barras; a régua do readout percorre por teclado. As
 * barras com capítulo próprio são navegáveis (link svg, só ponteiro —
 * o caminho de teclado são as portas por baixo, que também acendem
 * os degraus ao foco).
 */
export function Fluxo({
  className,
  destaque,
  medidas,
}: {
  className?: string;
  /** índice da barra em foco no scrolly; as outras esbatem-se */
  destaque?: number | null;
  medidas: MedidasEuro;
}) {
  const { custo, tsu, irs, ss, liquido, estado, taxaTsu, taxaSs } = medidas;

  // interrogação — ponteiro nas barras ou régua do readout;
  // "estado" interroga o bracket (os três cortes de uma vez)
  const [hover, setHover] = useState<number | "estado" | null>(null);
  const ativo: number | "estado" | null = hover ?? destaque ?? null;
  const GRUPO_ESTADO = [1, 3, 4];
  const acesa = (i: number) =>
    ativo === null || ativo === i || (ativo === "estado" && GRUPO_ESTADO.includes(i));

  // geometria — eixo vertical = euros, base em y=380
  const Y0 = 380;
  const k = 292 / custo;
  const y = (v: number) => Y0 - v * k;

  const BW = 96; // largura da barra
  const SLOT = 1000 / 6;
  const xs = [0, 1, 2, 3, 4, 5].map((i) => i * SLOT + (SLOT - BW) / 2);

  interface Barra {
    x: number;
    top: number; // valor no topo
    bot: number; // valor na base
    cor: string;
    cresce: "cima" | "baixo"; // direcção do crescimento
    valor: string;
    v: number; // valor numérico — para o % do custo no readout
    nome: string;
    href: string; // capítulo correspondente — a barra é navegável
  }

  const barras: Barra[] = [
    {
      x: xs[0], top: custo, bot: 0, cor: "var(--ink)", cresce: "baixo",
      valor: fmtEUR0(custo), v: custo, nome: m.fluxo.empresa, href: "/salario",
    },
    {
      x: xs[1], top: custo, bot: custo - tsu, cor: "var(--accent)", cresce: "cima",
      valor: `−${fmtEUR0(tsu)}`, v: tsu, nome: t(m.fluxo.tsu, { taxa: fmtPct(taxaTsu, 2) }),
      href: "/salario",
    },
    {
      x: xs[2], top: custo - tsu, bot: 0, cor: "var(--ink2)", cresce: "baixo",
      valor: fmtEUR0(custo - tsu), v: custo - tsu, nome: m.fluxo.brutoLabel,
      href: "/salario",
    },
    {
      x: xs[3], top: custo - tsu, bot: custo - tsu - irs, cor: "var(--accent)", cresce: "cima",
      valor: `−${fmtEUR0(irs)}`, v: irs, nome: m.fluxo.irs, href: "/irs",
    },
    {
      x: xs[4], top: custo - tsu - irs, bot: custo - tsu - irs - ss, cor: "var(--accent)", cresce: "cima",
      valor: `−${fmtEUR0(ss)}`, v: ss, nome: t(m.fluxo.ss, { taxa: fmtPct(taxaSs, 0) }),
      href: "/salario",
    },
    {
      x: xs[5], top: custo - tsu - irs - ss, bot: 0, cor: "var(--keep)", cresce: "baixo",
      valor: fmtEUR0(liquido), v: liquido, nome: m.fluxo.tu, href: "/salario",
    },
  ];

  // conectores tracejados: nível que sai de uma barra para a seguinte
  const ligacoes = [
    { x1: xs[0] + BW, x2: xs[1], yy: y(custo) },              // topo empresa → topo TSU
    { x1: xs[1] + BW, x2: xs[2], yy: y(custo - tsu) },        // base TSU → topo bruto
    { x1: xs[2] + BW, x2: xs[3], yy: y(custo - tsu) },        // topo bruto → topo IRS
    { x1: xs[3] + BW, x2: xs[4], yy: y(custo - tsu - irs) },  // base IRS → topo SS
    { x1: xs[4] + BW, x2: xs[5], yy: y(custo - tsu - irs - ss) }, // base SS → topo tu
  ];

  // bracket do Estado sobre os três cortes
  const bx1 = xs[1] - 8;
  const bx2 = xs[4] + BW + 8;
  const by = y(custo) - 34;

  // texto do readout — repouso: a viagem inteira; interrogado: o degrau
  const leitura =
    ativo === null
      ? { t: `${m.fluxo.empresa} ${fmtEUR0(custo)}`, v: `${m.fluxo.tu} ${fmtEUR0(liquido)}` }
      : ativo === "estado"
        ? {
            t: t(m.fluxo.estado, { valor: fmtEUR0(estado) }),
            v: `${fmtPct(estado / custo)} ${m.chart.doCusto}`,
          }
        : {
            t: barras[ativo].nome,
            v: `${barras[ativo].valor} · ${fmtPct(barras[ativo].v / custo)} ${m.chart.doCusto}`,
          };

  return (
    <div className={className}>
      {/* equivalente tabular para leitores de ecrã — a escada em texto.
          sr-only no wrapper: uma <table> ignora width:1px (largura é do
          conteúdo) e transbordava a página em mobile */}
      <div className="sr-only">
        <table>
        <caption>
          {t(m.fluxo.aria, { custo: fmtEUR0(custo), liquido: fmtEUR0(liquido) })}
        </caption>
        <tbody>
          {barras.map((b) => (
            <tr key={b.nome}>
              <th scope="row">{b.nome}</th>
              <td>{b.valor}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">{m.fluxo.estadoLabel}</th>
            <td>{fmtEUR0(estado)}</td>
          </tr>
        </tbody>
        </table>
      </div>

      {/* readout fixo — o degrau em leitura; a régua percorre as 6 barras
          + o total do Estado (posição final) por teclado */}
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

      {/* em ecrã estreito a escada desliza — a máscara esbate o fim da
          pista, a afordância de que há mais à direita (técnica do ticker) */}
      <div className="fluxo-scroll overflow-x-auto">
        <svg
          viewBox="0 0 1000 440"
          aria-hidden="true"
          className="w-full min-w-[680px]"
        >
          {/* bracket: o Estado leva tudo o que está suspenso — navegável */}
          <a href="/impostos" tabIndex={-1}>
            <g
              className="chart-hit cursor-pointer"
              onPointerEnter={() => setHover("estado")}
              onPointerLeave={() => setHover(null)}
            >
              <path
                d={`M ${bx1} ${by + 18} V ${by + 8} H ${bx2} V ${by + 18}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={(bx1 + bx2) / 2}
                y={by}
                textAnchor="middle"
                className="fluxo-label"
                fill="var(--accent)"
              >
                {t(m.fluxo.estado, { valor: fmtEUR0(estado) })}
              </text>
            </g>
          </a>

          {/* conectores */}
          {ligacoes.map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.yy} x2={l.x2} y2={l.yy}
              stroke="var(--line2)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          ))}

          {/* linha de base */}
          <line x1="10" y1={Y0} x2="990" y2={Y0} stroke="var(--ink)" strokeWidth="1.5" />

          {/* barras — cada uma é uma porta para o capítulo que a explica */}
          {barras.map((b, i) => {
            const top = y(b.top);
            const h = (b.top - b.bot) * k;
            return (
              <a key={b.nome} href={b.href} tabIndex={-1}>
                <g
                  className={`fluxo-passo cursor-pointer ${acesa(i) ? "" : "fluxo-off"}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                >
                  <rect
                    className={`fluxo-barra fluxo-barra-${b.cresce}`}
                    x={b.x}
                    y={top}
                    width={BW}
                    height={h}
                    fill={b.cor}
                    style={{ animationDelay: `calc(${i} * var(--stagger))` }}
                  />
                  <text
                    x={b.x + BW / 2}
                    y={top - 10}
                    textAnchor="middle"
                    className="fluxo-valor-mini"
                    fill="var(--ink)"
                  >
                    {b.valor}
                  </text>
                  <text
                    x={b.x + BW / 2}
                    y={Y0 + 24}
                    textAnchor="middle"
                    className="fluxo-label"
                    fill="var(--muted)"
                  >
                    {b.nome}
                  </text>
                </g>
              </a>
            );
          })}
        </svg>
      </div>

      {/* portas para os capítulos — o caminho de teclado; ao foco,
          acendem os degraus correspondentes */}
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
