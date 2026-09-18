import { TweenNum } from "@/components/TweenNum";

/** O número-resposta — registo herói da escala de números.
 *  Recebe a string já formatada: fmtEUR/fmtPct trazem « €»/« %»; a
 *  unidade é separada e composta como .num-unit, com `sufixo` colado
 *  («€/mês»). O `sinal` («+»/«−») é membro da linha e herda a cor —
 *  nunca decoração. Falha de dados («—») renderiza-se tal qual.
 *  `animar`: o mesmo valor em número — quando muda, os dígitos deslizam
 *  (TweenNum) em vez de saltar; o SSR continua a trazer o valor certo. */
export function NumHero({
  valor,
  sufixo,
  sinal,
  compacto = false,
  animar,
  casas = 2,
  className = "",
}: {
  valor: string;
  sufixo?: string;
  sinal?: "+" | "−";
  /** cabeça mais baixa para valores sem teto conhecido */
  compacto?: boolean;
  /** valor numérico para interpolação — o texto continua a vir de `valor` */
  animar?: number;
  /** casas decimais do valor animado — tem de bater com `valor` */
  casas?: number;
  className?: string;
}) {
  const m = /^([\s\d.,+-]+?)\s*(€|%)?$/.exec(valor.trim());
  const digitos = m ? m[1].trim() : valor;
  const unidade = m ? (m[2] ?? "") + (sufixo ?? "") : "";
  return (
    <p className={`num-hero${compacto ? " num-hero-compact" : ""}${className ? ` ${className}` : ""}`}>
      {sinal && (
        <span className="num-sign" aria-hidden="true">
          {sinal}
        </span>
      )}
      {animar === undefined ? (
        digitos
      ) : (
        <TweenNum valor={animar} casas={casas} texto={digitos} />
      )}
      {unidade && <span className="num-unit">{unidade}</span>}
    </p>
  );
}
