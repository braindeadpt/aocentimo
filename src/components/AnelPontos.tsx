"use client";

/**
 * AnelPontos — o anel de pontos do catálogo V4 (§5): CICLOS desenham-se
 * como pontos contáveis num círculo — os 12 meses do ano, os trimestres,
 * as estações. O número do ciclo vai ao centro (em HTML, sempre nítido
 * a qualquer escala). O ponto «agora» ganha o anel torrado de marca.
 *
 * Quando NÃO se usa: progressão linear (é a linha anotada ou a barra
 * de traços); parte-todo (são pontos do CampoCentimos). O anel diz
 * «o tempo volta» — mês 12 encosta no mês 1.
 *
 * O svg (pontos + rótulos curtos) é decorativo e fixo — viewBox
 * 300×300, escala com o palco; os rótulos curtos escondem-se por
 * container query quando o palco é estreito (o «atual» fica sempre).
 * O equivalente textual é um <p> sr-only irmão — um por figura. A
 * entrada (pontos a assentar no sentido dos ponteiros) só existe com
 * .ap-on (useArmado abaixo da dobra); reduced-motion = estado final.
 */
import type { CSSProperties, ReactNode } from "react";
import { r1 } from "@/lib/materia";
import { useArmado } from "@/lib/useArmado";

/** cor semântica do ponto — os mesmos tons da casa: «fica» verde,
    «sai» vermelhão, «marca» torrado (marco/limite), «vago» oco */
export type TomPontoAnel = "neutro" | "fica" | "sai" | "marca" | "vago";

export interface PontoAnel {
  id: string;
  /** nome completo — entra no equivalente («janeiro») */
  rotulo: string;
  /** legenda curta junto ao ponto («jan») — desenhada se couber */
  rotuloCurto?: string;
  tom?: TomPontoAnel;
  /** o ponto do momento — anel torrado + rótulo sempre visível */
  atual?: boolean;
}

export interface CentroAnel {
  /** o número do ciclo — «14 004 €», «12», «4» */
  valor: ReactNode;
  /** linha pequena por baixo — «por ano», «meses» */
  rotulo?: ReactNode;
}

export interface AnelPontosProps {
  pontos: PontoAnel[];
  centro: CentroAnel;
  /** rótulos curtos à volta do anel (defeito: sim, até 16 pontos) */
  comRotulos?: boolean;
  /** equivalente textual — gerado dos pontos se omitido */
  equivalente?: string;
  className?: string;
}

const VB = 300;
const C = VB / 2;
const R = 104; // raio do anel de pontos
const RL = R + 20; // raio dos rótulos curtos

export function AnelPontos({
  pontos,
  centro,
  comRotulos = true,
  equivalente,
  className,
}: AnelPontosProps) {
  const { ref, arm } = useArmado<HTMLDivElement>(
    `anel:${pontos.map((p) => p.id).join("+")}`
  );
  const n = pontos.length;
  const rotulos = comRotulos && n > 0 && n <= 16;
  const atual = pontos.find((p) => p.atual);

  const geo = pontos.map((p, i) => {
    // sentido dos ponteiros a partir do topo (-90°)
    const a = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
    return {
      p,
      i,
      x: r1(C + Math.cos(a) * R),
      y: r1(C + Math.sin(a) * R),
      lx: r1(C + Math.cos(a) * RL),
      ly: r1(C + Math.sin(a) * RL + 3.5),
    };
  });

  const eq =
    equivalente ??
    `${n} pontos em anel: ${pontos.map((p) => p.rotulo).join(", ")}` +
      (atual ? `. Agora: ${atual.rotulo}.` : ".");

  return (
    <div
      ref={ref}
      className={`ap ${arm("ap-on")}${className ? ` ${className}` : ""}`}
    >
      <div className="ap-palco">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          aria-hidden="true"
          className="block h-full w-full"
        >
          {/* a pista do ciclo — tracejado fino atrás dos pontos */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            className="ap-pista"
          />
          {geo.map((g) => (
            <g
              key={g.p.id}
              className={`ap-ponto${g.p.atual ? " ap-atual" : ""}`}
              style={{ "--ad": `${g.i * 60}ms` } as CSSProperties}
            >
              {g.p.atual && (
                <circle
                  className="ap-anel-agora"
                  cx={g.x}
                  cy={g.y}
                  r={11.5}
                />
              )}
              <circle
                className={`ap-dot ap-tom-${g.p.tom ?? "neutro"}`}
                cx={g.x}
                cy={g.y}
                r={6}
              />
              {rotulos && g.p.rotuloCurto && (
                <text
                  className={`ap-txt ap-rot${g.p.atual ? " ap-rot-atual" : ""}`}
                  x={g.lx}
                  y={g.ly}
                  textAnchor="middle"
                >
                  {g.p.rotuloCurto}
                </text>
              )}
            </g>
          ))}
        </svg>
        <div className="ap-centro">
          <span className="ap-num">{centro.valor}</span>
          {centro.rotulo && <span className="ap-centro-rot">{centro.rotulo}</span>}
        </div>
      </div>
      <p className="sr-only" data-ap-equivalente>
        {eq}
      </p>
    </div>
  );
}
