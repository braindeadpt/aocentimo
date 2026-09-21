"use client";

/**
 * Euro — o storytelling «o teu euro» (C-03, geometria revista):
 *
 *  · cena pinned ≥768 + movimento (ScrollTrigger, pin, scrub 0.6,
 *    400 vh): coluna esquerda (40 %) lê o passo actual — kicker
 *    «PASSO n/5», rótulo grande, cêntimos em mono ~72 px, detalhe e
 *    fonte; coluna direita (60 %) tem a moeda-pie (o que RESTA é um
 *    sector desde as 12h, fill --panel / contorno --ink, que encolhe
 *    a cada corte) e a régua de cêntimos em baixo;
 *  · o wedge do passo fica em --accent na moeda (ângulo real ∝
 *    cêntimos, contorno tracejado — o tracejado marca só o wedge a
 *    cortar) com o valor junto ao arco exterior; ao avançar voa para
 *    a régua e ao aterrar desaparece (scale→0) enquanto acende um
 *    SEGMENTO rectangular --accent de largura ∝ cêntimos — os
 *    segmentos acumulam da esquerda e os rótulos vivem SÓ na régua;
 *  · «Chega à conta» não é corte: o resto pisca a --keep e a régua
 *    ganha um marcador vertical com o líquido; «Fica-te» deixa o
 *    resto em --keep com o valor no centro;
 *  · o índice do passo vem do progresso do scroll (onUpdate); a troca
 *    de texto é a keyframe `euro-passo` (y 8 px, opacidade 0.4→1);
 *  · a <ol> de passos fica sempre visível por baixo — é o equivalente;
 *    em <768 e reduced-motion é o conteúdo (a cena nem se monta);
 *  · a cena inteira é aria-hidden e não tem focáveis;
 *  · GSAP só desce por IntersectionObserver quando a secção se
 *    aproxima — nunca no bundle inicial nem acima da dobra.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Odometer } from "@/components/Odometer";
import { Source } from "@/components/Source";
import { m, t } from "@/lib/messages";
import { fmtNum } from "@/lib/format";
import { carregarGsap, motionActiva } from "@/lib/motion/gsap";

export interface PassoEuro {
  rotulo: string;
  /** rótulo curto para a régua (só nos passos de corte) */
  curto?: string;
  detalhe: string;
  /** cêntimos por cada euro bruto */
  centimos: number;
  fonteNome: string;
  fonteUrl?: string;
}

/* ———— geometria da cena (viewBox 460×560) ———— */

const W = 460;
const H = 560;
/** moeda-pie — diâmetro ≈ 45 vh no ecrã pinned */
const CX = 230;
const CY = 200;
const R = 150;
/** régua 0–100 cêntimos */
const Y_REGUA = 468;
const X0 = 30;
const X1 = 430;
const PX_C = (X1 - X0) / 100; // px por cêntimo
const SEG_H = 16;

/** sector que RESTA — das 12h no sentido horário até `ang` graus */
function restoPath(cx: number, cy: number, r: number, ang: number) {
  if (ang >= 359.9)
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  const a = (ang * Math.PI) / 180;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  const grande = ang > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${grande} 1 ${x} ${y} Z`;
}

/** wedge de corte — apex em (0,0), simétrico em torno de "up" (12h) */
function sector(r: number, meioAngulo: number) {
  const a = (meioAngulo * Math.PI) / 180;
  const x = r * Math.sin(a);
  const y = -r * Math.cos(a);
  const grande = meioAngulo * 2 > 180 ? 1 : 0;
  return `M 0 0 L ${-x} ${y} A ${r} ${r} 0 ${grande} 1 ${x} ${y} Z`;
}

/** ponto no arco exterior do wedge — para o rótulo de valor */
function arcoExt(ang: number, rr = R + 18) {
  const a = (ang * Math.PI) / 180;
  return { x: CX + rr * Math.sin(a), y: CY - rr * Math.cos(a) };
}

export function Euro({ passos }: { passos: PassoEuro[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cena = useRef<HTMLDivElement>(null);
  const [passo, setPasso] = useState(0);

  const n = passos.length;
  const p = passos[passo];

  const c = passos.map((pp) => pp.centimos);
  /* cortes reais: passos 0 (SS), 1 (IRS) e 3 (gasóleo). Passo 2 é o
     líquido que chega (flash + marcador); passo 4 é o resto (keep) */
  const cortes = [0, 1, 3];
  /** o que resta ANTES de cada corte — em cêntimos */
  const remAntes = [100, 100 - c[0], c[2]];
  const remDepois = [100 - c[0], c[2], c[2] - c[3]];
  /** meio angular do wedge — no fim do sector que resta */
  const meio = cortes.map((_, k) => (remAntes[k] - c[cortes[k]] / 2) * 3.6);
  /** posição acumulada dos segmentos na régua — da esquerda */
  const acc = [0, c[0], c[0] + c[1]];
  const segX = cortes.map((_, k) => X0 + acc[k] * PX_C);
  const segW = cortes.map((_, k) => c[cortes[k]] * PX_C);
  const segCx = cortes.map((_, k) => segX[k] + segW[k] / 2);
  const marcadorX = X0 + c[2] * PX_C;

  /** contador «restam» — o que fica depois da acção do passo */
  const restam = [remDepois[0], remDepois[1], c[2], remDepois[2], c[4]];

  useEffect(() => {
    const alvo = wrap.current;
    const palco = cena.current;
    if (!alvo || !palco) return;
    if (!motionActiva()) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    let morto = false;
    let ctx: { revert(): void } | null = null;
    /* GSAP só desce quando a secção se aproxima da dobra — nunca no
       bundle inicial nem à nascença da página */
    const arranca = () => {
      void carregarGsap().then(({ gsap }) => {
        if (morto) return;
        ctx = gsap.context(() => {
          /* estado inicial — moeda cheia, wedges no lugar mas
             invisíveis, régua limpa */
          cortes.forEach((i, k) => {
            gsap.set(`.euro-fatia-${i}`, {
              x: CX,
              y: CY,
              rotation: meio[k],
              opacity: 0,
              transformOrigin: "0px 0px",
            });
            gsap.set(`.euro-vlab-${i}`, { opacity: 0 });
            gsap.set(`.euro-seg-${i}`, {
              scaleX: 0,
              transformOrigin: "left center",
            });
            gsap.set(`.euro-leg-${i}`, { opacity: 0 });
          });
          gsap.set(".euro-marcador", { opacity: 0 });
          gsap.set(".euro-fim", { opacity: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: alvo,
              start: "top top",
              end: "bottom bottom",
              pin: palco,
              scrub: 0.6,
              onUpdate: (st) => {
                const i = Math.min(n - 1, Math.floor(st.progress * n));
                setPasso((a) => (a === i ? a : i));
              },
            },
          });

          /* cada passo tem exactamente SEG de timeline — o índice do
             texto (onUpdate, progress×5) bate certo com a cena */
          const SEG = 1.6;
          const padAte = (i: number) => {
            const falta = (i + 1) * SEG - tl.duration();
            if (falta > 0) tl.to({}, { duration: falta });
          };

          /* um corte: o wedge acende no lugar, voa para a régua,
             desaparece ao aterrar e o segmento acende com a largura
             real; a moeda encolhe no momento da aterragem */
          const cai = (k: number) => {
            const i = cortes[k];
            tl.to(`.euro-fatia-${i}`, { opacity: 1, duration: 0.15 });
            tl.to(`.euro-vlab-${i}`, { opacity: 1, duration: 0.15 }, "<");
            tl.to({}, { duration: 0.35 });
            tl.to(`.euro-vlab-${i}`, { opacity: 0, duration: 0.12 });
            tl.to(
              `.euro-fatia-${i}`,
              {
                x: segCx[k],
                y: Y_REGUA - SEG_H - 8,
                rotation: 360,
                duration: 0.6,
                ease: "power1.in",
              },
              "<"
            );
            tl.to(`.euro-fatia-${i}`, { scale: 0, duration: 0.18 });
            tl.set(".euro-resto", {
              attr: { d: restoPath(CX, CY, R, remDepois[k] * 3.6) },
            });
            tl.to(`.euro-seg-${i}`, {
              scaleX: 1,
              duration: 0.22,
              ease: "power1.out",
            });
            tl.to(`.euro-leg-${i}`, { opacity: 1, duration: 0.2 }, "<");
          };

          /* passo 0 — Segurança Social */
          cai(0);
          tl.set(".euro-umo", { opacity: 0 }); // já não é o euro inteiro
          padAte(0);
          /* passo 1 — retenção de IRS */
          cai(1);
          padAte(1);
          /* passo 2 — chega à conta: não corta, marca-se */
          tl.set(".euro-resto", { attr: { fill: "var(--keep)" } });
          tl.to({}, { duration: 0.5 }); // --dur-media de pausa
          tl.set(".euro-resto", { attr: { fill: "var(--panel)" } });
          tl.to(".euro-marcador", { opacity: 1, duration: 0.25 });
          padAte(2);
          /* passo 3 — impostos no gasóleo */
          cai(2);
          padAte(3);
          /* passo 4 — o resto fica-te, em keep definitivo */
          tl.set(".euro-resto", { attr: { fill: "var(--keep)" } });
          tl.fromTo(
            ".euro-fim",
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.4 },
            ">0.15"
          );
          padAte(4);
        }, alvo);
      });
    };
    if (typeof IntersectionObserver === "undefined") {
      arranca();
      return () => {
        morto = true;
        ctx?.revert();
      };
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        arranca();
      },
      { rootMargin: "100% 0px" }
    );
    obs.observe(alvo);
    return () => {
      morto = true;
      obs.disconnect();
      ctx?.revert();
    };
    // geometria derivada de props estáveis — a cena monta uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section aria-labelledby="euro-titulo" className="stack-sec">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
        <h2
          id="euro-titulo"
          className="font-display text-2xl tracking-wide md:text-3xl"
        >
          {m.home.euro.titulo}
        </h2>
        <p className="num text-xs text-muted">
          {m.home.euro.nota}{" "}
          <Link
            href="/salario"
            className="underline decoration-line2 underline-offset-2"
          >
            /salario
          </Link>
        </p>
      </div>

      {/* a cena pinned — ≥768 e sem reduced-motion; aria-hidden porque
          a lista em baixo é o equivalente (e nada aqui é focável) */}
      <div
        ref={wrap}
        aria-hidden="true"
        className="hidden md:motion-safe:block md:h-[400vh]"
      >
        <div ref={cena} className="flex h-screen items-center gap-8 py-4">
          {/* esquerda — o texto do passo, em leitura */}
          <div className="w-[40%] shrink-0">
            <p className="kicker-xs text-muted">
              {t(m.home.euro.passo, { n: passo + 1, total: n })}
            </p>
            <div key={passo} className="euro-passo">
              <h3 className="mt-2 font-display text-4xl leading-none tracking-wide">
                {p.rotulo}
              </h3>
            </div>
            <p className="num mt-3 text-7xl tabular-nums">
              <Odometer valor={p.centimos} casas={1} sufixo=" c" dur={600} />
            </p>
            <div key={`d${passo}`} className="euro-passo">
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink2">
                {p.detalhe}
              </p>
              {/* fonte em texto — sem link: a cena é aria-hidden, os
                  links vivem na lista equivalente */}
              <p className="footnote mt-2">{p.fonteNome}</p>
            </div>
          </div>

          {/* direita — a moeda-pie e a régua de cêntimos */}
          <div className="relative min-w-0 flex-1">
            <p className="num absolute right-0 top-0 text-sm tabular-nums text-muted">
              <Odometer
                valor={restam[passo]}
                casas={1}
                prefixo={`${m.home.euro.restam} `}
                sufixo=" c"
                dur={400}
              />
            </p>
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
              {/* a moeda — o que RESTA é o sector desde as 12h; sem
                  contorno fantasma: o tracejado é só do wedge a cortar */}
              <path
                className="euro-resto"
                d={restoPath(CX, CY, R, 360)}
                fill="var(--panel)"
                stroke="var(--ink)"
                strokeWidth={2}
              />
              <text
                className="euro-umo"
                x={CX}
                y={CY + 9}
                textAnchor="middle"
                fontSize={28}
                fill="var(--ink)"
                fontFamily="var(--font-mono)"
              >
                1 €
              </text>
              {/* «ficam-te» — o resto em keep com o valor ao centro */}
              <g className="euro-fim" opacity={0}>
                <text
                  x={CX}
                  y={CY - 2}
                  textAnchor="middle"
                  fontSize={24}
                  fill="var(--ink)"
                  fontFamily="var(--font-mono)"
                  className="tabular-nums"
                >
                  {fmtNum(c[4], 1)} c
                </text>
                <text
                  x={CX}
                  y={CY + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--muted)"
                  fontFamily="var(--font-mono)"
                >
                  {m.home.euro.escala}
                </text>
              </g>

              {/* wedges de corte — apex em (0,0) local; tracejado =
                  "a ser cortado"; o valor fica junto ao arco exterior */}
              {cortes.map((i, k) => {
                const lab = arcoExt(meio[k]);
                return (
                  <g key={i}>
                    <g className={`euro-fatia-${i}`} opacity={0}>
                      <path
                        d={sector(R, (c[i] * 3.6) / 2)}
                        fill="var(--accent)"
                        fillOpacity={0.9}
                        stroke="var(--ink)"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                      />
                    </g>
                    <text
                      className={`euro-vlab-${i} tabular-nums`}
                      x={lab.x}
                      y={lab.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={13}
                      fill="var(--ink)"
                      stroke="var(--paper)"
                      strokeWidth={4}
                      paintOrder="stroke"
                      fontFamily="var(--font-mono)"
                      opacity={0}
                    >
                      {fmtNum(c[i], 1)} c
                    </text>
                  </g>
                );
              })}

              {/* régua — ticks a cada 10 cêntimos, escala honesta */}
              <line
                x1={X0}
                x2={X1}
                y1={Y_REGUA}
                y2={Y_REGUA}
                stroke="var(--line2)"
                strokeWidth={1}
              />
              {Array.from({ length: 11 }, (_, i) => {
                const x = X0 + i * 10 * PX_C;
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      x2={x}
                      y1={Y_REGUA}
                      y2={Y_REGUA + (i % 5 === 0 ? 7 : 4)}
                      stroke="var(--muted)"
                      strokeWidth={1}
                    />
                    {i % 5 === 0 && (
                      <text
                        x={x}
                        y={Y_REGUA + 17}
                        textAnchor="middle"
                        fontSize={9}
                        fill="var(--muted)"
                        fontFamily="var(--font-mono)"
                      >
                        {i * 10}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* marcador «chega à conta» — linha vertical no líquido */}
              <g className="euro-marcador" opacity={0}>
                <line
                  x1={marcadorX}
                  x2={marcadorX}
                  y1={Y_REGUA - SEG_H - 22}
                  y2={Y_REGUA + 8}
                  stroke="var(--mark)"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                />
                <text
                  x={marcadorX}
                  y={Y_REGUA - SEG_H - 28}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--ink)"
                  fontFamily="var(--font-mono)"
                  className="tabular-nums"
                >
                  {fmtNum(c[2], 1)} c
                </text>
              </g>

              {/* segmentos cortados — rectângulos --accent de largura
                  real, acumulam da esquerda; rótulos SÓ aqui */}
              {cortes.map((i, k) => (
                <g key={i}>
                  <rect
                    className={`euro-seg-${i}`}
                    x={segX[k]}
                    y={Y_REGUA - SEG_H}
                    width={segW[k]}
                    height={SEG_H}
                    fill="var(--accent)"
                  />
                  <g className={`euro-leg-${i}`} opacity={0}>
                    <text
                      x={segCx[k]}
                      y={Y_REGUA + 34 + (k % 2) * 15}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--ink)"
                      fontFamily="var(--font-mono)"
                    >
                      {passos[i].curto}
                    </text>
                    <text
                      x={segCx[k]}
                      y={Y_REGUA + 34 + (k % 2) * 15 + 11}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--muted)"
                      fontFamily="var(--font-mono)"
                      className="tabular-nums"
                    >
                      {fmtNum(c[i], 1)} c
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* a lista de passos — o equivalente sempre visível; em <768 e
          reduced-motion é o conteúdo, não o fallback */}
      <ol
        data-euro-lista
        className="grid gap-px border border-line bg-line md:grid-cols-5"
      >
        {passos.map((pp, i) => (
          <li key={pp.rotulo} className="bg-panel px-4 py-3">
            <p className="kicker-xs flex items-baseline justify-between gap-2">
              <span>{pp.rotulo}</span>
              <span aria-hidden className="num text-muted">
                {i + 1}/{passos.length}
              </span>
            </p>
            <p className="num mt-1 text-2xl tabular-nums">
              <Odometer valor={pp.centimos} casas={1} sufixo=" c" dur={700} />
            </p>
            <p className="footnote mt-1">{pp.detalhe}</p>
            <Source nome={pp.fonteNome} url={pp.fonteUrl} />
          </li>
        ))}
      </ol>
    </section>
  );
}
