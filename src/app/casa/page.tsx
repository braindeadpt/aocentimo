import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { Leitura } from "@/components/Leitura";
import { EstadoVazio } from "@/components/EstadoVazio";
import { SimuladorCasa } from "./SimuladorCasa";
import { loadFonte, loadDerivado, loadFreshness } from "@/lib/data";
import { comUnidade, fmtEUR0, fmtNum, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  homologa,
  janela10,
  rotulosLeitura,
  type Cartao,
  type Ponto,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import { readFileSync } from "fs";
import path from "path";
import imt from "@data/fiscal/imt-2026.json";
import { JsonLd, webApplication } from "@/lib/jsonld";
import { TituloPagina } from "@/components/Voo";

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

/** derivado casa-em-salarios: índice de preços da habitação ÷ custo do
    trabalho reindexado (2015=100) — razão de índices, não salários reais */
interface CasaSalarios {
  meta: { fonte: string; url: string; serieAte: string };
  series: Ponto[];
}

export default function CasaPage() {
  const eur = euriborAtual();
  const rotulos = rotulosLeitura();
  const fresh = loadFreshness();

  // ————— o preço das casas como instrumento: índice Eurostat da
  //   habitação em taxa homóloga (série trimestral, passo 4) —————
  const hpi = loadFonte("eurostat", "hpi-pt");
  const serieHpi = hpi ? janela10(homologa(hpi.series, 4)) : [];
  const ultHpi = serieHpi[serieHpi.length - 1];
  const cartao: Cartao | null =
    hpi && ultHpi
      ? {
          breadcrumb: m.painel.cartoes.habitacao.breadcrumb,
          titulo: m.painel.cartoes.habitacao.titulo,
          insight: t(m.painel.insightHabitacao, {
            direcao: ultHpi.v >= 0 ? m.painel.subiu : m.painel.desceu,
            v: fmtNum(Math.abs(ultHpi.v), 1),
          }),
          valor: ultHpi.v,
          unidade: "%",
          formato: "pct1",
          serie: serieHpi,
          anotacao: anotacaoDe(serieHpi, "max", (v) => `${comUnidade(fmtNum(v, 1), "%")}`),
          leitura: fmtPeriodo(ultHpi.t),
          estado: estadoDe(fresh, "hpi-pt"),
          fonteNome: hpi.meta.fonte,
          fonteUrl: hpi.meta.url,
          href: "/casa",
          hrefJson: "/api/hpi-pt.json",
          amplo: true,
        }
      : null;

  // a razão casa/trabalho — a conclusão do derivado, em prosa curta
  const razao = loadDerivado<CasaSalarios>("casa-em-salarios");
  const ultRazao = razao?.series.at(-1) ?? null;

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
      <TituloPagina rota="/casa">O que a casa custa de verdade</TituloPagina>
      <p className="lede mt-5">
        O preço na placa não é o que pagas. No dia da escritura junta-se o IMT,
        o Imposto de Selo e os registos; nos trinta anos seguintes, os juros.
        Este simulador soma tudo — com as tabelas oficiais de {imt.ano} e a
        Euribor real do Banco de Portugal.
      </p>

      {/* o índice de preços da habitação em leitura — homóloga do
          trimestre; a razão casa/trabalho fica em prosa por baixo */}
      {cartao ? (
        <div className="mt-8">
          <Leitura {...cartao} rotulos={rotulos} />
          {razao && ultRazao && (
            <p className="footnote mt-3">
              Face ao custo do trabalho, a casa está{" "}
              {comUnidade(fmtNum(Math.abs(ultRazao.v - 100), 0), "%")}{" "}
              {ultRazao.v >= 100 ? "acima" : "abaixo"} do nível de 2015
              ({fmtPeriodo(ultRazao.t)} — razão de índices Eurostat, não
              salários reais).
            </p>
          )}
        </div>
      ) : (
        // a falha mostra-se no lugar do instrumento — nunca um buraco
        <div className="mt-8">
          <EstadoVazio
            titulo="o índice de preços da habitação"
            falha={m.estados.serieFalhou}
            desde={
              hpi?.meta.serieAte ? fmtPeriodo(hpi.meta.serieAte) : undefined
            }
            fonte={{
              nome: hpi?.meta.fonte ?? "Eurostat",
              url: hpi?.meta.url ?? "https://ec.europa.eu/eurostat",
            }}
          />
        </div>
      )}

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

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-display-sm text-ink">Os impostos da escritura</h2>
        <p>
          <strong>IMT</strong> incide sobre o maior valor entre preço e VPT, em
          escalões — isento até {fmtEUR0(imt.hpp[0].ate ?? 0)} em habitação própria e
          permanente. Com o <strong>IMT Jovem</strong> (≤35 anos, primeira
          casa) a isenção sobe a {fmtEUR0(imt.jovem.isentoAte)}, e entre isso e{" "}
          {fmtEUR0(imt.jovem.limiteBeneficio)} só o excedente tributa a 8 %.{" "}
          <strong>Imposto de Selo</strong>: 0,8 % sobre a compra e 0,6 % sobre
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
