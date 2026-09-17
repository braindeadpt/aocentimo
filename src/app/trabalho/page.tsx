import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { SimuladorDesemprego } from "./SimuladorDesemprego";
import { SimuladorIndependente } from "./SimuladorIndependente";
import desemprego from "@data/fiscal/desemprego.json";
import catb from "@data/fiscal/catb.json";

export const metadata: Metadata = {
  title: "Subsídio de desemprego — quanto e por quanto tempo",
  description:
    "Simulador do subsídio de desemprego em Portugal: 65% da remuneração de referência, limites do IAS, duração por idade e descontos.",
};

export default function TrabalhoPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Proteção no desemprego</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Se ficares sem trabalho
      </h1>
      <p className="lede mt-5">
        Os 11 % que descontas todos os meses pagam isto: se perderes o emprego
        de forma involuntária, a Segurança Social devolve-te uma parte — 65 %
        da tua remuneração de referência, dentro de limites e por tempo
        contado.
      </p>

      <Figure n={1} title="Simulador de subsídio de desemprego" source={desemprego.fonte}>
        <SimuladorDesemprego />
      </Figure>

      <Figure n={2} title="Recibos verdes — da faturação ao bolso" source={catb.fonte}>
        <SimuladorIndependente />
      </Figure>

      <section className="body-copy max-w-2xl py-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">O que a simulação simplifica</h2>
        <p>
          Assume salário estável nos últimos 14 meses e descontos contínuos —
          na realidade a remuneração de referência soma o que efetivamente
          entrou para a Segurança Social. Não cobre subsídio social de
          desemprego, trabalhadores independentes, nem as regras transitórias
          de carreiras antigas. A decisão certa é a da Segurança Social.
        </p>
      </section>
    </div>
  );
}
