import type { ReactNode } from "react";
import { OrbeEstado } from "@/components/OrbeEstado";

/**
 * EstadoVazio — VAZIO / FONTE INDISPONÍVEL (1B-05). A regra nº1 com
 * desenho: quando uma fonte falha, o lugar do instrumento fica
 * marcado — nunca um buraco na grelha, nunca um número inventado.
 *
 * A ilustração é a mecânica isométrica de traço fino da referência
 * «Nothing on the schedule yet» na gramática do <Isometrico>: um
 * stack de placas wireframe sobre o eixo tracejado, em que a peça
 * em falta se desenha só a tracejado — o contorno do que devia lá
 * estar — com a sua linha de chamada. (Não é o <Isometrico>: este é
 * interactivo e mede camadas por estrutura; aqui o desenho é fixo,
 * decorativo e feito para o tamanho pequeno.)
 *
 * A frase é honesta: diz o que falhou, desde quando (o último dado
 * conhecido, quando o há) e onde ver a fonte oficial. O selo é o
 * orbe «atrasada» — e o estado existe também em texto, como sempre.
 *
 * Sem hooks — serve em servidor e em cliente (o <EmptyState> dos
 * gráficos delega aqui).
 */
export function EstadoVazio({
  titulo,
  falha = "a série não chegou da fonte",
  desde,
  fonte,
  compacto = false,
  className,
}: {
  /** o que falhou — «Gasóleo simples», «a série do IHPC» */
  titulo: string;
  /** o que aconteceu — «a série não chegou da fonte» por omissão;
      «falhou a actualização» quando o watchdog a marca atrasada */
  falha?: string;
  /** desde quando — o último dado conhecido já formatado
      («ago 2026»); escreve-se «último dado conhecido: {desde}» */
  desde?: string;
  /** onde ver a fonte oficial — nome + url (abre em separador novo) */
  fonte?: { nome: ReactNode; url?: string };
  /** variante pequena — dentro de figuras e células */
  compacto?: boolean;
  className?: string;
}) {
  return (
    <figure
      role="status"
      className={`estado-vazio${compacto ? " estado-vazio-c" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      {/* a peça em falta: duas placas sólidas e a do topo só a
          tracejado — o contorno do que devia lá estar; a chamada
          marca o lugar. Decorativa — o texto ao lado diz tudo. */}
      <svg
        viewBox="0 0 220 140"
        aria-hidden="true"
        className="ev-iso"
      >
        {/* o eixo da explosão — continua por onde a peça devia estar */}
        <line
          x1={82}
          y1={12}
          x2={82}
          y2={116}
          stroke="var(--line2)"
          strokeWidth={1}
          strokeDasharray="1 5"
          opacity={0.7}
        />
        {/* a base — o que chegou */}
        <path
          d="M 34 106 L 34 115 A 48 13.5 0 0 0 130 115 L 130 106"
          fill="none"
          stroke="var(--ink2)"
          strokeWidth={1}
        />
        <ellipse
          cx={82}
          cy={106}
          rx={48}
          ry={13.5}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={1.2}
        />
        {/* a placa de cima — sólida */}
        <path
          d="M 42 78 L 42 84 A 40 11 0 0 0 122 84 L 122 78"
          fill="none"
          stroke="var(--ink2)"
          strokeWidth={1}
        />
        <ellipse
          cx={82}
          cy={78}
          rx={40}
          ry={11}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={1.2}
        />
        {/* a peça em falta — existe só a tracejado */}
        <ellipse
          cx={82}
          cy={42}
          rx={40}
          ry={11}
          fill="none"
          stroke="var(--ink2)"
          strokeWidth={1.2}
          strokeDasharray="5 4"
        />
        {/* a chamada até ao lugar da peça */}
        <line
          x1={128}
          y1={42}
          x2={176}
          y2={42}
          stroke="var(--line2)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <circle
          cx={181}
          cy={42}
          r={2.6}
          fill="none"
          stroke="var(--line2)"
          strokeWidth={1.2}
        />
      </svg>

      <figcaption className="ev-txt">
        <p className="kicker ev-selo">
          <OrbeEstado estado="atrasada" tamanho={15} />
          fonte indisponível
        </p>
        <p className="ev-frase">
          {titulo} — {falha}.
        </p>
        {desde && <p className="ev-desde num">último dado conhecido: {desde}</p>}
        {fonte && (
          <p className="ev-fonte">
            {fonte.url ? (
              <a
                href={fonte.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ev-link"
              >
                ver na fonte oficial — {fonte.nome} ↗
              </a>
            ) : (
              <>fonte oficial: {fonte.nome}</>
            )}
          </p>
        )}
        <p className="footnote ev-regra">
          Não mostramos um número inventado — a falha mostra-se.
        </p>
      </figcaption>
    </figure>
  );
}
