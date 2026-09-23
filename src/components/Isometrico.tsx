"use client";

/**
 * Isometrico — a estrutura explodida de traço fino do catálogo V4
 * (§5 «isométrico de traço»): camadas wireframe (moeda/disco/placa/
 * base) afastadas na vertical sobre um eixo tracejado, cada uma com a
 * sua linha de chamada tracejada até ao rótulo mono à direita; à
 * esquerda da base, o número grande opcional. A <ol> é o equivalente
 * sempre visível — faz parte do desenho — e interroga as camadas por
 * hover/focus (iso-camada-on acende a face no tom da camada e a
 * chamada).
 *
 * REGRA DE OURO V4: isométrico = ESTRUTURA (o que é), nunca
 * quantidade. Nenhuma prop dimensiona camadas por valor — a API nem
 * aceita números: `texto`/`textoLista` são nós de rótulo (podem ser
 * um valor já formatado, mas é texto — a geometria é fixa). Quanto é
 * uma coisa codifica-se em pontos (CampoCentimos) ou traços
 * (BarraTracos), nunca aqui.
 *
 * Geometria toda no HTML (viewBox fixa 520×440, sem medição); o svg é
 * decorativo (aria-hidden). A montagem — camadas a convergir de cima,
 * chamadas a desenharem-se por clip-path, rótulos a assentar — só
 * existe quando o cartão pai ganha .iso-on (useArmado); sem ela, ou
 * em reduced-motion, o estado base é já o final.
 *
 * (Núcleo extraído do EuroExplodido em R-05; renomeado de «Explodido»
 * para «Isometrico» em S1-05 — é a codificação «isométrico de traço»
 * do catálogo.)
 */
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { r1 } from "@/lib/materia";

export type FormaCamada = "moeda" | "disco" | "placa" | "base";

/** cor semântica da camada (S1-02): «corte» = dinheiro que sai do
    bolso (SS, IRS, impostos) → --accent; «fica» = dinheiro que fica
    contigo (líquido, «fica», «chega à conta») → --keep; «neutro» =
    estrutura/totais que não são nem saída nem sobra → tinta. */
export type TomCamada = "neutro" | "corte" | "fica";

/** var de cor por tom — também alimenta o realce de foco (--iso-tom) */
export const TOM_CAMADA: Record<TomCamada, string> = {
  neutro: "var(--l-ink)",
  corte: "var(--l-accent)",
  fica: "var(--l-keep)",
};

export interface CamadaIsometrica {
  id: string;
  /** a forma é ESTRUTURAL — posição na explosão, nunca medida por
      valor: «moeda» = a peça-mãe/o todo, «placa» = uma fatia da
      estrutura, «disco» = um patamar, «base» = onde se chega */
  forma: FormaCamada;
  rotulo: string;
  detalhe: string;
  /** tom semântico — decide cor do texto, da face em foco e do
      realce na lista */
  tom: TomCamada;
  /** texto junto à chamada — nó dentro do <text> (string, ou <tspan>
      animado quando a camada responde a um input). Pode ser um valor
      formatado, mas é só legenda: nunca dimensiona a camada. */
  texto?: ReactNode;
  /** texto na lista-equivalente — nó resolvido (Odometer/TweenNum).
      Ausente → a camada não entra na lista (a peça-mãe é o todo, não
      um passo) */
  textoLista?: ReactNode;
}

export interface NumeroIsometrico {
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
const RXC = 74; // fatias — mais pequenas e finas
const RYC = 20;
const BW = 104; // placa base — losango arredondado
const BH = 30;
const BTH = 12; // extrusão da base
const BR = 11; // raio dos vértices do losango
const LX = 392; // coluna de rótulos (mono 11 px ≈ 19 car. por linha)
const LEAD = LX - 8;
const TOP = 54; // cy da camada do topo
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

type CamadaGeo = CamadaIsometrica & { cy: number };

export function Isometrico({
  camadas,
  numero,
  nome,
}: {
  camadas: CamadaIsometrica[];
  /** o número grande à esquerda da base — opcional: numa estrutura
      pura (sem leitura de valor) o bloco simplesmente não se desenha */
  numero?: NumeroIsometrico;
  /** nome do equivalente — vira data-{nome}-lista na <ol> */
  nome: string;
}) {
  const [activa, setActiva] = useState<string | null>(null);

  // o stack: a peça-mãe no topo, os passos por ordem, a base no fundo
  const gap = (BOT - TOP) / Math.max(1, camadas.length - 1);
  const geo: CamadaGeo[] = camadas.map((p, i) => ({
    ...p,
    cy: r1(TOP + i * gap),
  }));
  const itens = geo.filter((p) => p.textoLista !== undefined);

  return (
    <div className="iso-grid">
      <div className="iso-stage">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          aria-hidden="true"
          className="block h-auto w-full"
        >
          {/* o eixo da explosão — a haste por onde as camadas descem */}
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

          {/* as camadas — wireframe; cada uma desce do céu ao armar */}
          {geo.map((p, i) => {
            const on = activa === p.id ? " iso-camada-on" : "";
            const pd = {
              "--iso-pd": `${i * 80}ms`,
              "--iso-tom": TOM_CAMADA[p.tom],
            } as CSSProperties;
            const entra = () => setActiva(p.id);
            const sai = () => setActiva(null);

            if (p.forma === "base") {
              const face = losango(CX, p.cy, BW, BH, BR);
              return (
                <g
                  key={p.id}
                  className={`iso-camada${on}`}
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
                    className="iso-face"
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

            const rx = p.forma === "placa" ? RXC : RX;
            const ry = p.forma === "placa" ? RYC : RY;
            const th = p.forma === "moeda" ? 9 : p.forma === "disco" ? 8 : 5;
            return (
              <g
                key={p.id}
                className={`iso-camada${on}`}
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
                  className="iso-face"
                  cx={CX}
                  cy={p.cy}
                  rx={rx}
                  ry={ry}
                  fill={p.forma === "moeda" ? "var(--l-ink)" : "none"}
                  fillOpacity={p.forma === "moeda" ? 0.08 : undefined}
                  stroke="var(--l-ink)"
                  strokeWidth={1.2}
                />
                {p.forma === "moeda" && (
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
              das camadas aterrarem */}
          {geo.map((p, i) => {
            const on = activa === p.id ? " iso-camada-on" : "";
            const estilo = { "--iso-tom": TOM_CAMADA[p.tom] } as CSSProperties;
            const edgeX =
              p.forma === "base"
                ? CX + BW
                : p.forma === "placa"
                  ? CX + RXC
                  : CX + RX;
            return (
              <g key={`rot-${p.id}`} className={`iso-rotg${on}`} style={estilo}>
                <line
                  className="iso-chamada"
                  style={
                    {
                      "--iso-ld": `${380 + i * 55}ms`,
                    } as CSSProperties
                  }
                  x1={edgeX + 6}
                  y1={p.cy}
                  x2={LEAD}
                  y2={p.cy}
                />
                <g
                  className="iso-rot"
                  style={
                    {
                      "--iso-rd": `${440 + i * 55}ms`,
                    } as CSSProperties
                  }
                >
                  <text className="iso-txt iso-rot-r" x={LX} y={p.cy - 13}>
                    {p.rotulo}
                  </text>
                  {p.texto !== undefined && (
                    <text
                      className={`iso-txt iso-rot-v iso-tom-${p.tom}`}
                      x={LX}
                      y={p.cy + 2}
                    >
                      {p.texto}
                    </text>
                  )}
                  {embrulha(p.detalhe).map((l, li) => (
                    <text
                      key={li}
                      className="iso-txt iso-rot-d"
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
          {numero && (
            <g className="iso-num-grupo">
              <text className="iso-txt iso-kicker" x={NUM_X} y={BOT - 34}>
                {numero.kicker}
              </text>
              <text
                className={`iso-txt iso-num${numero.compacto ? " iso-num-m" : ""}`}
                x={NUM_X}
                y={BOT + 12}
              >
                {numero.valor}
              </text>
              {numero.pequeno && (
                <text className="iso-txt iso-kicker" x={NUM_X} y={BOT + 34}>
                  {numero.pequeno}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* o equivalente sempre visível — os mesmos passos e valores */}
      <ol {...{ [`data-${nome}-lista`]: true }} className="iso-lista">
        {itens.map((p) => (
          <li
            key={p.id}
            tabIndex={0}
            className={`iso-li${activa === p.id ? " iso-li-on" : ""}`}
            style={{ "--iso-tom": TOM_CAMADA[p.tom] } as CSSProperties}
            onMouseEnter={() => setActiva(p.id)}
            onMouseLeave={() => setActiva(null)}
            onFocus={() => setActiva(p.id)}
            onBlur={() => setActiva(null)}
          >
            <div className="iso-li-top">
              <span className="iso-li-rot">{p.rotulo}</span>
              <span className={`iso-li-val iso-tom-${p.tom}`}>
                {p.textoLista}
              </span>
            </div>
            <p className="iso-li-det">{p.detalhe}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
