import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { Declive } from "@/components/instrumentos/Declive";
import { SimuladorCasa } from "./SimuladorCasa";
import { fmtEUR0, fmtNum, fmtPeriodo } from "@/lib/format";
import { loadDerivado, loadFonte } from "@/lib/data";
import { m, t } from "@/lib/messages";
import { readFileSync } from "fs";
import path from "path";
import imt from "@data/fiscal/imt-2026.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Comprar casa — IMT, Imposto de Selo e prestação",
  description:
    "O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual do Banco de Portugal.",
  alternates: { canonical: "/casa", types: ALT_FEED },
};

/** Último ponto da Euribor 3M mensal recolhido do BPstat. */
function euriborAtual(): { valor: number; ate: string } | null {
  try {
    const p = path.join(process.cwd(), "data/sources/bpstat/euribor-3m-mensal.json");
    const d = JSON.parse(readFileSync(p, "utf8")) as { series: { t: string; v: number }[] };
    const u = d.series.at(-1);
    return u ? { valor: u.v, ate: u.t } : null;
  } catch {
    return null;
  }
}

type DerivadoRazao = {
  meta: { serieAte: string; fontes: string[]; formula: string };
  series: { t: string; v: number }[];
};

export default function CasaPage() {
  const eur = euriborAtual();

  /* D-02 — «a casa contra o salário»: HPI e LCI reindexados a
     2015=100. O índice do LCI vem da razão derivada (casa-em-salarios
     = HPI ÷ LCI) — nunca inventamos o nível, derivamo-lo da fórmula
     documentada no meta do derivado */
  const hpi = loadFonte("eurostat", "hpi-pt");
  const razao = loadDerivado<DerivadoRazao>("casa-em-salarios");
  const hpiUlt = hpi?.series.at(-1) ?? null;
  const razaoUlt = razao?.series.at(-1) ?? null;
  const lciIdx =
    hpiUlt && razaoUlt ? (hpiUlt.v * 100) / razaoUlt.v : null;
  const declive =
    hpiUlt && razao && razaoUlt && lciIdx
      ? {
          itens: [
            { rotulo: m.casa.hpi, antes: 100, depois: hpiUlt.v },
            { rotulo: m.casa.lci, antes: 100, depois: lciIdx },
          ],
          rotulos: ["2015", fmtPeriodo(razaoUlt.t)] as [string, string],
          vezes: razaoUlt.v / 100,
        }
      : null;
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Custo de comprar casa — simulador",
          "/casa",
          "O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual."
        )}
      />
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
        title="Simulador de compra"
        source={
          <Source
            nome={`IMT — ${imt.fonte}; Euribor 3M — BPstat (Banco de Portugal)`}
            vigencia={imt.vigencia}
            serieAte={eur?.ate}
          />
        }
      >
        <SimuladorCasa euriborAtual={eur?.valor ?? null} />
      </Figure>

      {/* D-02 — a casa contra o salário: os dois índices oficiais
          reindexados a 2015=100, lado a lado */}
      <Figure
        title={m.casa.contraSalarioTitulo}
        source={
          <Source
            nome="Eurostat — prc_hpi_q ÷ ei_lmlc_q"
            url={razao?.meta.fontes[0]}
            serieAte={razao?.meta.serieAte}
          />
        }
      >
        {declive ? (
          <>
            <Declive
              itens={declive.itens}
              rotulos={declive.rotulos}
              unidade=""
              titulo={m.casa.contraSalarioTitulo}
            />
            <p className="num mt-3 text-lg tabular-nums">
              {t(m.casa.contraSalario, { x: fmtNum(declive.vezes, 1) })}
            </p>
            <p className="footnote mt-2">{m.casa.contraSalarioNota}</p>
          </>
        ) : (
          <p className="footnote">Indisponível sem dados.</p>
        )}
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
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
