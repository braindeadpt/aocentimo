"use client";

/**
 * EuroExplodido — «O TEU EURO» (R-02, Direcção V3 §6): o euro bruto
 * desmontado numa explosão isométrica — camadas wireframe afastadas
 * na vertical sobre um eixo tracejado, cada uma com a sua linha de
 * chamada até ao rótulo mono à direita. A metáfora é a da referência
 * (o vault em peças): «o euro desmontado», nunca a moeda a rolar.
 *
 * O cartão reusa a gramática .leitura: breadcrumb + corpo + rodapé,
 * inversão para papel em hover/focus-within via vars locais --l-*.
 *
 * SSR/a11y: toda a geometria nasce no HTML (viewBox fixa, sem
 * medição). O svg é decorativo (aria-hidden) — o equivalente sempre
 * visível é a <ol data-euro-lista> com os mesmos passos e valores.
 * Hover/focus num passo da lista realça a peça (fill --accent a 12 %
 * e chamada em --accent); hover na peça realça a linha da lista.
 *
 * Montagem (só com .eu-on, via useArmado abaixo da dobra): cada peça
 * nasce ~40 px acima e converge para o stack (stagger 80 ms,
 * --ease-entra), as chamadas revelam-se depois por clip-path (o dash
 * "2 3" é semântico, não serve de truque de desenho) e os rótulos
 * assentam por último; os valores da lista contam (Odometer).
 * Reduced-motion = stack montado e legendado — o estado base é o
 * final e a inversão é instantânea (bloco global).
 */
import Link from "next/link";
import { useState } from "react";
import { Odometer } from "@/components/Odometer";
import { fmtNum } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";

export interface PassoEuro {
  id: string;
  rotulo: string;
  detalhe: string;
  /** cêntimos por cada euro bruto */
  centimos: number;
  fonteNome: string;
  fonteUrl?: string;
}

export interface RotulosEuro {
  /** kicker da secção — «O TEU EURO» */
  titulo: string;
  /** nota à direita do kicker — o cenário simulado */
  nota: string;
  /** breadcrumb mono do cartão — «O TEU DINHEIRO / DECOMPOSIÇÃO · …» */
  breadcrumb: string;
  /** selo do lado direito do cabeçalho — «PMD gasóleo · {quando}» */
  meta: string;
  brutoRotulo: string;
  brutoDetalhe: string;
  /** kicker junto ao número grande — «ficam-te» */
  ficamTe: string;
  fontes: string;
  simulador: string;
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

const r1 = (n: number) => Math.round(n * 10) / 10;

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

type Peca = {
  id: string;
  kind: "moeda" | "disco" | "placa" | "base";
  cy: number;
  rotulo: string;
  valor: string;
  keep: boolean;
  detalhe: string;
};

export function EuroExplodido({
  passos,
  rotulos,
}: {
  passos: PassoEuro[];
  rotulos: RotulosEuro;
}) {
  const { ref, arm } = useArmado<HTMLElement>("euro:explodido");
  const [activo, setActivo] = useState<string | null>(null);

  const fica = passos.find((p) => p.id === "fica") ?? passos[passos.length - 1];

  // o stack: a moeda-mãe no topo, os passos por ordem, a base no fundo
  const pecas: Peca[] = [
    {
      id: "bruto",
      kind: "moeda",
      cy: 0,
      rotulo: rotulos.brutoRotulo,
      valor: "100 c",
      keep: false,
      detalhe: rotulos.brutoDetalhe,
    },
    ...passos.map<Peca>((p) => ({
      id: p.id,
      kind: p.id === "fica" ? "base" : p.id === "liquido" ? "disco" : "placa",
      cy: 0,
      rotulo: p.rotulo,
      valor: `${fmtNum(p.centimos, 1)} c`,
      keep: p.id === "fica",
      detalhe: p.detalhe,
    })),
  ];
  const gap = (BOT - TOP) / Math.max(1, pecas.length - 1);
  pecas.forEach((p, i) => {
    p.cy = r1(TOP + i * gap);
  });

  // as fontes dos passos, sem repetições, para o rodapé do cartão
  const fontes = passos.reduce<{ nome: string; url?: string }[]>((acc, p) => {
    if (!acc.some((f) => f.nome === p.fonteNome))
      acc.push({ nome: p.fonteNome, url: p.fonteUrl });
    return acc;
  }, []);

  return (
    <section aria-labelledby="euro-titulo" className="stack-sec">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
        <h2 id="euro-titulo" className="kicker">
          {rotulos.titulo}
        </h2>
        <p className="num text-right text-xs text-muted">{rotulos.nota}</p>
      </div>

      <article
        ref={ref}
        className={`leitura leitura-amplo eu-card mt-5 ${arm("eu-on")}`}
      >
        <header className="leitura-head">
          <p className="leitura-breadcrumb">{rotulos.breadcrumb}</p>
          {rotulos.meta && (
            <p className="leitura-meta num">
              <span>{rotulos.meta}</span>
            </p>
          )}
        </header>

        <div className="leitura-corpo">
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
                {pecas.map((p, i) => {
                  const on = activo === p.id ? " eu-peca-on" : "";
                  const pd = { "--pd": `${i * 80}ms` } as React.CSSProperties;
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
                          fill="var(--l-keep)"
                          fillOpacity={0.14}
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
                {pecas.map((p, i) => {
                  const on = activo === p.id ? " eu-peca-on" : "";
                  const edgeX =
                    p.kind === "base"
                      ? CX + BW
                      : p.kind === "placa"
                        ? CX + RXC
                        : CX + RX;
                  return (
                    <g key={`rot-${p.id}`} className={`eu-rotg${on}`}>
                      <line
                        className="eu-chamada"
                        style={
                          {
                            "--ld": `${380 + i * 55}ms`,
                          } as React.CSSProperties
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
                          } as React.CSSProperties
                        }
                      >
                        <text
                          className="eu-txt eu-rot-r"
                          x={LX}
                          y={p.cy - 13}
                        >
                          {p.rotulo}
                        </text>
                        <text
                          className={`eu-txt eu-rot-v${p.keep ? " eu-keep" : ""}`}
                          x={LX}
                          y={p.cy + 2}
                        >
                          {p.valor}
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
                    {rotulos.ficamTe}
                  </text>
                  <text className="eu-txt eu-num" x={NUM_X} y={BOT + 12}>
                    {fica ? `${fmtNum(fica.centimos, 1)} c` : ""}
                  </text>
                </g>
              </svg>
            </div>

            {/* o equivalente sempre visível — os mesmos passos e valores */}
            <ol data-euro-lista className="eu-lista">
              {passos.map((p) => (
                <li
                  key={p.id}
                  tabIndex={0}
                  className={`eu-li${activo === p.id ? " eu-li-on" : ""}`}
                  onMouseEnter={() => setActivo(p.id)}
                  onMouseLeave={() => setActivo(null)}
                  onFocus={() => setActivo(p.id)}
                  onBlur={() => setActivo(null)}
                >
                  <div className="eu-li-top">
                    <span className="eu-li-rot">{p.rotulo}</span>
                    <span
                      className={`eu-li-val${p.id === "fica" ? " eu-keep" : ""}`}
                    >
                      <Odometer
                        valor={p.centimos}
                        casas={1}
                        sufixo=" c"
                        dur={700}
                      />
                    </span>
                  </div>
                  <p className="eu-li-det">{p.detalhe}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <footer className="leitura-foot">
          <p className="leitura-fonte">
            {rotulos.fontes}:{" "}
            {fontes.map((f, i) => (
              <span key={f.nome}>
                {i > 0 && " · "}
                {f.url ? (
                  f.url.startsWith("/") ? (
                    <Link href={f.url} className="lq-link">
                      {f.nome}
                    </Link>
                  ) : (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lq-link"
                    >
                      {f.nome}
                    </a>
                  )
                ) : (
                  f.nome
                )}
              </span>
            ))}
          </p>
          <p className="leitura-acoes">
            <Link href="/salario" className="lq-link">
              {rotulos.simulador} →
            </Link>
          </p>
        </footer>
      </article>
    </section>
  );
}
