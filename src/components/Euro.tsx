"use client";

/**
 * Euro — o storytelling «o teu euro» (C-03): uma moeda de 1 € atravessa
 * o ecrã pinned (ScrollTrigger, scrub 0.6, 400 vh) e a cada passo uma
 * fatia cai para a linha de baixo com o rótulo e o valor.
 *
 *  · cena só existe a ≥768 px e com movimento — em <768 e em
 *    reduced-motion o que fica é a <ol> de passos (os mesmos números);
 *  · a <ol> está sempre no DOM e visível — é o equivalente textual;
 *    o SVG é aria-hidden;
 *  · cada valor é um Odometer (motor puro) — anima ao entrar;
 *  · nada disto corre acima da dobra: o ScrollTrigger só é criado no
 *    cliente, com motionActiva() e ecrã largo.
 */
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Odometer } from "@/components/Odometer";
import { Source } from "@/components/Source";
import { m } from "@/lib/messages";
import { carregarGsap, motionActiva } from "@/lib/motion/gsap";

export interface PassoEuro {
  rotulo: string;
  detalhe: string;
  /** cêntimos por cada euro bruto */
  centimos: number;
  fonteNome: string;
  fonteUrl?: string;
  /** o último passo é o resto — fatia realçada */
  final?: boolean;
}

/** fatia de pizza: sector entre a0 e a1 (graus, 0° = 12h) */
function fatia(cx: number, cy: number, r: number, a0: number, a1: number) {
  const r0 = (a0 * Math.PI) / 180;
  const r1 = (a1 * Math.PI) / 180;
  const x0 = cx + r * Math.sin(r0);
  const y0 = cy - r * Math.cos(r0);
  const x1 = cx + r * Math.sin(r1);
  const y1 = cy - r * Math.cos(r1);
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1} Z`;
}

const W = 1200;
const H = 640;
const CY_MOEDA = 190;
const R_MOEDA = 86;
const Y_BASE = 470;

export function Euro({ passos }: { passos: PassoEuro[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cena = useRef<HTMLDivElement>(null);

  const n = passos.length;
  /* estações ao longo do ecrã — a moeda pára em cada uma */
  const xs = passos.map((_, i) => 150 + (i * (W - 300)) / Math.max(1, n - 1));

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
      void carregarGsap().then(({ gsap, ScrollTrigger }) => {
        if (morto) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: alvo,
            start: "top top",
            end: "bottom bottom",
            pin: palco,
            scrub: 0.6,
          },
        });
        /* por passo: a moeda rola até à estação, a fatia destaca-se
           e cai para a linha de baixo, o rótulo imprime-se */
        for (let i = 0; i < n; i++) {
          tl.to(".euro-moeda", { x: xs[i] - xs[0], duration: 1 });
          tl.fromTo(
            `.euro-fatia-${i}`,
            { opacity: 0, y: 0 },
            { opacity: 1, duration: 0.25 },
            "<0.6"
          );
          tl.to(
            `.euro-fatia-${i}`,
            { y: Y_BASE - CY_MOEDA, duration: 0.8, ease: "power1.in" },
            ">"
          );
          tl.fromTo(
            `.euro-rotulo-${i}`,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 },
            "<0.5"
          );
        }
        /* a moeda sai de cena no fim */
        tl.to(".euro-moeda", { x: W - 80 - xs[0], duration: 1 });
      }, alvo);
        /* o pin mede mal se as fontes ainda não carregaram */
        ScrollTrigger.refresh();
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
    // xs/n são derivados de props estáveis — a cena monta uma vez
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

      {/* a cena — ≥768 e sem reduced-motion; a lista em baixo é sempre
          o equivalente, por isso o svg pode ser mudo */}
      <div
        ref={wrap}
        aria-hidden="true"
        className="hidden md:motion-safe:block md:h-[400vh]"
      >
        <div ref={cena} className="h-screen overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* linha de destino das fatias */}
            <line
              x1={60}
              x2={W - 60}
              y1={Y_BASE + 46}
              y2={Y_BASE + 46}
              stroke="var(--line2)"
              strokeWidth={1}
            />
            {/* moeda — círculo com «1 €» em mono; rola pelas estações */}
            <g className="euro-moeda">
              <circle
                cx={xs[0]}
                cy={CY_MOEDA}
                r={R_MOEDA}
                fill="var(--panel)"
                stroke="var(--ink)"
                strokeWidth={2}
              />
              <circle
                cx={xs[0]}
                cy={CY_MOEDA}
                r={R_MOEDA - 10}
                fill="none"
                stroke="var(--line2)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <text
                x={xs[0]}
                y={CY_MOEDA + 8}
                textAnchor="middle"
                fontSize={30}
                fill="var(--ink)"
                fontFamily="var(--font-mono)"
              >
                1 €
              </text>
            </g>
            {/* fatias — nascem na moeda, caem para a linha */}
            {passos.map((p, i) => {
              const arco = Math.max(14, Math.min(120, p.centimos * 3.6));
              return (
                <g key={p.rotulo} className={`euro-fatia-${i}`} opacity={0}>
                  <path
                    d={fatia(xs[i], CY_MOEDA, R_MOEDA * 0.72, -arco / 2, arco / 2)}
                    fill={p.final ? "var(--keep)" : "var(--accent)"}
                    fillOpacity={0.9}
                    stroke="var(--ink)"
                    strokeWidth={1}
                  />
                  <g className={`euro-rotulo-${i}`} opacity={0}>
                    <text
                      x={xs[i]}
                      y={Y_BASE + 66}
                      textAnchor="middle"
                      fontSize={15}
                      fill="var(--ink)"
                      fontFamily="var(--font-mono)"
                      className="tabular-nums"
                    >
                      {p.centimos.toFixed(1).replace(".", ",")} c
                    </text>
                    <text
                      x={xs[i]}
                      y={Y_BASE + 84}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--muted)"
                      fontFamily="var(--font-mono)"
                    >
                      {p.rotulo}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* a lista de passos — o equivalente sempre visível; em <768 e
          reduced-motion é o conteúdo, não o fallback */}
      <ol
        data-euro-lista
        className="grid gap-px border border-line bg-line md:grid-cols-5"
      >
        {passos.map((p, i) => (
          <li key={p.rotulo} className="bg-panel px-4 py-3">
            <p className="kicker-xs flex items-baseline justify-between gap-2">
              <span>{p.rotulo}</span>
              <span aria-hidden className="num text-muted">
                {i + 1}/{passos.length}
              </span>
            </p>
            <p className="num mt-1 text-2xl tabular-nums">
              <Odometer valor={p.centimos} casas={1} sufixo=" c" dur={700} />
            </p>
            <p className="footnote mt-1">{p.detalhe}</p>
            <Source nome={p.fonteNome} url={p.fonteUrl} />
          </li>
        ))}
      </ol>
    </section>
  );
}
