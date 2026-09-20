"use client";

/**
 * Secção «Motor» do /estilo — prova mínima de B-01: escalas d3 + SVG
 * manual + revelação GSAP por dynamic import (DrawSVG no traço,
 * agulha por coordenadas — o mesmo padrão do instrumento Mostrador).
 * Dados reais de data/derived/painel.json — a régie do site aplica-se
 * também às demos. Com prefers-reduced-motion nenhum tween arranca e
 * o chunk do GSAP nunca é descarregado.
 */
import { useEffect, useRef } from "react";
import { useArmado } from "@/lib/useArmado";
import { carregarGsap, dur, ease, motionActiva } from "@/lib/motion/gsap";
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

/* Mostrador mínimo — arco simétrico −120°→120° (8h→4h), vazio em baixo */
const MCX = 110;
const MCY = 74;
const MR_ = 64;
const A0 = -120;
const A1 = 120;
const anguloDe = (v: number, min: number, max: number) =>
  A0 + ((v - min) / (max - min)) * (A1 - A0);
const noArco = (r: number, a: number) => ({
  x: MCX + r * Math.sin((a * Math.PI) / 180),
  y: MCY - r * Math.cos((a * Math.PI) / 180),
});

export function MotorDemo() {
  const scope = useRef<HTMLDivElement>(null);
  const agulha = useRef<SVGLineElement>(null);
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
  const ponta = noArco(MR_ - 12, angulo);
  const pMed1 = mediana !== undefined ? noArco(MR_ - 8, anguloDe(mediana, min, max)) : null;
  const pMed2 = mediana !== undefined ? noArco(MR_ + 8, anguloDe(mediana, min, max)) : null;

  useEffect(() => {
    if (!armado || !motionActiva()) return;
    let morto = false;
    void carregarGsap().then(({ gsap }) => {
      const raiz = scope.current;
      const el = agulha.current;
      if (morto || !raiz || !el) return;
      const proxy = { a: A0 };
      gsap.fromTo(
        raiz.querySelectorAll(".motor-linha"),
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: dur("longa"), ease: ease("entra") }
      );
      gsap.to(proxy, {
        a: angulo,
        duration: dur("longa"),
        ease: ease("entra"),
        onUpdate: () => {
          const p = noArco(MR_ - 12, proxy.a);
          el.setAttribute("x2", String(Math.round(p.x * 100) / 100));
          el.setAttribute("y2", String(Math.round(p.y * 100) / 100));
        },
      });
    });
    return () => {
      morto = true;
    };
  }, [armado, caminho, angulo]);

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
          Mostrador — agulha por coordenadas, escala fixa 0–15
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
          {pMed1 && pMed2 && (
            <line
              x1={pMed1.x}
              y1={pMed1.y}
              x2={pMed2.x}
              y2={pMed2.y}
              stroke="var(--mark)"
              strokeWidth={2}
            />
          )}
          <line
            ref={agulha}
            x1={MCX}
            y1={MCY}
            x2={ponta.x}
            y2={ponta.y}
            stroke="var(--ink)"
            strokeWidth={2}
          />
          <circle cx={MCX} cy={MCY} r={3} fill="var(--ink)" />
          <text
            x={MCX}
            y={MCY + MR_ * 0.5 + 26}
            textAnchor="middle"
            fontSize={21}
            fill="var(--ink)"
            className="num tabular-nums"
          >
            {fmtNum(valor)} %
          </text>
          <text
            x={MCX}
            y={MCY + MR_ * 0.5 + 42}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            UE27 {fmtNum(mediana ?? NaN)} %
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
