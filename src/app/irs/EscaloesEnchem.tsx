"use client";

import { useMemo, useState } from "react";
import { repartePorEscaloes, escalaoMarginal, REGRAS_IRS } from "@/lib/engines/irs";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

/**
 * Os escalões como recipientes que enchem — a demonstração do
 * mal-entendido mais comum do IRS: subir de escalão não te faz perder
 * dinheiro. Cada recipiente enche pela ordem e só cobra a taxa sobre
 * a fatia que lá cabe — o enchimento vê-se (transição de largura,
 * --dur-media) sempre que o rendimento muda. O desmentido está no
 * painel: "se o mito fosse verdade" riscado vs a coleta real.
 *
 * Cor: família torrada do "sai" — a taxa sobe, a tinta engrossa.
 * Sem remount por mudança: a transição de largura é o enchimento.
 * Reduced-motion corta a transição (regra global) e o estado é final.
 */

const TORRADO = "rgba(157,42,13,";

export function EscaloesEnchem({ ano }: { ano: number }) {
  const regras = REGRAS_IRS[ano];
  const [rc, setRc] = useState(14000);

  const fatias = useMemo(() => repartePorEscaloes(rc, regras), [rc, regras]);
  const marginal = escalaoMarginal(rc, regras);
  const coleta = fatias.reduce((a, f) => a + f.imposto, 0);
  const taxaMedia = rc > 0 ? coleta / rc : 0;
  // o mito: todo o rendimento tributado à taxa do último escalão tocado
  const mito = rc * marginal.taxa;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="esc-rc">
            Rendimento coletável anual
          </label>
          <input id="esc-rc" type="number" min={0} step={500} value={rc}
            onChange={(e) => setRc(Number(e.target.value) || 0)} className="field" />
          <p className="footnote mt-1">
            Bruto menos dedução específica e abatimentos — o número sobre o
            qual os escalões trabalham (em casados, sobre metade do casal).
          </p>
        </div>
        {/* o desmentido, em números */}
        <div className="bg-panel border border-line px-5 py-4 text-sm space-y-1.5" aria-live="polite">
          <p className="flex justify-between">
            <span className="text-ink2">Taxa do último escalão tocado</span>
            <span className="num">{fmtPct(marginal.taxa)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-ink2">
              Se o mito fosse verdade — tudo a {fmtPct(marginal.taxa, 0)}
            </span>
            <span className="num text-muted line-through decoration-line2">{fmtEUR0(mito)}</span>
          </p>
          <p className="flex justify-between border-t border-line pt-1.5">
            <span className="font-medium text-ink">Coleta real, fatia a fatia</span>
            <span className="num font-medium">{fmtEUR0(coleta)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-ink2">Taxa média — o que pagas por euro</span>
            <span className="num text-keep">{fmtPct(taxaMedia)}</span>
          </p>
        </div>
        <p className="footnote">
          Acima de {fmtEUR0(regras.solidariedade[0].de)} acresce a taxa de
          solidariedade ({fmtPct(regras.solidariedade[0].taxa, 1)};{" "}
          {fmtPct(regras.solidariedade[1].taxa, 1)} acima de{" "}
          {fmtEUR0(regras.solidariedade[1].de)}) — não desenhada aqui.
        </p>
      </div>

      {/* os recipientes — cada escalão só cobre a sua fatia */}
      <div className="self-start">
        <div className="space-y-2">
          {fatias.map((f, i) => (
            <div key={f.n}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-ink2">
                  {f.n}.º escalão ·{" "}
                  {f.ate === null ? `mais de ${fmtEUR0(f.de)}` : `até ${fmtEUR0(f.ate)}`}
                </span>
                <span className="num">{fmtPct(f.taxa)}</span>
              </div>
              <div
                className={f.ate === null ? "esc-vessel esc-aberto" : "esc-vessel"}
                role="img"
                aria-label={`${f.n}.º escalão: ${f.fatia > 0 ? `${fmtEUR(f.fatia)} dentro, imposto ${fmtEUR(f.imposto)}` : "vazio"}`}
              >
                <div
                  className="esc-fill"
                  style={{
                    width: `${Math.min(100, f.ocupacao * 100)}%`,
                    background: `${TORRADO}${0.22 + i * 0.09})`,
                  }}
                />
              </div>
              <p className="flex justify-between text-xs text-muted">
                <span>{f.fatia > 0 ? `${fmtEUR(f.fatia)} dentro` : "vazio"}</span>
                <span className="num">{f.imposto > 0 ? `−${fmtEUR(f.imposto)}` : ""}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="footnote mt-3">
          Enchem por ordem e nunca voltam atrás: cada escalão tributa só a
          fatia que lá coube. Por isso o último euro paga a taxa marginal —
          e todos os anteriores continuam na sua.
        </p>
      </div>
    </div>
  );
}
