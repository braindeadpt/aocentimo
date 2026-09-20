"use client";

/**
 * Mostrador — o relógio do observatório (B-02): um valor numa escala
 * fixa passada por props (nunca auto-escalada — min/max são o contexto,
 * ex.: 0–15 % para taxas). Arco de 240° de −210° a 30° (0° = 12h,
 * positivo horário). A marca torrada é a mediana de referência; o arco
 * percorrido é --accent acima dela e --keep abaixo.
 *
 * Movimento: mudança de valor roda a agulha com gsap.to (dur media,
 * ease entra); revelação abaixo da dobra varre de A0 ao valor.
 * Nascer visível = posição final já. prefers-reduced-motion: sem tween.
 * Equivalente único: role="img" + aria-label com valor, unidade e data.
 */
import { useEffect, useRef } from "react";
import { fmtData, fmtNum } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { dur, ease, gsap, reduzido } from "@/lib/motion/gsap";
import { pathArco } from "@/lib/viz/formas";

interface Props {
  valor: number;
  unidade: string;
  /** escala FIXA — nunca auto-escalada */
  min: number;
  max: number;
  /** marca de referência (ex.: mediana UE27) */
  mediana?: { valor: number; rotulo: string };
  rotulo: string;
  /** período do valor — entra no aria-label */
  t: string;
  compacto?: boolean;
}

const A0 = -210;
const A1 = 30;
const anguloDe = (v: number, min: number, max: number) =>
  A0 + (Math.min(max, Math.max(min, v)) - min) / (max - min) * (A1 - A0);

const r2 = (n: number) => Math.round(n * 100) / 100;

/** ponto no arco: ângulo (0°=12h, horário) e raio → coordenadas */
function noArco(cx: number, cy: number, r: number, a: number) {
  const rad = (a * Math.PI) / 180;
  return { x: r2(cx + r * Math.sin(rad)), y: r2(cy - r * Math.cos(rad)) };
}

export function Mostrador({
  valor,
  unidade,
  min,
  max,
  mediana,
  rotulo,
  t,
  compacto = false,
}: Props) {
  const { ref: refArmado, armado } = useArmado<HTMLDivElement>(
    `${rotulo}-${t}`
  );
  const agulha = useRef<SVGLineElement>(null);
  const arcoVivo = useRef<SVGPathElement>(null);
  const angRef = useRef<number | null>(null);

  const cx = 110;
  const cy = compacto ? 96 : 105;
  const r = compacto ? 66 : 78;
  const angulo = anguloDe(valor, min, max);

  // movimento da agulha: revelação (armado) ou mudança de valor —
  // sempre da posição actual para a nova, nunca de zero
  useEffect(() => {
    const el = agulha.current;
    if (!el) return;
    const de = angRef.current;
    angRef.current = angulo;
    if (reduzido()) {
      gsap.set(el, { rotation: angulo, svgOrigin: `${cx} ${cy}` });
      return;
    }
    if (de === null) {
      // primeiro render — só anima se a dobra legitimou (armado)
      if (!armado) return;
      gsap.fromTo(
        el,
        { rotation: A0, svgOrigin: `${cx} ${cy}` },
        { rotation: angulo, svgOrigin: `${cx} ${cy}`, duration: dur("media"), ease: ease("entra") }
      );
      return;
    }
    if (de === angulo) return;
    gsap.fromTo(
      el,
      { rotation: de, svgOrigin: `${cx} ${cy}` },
      { rotation: angulo, svgOrigin: `${cx} ${cy}`, duration: dur("media"), ease: ease("entra") }
    );
  }, [angulo, armado, cx, cy]);

  const acima = mediana !== undefined && valor > mediana.valor;
  const corArco = mediana === undefined ? "var(--ink)" : acima ? "var(--accent)" : "var(--keep)";
  const pMed = mediana ? noArco(cx, cy, r - 9, anguloDe(mediana.valor, min, max)) : null;
  const pMed2 = mediana ? noArco(cx, cy, r + 9, anguloDe(mediana.valor, min, max)) : null;

  return (
    <div
      ref={refArmado}
      className={compacto ? "w-full" : "mx-auto w-full max-w-64"}
    >
      <svg
        viewBox={`0 0 220 ${compacto ? 150 : 170}`}
        className="block w-full"
        role="img"
        aria-label={`${rotulo}: ${fmtNum(valor)} ${unidade} em ${fmtData(t)}`}
        data-viz
      >
        {/* pista */}
        <path
          d={pathArco(cx, cy, r, A0, A1)}
          fill="none"
          stroke="var(--line2)"
          strokeWidth={compacto ? 5 : 6}
          strokeLinecap="butt"
        />
        {/* arco percorrido */}
        <path
          ref={arcoVivo}
          d={pathArco(cx, cy, r, A0, angulo)}
          fill="none"
          stroke={corArco}
          strokeWidth={compacto ? 5 : 6}
        />
        {/* marca da mediana */}
        {mediana && pMed && pMed2 && (
          <line
            x1={pMed.x}
            y1={pMed.y}
            x2={pMed2.x}
            y2={pMed2.y}
            stroke="var(--mark)"
            strokeWidth={2}
          />
        )}
        {/* agulha — nasce na posição final; o tween só a roda */}
        <line
          ref={agulha}
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - (r - 14)}
          stroke="var(--ink)"
          strokeWidth={2}
          transform={`rotate(${angulo} ${cx} ${cy})`}
        />
        <circle cx={cx} cy={cy} r={3} fill="var(--ink)" />
        {/* valor central — mono tabular */}
        <text
          x={cx}
          y={cy + (compacto ? 28 : 34)}
          textAnchor="middle"
          fontSize={compacto ? 18 : 22}
          fill="var(--ink)"
          fontFamily="var(--font-mono)"
          className="tabular-nums"
        >
          {fmtNum(valor)}
          {unidade === "%" ? " %" : unidade ? ` ${unidade}` : ""}
        </text>
        {!compacto && (
          <text
            x={cx}
            y={cy + 50}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted)"
          >
            {rotulo}
            {mediana ? ` · ${mediana.rotulo} ${fmtNum(mediana.valor)} ${unidade}` : ""}
          </text>
        )}
      </svg>
    </div>
  );
}
