import { Spark, type EstadoSerie } from "@/components/Spark";
import { OrbeEstado } from "@/components/OrbeEstado";
import { fmtNum } from "@/lib/format";
import { m } from "@/lib/messages";

/**
 * Instrumento — a célula única do quadro: rótulo + selo de frescura +
 * valor herói + sparkline + timestamp. Substitui as três variantes
 * soltas (home, /dados, mini-células). O selo de frescura aparece duas
 * vezes por construção — no rótulo e no marcador final da spark — e a
 * palavra "atrasada"/"sem prazo" sai no rodapé quando o estado não é limpo.
 */
export function descricaoSpark(
  rotulo: string,
  pts: { t: string; v: number }[]
): string {
  const cauda = pts.slice(-24);
  const vs = cauda.map((p) => p.v);
  const ult = cauda[cauda.length - 1];
  return m.chart.sparkDesc
    .replace("{rotulo}", rotulo)
    .replace("{n}", String(cauda.length))
    .replace("{min}", fmtNum(Math.min(...vs), 2))
    .replace("{max}", fmtNum(Math.max(...vs), 2))
    .replace("{ult}", fmtNum(ult.v, 2));
}

export function Instrumento({
  rotulo,
  valor,
  spark,
  estado,
  meta,
  atraso = 0,
  grande = false,
  className = "",
}: {
  rotulo: string;
  /** o número herói — já formatado (Delta, Odometer, texto) */
  valor: React.ReactNode;
  /** cauda da série; quando presente desenha a sparkline */
  spark?: { t: string; v: number }[];
  estado?: EstadoSerie;
  /** timestamp/nota de rodapé — a fonte vive no <Source> da secção */
  meta?: React.ReactNode;
  /** índice de escalonamento da spark entre células */
  atraso?: number;
  /** valor herói em 3xl — primeira dobra da home */
  grande?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="kicker-xs flex items-center">
        {estado && <OrbeEstado estado={estado} tamanho={16} />}
        {rotulo}
      </p>
      <p className={`num-read mt-2 ${grande ? "num-read-lg" : ""}`}>{valor}</p>
      {spark && spark.length > 1 && (
        <div className="mt-2 text-muted">
          <Spark
            pts={spark}
            atraso={atraso}
            estado={estado}
            descricao={descricaoSpark(rotulo, spark)}
          />
        </div>
      )}
      {(meta || estado === "atrasada" || estado === "sem-sla") && (
        <p className="footnote mt-1.5">
          {estado === "atrasada" && (
            <span className="text-warn">{m.chart.atrasada} · </span>
          )}
          {estado === "sem-sla" && (
            <span className="text-muted">{m.chart.semSla} · </span>
          )}
          {meta}
        </p>
      )}
    </div>
  );
}
