import type { ReactNode } from "react";
import { OrbeEstado } from "@/components/OrbeEstado";

/**
 * ACarregar — o estado «a carregar» partilhado (1B-05): o mini-orbe
 * de pontos a rodar (o «a-recolher» da família OrbeEstado — não se
 * inventa spinner) mais o rótulo que diz o que está a acontecer
 * («A calcular…», «A recolher…»).
 *
 * Num site estático quase nada carrega — usa-se só onde há espera
 * real: o `aCarregar` do <Botao> consome-o e é hoje o único ponto
 * de espera do produto (o motor lazy de /salario não o usa de
 * propósito — mostra o último valor calculado, que é melhor que
 * qualquer indicador).
 *
 * `role="status"` torna a chegada do estado anunciável; o orbe é
 * decorativo — a rotação pára fora do ecrã e desliga-se em
 * reduced-motion (a regra já vive no OrbeEstado). Sem hooks: serve
 * em servidor e em cliente.
 */
export function ACarregar({
  rotulo,
  tamanho = 15,
  className,
}: {
  /** o que está a acontecer — «A calcular…»; nunca vazio */
  rotulo: ReactNode;
  /** px — o desenho do orbe é feito para 14–18 */
  tamanho?: number;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={`acarregar${className ? ` ${className}` : ""}`}
    >
      <OrbeEstado
        estado="a-recolher"
        tamanho={tamanho}
        className="acarregar-orbe"
      />
      <span>{rotulo}</span>
    </span>
  );
}
