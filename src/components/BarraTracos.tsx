"use client";

/**
 * BarraTracos — a barra de traços do catálogo V4 (§5): contagens,
 * limites e durações desenham-se como traços contáveis. A regra é
 * «1 traço = x» e a unidade está SEMPRE escrita no cartão — o que se
 * conta lê-se traço a traço, como os pontos do CampoCentimos.
 *
 * Quando NÃO se usa: dinheiro contínuo (isso são pontos ou euros),
 * proporções de um todo (isso é o campo de cêntimos), séries no
 * tempo (isso é a linha anotada). Lê-se bem até ~120 traços; acima
 * disso os traços viram textura e a contagem deixa de ser literal.
 *
 * Os traços são HTML (a mesma gramática dos traços da Regua), a
 * cores dos tokens — funciona nos dois temas e em papel. Os grupos
 * dão cor por significado: «fica» = o que é teu (verde), «sai» = o
 * que sai do bolso (vermelhão), «marca» = marco/limite (torrado),
 * «vago» = o que falta ou não se usa (linha — ex.: «3 dos 10 anos»).
 *
 * SSR: o estado final está todo no HTML — cada traço é um <i>. A
 * varredura esq→dir só existe com .bt-on (useArmado abaixo da
 * dobra); reduced-motion = estado final imediato. O equivalente
 * textual é um <p> sr-only irmão — um por figura.
 */
import type { ReactNode } from "react";
import { useArmado } from "@/lib/useArmado";

/** cor semântica do traço — «vago» = ainda por usar/não se aplica */
export type TomTraco = "neutro" | "fica" | "sai" | "marca" | "vago";

export interface GrupoTracos {
  /** quantos traços o grupo tem — cada um vale `unidadeTraco` */
  n: number;
  tom?: TomTraco;
  /** nome do grupo no equivalente — «meses de salário» */
  rotulo?: string;
}

export interface BarraTracosProps {
  /** a sequência de traços, em ordem — um grupo só = barra simples */
  grupos: GrupoTracos[];
  /** o que vale um traço — «1 mês», «30 dias», «1 pagamento».
      Escreve-se no cartão como «1 traço = {unidadeTraco}». */
  unidadeTraco: string;
  /** o que se está a contar — «pagamentos por ano» */
  rotulo: string;
  /** o número de leitura — o total ou o estado («14», «3 de 10») */
  valor?: ReactNode;
  /** linha pequena de contexto junto ao valor */
  nota?: string;
  /** equivalente textual — gerado dos grupos se omitido */
  equivalente?: string;
  className?: string;
}

/** traço forte a cada `k`: o divisor «redondo» que deixa ≤ 10
    blocos — a agregação ajuda a contar sem perder o 1:1 */
function passoForte(total: number): number {
  for (const k of [4, 5, 8, 10, 20, 25, 50, 100]) {
    if (total / k <= 10) return k;
  }
  return 100;
}

export function BarraTracos({
  grupos,
  unidadeTraco,
  rotulo,
  valor,
  nota,
  equivalente,
  className,
}: BarraTracosProps) {
  const total = grupos.reduce((a, g) => a + Math.max(0, Math.round(g.n)), 0);
  const { ref, arm } = useArmado<HTMLDivElement>(
    `tracos:${rotulo}:${total}`
  );

  // a sequência plana de traços com o tom do seu grupo
  const tracos: { tom: TomTraco; f: boolean }[] = [];
  {
    let i = 0;
    const forte = passoForte(total);
    for (const g of grupos) {
      const tom = g.tom ?? "neutro";
      for (let k = 0; k < Math.max(0, Math.round(g.n)); k++, i++) {
        // traço forte fecha cada bloco e o último da barra
        tracos.push({ tom, f: (i + 1) % forte === 0 || i === total - 1 });
      }
    }
  }

  const eq =
    equivalente ??
    `${rotulo}: ${total} traços — 1 traço = ${unidadeTraco}` +
      (grupos.length > 1
        ? ` (${grupos
            .filter((g) => g.rotulo && g.n > 0)
            .map((g) => `${g.n} ${g.rotulo}`)
            .join(" + ")})`
        : "");

  return (
    <div ref={ref} className={`bt ${arm("bt-on")}${className ? ` ${className}` : ""}`}>
      <div className="bt-head">
        <p className="bt-rot kicker">{rotulo}</p>
        <p className="bt-un">1 traço = {unidadeTraco}</p>
      </div>
      <div className="bt-pista" aria-hidden="true">
        {tracos.map((tr, i) => (
          <i
            key={i}
            className={`bt-tq bt-tom-${tr.tom}${tr.f ? " bt-f" : ""}`}
            style={{ left: `${(((i + 0.5) / total) * 100).toFixed(3)}%` }}
          />
        ))}
      </div>
      {(valor !== undefined || nota) && (
        <div className="bt-foot">
          {valor !== undefined && <p className="bt-val">{valor}</p>}
          {nota && <p className="bt-nota">{nota}</p>}
        </div>
      )}
      <p className="sr-only" data-bt-equivalente>
        {eq}
      </p>
    </div>
  );
}
