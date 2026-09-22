"use client";

/**
 * Explodido — a explosão isométrica da Direcção V3 §6 generalizada
 * (extraída do EuroExplodido em R-05, para servir também o custo do
 * trabalho em /salario): peças wireframe (moeda/disco/placa/base)
 * afastadas na vertical sobre um eixo tracejado, cada uma com a sua
 * linha de chamada tracejada até ao rótulo mono à direita; à esquerda
 * da base, o número grande. A <ol> é o equivalente sempre visível —
 * faz parte do desenho — e interroga as peças por hover/focus
 * (eu-peca-on acende a face e a chamada).
 *
 * Geometria toda no HTML (viewBox fixa 520×440, sem medição); o svg é
 * decorativo (aria-hidden). A montagem — peças a convergir de cima,
 * chamadas a desenharem-se por clip-path, rótulos a assentar — só
 * existe quando o cartão pai ganha .eu-on (useArmado); sem ela, ou em
 * reduced-motion, o estado base é já o final.
 */
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { r1 } from "@/lib/materia";

export type TipoPeca = "moeda" | "disco" | "placa" | "base";

/** cor semântica da peça (S1-02): «corte» = dinheiro que sai do bolso
    (SS, IRS, impostos) → --accent; «fica» = dinheiro que fica contigo
    (líquido, «fica», «chega à conta») → --keep; «neutro» = totais que
    não são nem saída nem sobra (bruto, custo da empresa) → tinta. */
export type TomPeca = "neutro" | "corte" | "fica";

/** var de cor por tom — também alimenta o realce de foco (--eu-tom) */
export const TOM_VAR: Record<TomPeca, string> = {
  neutro: "var(--l-ink)",
  corte: "var(--l-accent)",
  fica: "var(--l-keep)",
};

export interface PecaExplodida {
  id: string;
  kind: TipoPeca;
  rotulo: string;
  detalhe: string;
  /** tom semântico — decide cor do valor, da face e do realce */
  tom: TomPeca;
  /** valor junto à chamada — nó dentro do <text> (string, ou <tspan>
      animado quando a peça responde a um input) */
  valorSvg: ReactNode;
  /** valor na lista-equivalente — nó resolvido (Odometer/TweenNum).
      Ausente → a peça não entra na lista (a moeda-mãe é o todo, não
      um passo) */
  valorLista?: ReactNode;
}

export interface NumeroExplodido {
  /** kicker mono por cima do número — «ficam-te», «chega à conta» */
  kicker: string;
  /** o valor — nó dentro do <text> */
  valor: ReactNode;
  /** linha pequena por baixo — «por mês» */
  pequeno?: ReactNode;
  /** corpo menor — os euros do mês são mais largos que os cêntimos */
  compacto?: boolean;
}

/* ————— geometria da explosão — viewBox fixa 520×440, sem medição ————— */
const VW = 520;
const VH = 440;
const CX = 264; // eixo do stack — a coluna de rótulos fica à direita
const RX = 88; // discos cheios («1 € bruto», «chega à conta»)
const RY = 24;
const RXC = 74; // fatias de imposto — mais pequenas e finas
const RYC = 20;
const BW = 104; // placa base «fica» — losango arredondado
const BH = 30;
const BTH = 12; // extrusão da base
const BR = 11; // raio dos vértices do losango
const LX = 392; // coluna de rótulos (mono 11 px ≈ 19 car. por linha)
const LEAD = LX - 8;
const TOP = 54; // cy da peça do topo
const BOT = 362; // cy da placa base
const NUM_X = 12; // o número grande, à esquerda da placa base

/** losango com vértices arredondados — a placa da base em perspectiva */
function losango(cx: number, cy: number, w: number, h: number, r: number) {
  const vs = [
    [cx, cy - h],
    [cx + w, cy],
    [cx, cy + h],
    [cx - w, cy],
  ];
  const u = r / Math.hypot(w, h);
  let d = "";
  for (let i = 0; i < 4; i++) {
    const V = vs[i];
    const A = vs[(i + 3) % 4];
    const C = vs[(i + 1) % 4];
    const p1 = [V[0] + (A[0] - V[0]) * u, V[1] + (A[1] - V[1]) * u];
    const p2 = [V[0] + (C[0] - V[0]) * u, V[1] + (C[1] - V[1]) * u];
    d += `${i === 0 ? "M" : "L"} ${r1(p1[0])} ${r1(p1[1])} Q ${r1(V[0])} ${r1(
      V[1]
    )} ${r1(p2[0])} ${r1(p2[1])} `;
  }
  return `${d}Z`;
}

/** parede lateral de um disco — só o arco da frente é visível */
function parede(cx: number, cy: number, rx: number, ry: number, th: number) {
  return (
    `M ${r1(cx - rx)} ${r1(cy)} L ${r1(cx - rx)} ${r1(cy + th)} ` +
    `A ${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(cy + th)} ` +
    `L ${r1(cx + rx)} ${r1(cy)}`
  );
}

/** o detalhe do rótulo em linhas de ~19 caracteres (a coluna é estreita) */
function embrulha(txt: string, max = 19): string[] {
  const linhas: string[] = [];
  let cur = "";
  for (const w of txt.split(" ")) {
    const tenta = cur ? `${cur} ${w}` : w;
    if (tenta.length <= max) {
      cur = tenta;
    } else {
      if (cur) linhas.push(cur);
      cur = w;
    }
  }
  if (cur) linhas.push(cur);
  // as strings da casa cabem em 2 linhas; a rede de segurança junta o resto
  return linhas.length > 2 ? [linhas[0], linhas.slice(1).join(" ")] : linhas;
}

type PecaGeo = PecaExplodida & { cy: number };

export function Explodido({
  pecas,
  numero,
  nome,
}: {
  pecas: PecaExplodida[];
  numero: NumeroExplodido;
  /** nome do equivalente — vira data-{nome}-lista na <ol> */
  nome: string;
}) {
  const [activo, setActivo] = useState<string | null>(null);

  // o stack: a peça-mãe no topo, os passos por ordem, a base no fundo
  const gap = (BOT - TOP) / Math.max(1, pecas.length - 1);
  const geo: PecaGeo[] = pecas.map((p, i) => ({ ...p, cy: r1(TOP + i * gap) }));
  const itens = geo.filter((p) => p.valorLista !== undefined);

  return (
    <div className="eu-grid">
      <div className="eu-stage">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          aria-hidden="true"
          className="block h-auto w-full"
        >
          {/* o eixo da explosão — a haste por onde as peças descem */}
          <line
            x1={CX}
            x2={CX}
            y1={TOP + RY + 10}
            y2={BOT - BH - 6}
            stroke="var(--l-line2)"
            strokeWidth={1}
            strokeDasharray="1 5"
            opacity={0.7}
          />

          {/* as peças — wireframe; cada uma desce do céu ao armar */}
          {geo.map((p, i) => {
            const on = activo === p.id ? " eu-peca-on" : "";
            const pd = {
              "--pd": `${i * 80}ms`,
              "--eu-tom": TOM_VAR[p.tom],
            } as CSSProperties;
            const entra = () => setActivo(p.id);
            const sai = () => setActivo(null);

            if (p.kind === "base") {
              const face = losango(CX, p.cy, BW, BH, BR);
              return (
                <g
                  key={p.id}
                  className={`eu-peca${on}`}
                  style={pd}
                  onMouseEnter={entra}
                  onMouseLeave={sai}
                >
                  {/* zona de toque invisível — topo + extrusão */}
                  <path d={face} fill="#000" fillOpacity={0} />
                  <path
                    d={losango(CX, p.cy + BTH, BW, BH, BR)}
                    fill="#000"
                    fillOpacity={0}
                  />
                  {/* face de baixo e arestas verticais */}
                  <path
                    d={losango(CX, p.cy + BTH, BW, BH, BR)}
                    fill="none"
                    stroke="var(--l-ink2)"
                    strokeWidth={1}
                  />
                  {[
                    [CX, p.cy - BH],
                    [CX - BW, p.cy],
                    [CX + BW, p.cy],
                    [CX, p.cy + BH],
                  ].map(([x, y], k) => (
                    <line
                      key={k}
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={y + BTH}
                      stroke="var(--l-ink2)"
                      strokeWidth={1}
                    />
                  ))}
                  <path
                    className="eu-face"
                    d={face}
                    fill={p.tom === "fica" ? "var(--l-keep)" : "none"}
                    fillOpacity={p.tom === "fica" ? 0.14 : undefined}
                    stroke="var(--l-ink)"
                    strokeWidth={1.2}
                  />
                  <ellipse
                    cx={CX}
                    cy={p.cy}
                    rx={BW * 0.55}
                    ry={BH * 0.55}
                    fill="none"
                    stroke="var(--l-ink2)"
                    strokeWidth={1}
                    strokeDasharray="3 4"
                    opacity={0.7}
                  />
                </g>
              );
            }

            const rx = p.kind === "placa" ? RXC : RX;
            const ry = p.kind === "placa" ? RYC : RY;
            const th = p.kind === "moeda" ? 9 : p.kind === "disco" ? 8 : 5;
            return (
              <g
                key={p.id}
                className={`eu-peca${on}`}
                style={pd}
                onMouseEnter={entra}
                onMouseLeave={sai}
              >
                {/* zona de toque invisível — face + parede */}
                <ellipse
                  cx={CX}
                  cy={p.cy + th / 2}
                  rx={rx + 8}
                  ry={ry + th / 2 + 6}
                  fill="#000"
                  fillOpacity={0}
                />
                <path
                  d={parede(CX, p.cy, rx, ry, th)}
                  fill="none"
                  stroke="var(--l-ink)"
                  strokeWidth={1}
                />
                <ellipse
                  className="eu-face"
                  cx={CX}
                  cy={p.cy}
                  rx={rx}
                  ry={ry}
                  fill={p.kind === "moeda" ? "var(--l-ink)" : "none"}
                  fillOpacity={p.kind === "moeda" ? 0.08 : undefined}
                  stroke="var(--l-ink)"
                  strokeWidth={1.2}
                />
                {p.kind === "moeda" && (
                  <ellipse
                    cx={CX}
                    cy={p.cy}
                    rx={rx - 18}
                    ry={ry - 7}
                    fill="none"
                    stroke="var(--l-ink2)"
                    strokeWidth={1}
                    strokeDasharray="3 4"
                    opacity={0.8}
                  />
                )}
              </g>
            );
          })}

          {/* chamadas tracejadas + rótulos mono — revelam-se depois
              das peças aterrarem */}
          {geo.map((p, i) => {
            const on = activo === p.id ? " eu-peca-on" : "";
            const estilo = { "--eu-tom": TOM_VAR[p.tom] } as CSSProperties;
            const edgeX =
              p.kind === "base"
                ? CX + BW
                : p.kind === "placa"
                  ? CX + RXC
                  : CX + RX;
            return (
              <g key={`rot-${p.id}`} className={`eu-rotg${on}`} style={estilo}>
                <line
                  className="eu-chamada"
                  style={
                    {
                      "--ld": `${380 + i * 55}ms`,
                    } as CSSProperties
                  }
                  x1={edgeX + 6}
                  y1={p.cy}
                  x2={LEAD}
                  y2={p.cy}
                />
                <g
                  className="eu-rot"
                  style={
                    {
                      "--rd": `${440 + i * 55}ms`,
                    } as CSSProperties
                  }
                >
                  <text className="eu-txt eu-rot-r" x={LX} y={p.cy - 13}>
                    {p.rotulo}
                  </text>
                  <text
                    className={`eu-txt eu-rot-v eu-tom-${p.tom}`}
                    x={LX}
                    y={p.cy + 2}
                  >
                    {p.valorSvg}
                  </text>
                  {embrulha(p.detalhe).map((l, li) => (
                    <text
                      key={li}
                      className="eu-txt eu-rot-d"
                      x={LX}
                      y={p.cy + 16 + li * 12}
                    >
                      {l}
                    </text>
                  ))}
                </g>
              </g>
            );
          })}

          {/* o número grande, à esquerda da placa base */}
          <g className="eu-num-grupo">
            <text className="eu-txt eu-kicker" x={NUM_X} y={BOT - 34}>
              {numero.kicker}
            </text>
            <text
              className={`eu-txt eu-num${numero.compacto ? " eu-num-m" : ""}`}
              x={NUM_X}
              y={BOT + 12}
            >
              {numero.valor}
            </text>
            {numero.pequeno && (
              <text className="eu-txt eu-kicker" x={NUM_X} y={BOT + 34}>
                {numero.pequeno}
              </text>
            )}
          </g>
        </svg>
      </div>

      {/* o equivalente sempre visível — os mesmos passos e valores */}
      <ol {...{ [`data-${nome}-lista`]: true }} className="eu-lista">
        {itens.map((p) => (
          <li
            key={p.id}
            tabIndex={0}
            className={`eu-li${activo === p.id ? " eu-li-on" : ""}`}
            style={{ "--eu-tom": TOM_VAR[p.tom] } as CSSProperties}
            onMouseEnter={() => setActivo(p.id)}
            onMouseLeave={() => setActivo(null)}
            onFocus={() => setActivo(p.id)}
            onBlur={() => setActivo(null)}
          >
            <div className="eu-li-top">
              <span className="eu-li-rot">{p.rotulo}</span>
              <span className={`eu-li-val eu-tom-${p.tom}`}>
                {p.valorLista}
              </span>
            </div>
            <p className="eu-li-det">{p.detalhe}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
