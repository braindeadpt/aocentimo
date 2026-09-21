"use client";

/**
 * Euro — o storytelling «o teu euro» (C-03, composição revista):
 *
 *  · cena pinned ≥768 + movimento (ScrollTrigger, pin, scrub 0.6,
 *    400 vh): coluna esquerda (40 %) lê o passo actual — kicker
 *    «PASSO n/5», rótulo grande, cêntimos em mono ~72 px, detalhe e
 *    fonte; coluna direita (60 %) tem a moeda grande, as fatias que se
 *    cortam e caem para a linha de base com o seu ângulo real, o
 *    contador «restam N c» no topo e uma régua de ticks a cada 10 c;
 *  · o índice do passo vem do progresso do scroll (onUpdate); a troca
 *    de texto é a keyframe `euro-passo` (y 8 px, opacidade 0.4→1) —
 *    o estado nunca parte de zero;
 *  · a <ol> de passos fica sempre visível por baixo — é o equivalente;
 *    em <768 e reduced-motion é o conteúdo (a cena nem se monta);
 *  · a cena inteira é aria-hidden e não tem focáveis — os links de
 *    fonte dentro dela são texto, os links a sério estão na lista;
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
  detalhe: string;
  /** cêntimos por cada euro bruto */
  centimos: number;
  fonteNome: string;
  fonteUrl?: string;
  /** o último passo é o resto — volta à moeda em --keep */
  final?: boolean;
}

/* ———— geometria da cena (viewBox 720×700) ———— */

const W = 720;
const H = 700;
/** moeda — diâmetro ≈ 46 vh no ecrã pinned */
const CX = 360;
const CY = 196;
const R = 158;
/** fatias caídas — apex em cima, sector abre para baixo */
const SY = 508;
const RS = 86;
/** régua de cêntimos por baixo */
const Y_REGUA = 652;
const X0_REGUA = 60;
const X1_REGUA = 660;

/** sector de pizza centrado no "up" (0° = 12h): apex em (0,0) */
function sector(r: number, meioAngulo: number) {
  const a = (meioAngulo * Math.PI) / 180;
  const x = r * Math.sin(a);
  const y = -r * Math.cos(a);
  const grande = meioAngulo * 2 > 180 ? 1 : 0;
  return `M 0 0 L ${-x} ${y} A ${r} ${r} 0 ${grande} 1 ${x} ${y} Z`;
}

/** arco do que resta na moeda — de `a0` a 360 graus (0 = 12h) */
function resto(cx: number, cy: number, r: number, a0: number) {
  const r0 = (a0 * Math.PI) / 180;
  const x0 = cx + r * Math.sin(r0);
  const y0 = cy - r * Math.cos(r0);
  const grande = 360 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${cx} ${cy - r} Z`;
}

export function Euro({ passos }: { passos: PassoEuro[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cena = useRef<HTMLDivElement>(null);
  const [passo, setPasso] = useState(0);

  const n = passos.length;
  const p = passos[passo];

  /* ângulos verdadeiros — cada fatia guarda o seu arco na moeda
     (0° = 12h, sentido do relógio). Os dois primeiros cortes saem do
     euro bruto; o 3.º é o líquido inteiro que "chega à conta"; o 4.º
     corta-se do líquido já na linha; o 5.º é o resto — volta à moeda */
  const a1 = passos[0].centimos * 3.6;
  const a2 = a1 + passos[1].centimos * 3.6;
  const a4 = passos[3].centimos * 3.6;
  const arcos = [
    { ini: 0, fim: a1 }, // SS
    { ini: a1, fim: a2 }, // IRS
    { ini: a2, fim: 360 }, // líquido
    { ini: a2, fim: a2 + a4 }, // gasóleo (dentro do líquido)
    { ini: a2 + a4, fim: 360 }, // resto
  ];
  const meio = arcos.map((a) => (a.ini + a.fim) / 2);
  const largura = arcos.map((a) => a.fim - a.ini);
  /** apex de cada fatia na linha de base — espalhadas */
  const slots = [104, 236, 370, 504, 616];
  /* o que ainda está na moeda ao mostrar o passo i: o arco a partir
     do que já caiu — passos 3 e 4 já têm a moeda vazia (o líquido
     caiu); no passo 5 o resto voltou (é o g5, não o sector) */
  const restoAngulo = [0, a1, a2, null, null] as const;
  const restam = [
    100 - passos[0].centimos,
    100 - passos[0].centimos - passos[1].centimos,
    passos[2].centimos,
    passos[4].centimos,
    passos[4].centimos,
  ];

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
          /* estado inicial: fatias na moeda (apex no centro, orientação
             verdadeira), invisíveis; rótulos da base escondidos; o
             texto dentro da fatia contra-roda sobre o próprio centro
             para ficar sempre direito */
          for (let i = 0; i < n; i++) {
            gsap.set(`.euro-fatia-${i}`, {
              x: CX,
              y: CY,
              rotation: meio[i],
              opacity: 0,
              transformOrigin: "0px 0px",
            });
            gsap.set(`.euro-ftxt-${i}`, {
              rotation: -meio[i],
              transformOrigin: `0px ${-R * (passos[i].centimos < 6 ? 0.82 : 0.6)}px`,
            });
          }
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

          const cai = (i: number, slot: number) => {
            /* aparece cortada na moeda, roda para "baixo" e cai; o
               texto dentro contra-roda/escala para ficar direito */
            tl.fromTo(
              `.euro-fatia-${i}`,
              { opacity: 0 },
              { opacity: 1, duration: 0.15 },
              ">"
            );
            tl.to(
              `.euro-fatia-${i}`,
              {
                x: slots[slot],
                y: SY,
                rotation: 180,
                scale: RS / R,
                duration: 0.85,
                ease: "power1.in",
              },
              "<0.15"
            );
            tl.to(
              `.euro-ftxt-${i}`,
              { rotation: -180, scale: R / RS, duration: 0.85 },
              "<"
            );
            tl.fromTo(
              `.euro-leg-${i}`,
              { opacity: 0 },
              { opacity: 1, duration: 0.25 },
              ">-0.2"
            );
          };

          /* passo 0 — Segurança Social */
          cai(0, 0);
          padAte(0);
          /* passo 1 — retenção de IRS */
          cai(1, 1);
          padAte(1);
          /* passo 2 — o líquido inteiro chega à conta */
          cai(2, 2);
          padAte(2);
          /* passo 3 — o gasóleo corta-se do líquido na linha: o bloco
             único troca pelas duas sub-fatias e a do gasóleo desliza */
          tl.to(`.euro-fatia-2`, { opacity: 0, duration: 0.15 });
          /* g4 e g5 nascem a cobrir exactamente o arco do líquido na
             orientação da linha (180 = a abrir para baixo) */
          const rot4 = 180 - largura[2] / 2 + largura[3] / 2;
          const rot5 = 180 + largura[2] / 2 - largura[4] / 2;
          tl.set(`.euro-fatia-3`, {
            x: slots[2],
            y: SY,
            rotation: rot4,
            scale: RS / R,
            opacity: 1,
          });
          tl.set(`.euro-ftxt-3`, {
            rotation: -rot4,
            scale: R / RS,
          });
          tl.set(`.euro-fatia-4`, {
            x: slots[2],
            y: SY,
            rotation: rot5,
            scale: RS / R,
            opacity: 1,
          });
          tl.set(`.euro-ftxt-4`, {
            rotation: -rot5,
            scale: R / RS,
          });
          tl.to(
            `.euro-fatia-3`,
            { x: slots[3], rotation: 180, duration: 0.85, ease: "power1.in" },
            ">0.1"
          );
          tl.to(`.euro-ftxt-3`, { rotation: -180, duration: 0.85 }, "<");
          tl.fromTo(
            `.euro-leg-3`,
            { opacity: 0 },
            { opacity: 1, duration: 0.25 },
            ">-0.2"
          );
          padAte(3);
          /* passo 4 — o resto volta à moeda em --keep */
          tl.to(
            `.euro-fatia-4`,
            {
              x: CX,
              y: CY,
              rotation: meio[4],
              scale: 1,
              duration: 0.9,
              ease: "power1.inOut",
            },
            ">0.1"
          );
          tl.to(`.euro-ftxt-4`, { opacity: 0, duration: 0.3 }, "<");
          tl.fromTo(
            ".euro-fim",
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.4 },
            ">-0.15"
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

          {/* direita — a moeda e a linha das fatias */}
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
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full"
            >
              {/* a moeda — círculo + «1 €» em mono; o que resta é o
                  sector ainda por cortar; fantasma tracejado fica */}
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke="var(--line2)"
                strokeWidth={1}
                strokeDasharray="3 5"
              />
              {restoAngulo[passo] !== null &&
                (restoAngulo[passo] === 0 ? (
                  <circle
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="var(--panel)"
                    stroke="var(--ink)"
                    strokeWidth={2}
                  />
                ) : (
                  <path
                    d={resto(CX, CY, R, restoAngulo[passo] as number)}
                    fill="var(--panel)"
                    stroke="var(--ink)"
                    strokeWidth={2}
                  />
                ))}
              {restoAngulo[passo] !== null && (
                <text
                  x={CX}
                  y={CY + 9}
                  textAnchor="middle"
                  fontSize={30}
                  fill="var(--ink)"
                  fontFamily="var(--font-mono)"
                >
                  1 €
                </text>
              )}
              {/* «ficam-te X c» no centro — aparece com o resto */}
              <g className="euro-fim" opacity={0}>
                <text
                  x={CX}
                  y={CY - 4}
                  textAnchor="middle"
                  fontSize={15}
                  fill="var(--ink)"
                  fontFamily="var(--font-mono)"
                >
                  {t(m.home.euro.ficamTe, {
                    n: fmtNum(passos[4].centimos, 1),
                  })}
                </text>
                <text
                  x={CX}
                  y={CY + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--muted)"
                  fontFamily="var(--font-mono)"
                >
                  {m.home.euro.escala}
                </text>
              </g>

              {/* régua — ticks a cada 10 cêntimos, escala honesta */}
              <line
                x1={X0_REGUA}
                x2={X1_REGUA}
                y1={Y_REGUA}
                y2={Y_REGUA}
                stroke="var(--line2)"
                strokeWidth={1}
              />
              {Array.from({ length: 11 }, (_, i) => {
                const x = X0_REGUA + (i * (X1_REGUA - X0_REGUA)) / 10;
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      x2={x}
                      y1={Y_REGUA}
                      y2={Y_REGUA - (i % 5 === 0 ? 8 : 4)}
                      stroke="var(--muted)"
                      strokeWidth={1}
                    />
                    {i % 5 === 0 && (
                      <text
                        x={x}
                        y={Y_REGUA + 14}
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

              {/* legendas de cada fatia caída */}
              {passos.map((pp, i) => (
                <g key={pp.rotulo} className={`euro-leg-${i}`} opacity={0}>
                  <text
                    x={slots[i]}
                    y={SY + 108}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--ink)"
                    fontFamily="var(--font-mono)"
                  >
                    {pp.rotulo}
                  </text>
                  <text
                    x={slots[i]}
                    y={SY + 124}
                    textAnchor="middle"
                    fontSize={13}
                    fill="var(--muted)"
                    fontFamily="var(--font-mono)"
                    className="tabular-nums"
                  >
                    {fmtNum(pp.centimos, 1)} c
                  </text>
                </g>
              ))}

              {/* as fatias — apex em (0,0) local, arco verdadeiro da
                  moeda; o valor viaja dentro (ou junto, se <6 c) */}
              {passos.map((pp, i) => {
                const a = largura[i];
                const fora = pp.centimos < 6;
                /* o valor dentro da fatia (ou junto à ponta, se <6 c) —
                   posição local do sector, que aponta para cima */
                const ty = -R * (fora ? 0.82 : 0.6);
                return (
                  <g key={pp.rotulo} className={`euro-fatia-${i}`} opacity={0}>
                    <path
                      d={sector(R, a / 2)}
                      fill={
                        pp.final
                          ? "var(--keep)"
                          : i === 2
                            ? "var(--ink2)"
                            : "var(--accent)"
                      }
                      fillOpacity={i === 2 ? 0.18 : 0.9}
                      stroke="var(--ink)"
                      strokeWidth={1}
                    />
                    <g className={`euro-ftxt-${i}`}>
                      <text
                        x={0}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={15}
                        fill="var(--ink)"
                        stroke="var(--paper)"
                        strokeWidth={4}
                        paintOrder="stroke"
                        fontFamily="var(--font-mono)"
                        className="tabular-nums"
                      >
                        {fmtNum(pp.centimos, 0)} c
                      </text>
                    </g>
                  </g>
                );
              })}
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
