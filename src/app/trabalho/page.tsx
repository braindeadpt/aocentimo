import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Leitura } from "@/components/Leitura";
import { Source } from "@/components/Source";
import { SimuladorDesemprego } from "./SimuladorDesemprego";
import { SimuladorIndependente } from "./SimuladorIndependente";
import desemprego from "@data/fiscal/desemprego.json";
import catb from "@data/fiscal/catb.json";
import { loadFonte, loadFreshness } from "@/lib/data";
import { fmtNum, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  janela10,
  rotulosLeitura,
  type Cartao,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Subsídio de desemprego — quanto e por quanto tempo",
  description:
    "Simulador do subsídio de desemprego em Portugal: 65% da remuneração de referência, limites do IAS, duração por idade e descontos.",
  alternates: { canonical: "/trabalho", types: ALT_FEED },
};

export default function TrabalhoPage() {
  const rotulos = rotulosLeitura();
  const fresh = loadFreshness();

  // ————— o dado do país na página do trabalho: desemprego PT com a
  // média europeia como série de referência por baixo —————
  const unePt = loadFonte("eurostat", "une-pt-total");
  const uneUe = loadFonte("eurostat", "une-ue27-total");
  const seriePt = unePt ? janela10(unePt.series) : [];
  const serieUe = uneUe ? janela10(uneUe.series) : [];
  const ultPt = seriePt[seriePt.length - 1];
  const ultUe = serieUe[serieUe.length - 1];
  const cartao: Cartao | null =
    unePt && ultPt && ultUe
      ? {
          breadcrumb: m.painel.cartoes.desemprego.breadcrumb,
          titulo: m.painel.cartoes.desemprego.titulo,
          insight: t(m.painel.insightUe, {
            abs: fmtNum(Math.abs(ultPt.v - ultUe.v), 1),
            direcao: ultPt.v >= ultUe.v ? m.painel.acima : m.painel.abaixo,
          }),
          valor: ultPt.v,
          unidade: "%",
          formato: "pct1",
          serie: seriePt,
          referencia: { pontos: serieUe, rotulo: m.leitura.ue27 },
          anotacao: anotacaoDe(seriePt, "max", (v) => `${fmtNum(v, 1)} %`),
          leitura: fmtPeriodo(unePt.meta.serieAte),
          estado: estadoDe(fresh, "une-pt-total"),
          fonteNome: unePt.meta.fonte,
          fonteUrl: unePt.meta.url,
          href: "/trabalho",
          hrefJson: "/api/une-pt-total.json",
          amplo: true,
        }
      : null;

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
      <h1 className="titulo-pagina">
        Se ficares sem trabalho
      </h1>
      <p className="lede mt-5">
        Os 11 % que descontas todos os meses pagam isto: se perderes o emprego
        de forma involuntária, a Segurança Social devolve-te uma parte — 65 %
        da tua remuneração de referência, dentro de limites e por tempo
        contado.
      </p>

      {cartao && (
        <div className="mt-8">
          <Leitura {...cartao} rotulos={rotulos} />
        </div>
      )}

      <Figure
        title="Simulador de subsídio de desemprego"
        source={<Source nome={desemprego.fonte} vigencia={desemprego.vigencia} />}
      >
        <SimuladorDesemprego />
      </Figure>

      <Figure
        title="Recibos verdes — da faturação ao bolso"
        source={<Source nome={catb.fonte} vigencia={catb.vigencia} />}
      >
        <SimuladorIndependente />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-display-sm text-ink">O que a simulação simplifica</h2>
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
