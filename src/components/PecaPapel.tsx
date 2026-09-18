import { useId } from "react";
import type { ReactNode } from "react";
import {
  furos,
  pecaRasgada,
  profundidadeRasgo,
  r1,
  sombraPeca,
} from "@/lib/materia";

/**
 * PecaPapel — um pedaço arrancado da fita, com toda a matéria do M-01:
 * silhueta rasgada (determinista por semente), camadas de papel
 * (tom/fibra/espessura via PapelDefs), perfuração a sério por máscara
 * (o furo mostra o fundo da página, não uma cor pintada) e sombra própria
 * derivada do ângulo e da altura de queda.
 *
 * O conteúdo (`children`) vai dentro da máscara — se um furo passar por
 * cima de tinta, fura-a também: fisicamente é assim que é.
 *
 * A sombra é um filtro CSS aplicado ao <svg> inteiro — estático. O que
 * anima (queda, rotação) aplica-se a um <g> ou wrapper por transform,
 * nunca ao filtro (orçamento do M-01).
 */
export function PecaPapel({
  comp,
  alt,
  semente,
  grosseria = 0.55,
  furoY,
  raioFuro = 1.8,
  espacamentoFuro = 14,
  angulo = 0,
  altura = 0.5,
  rasgoTopo = true,
  rasgoFundo = true,
  cor = "var(--talao-paper)",
  sombra = true,
  children,
  className = "",
}: {
  /** largura do papel em px do viewBox */
  comp: number;
  /** altura do papel em px do viewBox */
  alt: number;
  /** semente do rasgo — deriva-se do valor (sementeDe) para ser estável */
  semente: number;
  /** 0..1 — violência do rasgo. Defeito 0.55 */
  grosseria?: number;
  /** linha de perfuração a esta coordenada y (viewBox); omitido = sem furos */
  furoY?: number;
  raioFuro?: number;
  espacamentoFuro?: number;
  /** ângulo de aterragem em graus — modula o desvio da sombra */
  angulo?: number;
  /** 0..1 — quão alto caiu: sombra mais distante e difusa */
  altura?: number;
  /** rasgar a aresta de cima. Defeito true. */
  rasgoTopo?: boolean;
  /** rasgar a aresta de baixo. Defeito true. */
  rasgoFundo?: boolean;
  cor?: string;
  sombra?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const m = Math.ceil(profundidadeRasgo(grosseria)) + 2;
  const d = pecaRasgada(comp, alt, { semente, grosseria, rasgoTopo, rasgoFundo });
  const centros =
    furoY !== undefined ? furos(comp, { espacamento: espacamentoFuro }) : [];
  const maskId = `perf-${id}`;
  return (
    <svg
      viewBox={`${-m} ${-m} ${r1(comp + 2 * m)} ${r1(alt + 2 * m)}`}
      className={className}
      style={sombra ? { filter: sombraPeca({ angulo, altura }) } : undefined}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <path d={d} fill="#fff" />
          {centros.map((cx) => (
            <circle key={cx} cx={cx} cy={furoY} r={raioFuro} fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path d={d} fill={cor} />
        <path d={d} fill="url(#papel-tom-x)" />
        <path d={d} fill="url(#papel-fibra)" />
        <path d={d} fill="url(#papel-espessura-y)" />
        {children}
      </g>
      {/* sombra interna do furo — arco no bordo superior, é o que faz o
          olho ler "buraco" e não "ponto" */}
      {centros.map((cx) => (
        <path
          key={cx}
          d={`M${r1(cx - raioFuro * 0.9)},${r1(furoY! - raioFuro * 0.4)} A${raioFuro},${raioFuro} 0 0 1 ${r1(cx + raioFuro * 0.9)},${r1(furoY! - raioFuro * 0.4)}`}
          fill="none"
          stroke="rgba(44,36,19,0.4)"
          strokeWidth={0.7}
        />
      ))}
    </svg>
  );
}
