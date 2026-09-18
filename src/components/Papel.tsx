import { prng, r1 } from "@/lib/materia";

/**
 * Matéria de papel — primitivos SVG partilhados.
 *
 * Técnica escolhida: <pattern> + gradientes, NUNCA feTurbulence nem
 * feGaussianBlur na superfície — esses filtros re-pintam a cada frame e
 * não se cacheiam entre peças; pattern e gradiente rasterizam uma vez.
 * (O orçamento do M-01 reserva filtros a elementos estáticos; aqui até os
 * estáticos ficam baratos.)
 *
 * Camadas da superfície, por esta ordem sobre a mesma forma:
 *   1. base — a cor do papel (token fixo nos dois temas)
 *   2. url(#papel-tom-*) — variação de tom mínima ao longo do comprimento
 *   3. url(#papel-fibra) — pontos finos irregulares
 *   4. url(#papel-espessura-*) — escurecimento de 1px nas arestas longas
 */

/** Pontos de fibra — deterministas: a mesma página tem a mesma fibra. */
const FIBRA = (() => {
  const rand = prng(20260918);
  const pontos = Array.from({ length: 34 }, () => ({
    cx: r1(rand() * 26),
    cy: r1(rand() * 26),
    r: r1(0.25 + rand() * 0.5),
    o: r1(0.03 + rand() * 0.05),
  }));
  // fibras longas — riscos finos, são elas que se leem como papel à lupa
  const longas = Array.from({ length: 4 }, () => ({
    x1: r1(rand() * 20),
    y1: r1(rand() * 26),
    x2: r1(rand() * 20 + 3),
    y2: r1(rand() * 26),
  }));
  return { pontos, longas };
})();

export function PapelDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        {/* fibra — tile 26×26 com pontos e riscos finos irregulares */}
        <pattern
          id="papel-fibra"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          {FIBRA.pontos.map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill="var(--talao-ink)"
              opacity={p.o}
            />
          ))}
          {FIBRA.longas.map((l, i) => (
            <line
              key={`l${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="var(--talao-ink)"
              strokeWidth={0.4}
              opacity={0.05}
            />
          ))}
        </pattern>
        {/* variação de tom ao longo do comprimento — amplitude mínima,
            o papel não é uniforme mas não é um gradiente decorativo */}
        <linearGradient id="papel-tom-x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c2413" stopOpacity="0.03" />
          <stop offset="0.5" stopColor="#fffbe9" stopOpacity="0.025" />
          <stop offset="1" stopColor="#2c2413" stopOpacity="0.045" />
        </linearGradient>
        <linearGradient id="papel-tom-y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2413" stopOpacity="0.03" />
          <stop offset="0.5" stopColor="#fffbe9" stopOpacity="0.025" />
          <stop offset="1" stopColor="#2c2413" stopOpacity="0.045" />
        </linearGradient>
        {/* espessura — escurecimento de ~1px nas duas arestas longas */}
        <linearGradient id="papel-espessura-y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2413" stopOpacity="0.14" />
          <stop offset="0.05" stopColor="#2c2413" stopOpacity="0" />
          <stop offset="0.95" stopColor="#2c2413" stopOpacity="0" />
          <stop offset="1" stopColor="#2c2413" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="papel-espessura-x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c2413" stopOpacity="0.14" />
          <stop offset="0.05" stopColor="#2c2413" stopOpacity="0" />
          <stop offset="0.95" stopColor="#2c2413" stopOpacity="0" />
          <stop offset="1" stopColor="#2c2413" stopOpacity="0.14" />
        </linearGradient>
      </defs>
    </svg>
  );
}
