"use client";

import { ZeroInformativo } from "@/components/ZeroInformativo";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import { diaLiberdade, useSalario } from "./contexto";

/**
 * Nível 3 de /salario (3A-01) — «Confirma»: as contas por extenso.
 * Vivem dentro de PaginaDetalhe (details fechados por defeito): os
 * antigos quatro KPI soltos e a tabela anual ficam aqui, integrados
 * na narrativa em vez de flutuarem na página.
 *
 * As linhas usam `flex justify-between` — o mesmo verniz do recibo —
 * e o IRS a zero ganha o zero informativo.
 */

const linha = "flex items-baseline justify-between gap-4 border-t border-line py-1.5 text-corpo-sm";
const rot = "text-ink2";
const val = "num text-ink";

/** O ano inteiro — o líquido anual a 14 meses e a média a 12 */
export function AnoDetalhe() {
  const s = useSalario();
  const r = s.resultado;
  return (
    <div className="max-w-xl">
      <div className={linha}>
        <span className={rot}>Salário bruto anual</span>
        <span className={val}>{fmtEUR(r.brutoAnualTotal)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>Segurança Social (11&#8239;%)</span>
        <span className={val}>{fmtEUR(r.ssAnual)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>IRS {s.ano} (estimativa)</span>
        <span className={val}>
          {r.irsAnual === 0 ? (
            <ZeroInformativo
              valor="0"
              unidade="€"
              nota="não te toca — o mínimo de existência e a dedução específica cobrem este rendimento"
            />
          ) : (
            fmtEUR(r.irsAnual)
          )}
        </span>
      </div>
      <div className={linha}>
        <span className={rot}>Líquido anual</span>
        <span className={val}>{fmtEUR(r.liquidoAnual)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>Por mês, a 14 meses</span>
        <span className={val}>{fmtEUR(r.liquidoMensal14)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>
          Por mês, em duodécimos (12)
        </span>
        <span className={val}>{fmtEUR(r.liquidoMensal12)}</span>
      </div>
    </div>
  );
}

/** Efetiva vs marginal, peso total do Estado e o dia da viragem —
    os antigos quatro KPI soltos, agora com a explicação ao lado */
export function TaxasDetalhe() {
  const s = useSalario();
  const r = s.resultado;
  return (
    <div className="max-w-xl">
      <div className={linha}>
        <span className={rot}>Efetiva — o que pagas por euro</span>
        <span className={val}>{fmtPct(r.taxaEfetiva)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>
          Marginal — a taxa do próximo euro
        </span>
        <span className={val}>{fmtPct(r.taxaMarginal)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>
          Para o Estado, no total (IRS + SS + TSU)
        </span>
        <span className={val}>{fmtPct(r.pesoEstado)}</span>
      </div>
      <div className={linha}>
        <span className={rot}>Dia da liberdade fiscal</span>
        <span className={val}>
          {diaLiberdade(r.pesoEstado, s.ano).completo}
        </span>
      </div>
      <p className="footnote mt-3">
        No cenário canónico ({fmtEUR0(s.cenarios.meta.brutoRef)} brutos,
        solteiro(a), sem dependentes): efetiva {fmtPct(r.taxaEfetiva)},
        marginal {fmtPct(r.taxaMarginal)}. A tabela canónica dos
        escalões está na <a href="/irs">página do IRS</a>.
      </p>
    </div>
  );
}
