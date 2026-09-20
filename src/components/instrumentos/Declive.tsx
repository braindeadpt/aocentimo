"use client";

/**
 * Declive — slope chart (B-02): antes → depois por item. Linhas que
 * subiram em --up, desceram em --down; ▲/▼ no rótulo do depois.
 * Rótulos com anti-colisão: empurra verticalmente em passos de ≥12 px.
 * Equivalente único: tabela sr-only com antes/depois/variação.
 */
import { useMemo } from "react";
import { fmtNum } from "@/lib/format";
import { escalaValor } from "@/lib/viz/escalas";
import { EmptyState } from "@/components/EmptyState";

interface Item {
  rotulo: string;
  antes: number;
  depois: number;
}

interface Props {
  itens: Item[];
  /** [rótulo da coluna esquerda, da direita] — ex.: ["2020", "2026"] */
  rotulos: [string, string];
  unidade: string;
  titulo: string;
}

const W = 640;
const H = 240;
const X0 = 150;
const X1 = W - 150;
const PAD_Y = 26;
const PASSO_ROTULO = 12;

const fmtV = (v: number, unidade: string) =>
  unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v);

/** anti-colisão: ordena por y e empurra ≥12 px; segunda passagem
 *  reentra para cima se a fila transbordar o fim */
function semColisao(ys: number[]): number[] {
  const orden = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const out = new Array<number>(ys.length);
  let prev = -Infinity;
  for (const o of orden) {
    o.y = Math.max(o.y, prev + PASSO_ROTULO, PAD_Y);
    prev = o.y;
    out[o.i] = o.y;
  }
  const limite = H - 8;
  const excesso = orden.length ? orden[orden.length - 1].y - limite : 0;
  if (excesso > 0) {
    let teto = limite;
    for (let i = orden.length - 1; i >= 0; i--) {
      orden[i].y = Math.min(orden[i].y, teto);
      teto = orden[i].y - PASSO_ROTULO;
      out[orden[i].i] = orden[i].y;
    }
  }
  return out;
}

export function Declive({ itens, rotulos, unidade, titulo }: Props) {
  const dados = useMemo(
    () => itens.filter((i) => Number.isFinite(i.antes) && Number.isFinite(i.depois)),
    [itens]
  );

  const y = useMemo(() => {
    const vs = dados.flatMap((i) => [i.antes, i.depois]);
    return escalaValor(vs, [H - PAD_Y, PAD_Y], { nice: true });
  }, [dados]);

  const rotEsq = useMemo(
    () => semColisao(dados.map((i) => y(i.antes))),
    [dados, y]
  );
  const rotDir = useMemo(
    () => semColisao(dados.map((i) => y(i.depois))),
    [dados, y]
  );

  if (dados.length === 0) return <EmptyState titulo="Dados indisponíveis" />;

  return (
    <div className="relative w-full">
      <div className="sr-only">
        <table>
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">{""}</th>
              <th scope="col">{rotulos[0]}</th>
              <th scope="col">{rotulos[1]}</th>
              <th scope="col">Variação</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((i) => (
              <tr key={i.rotulo}>
                <th scope="row">{i.rotulo}</th>
                <td>{fmtV(i.antes, unidade)}</td>
                <td>{fmtV(i.depois, unidade)}</td>
                <td>{fmtV(i.depois - i.antes, unidade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        aria-hidden
        data-viz
      >
        <text
          x={X0}
          y={14}
          textAnchor="middle"
          fontSize={11}
          fill="var(--muted)"
          fontFamily="var(--font-mono)"
        >
          {rotulos[0]}
        </text>
        <text
          x={X1}
          y={14}
          textAnchor="middle"
          fontSize={11}
          fill="var(--muted)"
          fontFamily="var(--font-mono)"
        >
          {rotulos[1]}
        </text>
        {dados.map((i, k) => {
          const subiu = i.depois > i.antes;
          const igual = i.depois === i.antes;
          const cor = igual ? "var(--ink2)" : subiu ? "var(--up)" : "var(--down)";
          const sinal = igual ? "=" : subiu ? "▲" : "▼";
          return (
            <g key={i.rotulo}>
              <line
                x1={X0}
                x2={X1}
                y1={y(i.antes)}
                y2={y(i.depois)}
                stroke={cor}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={X0} cy={y(i.antes)} r={2.5} fill={cor} />
              <circle cx={X1} cy={y(i.depois)} r={2.5} fill={cor} />
              <text
                x={X0 - 8}
                y={rotEsq[k] + 3}
                textAnchor="end"
                fontSize={11}
                fill="var(--ink2)"
                fontFamily="var(--font-mono)"
              >
                {i.rotulo} {fmtV(i.antes, unidade)}
              </text>
              <text
                x={X1 + 8}
                y={rotDir[k] + 3}
                textAnchor="start"
                fontSize={11}
                fill="var(--ink2)"
                fontFamily="var(--font-mono)"
              >
                <tspan fill={cor}>{sinal}</tspan> {fmtV(i.depois, unidade)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
