import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { SimuladorDesemprego } from "./SimuladorDesemprego";
import { SimuladorIndependente } from "./SimuladorIndependente";
import desemprego from "@data/fiscal/desemprego.json";
import catb from "@data/fiscal/catb.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Subsídio de desemprego — quanto e por quanto tempo",
  description:
    "Simulador do subsídio de desemprego em Portugal: 65% da remuneração de referência, limites do IAS, duração por idade e descontos.",
  alternates: { canonical: "/trabalho", types: ALT_FEED },
};

export default function TrabalhoPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Simuladores de trabalho — desemprego e recibos verdes",
          "/trabalho",
          "Simulador do subsídio de desemprego e do trabalho independente em Portugal: quanto recebes e por quanto tempo."
        )}
      />
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

      <Figure
        n={1}
        title="Simulador de subsídio de desemprego"
        source={<Source nome={desemprego.fonte} vigencia={desemprego.vigencia} />}
      >
        <SimuladorDesemprego />
      </Figure>

      <Figure
        n={2}
        title="Recibos verdes — da faturação ao bolso"
        source={<Source nome={catb.fonte} vigencia={catb.vigencia} />}
      >
        <SimuladorIndependente />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
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
