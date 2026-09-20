/**
 * Motor de movimento — B-01 (revisão pós-B-2: GSAP fora do bundle inicial).
 *
 * Ninguém importa `gsap` estaticamente — a biblioteca e os plugins
 * chegam por `carregarGsap()`, um dynamic import memoizado que só é
 * pedido quando há movimento legítimo por fazer (abaixo da dobra ou
 * run nova, via useArmado) E `motionActiva()` — com
 * prefers-reduced-motion o chunk nunca é descarregado.
 *
 * Os helpers de tokens (--dur-*, --ease-*, --stagger) são puros: leem
 * o :root e não dependem do GSAP — podem ser importados sem custo.
 *
 * Contrato (M-02/M-09):
 *  - SSR/sem-JS nasce no estado final — nenhum tween corre no servidor;
 *  - prefers-reduced-motion: estado final já, sem tween nem download.
 */
const CLIENTE = typeof window !== "undefined";

export interface MotorGsap {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  Flip: typeof import("gsap/Flip").Flip;
  DrawSVGPlugin: typeof import("gsap/DrawSVGPlugin").DrawSVGPlugin;
  SplitText: typeof import("gsap/SplitText").SplitText;
}

let promessa: Promise<MotorGsap> | null = null;

/** Carrega o GSAP + plugins uma vez; devolve sempre a mesma promessa. */
export function carregarGsap(): Promise<MotorGsap> {
  if (!promessa) {
    promessa = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/Flip"),
      import("gsap/DrawSVGPlugin"),
      import("gsap/SplitText"),
    ]).then(([g, st, fl, dr, sp]) => {
      const gsap = g.gsap;
      gsap.registerPlugin(
        st.ScrollTrigger,
        fl.Flip,
        dr.DrawSVGPlugin,
        sp.SplitText
      );
      return {
        gsap,
        ScrollTrigger: st.ScrollTrigger,
        Flip: fl.Flip,
        DrawSVGPlugin: dr.DrawSVGPlugin,
        SplitText: sp.SplitText,
      };
    });
  }
  return promessa;
}

/** prefers-reduced-motion agora — com reduce nenhum tween arranca. */
export function reduzido(): boolean {
  return (
    CLIENTE && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** O movimento pode correr — o contrário de reduzido(), falso no SSR. */
export function motionActiva(): boolean {
  return CLIENTE && !reduzido();
}

export type DurToken = "micro" | "curta" | "media" | "longa";

/** Lê --dur-{token} do :root e devolve SEGUNDOS (a unidade do GSAP). */
export function dur(token: DurToken): number {
  if (!CLIENTE) return 0;
  const bruto = getComputedStyle(document.documentElement)
    .getPropertyValue(`--dur-${token}`)
    .trim();
  const n = parseFloat(bruto);
  if (!Number.isFinite(n)) return 0;
  return bruto.endsWith("ms") ? n / 1000 : n;
}

/** --stagger em segundos — o escalonamento entre irmãos. */
export function stagger(): number {
  if (!CLIENTE) return 0;
  const n = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--stagger")
      .trim()
  );
  return Number.isFinite(n) ? n / 1000 : 0;
}

/* ————— easings = os tokens CSS, resolvidos por cubic-bezier ————— */

export type EaseToken = "entra" | "sai" | "rasgo" | "lin";

/** Os mesmos pontos de controlo declarados em globals.css. */
const PONTOS: Record<EaseToken, [number, number, number, number]> = {
  entra: [0.22, 1, 0.36, 1],
  sai: [0.55, 0, 0.85, 0.36],
  rasgo: [0.34, 1.45, 0.64, 1],
  lin: [0, 0, 1, 1],
};

/** cubic-bezier(x1,y1,x2,y2) → função de easing idêntica à do CSS. */
function curvaCss(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (p: number) => number {
  if (x1 === y1 && x2 === y2) return (p) => p;
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const B = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const C = (a1: number) => 3 * a1;
  const calc = (t: number, a1: number, a2: number) =>
    ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const declive = (t: number, a1: number, a2: number) =>
    3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);

  const N = 11;
  const amostra = new Float32Array(N);
  for (let i = 0; i < N; i++) amostra[i] = calc(i / (N - 1), x1, x2);

  const tParaX = (x: number): number => {
    let i = 0;
    while (i < N - 1 && amostra[i + 1] <= x) i++;
    let lo = i / (N - 1);
    let hi = (i + 1) / (N - 1);
    let t = lo + ((x - amostra[i]) / (amostra[i + 1] - amostra[i] || 1)) / (N - 1);
    // Newton primeiro; se o declive é quase nulo, bissecção
    for (let k = 0; k < 4; k++) {
      const s = declive(t, x1, x2);
      if (Math.abs(s) < 1e-3) break;
      const erro = calc(t, x1, x2) - x;
      t -= erro / s;
      if (t < lo) t = lo;
      if (t > hi) t = hi;
    }
    for (let k = 0; k < 10 && Math.abs(calc(t, x1, x2) - x) > 1e-7; k++) {
      if (calc(t, x1, x2) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };

  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : calc(tParaX(p), y1, y2));
}

const cache = new Map<EaseToken, (p: number) => number>();

/** Easing nomeado — a curva exacta do token, como função para o GSAP. */
export function ease(token: EaseToken): (p: number) => number {
  let f = cache.get(token);
  if (!f) {
    f = curvaCss(...PONTOS[token]);
    cache.set(token, f);
  }
  return f;
}
