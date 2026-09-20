"use client";

/**
 * Mostrador — o relógio do observatório (B-02, rev. pós-B-2): um valor
 * numa escala fixa passada por props (nunca auto-escalada — min/max são
 * o contexto, ex.: 0–10 % para inflação). Arco simétrico de −120° a
 * 120° (8h → 4h, 0° = 12h) — o vazio fica em baixo e recebe o valor.
 * A marca torrada é a mediana de referência; o arco percorrido é
 * --accent acima dela e --keep abaixo.
 *
 * A agulha é uma <line> cujos x2/y2 saem de noArco() no render — SSR
 * correcto sem JS, sem transform/rotation (nada se compõe). A animação
 * tween um proxy {a} e escreve x2/y2 em onUpdate.
 * Movimento: mudança de valor ou revelação abaixo da dobra varre de
 * A0/posição actual ao alvo; nascer visível = posição final já.
 * prefers-reduced-motion: sem tween, e o GSAP nunca é descarregado.
 * Equivalente único: role="img" + aria-label com valor, unidade e data.
 */
import { useEffect, useRef } from "react";
import { fmtNum, fmtPeriodo } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { carregarGsap, dur, ease, motionActiva } from "@/lib/motion/gsap";
import { pathArco } from "@/lib/viz/formas";

interface Props {
  valor: number;
  unidade: string;
  /** escala FIXA — nunca auto-escalada */
  min: number;
  max: number;
  /** marca de referência (ex.: mediana 10 anos, UE27) */
  mediana?: { valor: number; rotulo: string };
  rotulo: string;
  /** período do valor — entra no aria-label */
  t: string;
  compacto?: boolean;
  /** dentro do painel (C-01) o equivalente é a tabela única — o svg
      fica mudo, sem role="img"/aria-label (evita anúncio duplo) */
  mudo?: boolean;
}

/* arco simétrico: 8h → 4h, o vazio fica em baixo para o valor */
const A0 = -120;
const A1 = 120;
const anguloDe = (v: number, min: number, max: number) =>
  A0 + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (A1 - A0);

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
  mudo = false,
}: Props) {
  const { ref: refArmado, armado } = useArmado<HTMLDivElement>(
    `${rotulo}-${t}`
  );
  const agulha = useRef<SVGLineElement>(null);
  const arcoVivo = useRef<SVGPathElement>(null);
  const angRef = useRef<number | null>(null);

  const cx = 110;
  const cy = compacto ? 64 : 74;
  const r = compacto ? 52 : 64;
  const angulo = anguloDe(valor, min, max);
  /* o vazio do arco começa em cy + r·cos(60°) — o valor mora lá dentro */
  const yVazio = cy + r * 0.5;
  const alturaSvg = yVazio + (compacto ? 40 : 52);

  /* movimento da agulha + arco percorrido: revelação (armado) ou
     mudança de valor — sempre da posição actual para a nova. O proxy
     tween o ângulo e escreve coordenadas; sem rotation. */
  useEffect(() => {
    const el = agulha.current;
    const arco = arcoVivo.current;
    if (!el) return;
    const de = angRef.current;
    angRef.current = angulo;
    if (!motionActiva()) return;
    if (de === null && !armado) return; // nasceu visível: SSR já é final
    const partida = de === null ? A0 : de;
    if (partida === angulo) return;
    let morto = false;
    const proxy = { a: partida };
    void carregarGsap().then(({ gsap }) => {
      if (morto) return;
      gsap.to(proxy, {
        a: angulo,
        duration: dur("media"),
        ease: ease("entra"),
        onUpdate: () => {
          const p = noArco(cx, cy, r - 12, proxy.a);
          el.setAttribute("x2", String(p.x));
          el.setAttribute("y2", String(p.y));
          arco?.setAttribute("d", pathArco(cx, cy, r, A0, proxy.a));
        },
      });
    });
    return () => {
      morto = true;
    };
  }, [angulo, armado, cx, cy, r]);

  const acima = mediana !== undefined && valor > mediana.valor;
  const corArco =
    mediana === undefined
      ? "var(--ink)"
      : acima
        ? "var(--accent)"
        : "var(--keep)";
  /* referência fora da escala → sem tick no arco; fica só no texto
     por baixo do valor (a escala fixa não mente) */
  const medVisivel =
    mediana !== undefined && mediana.valor >= min && mediana.valor <= max;
  const pMed = medVisivel
    ? noArco(cx, cy, r - 8, anguloDe(mediana!.valor, min, max))
    : null;
  const pMed2 = medVisivel
    ? noArco(cx, cy, r + 8, anguloDe(mediana!.valor, min, max))
    : null;
  const ponta = noArco(cx, cy, r - 12, angulo);

  /* traços menores a cada unidade inteira da escala + extremos com
     rótulo — a escala fixa lê-se, não se deduz */
  const tracos: { a: number; extremo: boolean }[] = [];
  for (let v = Math.ceil(min); v <= Math.floor(max); v++) {
    tracos.push({ a: anguloDe(v, min, max), extremo: v === min || v === max });
  }

  return (
    <div ref={refArmado} className="w-full">
      {/* rótulo por cima do arco — kicker, fora do svg */}
      <p className="kicker-xs mb-1 text-center">{rotulo}</p>
      <svg
        viewBox={`0 0 220 ${alturaSvg}`}
        className={compacto ? "block w-full" : "mx-auto block w-full max-w-64"}
        {...(mudo
          ? { "aria-hidden": "true" }
          : {
              role: "img",
              "aria-label": `${rotulo}: ${fmtNum(valor)} ${unidade} em ${fmtPeriodo(t)}`,
            })}
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
        {/* traços da escala — um por unidade inteira; extremos levam
            rótulo de 10 px em --muted */}
        {tracos.map(({ a, extremo }) => {
          const p1 = noArco(cx, cy, r + (extremo ? 10 : 6), a);
          const p2 = noArco(cx, cy, r + 3, a);
          const pRot = noArco(cx, cy, r + 17, a);
          return (
            <g key={a}>
              <line
                x1={p2.x}
                y1={p2.y}
                x2={p1.x}
                y2={p1.y}
                stroke="var(--line2)"
                strokeWidth={extremo ? 1.5 : 1}
              />
              {extremo && (
                <text
                  x={pRot.x}
                  y={pRot.y + 3}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--muted)"
                  fontFamily="var(--font-mono)"
                >
                  {a === A0 ? fmtNum(min) : `${fmtNum(max)}${unidade === "%" ? " %" : unidade ? ` ${unidade}` : ""}`}
                </text>
              )}
            </g>
          );
        })}
        {/* marca da mediana — só dentro da escala */}
        {medVisivel && pMed && pMed2 && (
          <line
            x1={pMed.x}
            y1={pMed.y}
            x2={pMed2.x}
            y2={pMed2.y}
            stroke="var(--mark)"
            strokeWidth={2}
          />
        )}
        {/* agulha — coordenadas do render; o tween só reescreve x2/y2 */}
        <line
          ref={agulha}
          x1={cx}
          y1={cy}
          x2={ponta.x}
          y2={ponta.y}
          stroke="var(--ink)"
          strokeWidth={2}
        />
        <circle cx={cx} cy={cy} r={3} fill="var(--ink)" />
        {/* valor no vazio do arco — mono tabular */}
        <text
          x={cx}
          y={yVazio + (compacto ? 20 : 26)}
          textAnchor="middle"
          fontSize={compacto ? 17 : 21}
          fill="var(--ink)"
          fontFamily="var(--font-mono)"
          className="tabular-nums"
        >
          {fmtNum(valor)}
          {unidade === "%" ? " %" : unidade ? ` ${unidade}` : ""}
        </text>
        {/* referência por baixo do valor */}
        {mediana && (
          <text
            x={cx}
            y={yVazio + (compacto ? 34 : 42)}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            {mediana.rotulo} {fmtNum(mediana.valor)} {unidade}
          </text>
        )}
      </svg>
    </div>
  );
}
