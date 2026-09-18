"use client";

import { useState } from "react";
import { decomporCombustivel, IVA_NORMAL } from "@/lib/engines/impostos";
import { fmtEUR, fmtPct } from "@/lib/format";
import isp from "@data/fiscal/isp.json";

type Fuel = "gasolina95" | "gasoleo";

export function DecomposicaoFuel() {
  const [fuel, setFuel] = useState<Fuel>("gasoleo");
  const [preco, setPreco] = useState(1.65);

  const d = isp[fuel];
  const r = decomporCombustivel(preco, d.ispELitro, d.carbonoELitro);

  const barras = [
    ["Produto + margens", r.produto, "bg-line2"],
    [`IVA (${fmtPct(IVA_NORMAL, 0)})`, r.iva, "bg-up"],
    ["ISP", r.isp, "bg-up/80"],
    ["Taxa de carbono", r.carbono, "bg-up/60"],
  ] as const;

  return (
    <div className="bg-raised border border-line shadow-raised px-5 py-5" aria-live="polite">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kicker block mb-1.5" htmlFor="fuel">Combustível</label>
          <select
            id="fuel"
            value={fuel}
            onChange={(e) => setFuel(e.target.value as Fuel)}
            className="field"
          >
            <option value="gasoleo">Gasóleo</option>
            <option value="gasolina95">Gasolina 95</option>
          </select>
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="preco">Preço por litro</label>
          <input
            id="preco"
            type="number"
            min={0}
            step={0.01}
            value={preco}
            onChange={(e) => setPreco(Number(e.target.value) || 0)}
            className="field"
          />
        </div>
      </div>

      {/* barra empilhada */}
      <div className="mt-6 flex h-10 w-full overflow-hidden border border-line">
        {barras.map(([label, v, cls]) => (
          <div
            key={label}
            className={cls}
            style={{ width: `${(v / r.precoFinal) * 100}%` }}
            title={`${label}: ${fmtEUR(v)}`}
          />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {barras.map(([label, v]) => (
          <div key={label}>
            <dt className="kicker">{label}</dt>
            <dd className="num text-lg mt-1">{fmtEUR(v)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-ink2">
        Impostos no total:{" "}
        <span className="num font-medium text-up">{fmtPct(r.pesoImpostos)}</span> do
        preço. O IVA incide sobre o preço que já inclui ISP e carbono —
        pagas imposto sobre imposto.
      </p>
      <p className="footnote mt-2">
        ISP e carbono vigentes em {isp.vigencia} · {isp.nota}
      </p>
    </div>
  );
}
