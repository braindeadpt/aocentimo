"use client";

/**
 * Secção «Motor» do /estilo — prova mínima de B-01: escalas d3 + SVG
 * manual + revelação GSAP (DrawSVG no traço, rotação na agulha).
 * Dados reais de data/derived/painel.json — a régie do site aplica-se
 * também às demos. Com prefers-reduced-motion nenhum tween arranca.
 */
import { useRef } from "react";
import { useArmado } from "@/lib/useArmado";
import { dur, ease, gsap, reduzido, useGSAP } from "@/lib/motion/gsap";
import { dataDePeriodo, escalaTempo, escalaValor } from "@/lib/viz/escalas";
import { pathArco, pathLinha } from "@/lib/viz/formas";
import { ticksTempo, ticksValor } from "@/lib/viz/eixos";
import { fmtData, fmtNum } from "@/lib/format";
import painel from "@data/derived/painel.json";

/* Linha mínima */
const LW = 560;
const LH = 170;
const ML = 46;
const MR = 8;
const MT = 8;
const MB = 24;

/* Mostrador mínimo — arco de 240°, de −210° a 30° (0° = 12h) */
const MCX = 110;
const MCY = 105;
const MR_ = 78;
const A0 = -210;
const A1 = 30;
const anguloDe = (v: number, min: number, max: number) =>
  A0 + ((v - min) / (max - min)) * (A1 - A0);

export function MotorDemo() {
  const scope = useRef<HTMLDivElement>(null);
  const { ref: refArmado, armado } = useArmado<HTMLDivElement>("motor-demo");

  const hicp = painel.series.find((i) => i.id === "hicp-pt-cp00");
  const desemprego = painel.series.find((i) => i.id === "une-pt-total");
  const ue27 = painel.series.find((i) => i.id === "une-ue27-total");

  const pontos = hicp?.spark ?? [];
  const x = escalaTempo(pontos, [ML, LW - MR]);
  const y = escalaValor(
    pontos.map((p) => p.v),
    [LH - MB, MT],
    { nice: true }
  );
  const caminho = pathLinha(
    pontos.map((p) => [x(dataDePeriodo(p.t)), y(p.v)] as [number, number])
  );

  const min = 0;
  const max = 15;
  const valor = desemprego?.valor ?? 0;
  const mediana = ue27?.valor;
  const angulo = anguloDe(valor, min, max);

  useGSAP(
    () => {
      if (!armado || reduzido()) return;
      gsap.fromTo(
        ".motor-linha",
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: dur("longa"), ease: ease("entra") }
      );
      gsap.fromTo(
        ".motor-agulha",
        { rotation: A0, svgOrigin: `${MCX} ${MCY}` },
        {
          rotation: angulo,
          svgOrigin: `${MCX} ${MCY}`,
          duration: dur("longa"),
          ease: ease("entra"),
        }
      );
    },
    { scope, dependencies: [armado, caminho, angulo] }
  );

  return (
    <div
      ref={(el) => {
        scope.current = el;
        refArmado(el);
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <figure className="border border-line bg-panel px-5 py-4">
        <figcaption className="kicker-xs">
          Linha — DrawSVG, --dur-longa (IHPC, dados reais)
        </figcaption>
        <svg
          viewBox={`0 0 ${LW} ${LH}`}
          className="mt-3 block w-full"
          aria-hidden
          data-viz
        >
          {ticksValor(y, 4, "").map((t) => (
            <g key={t.rotulo}>
              <line
                x1={ML}
                x2={LW - MR}
                y1={t.y}
                y2={t.y}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={ML - 6}
                y={t.y + 3}
                textAnchor="end"
                fontSize={10}
                fill="var(--muted)"
                className="num"
              >
                {t.rotulo}
              </text>
            </g>
          ))}
          {ticksTempo(x, 5).map((t) => (
            <text
              key={t.rotulo}
              x={t.x}
              y={LH - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted)"
              className="num"
            >
              {t.rotulo}
            </text>
          ))}
          <path
            className="motor-linha"
            d={caminho}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={1.5}
          />
        </svg>
        <p className="footnote mt-2">
          Último: {fmtNum(hicp?.valor ?? NaN, 2)} em {fmtData(hicp?.t ?? "")} —
          fonte {hicp?.fonte ?? "Eurostat"}.
        </p>
      </figure>

      <figure className="border border-line bg-panel px-5 py-4">
        <figcaption className="kicker-xs">
          Mostrador — agulha GSAP, escala fixa 0–15
        </figcaption>
        <svg
          viewBox="0 0 220 170"
          className="mx-auto mt-3 block w-full max-w-56"
          role="img"
          aria-label={`Taxa de desemprego: ${fmtNum(valor)} % em ${fmtData(
            desemprego?.t ?? ""
          )}`}
          data-viz
        >
          <path
            d={pathArco(MCX, MCY, MR_, A0, A1)}
            fill="none"
            stroke="var(--line2)"
            strokeWidth={6}
          />
          <path
            d={pathArco(MCX, MCY, MR_, A0, angulo)}
            fill="none"
            stroke={
              mediana !== undefined && valor > mediana
                ? "var(--accent)"
                : "var(--keep)"
            }
            strokeWidth={6}
          />
          {mediana !== undefined && (
            <line
              x1={MCX + (MR_ - 8) * Math.sin((anguloDe(mediana, min, max) * Math.PI) / 180)}
              y1={MCY - (MR_ - 8) * Math.cos((anguloDe(mediana, min, max) * Math.PI) / 180)}
              x2={MCX + (MR_ + 8) * Math.sin((anguloDe(mediana, min, max) * Math.PI) / 180)}
              y2={MCY - (MR_ + 8) * Math.cos((anguloDe(mediana, min, max) * Math.PI) / 180)}
              stroke="var(--mark)"
              strokeWidth={2}
            />
          )}
          <line
            className="motor-agulha"
            x1={MCX}
            y1={MCY}
            x2={MCX}
            y2={MCY - (MR_ - 14)}
            stroke="var(--ink)"
            strokeWidth={2}
            transform={`rotate(${angulo} ${MCX} ${MCY})`}
          />
          <circle cx={MCX} cy={MCY} r={3} fill="var(--ink)" />
          <text
            x={MCX}
            y={MCY + 34}
            textAnchor="middle"
            fontSize={22}
            fill="var(--ink)"
            className="num tabular-nums"
          >
            {fmtNum(valor)} %
          </text>
          <text
            x={MCX}
            y={MCY + 50}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted)"
          >
            desemprego · UE27 {fmtNum(mediana ?? NaN)} %
          </text>
        </svg>
        <p className="footnote mt-2">
          Marca torrada: mediana de referência (UE27). Acima → vermilhão,
          abaixo → verde.
        </p>
      </figure>
    </div>
  );
}
