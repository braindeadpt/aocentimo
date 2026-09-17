import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { SimuladorCasa } from "./SimuladorCasa";
import { fmtEUR0 } from "@/lib/format";
import { readFileSync } from "fs";
import path from "path";
import imt from "@data/fiscal/imt-2026.json";

export const metadata: Metadata = {
  title: "Comprar casa — IMT, Imposto de Selo e prestação",
  description:
    "O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual do Banco de Portugal.",
};

/** Último valor da Euribor 3M mensal recolhido do BPstat. */
function euriborAtual(): number | null {
  try {
    const p = path.join(process.cwd(), "data/sources/bpstat/euribor-3m-mensal.json");
    const d = JSON.parse(readFileSync(p, "utf8")) as { series: { t: string; v: number }[] };
    return d.series.at(-1)?.v ?? null;
  } catch {
    return null;
  }
}

export default function CasaPage() {
  const eur = euriborAtual();
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Comprar casa</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        O que a casa custa de verdade
      </h1>
      <p className="lede mt-5">
        O preço na placa não é o que pagas. No dia da escritura junta-se o IMT,
        o Imposto de Selo e os registos; nos trinta anos seguintes, os juros.
        Este simulador soma tudo — com as tabelas oficiais de {imt.ano} e a
        Euribor real do Banco de Portugal.
      </p>

      <Figure
        n={1}
        title="Simulador de compra"
        source={`IMT ${imt.ano} — ${imt.fonte}; Euribor — BPstat (Banco de Portugal)`}
      >
        <SimuladorCasa euriborAtual={eur} />
      </Figure>

      <section className="body-copy max-w-2xl py-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">Os impostos da escritura</h2>
        <p>
          <strong>IMT</strong> incide sobre o maior valor entre preço e VPT, em
          escalões — isento até {fmtEUR0(imt.hpp[0].ate ?? 0)} em habitação própria e
          permanente. Com o <strong>IMT Jovem</strong> (≤35 anos, primeira
          casa) a isenção sobe a {fmtEUR0(imt.jovem.isentoAte)}, e entre isso e{" "}
          {fmtEUR0(imt.jovem.limiteBeneficio)} só o excedente tributa a 8 %.{" "}
          <strong>Imposto de Selo</strong>: 0,8 % sobre a compra e 0,6 % sobre
          o crédito. Os registos usam o valor típico do Casa Pronta — nas
          conservatórias avulsas pode diferir.
        </p>
        <p>
          O IMT Jovem isenta também o Imposto de Selo na mesma proporção —
          nunca o IS do crédito. Ilhas e imóveis para arrendamento têm regras
          próprias.
        </p>
      </section>
    </div>
  );
}
