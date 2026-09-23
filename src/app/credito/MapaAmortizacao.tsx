"use client";

import { useMemo } from "react";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import { useCredito } from "./CreditoSim";

/**
 * O mapa de amortização completo — nível 3 de /credito: o plano mensal
 * agregado por ano, para confirmar a troca de peso juro→capital com os
 * números na mesa. Lê o mesmo contrato das réguas via <CreditoProvider>
 * (com o choque ligado, a tabela é a do cenário chocado — é esse o
 * plano que se confirma).
 */
export function MapaAmortizacao() {
  const { sim, choque } = useCredito();

  const anos = useMemo(() => {
    if (!sim) return [];
    const out: {
      ano: number;
      prestacoes: number;
      juro: number;
      capital: number;
      divida: number;
    }[] = [];
    for (const l of sim.linhas) {
      const a = Math.floor((l.mes - 1) / 12);
      if (!out[a])
        out[a] = { ano: a + 1, prestacoes: 0, juro: 0, capital: 0, divida: 0 };
      out[a].prestacoes += l.prestacao;
      out[a].juro += l.juro;
      out[a].capital += l.capital;
      out[a].divida = l.divida;
    }
    return out;
  }, [sim]);

  if (!sim) {
    return (
      <p className="footnote">
        Sem a Euribor não há plano para confirmar — escreve a taxa do teu
        contrato nas réguas de «Explora».
      </p>
    );
  }

  return (
    <div>
      <table className="w-full text-corpo-sm bg-raised border border-line shadow-raised">
        <thead>
          <tr className="text-left border-b-2 border-ink">
            <th scope="col" className="px-4 py-2 font-medium">Ano</th>
            <th scope="col" className="px-4 py-2 font-medium text-right">Prestações do ano</th>
            <th scope="col" className="px-4 py-2 font-medium text-right">… dos quais juro</th>
            <th scope="col" className="px-4 py-2 font-medium text-right">… dos quais capital</th>
            <th scope="col" className="px-4 py-2 font-medium text-right">Dívida no fim</th>
          </tr>
        </thead>
        <tbody>
          {anos.map((a) => (
            <tr key={a.ano} className="border-b border-line last:border-0">
              <td className="px-4 py-1.5 num">{a.ano}</td>
              <td className="px-4 py-1.5 text-right num">{fmtEUR0(a.prestacoes)}</td>
              <td className="px-4 py-1.5 text-right num text-up">
                {fmtEUR0(a.juro)}
                <span className="block text-rotulo text-muted">
                  {fmtPct(a.prestacoes > 0 ? a.juro / a.prestacoes : 0, 0)} do ano
                </span>
              </td>
              <td className="px-4 py-1.5 text-right num text-keep">
                {fmtEUR0(a.capital)}
              </td>
              <td className="px-4 py-1.5 text-right num">{fmtEUR0(a.divida)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="footnote mt-3">
        Agregado por ano do plano mensal ({sim.linhas.length} prestações de{" "}
        {fmtEUR(sim.prestacao)}, TAN {fmtPct(sim.tan)}
        {choque ? ", com o choque +1 p.p. ligado" : ""}). No primeiro ano{" "}
        {fmtPct(
          anos.length && anos[0].prestacoes > 0
            ? anos[0].juro / anos[0].prestacoes
            : 0,
          0
        )}{" "}
        do que pagas é juro — a divisória inverte-se devagar.
      </p>
    </div>
  );
}
