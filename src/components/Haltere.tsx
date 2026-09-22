"use client";

/**
 * Haltere — «antes ● — ○ agora» por categoria (catálogo V4 §5): cada
 * linha compara DOIS momentos do mesmo indicador — ponto cheio para
 * «antes», ponto oco para «agora», ligados por um traço na cor da
 * direcção. A variação nunca é só cor: fica escrita com ▲/▼ na
 * coluna da categoria, e a grelha é pontilhada — zona de medição,
 * família .blueprint.
 *
 * Quando NÃO se usa: mais de dois pontos no tempo (é a linha
 * anotada); parte-todo (são pontos do CampoCentimos); estrutura
 * (isométrico). A escala é partilhada por todas as categorias — é
 * isso que torna os halteres comparáveis.
 *
 * Geometria em px medida por ResizeObserver (o padrão da Leitura): o
 * SSR calcula com a largura por omissão e o markup completo está no
 * HTML — ao hidratar só mudam as posições, nunca a altura. O svg é
 * decorativo (aria-hidden); o equivalente é uma <ul> sr-only com um
 * item por categoria. A entrada (traço a desenhar-se de «antes» para
 * «agora», pontos a assentar) só existe com .hal-on (useArmado
 * abaixo da dobra); reduced-motion = estado final.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { r1 } from "@/lib/materia";
import { fmtNum } from "@/lib/format";
import { escalaValor } from "@/lib/viz/escalas";
import {
  casasViz,
  fmtViz,
  unidadeDeltaViz,
  type FormatoViz,
} from "@/lib/viz/formatos";
import { useArmado } from "@/lib/useArmado";

export interface CategoriaHaltere {
  id: string;
  rotulo: string;
  /** forma curta para cartão estreito (container query < 460 px) */
  rotuloCurto?: string;
  /** os dois momentos — na mesma unidade, na escala partilhada */
  antes: number;
  agora: number;
}

export interface HaltereProps {
  categorias: CategoriaHaltere[];
  /** chave do formato partilhado (props de cliente não serializam
      funções) — «pct1» → «3,6 %» */
  formato?: FormatoViz;
  /** unidade da variação — «p.p.» por omissão em formatos de %;
      passar explicitamente quando a diferença não é em p.p. */
  unidadeDelta?: string;
  /** rótulo dos dois momentos — «ago 2025» / «ago 2026» — na legenda */
  rotuloAntes: string;
  rotuloAgora: string;
  /** subir é bom? (poupança sim, preços não) — decide a cor de
      direcção, como no Delta */
  bomSubir?: boolean;
  /** equivalente textual — gerado das categorias se omitido */
  equivalente?: string;
  className?: string;
}

const MONO_CH = 6.9; // mono 11 px ≈ 6,9 px por carácter (o modelo da Leitura)
const TOP = 34; // legenda
const ROW = 50;
const BOT = 26; // rótulos da grelha

export function Haltere({
  categorias,
  formato = "num1",
  unidadeDelta,
  rotuloAntes,
  rotuloAgora,
  bomSubir = false,
  equivalente,
  className,
}: HaltereProps) {
  const F = (v: number) => fmtViz(formato, v);
  const casas = casasViz(formato);
  const unD = unidadeDelta ?? unidadeDeltaViz(formato);
  const eps = 0.5 * Math.pow(10, -casas);
  const { ref, arm } = useArmado<HTMLDivElement>(
    `haltere:${categorias.map((c) => c.id).join("+")}`
  );

  // a geometria é em px reais — medida como na Leitura; o SSR usa o
  // default e o markup final está sempre no HTML
  const caixaRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = caixaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setW(Math.max(240, Math.round(e.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = categorias.length;
  const H = TOP + n * ROW + BOT;

  // coluna da categoria: mais estreita em cartão pequeno (a query de
  // container troca rotulo↔rotuloCurto)
  const LC = W < 480 ? 116 : 168;
  const X0 = LC + 12;
  const X1 = W - 14;

  const escala = useMemo(() => {
    const vals = categorias.flatMap((c) => [c.antes, c.agora]);
    return escalaValor(vals, [X0, X1], { nice: true });
  }, [categorias, X0, X1]);

  // grelha pontilhada — ~4 colunas de pontos, rótulos em baixo
  const grelha = escala.ticks(4).filter((v) => {
    const x = escala(v);
    return x > X0 + 2 && x < X1 - 2;
  });

  const linhas = categorias.map((c, i) => {
    const cy = TOP + i * ROW + ROW / 2;
    const xa = r1(escala(c.antes));
    const xb = r1(escala(c.agora));
    const d = c.agora - c.antes;
    // direcção do desenho (seta) e leitura boa/má (cor) — a semântica
    // do Delta: sobe→up, desce→down; up é «mau» salvo bomSubir
    const sentido = Math.abs(d) < eps ? "igual" : d > 0 ? "sobe" : "desce";
    const dir =
      sentido === "igual" ? "igual" : d > 0 === bomSubir ? "bom" : "mau";
    const txtA = F(c.antes);
    const txtB = F(c.agora);
    const wA = txtA.length * MONO_CH;
    const wB = txtB.length * MONO_CH;

    // rótulos dos valores: sempre para FORA do par — nunca colidem
    // entre si; se o exterior não couber na pista, o rótulo sobe para
    // cima do seu ponto (antes desce quando os pontos estão colados)
    const colados = Math.abs(xb - xa) < (wA + wB) / 2 + 18;
    let rotA: { x: number; y: number; a: "start" | "middle" | "end" };
    let rotB: { x: number; y: number; a: "start" | "middle" | "end" };
    if (colados) {
      rotA = { x: xa, y: cy + 20, a: "middle" };
      rotB = { x: xb, y: cy - 13, a: "middle" };
    } else if (xb >= xa) {
      rotA =
        xa - 9 - wA < X0 - 4
          ? { x: xa, y: cy - 13, a: "middle" }
          : { x: xa - 9, y: cy + 4, a: "end" };
      rotB =
        xb + 9 + wB > X1 + 4
          ? { x: xb, y: cy - 13, a: "middle" }
          : { x: xb + 9, y: cy + 4, a: "start" };
    } else {
      rotA =
        xa + 9 + wA > X1 + 4
          ? { x: xa, y: cy - 13, a: "middle" }
          : { x: xa + 9, y: cy + 4, a: "start" };
      rotB =
        xb - 9 - wB < X0 - 4
          ? { x: xb, y: cy - 13, a: "middle" }
          : { x: xb - 9, y: cy + 4, a: "end" };
    }

    const seta = sentido === "sobe" ? "▲" : sentido === "desce" ? "▼" : "=";
    const delta = `${seta} ${fmtNum(Math.abs(d), casas)}${unD}`;

    return { c, cy, xa, xb, dir, sentido, txtA, txtB, rotA, rotB, delta };
  });

  const eq =
    equivalente ?? null; // null → usa a <ul> gerada das categorias

  return (
    <div
      ref={ref}
      className={`hal ${arm("hal-on")}${className ? ` ${className}` : ""}`}
    >
      <div ref={caixaRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          className="block h-auto w-full"
        >
          {/* legenda — ● antes / ○ agora, ancorada à pista */}
          <g>
            <circle cx={X0 + 4} cy={16} r={4.2} className="hal-antes-dot" />
            <text className="hal-txt hal-leg" x={X0 + 14} y={20}>
              {rotuloAntes}
            </text>
            <circle
              cx={X0 + 26 + rotuloAntes.length * MONO_CH}
              cy={16}
              r={5}
              className="hal-agora-dot"
            />
            <text
              className="hal-txt hal-leg"
              x={X0 + 36 + rotuloAntes.length * MONO_CH}
              y={20}
            >
              {rotuloAgora}
            </text>
          </g>

          {/* a grelha pontilhada — colunas de pontos, família blueprint */}
          {grelha.map((v, i) => (
            <g key={i}>
              <line
                x1={r1(escala(v))}
                x2={r1(escala(v))}
                y1={TOP - 6}
                y2={H - BOT + 4}
                className="hal-grid"
              />
              <text
                className={`hal-txt hal-grid-rot${
                  i === 0 || i === grelha.length - 1 ? " hal-ext" : ""
                }`}
                x={r1(escala(v))}
                y={H - 8}
                textAnchor="middle"
              >
                {F(v)}
              </text>
            </g>
          ))}

          {linhas.map((l, i) => (
            <g
              key={l.c.id}
              className="hal-linha"
              style={{ "--hd": `${i * 70}ms` } as CSSProperties}
            >
              {/* categoria + variação escrita — a coluna da esquerda */}
              <text className="hal-txt hal-rot hal-rot-l" x={2} y={l.cy - 7}>
                {l.c.rotulo}
              </text>
              {l.c.rotuloCurto && (
                <text className="hal-txt hal-rot hal-rot-c" x={2} y={l.cy - 7}>
                  {l.c.rotuloCurto}
                </text>
              )}
              <text
                className={`hal-txt hal-delta hal-${l.dir}`}
                x={2}
                y={l.cy + 11}
              >
                {l.delta}
              </text>

              {/* o haltere — traço de «antes» para «agora» */}
              <line
                className={`hal-link hal-${l.dir}`}
                x1={l.xa}
                y1={l.cy}
                x2={l.xb}
                y2={l.cy}
                pathLength={1}
              />
              <circle
                className="hal-dot hal-antes-dot"
                cx={l.xa}
                cy={l.cy}
                r={4.2}
              />
              <circle
                className={`hal-dot hal-agora-dot hal-${l.dir}`}
                cx={l.xb}
                cy={l.cy}
                r={5.5}
              />
              <text
                className="hal-txt hal-v hal-v-antes"
                x={l.rotA.x}
                y={l.rotA.y}
                textAnchor={l.rotA.a}
              >
                {l.txtA}
              </text>
              <text
                className="hal-txt hal-v"
                x={l.rotB.x}
                y={l.rotB.y}
                textAnchor={l.rotB.a}
              >
                {l.txtB}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* equivalente textual — UM por figura */}
      {eq !== null ? (
        <p className="sr-only" data-hal-equivalente>
          {eq}
        </p>
      ) : (
        <ul className="sr-only" data-hal-equivalente>
          {linhas.map((l) => (
            <li key={l.c.id}>
              {`${l.c.rotulo}: ${l.txtA} (${rotuloAntes}) → ${l.txtB} (${rotuloAgora}) — ${l.delta}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
