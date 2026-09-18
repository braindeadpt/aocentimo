"use client";

import { useMemo, useState } from "react";
import { ivaContido } from "@/lib/engines/impostos";
import { fmtEUR, fmtPct } from "@/lib/format";
import { m } from "@/lib/messages";

/**
 * O talão de supermercado — o segundo artefacto de papel do site.
 * O recibo de vencimento (/salario) é o euro que entra; este é o euro
 * que sai. Os preços são editáveis — são a interface, não ilustração —
 * e o IVA de cada linha e o RESUMO IVA por taxa saem do motor real
 * (ivaContido + taxas de data/fiscal/iva.json). Carimbado SIMULAÇÃO
 * porque os preços de exemplo são isso mesmo; as taxas são as legais.
 *
 * Interrogável como os outros instrumentos (D-04): readout fixo em
 * cima, linhas ao ponteiro, régua com setas para teclado.
 */

interface Item {
  nome: string;
  preco: number;
  taxa: number;
}

const CABAZ: Item[] = [
  { nome: "PÃO DE TRIGO 400G", preco: 0.69, taxa: 0.06 },
  { nome: "LEITE UHT M.G. 1L", preco: 0.94, taxa: 0.06 },
  { nome: "MAÇÃS GALA KG", preco: 2.15, taxa: 0.06 },
  { nome: "ÁGUA MINERAL 1,5L", preco: 0.55, taxa: 0.06 },
  { nome: "ARROZ AGULHA KG", preco: 1.59, taxa: 0.06 },
  { nome: "ATUM CONSERVA ×3", preco: 4.49, taxa: 0.13 },
  { nome: "VINHO TINTO 75CL", preco: 3.99, taxa: 0.13 },
  { nome: "PILHAS AA ×4", preco: 4.99, taxa: 0.23 },
  { nome: "CHAMPÔ 400ML", preco: 3.29, taxa: 0.23 },
  { nome: "T-SHIRT ALGODÃO", preco: 9.99, taxa: 0.23 },
];

export function TalaoCompras() {
  const [precos, setPrecos] = useState<number[]>(CABAZ.map((i) => i.preco));
  const [ativo, setAtivo] = useState<number | null>(null);

  const linhas = useMemo(
    () =>
      CABAZ.map((it, i) => ({
        ...it,
        preco: Math.max(0, precos[i] || 0),
        ...((precos[i] || 0) > 0
          ? ivaContido(precos[i] || 0, it.taxa)
          : { iva: 0, semIva: 0, pesoIva: 0 }),
      })),
    [precos]
  );

  // RESUMO IVA por taxa — o bloco que os talões reais trazem no fim
  const resumo = useMemo(() => {
    const porTaxa = new Map<number, { base: number; iva: number }>();
    for (const l of linhas) {
      const r = porTaxa.get(l.taxa) ?? { base: 0, iva: 0 };
      r.base += l.semIva;
      r.iva += l.iva;
      porTaxa.set(l.taxa, r);
    }
    return [...porTaxa.entries()]
      .map(([taxa, r]) => ({ taxa, ...r }))
      .sort((a, b) => a.taxa - b.taxa);
  }, [linhas]);

  const total = linhas.reduce((a, l) => a + l.preco, 0);
  const totalIva = linhas.reduce((a, l) => a + l.iva, 0);
  const lida = ativo !== null ? linhas[ativo] : null;

  return (
    <div className="grid items-start gap-10 md:grid-cols-[1fr_auto]">
      {/* leitura — a coluna explica o objecto; pegajosa porque o
          talão é alto: o readout fica visível ao interrogar o fim */}
      <div className="self-start md:sticky md:top-6">
        {/* readout fixo — a linha interrogada; régua percorre por teclado */}
        <div className="chart-readout" aria-live="polite">
          {lida ? (
            <>
              <span className="chart-readout-t">{lida.nome}</span>
              <span className="chart-readout-v">{fmtEUR(lida.preco)}</span>
              <span className="chart-readout-t">
                inclui {fmtEUR(lida.iva)} de IVA ({fmtPct(lida.taxa, 0)})
              </span>
            </>
          ) : (
            <span className="chart-readout-t">
              {fmtEUR(total)} · {fmtEUR(totalIva)} são IVA
            </span>
          )}
          <input
            type="range"
            className="chart-scrub"
            min={0}
            max={linhas.length - 1}
            value={ativo ?? linhas.length - 1}
            aria-label={m.chart.scrubAria}
            aria-valuetext={
              lida ? `${lida.nome}: ${fmtEUR(lida.preco)}` : undefined
            }
            onChange={(e) => setAtivo(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAtivo(null);
            }}
            onBlur={() => setAtivo(null)}
          />
        </div>
        <p className="body-copy mt-4">
          Um talão de supermercado real traz o IVA escondido nas letras do
          fim de cada linha e no resumo por taxa. Aqui os preços são teus —
          edita-os no talão — e a máquina é o motor de IVA do site: cada
          preço já inclui imposto, que o recibo só declara no fim.
        </p>
        <p className="footnote mt-4">
          Cabaz de exemplo com as taxas do continente (6 %, 13 %, 23 %).
          A Madeira e os Açores têm taxas próprias, mais baixas.
        </p>
      </div>

      {/* o talão — papel fixo nos dois temas, como o do salário */}
      <div className="talao-wrap w-full max-w-80 justify-self-center" aria-live="polite">
        <div className="talao">
          <span className="carimbo">simulação</span>
          <div className="talao-face px-6 pb-5 pt-7">
            <p className="talao-head text-center">Talão de compras</p>
            <p className="talao-sub talao-dim mt-1 text-center">
              * * * preços editáveis * * *
            </p>
            <ul className="talao-body mt-4">
              {linhas.map((l, i) => (
                <li
                  key={l.nome}
                  className={`talao-sep chart-hit flex items-baseline justify-between gap-3 py-1.5 ${
                    ativo !== null && ativo !== i ? "chart-hit-off" : ""
                  }`}
                  onPointerEnter={() => setAtivo(i)}
                  onPointerLeave={() => setAtivo(null)}
                >
                  <span className="talao-dim min-w-0">
                    {l.nome}
                    <span className="talao-note block">
                      IVA {fmtPct(l.taxa, 0)} · contém {fmtEUR(l.iva)}
                    </span>
                  </span>
                  <label className="flex items-baseline gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={precos[i]}
                      aria-label={`Preço de ${l.nome.toLowerCase()}`}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setPrecos((p) => p.map((x, j) => (j === i ? v : x)));
                      }}
                      className="talao-field w-16 text-right"
                    />
                    <span aria-hidden>€</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="talao-cut mt-1 flex items-baseline justify-between gap-4 py-3">
              <span className="talao-total">Total</span>
              <span className="text-3xl font-bold">{fmtEUR(total)}</span>
            </div>

            {/* RESUMO IVA — o bloco que o talão real traz, por taxa */}
            <table className="talao-body talao-dim mt-1 w-full">
              <thead>
                <tr className="talao-note text-left uppercase">
                  <th scope="col" className="py-1 font-normal">Resumo IVA</th>
                  <th scope="col" className="py-1 text-right font-normal">base</th>
                  <th scope="col" className="py-1 text-right font-normal">imposto</th>
                </tr>
              </thead>
              <tbody>
                {resumo.map((r) => (
                  <tr key={r.taxa} className="talao-sep">
                    <td className="py-1">{fmtPct(r.taxa, 0)}</td>
                    <td className="py-1 text-right">{fmtEUR(r.base)}</td>
                    <td className="py-1 text-right">{fmtEUR(r.iva)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="talao-sep mt-1 flex items-baseline justify-between gap-4 py-1.5">
              <span className="talao-total">Deste total é IVA</span>
              <span className="whitespace-nowrap text-lg font-bold">
                {fmtEUR(totalIva)}
                <span className="talao-note talao-dim ml-2 whitespace-nowrap">
                  {fmtPct(total > 0 ? totalIva / total : 0)}
                </span>
              </span>
            </div>

            <div className="talao-barras mt-5" aria-hidden />
            <p className="talao-meta talao-dim mt-2 flex justify-between">
              <span>CIVA · LISTAS I/II</span>
              <span>AOCENTIMO</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
