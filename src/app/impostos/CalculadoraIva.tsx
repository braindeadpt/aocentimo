"use client";

import { useState } from "react";
import { ivaContido, IVA_NORMAL } from "@/lib/engines/impostos";
import { fmtEUR, fmtPct } from "@/lib/format";
import ivaData from "@data/fiscal/iva.json";

export function CalculadoraIva() {
  const [preco, setPreco] = useState(10);
  const [taxa, setTaxa] = useState(IVA_NORMAL);
  const r = ivaContido(preco, taxa);

  return (
    <div className="bg-surface border border-line px-5 py-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kicker block mb-1.5" htmlFor="iva-preco">Preço com IVA</label>
          <input
            id="iva-preco"
            type="number"
            min={0}
            step={0.5}
            value={preco}
            onChange={(e) => setPreco(Number(e.target.value) || 0)}
            className="w-full bg-paper border border-line px-3 py-2 num text-sm focus:outline-none focus:border-line2"
          />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="iva-taxa">Taxa</label>
          <select
            id="iva-taxa"
            value={taxa}
            onChange={(e) => setTaxa(Number(e.target.value))}
            className="w-full bg-paper border border-line px-3 py-2 num text-sm focus:outline-none focus:border-line2"
          >
            {ivaData.taxas.map((t) => (
              <option key={t.nome} value={t.taxa}>
                {fmtPct(t.taxa, 0)} — {t.nome.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex items-baseline gap-8">
        <div>
          <p className="kicker">Imposto no preço</p>
          <p className="num text-2xl mt-1 text-up">{fmtEUR(r.iva)}</p>
        </div>
        <div>
          <p className="kicker">Preço sem IVA</p>
          <p className="num text-2xl mt-1">{fmtEUR(r.semIva)}</p>
        </div>
        <div>
          <p className="kicker">Peso do IVA</p>
          <p className="num text-2xl mt-1">{fmtPct(r.pesoIva)}</p>
        </div>
      </div>
    </div>
  );
}
