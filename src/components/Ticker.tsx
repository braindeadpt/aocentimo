import { loadFonte, loadSerie, variacao } from "@/lib/data";
import { fmtData, fmtLitro, fmtNum, fmtPct } from "@/lib/format";
import { m } from "@/lib/messages";
import smn from "@data/fiscal/smn.json";
import ca from "@data/fiscal/ca.json";

interface Item {
  label: string;
  valor: string;
  detalhe?: string;
}

/**
 * Fio de dados vivos sob o cabeçalho — a assinatura do observatório.
 * Percorre em marquee contínuo; com prefers-reduced-motion fica estático
 * e rolável. Cada valor vem de uma fonte oficial carregada no servidor.
 */
export function Ticker() {
  const itens: Item[] = [];

  const eur3 = loadFonte("bpstat", "euribor-3m-mensal");
  if (eur3) {
    const ultimo = eur3.series[eur3.series.length - 1];
    itens.push({
      label: m.ticker.euribor3m,
      valor: `${fmtNum(ultimo.v, 2)} %`,
      detalhe: fmtData(ultimo.t),
    });
  }

  const ipc = loadSerie("CP00");
  if (ipc) {
    const v = variacao(ipc, 12);
    itens.push({
      label: m.ticker.inflacao,
      valor: v === null ? "—" : `${v >= 0 ? "+" : "−"}${fmtPct(Math.abs(v))}`,
      detalhe: fmtData(ipc.meta.serieAte),
    });
  }

  const gasoleo = loadFonte("dgeg", "pmd-gasoleo-diario");
  if (gasoleo) {
    const ultimo = gasoleo.series[gasoleo.series.length - 1];
    itens.push({
      label: m.ticker.gasoleo,
      valor: fmtLitro(ultimo.v),
      detalhe: fmtData(ultimo.t),
    });
  }

  const gasolina = loadFonte("dgeg", "pmd-gasolina95-diario");
  if (gasolina) {
    const ultimo = gasolina.series[gasolina.series.length - 1];
    itens.push({
      label: m.ticker.gasolina,
      valor: fmtLitro(ultimo.v),
      detalhe: fmtData(ultimo.t),
    });
  }

  itens.push({
    label: m.ticker.smn,
    valor: `${fmtNum(smn.serie[smn.serie.length - 1].valor)} €`,
    detalhe: m.ticker.smnNota,
  });
  itens.push({
    label: m.ticker.ca,
    valor: fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2),
    detalhe: m.ticker.caNota,
  });

  if (itens.length === 0) return null;

  // a pista duplica-se para o loop ser contínuo
  const pista = [...itens, ...itens];
  return (
    <div className="ticker bg-panel" role="region" aria-label={m.ticker.label}>
      <div className="ticker-track">
        {pista.map((it, i) => (
          <span
            key={`${it.label}-${i}`}
            aria-hidden={i >= itens.length}
            className="num ticker-item inline-flex items-baseline gap-2 whitespace-nowrap px-6 py-1.5"
          >
            <span className="text-muted">{it.label}</span>
            <span className="text-ink">{it.valor}</span>
            {it.detalhe && <span className="text-muted">{it.detalhe}</span>}
            <span aria-hidden className="text-line2">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
