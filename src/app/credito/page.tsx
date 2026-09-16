import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { SimuladorPrestacao } from "./SimuladorPrestacao";

export const metadata: Metadata = {
  title: "Crédito — Euribor, spread e prestação",
  description:
    "O que é a Euribor, como o spread forma a TAN, e simulador de prestação de crédito habitação com custo total do empréstimo.",
};

export default function CreditoPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Módulo 04</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-2">
        Euribor, spread e a tua prestação
      </h1>
      <p className="lede mt-5">
        A Euribor é a taxa a que os bancos europeus se emprestam dinheiro entre
        si — e é o chão sobre o qual o teu banco constrói a tua prestação. A
        fórmula é simples: <strong>TAN = Euribor + spread</strong>. A Euribor
        não se negoceia; o spread, sim.
      </p>

      <Figure n={1} title="Simulador de prestação" source="Cálculo próprio — sistema de amortização francês">
        <SimuladorPrestacao />
      </Figure>

      <section className="max-w-2xl py-8 text-ink2 text-[0.95rem] leading-relaxed space-y-4">
        <h2 className="font-display text-2xl text-ink">Os cinco termos que interessam</h2>
        <dl className="space-y-3">
          <div>
            <dt className="font-medium text-ink">Euribor</dt>
            <dd>
              Taxa interbancária europeia, calculada diariamente. O teu contrato
              usa um prazo (3, 6 ou 12 meses) — a cada revisão, a prestação
              reflete a média da Euribor desse prazo.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Spread</dt>
            <dd>
              A margem do banco, fixada no contrato. É a única parte
              negociável da TAN — e onde comparar propostas compensa.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">TAN</dt>
            <dd>Euribor + spread. A taxa que efetivamente gera os teus juros.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">TAEG</dt>
            <dd>
              TAN + seguros + comissões + custos de manutenção. É o custo real
              anual do crédito — compara sempre TAEG entre bancos.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">MTIC</dt>
            <dd>
              Montante total imputado ao consumidor: tudo o que pagas até ao
              fim. É o número que revela quanto a casa realmente custa.
            </dd>
          </div>
        </dl>
        <p>
          A série mensal da Euribor será ligada à API do Banco de Portugal
          (BPstat) na fase seguinte — até lá, o simulador aceita qualquer
          valor, para perceberes a sensibilidade da tua prestação.
        </p>
      </section>
    </div>
  );
}
