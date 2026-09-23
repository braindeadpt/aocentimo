import type { ReactNode } from "react";
import { FINO } from "@/lib/format";

/**
 * ZeroInformativo — o zero como informação (1B-05). Quando uma parte
 * vale zero de verdade — o IRS ao salário mínimo, por exemplo — o
 * zero diz-se e vê-se: «0 € — não te toca». Não é um número cru nem
 * uma ausência: é a leitura certa do motor.
 *
 * Desenho: o ponto oco — o cêntimo que não existe (a mesma leitura
 * do `repartir`: uma parte a 0 não tem pontos, e isso é informação,
 * não erro) — mais o valor já formatado e a nota. Em texto corrido
 * e em listas de decomposição (talão, lista do isométrico, cascata).
 *
 * Sem hooks — serve em servidor e em cliente.
 */
export function ZeroInformativo({
  valor = "0",
  unidade,
  nota = "não te toca",
  className,
}: {
  /** o zero já formatado — «0,00», «0»; por omissão «0» */
  valor?: ReactNode;
  /** a unidade SEM espaço — «€», «c»; a ponte é o fino inseparável */
  unidade?: string;
  /** porquê o zero — «não te toca» por omissão; `null` omite a nota */
  nota?: ReactNode;
  className?: string;
}) {
  return (
    <span className={`zero-info${className ? ` ${className}` : ""}`}>
      {/* o ponto oco — o cêntimo que não existe */}
      <span className="zero-info-ponto" aria-hidden="true" />
      <span className="zero-info-valor">
        {valor}
        {unidade && (
          <span className="zero-info-un">
            {FINO}
            {unidade}
          </span>
        )}
      </span>
      {nota !== null && nota !== undefined && nota !== false && (
        <>
          {" "}
          <span className="zero-info-nota">— {nota}</span>
        </>
      )}
    </span>
  );
}
