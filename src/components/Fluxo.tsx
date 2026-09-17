import Link from "next/link";
import { simularSalario } from "@/lib/engines/irs";
import { TSU_ENTIDADE, TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";

/**
 * A escada do euro — a assinatura do AO CÊNTIMO.
 * Waterfall editorial: o que a empresa paga desce em degraus — cada
 * corte do Estado é uma barra suspensa — até sobrar o líquido.
 * Números do motor fiscal: salário de 1 500 €, solteiro, 2026,
 * valores mensais. Largura = presença; nenhum rótulo toca uma barra.
 */
export function Fluxo({
  className,
  destaque,
}: {
  className?: string;
  /** índice da barra em foco no scrolly; as outras esbatem-se */
  destaque?: number | null;
}) {
  const med = simularSalario([1500], 0, 2026);
  const mensal = (v: number) => v / 14;

  const custo = mensal(med.custoEmpresaAnual);
  const tsu = mensal(med.brutoAnualTotal * TSU_ENTIDADE);
  const irs = mensal(med.irsAnual);
  const ss = mensal(med.ssAnual);
  const liquido = mensal(med.liquidoAnual);
  const estado = tsu + irs + ss;

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
    nome: string;
    acima?: string; // rótulo flutuante por cima
  }

  const barras: Barra[] = [
    {
      x: xs[0], top: custo, bot: 0, cor: "var(--ink)", cresce: "baixo",
      valor: fmtEUR0(custo), nome: m.fluxo.empresa,
    },
    {
      x: xs[1], top: custo, bot: custo - tsu, cor: "var(--accent)", cresce: "cima",
      valor: `−${fmtEUR0(tsu)}`, nome: t(m.fluxo.tsu, { taxa: fmtPct(TSU_ENTIDADE, 2) }),
    },
    {
      x: xs[2], top: custo - tsu, bot: 0, cor: "var(--ink2)", cresce: "baixo",
      valor: fmtEUR0(custo - tsu), nome: m.fluxo.brutoLabel,
    },
    {
      x: xs[3], top: custo - tsu, bot: custo - tsu - irs, cor: "var(--accent)", cresce: "cima",
      valor: `−${fmtEUR0(irs)}`, nome: m.fluxo.irs,
    },
    {
      x: xs[4], top: custo - tsu - irs, bot: custo - tsu - irs - ss, cor: "var(--accent)", cresce: "cima",
      valor: `−${fmtEUR0(ss)}`, nome: t(m.fluxo.ss, { taxa: fmtPct(TSU_TRABALHADOR, 0) }),
    },
    {
      x: xs[5], top: custo - tsu - irs - ss, bot: 0, cor: "var(--keep)", cresce: "baixo",
      valor: fmtEUR0(liquido), nome: m.fluxo.tu,
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
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 1000 440"
          aria-hidden="true"
          className="w-full min-w-[680px]"
        >
          {/* bracket: o Estado leva tudo o que está suspenso */}
          <g>
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

          {/* barras */}
          {barras.map((b, i) => {
            const top = y(b.top);
            const h = (b.top - b.bot) * k;
            return (
              <g
                key={b.nome}
                className={
                  destaque == null || destaque === i ? "fluxo-passo" : "fluxo-passo fluxo-off"
                }
              >
                <rect
                  className={`fluxo-barra fluxo-barra-${b.cresce}`}
                  x={b.x}
                  y={top}
                  width={BW}
                  height={h}
                  fill={b.cor}
                  style={{ animationDelay: `${i * 130}ms` }}
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
            );
          })}
        </svg>
      </div>

      {/* portas para os capítulos */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
        <Link href="/impostos" className="num text-[0.68rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:text-accent">
          {m.fluxo.linkEstado} →
        </Link>
        <Link href="/salario" className="num text-[0.68rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:text-keep">
          {m.fluxo.linkTu} →
        </Link>
        <Link href="/casa" className="num text-[0.68rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:text-accent">
          {m.fluxo.linkBanco} →
        </Link>
        <Link href="/precos" className="num text-[0.68rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:text-accent">
          {m.fluxo.linkBomba} →
        </Link>
      </div>
    </div>
  );
}
