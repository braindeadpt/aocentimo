import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { loadDerivado, loadFonte } from "@/lib/data";
import { fmtNum, fmtPeriodo } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { JsonLd, dataset } from "@/lib/jsonld";

const Linha = dynamic(() =>
  import("@/components/instrumentos/Linha").then((mo) => mo.Linha)
);
const Declive = dynamic(() =>
  import("@/components/instrumentos/Declive").then((mo) => mo.Declive)
);
const Barras = dynamic(() =>
  import("@/components/instrumentos/Barras").then((mo) => mo.Barras)
);

export const metadata: Metadata = {
  title: "Habitação — o índice de preços contra o salário",
  description:
    "Índice de preços da habitação (HPI) em Portugal desde 2008, contra o custo do trabalho — séries oficiais Eurostat.",
  alternates: { canonical: "/habitacao", types: ALT_FEED },
};

type DerivadoRazao = {
  meta: { serieAte: string; fontes: string[]; formula: string };
  series: { t: string; v: number }[];
};

export default function HabitacaoPage() {
  const hpi = loadFonte("eurostat", "hpi-pt");
  const razao = loadDerivado<DerivadoRazao>("casa-em-salarios");

  /* declive 2015→último trimestre: o nível do LCI nunca é inventado —
     vem da razão oficial (HPI ÷ LCI) documentada no meta do derivado */
  const hpiUlt = hpi?.series.at(-1) ?? null;
  const razaoUlt = razao?.series.at(-1) ?? null;
  const lciIdx =
    hpiUlt && razaoUlt ? (hpiUlt.v * 100) / razaoUlt.v : null;
  const declive =
    hpiUlt && razao && razaoUlt && lciIdx
      ? {
          itens: [
            { rotulo: m.habitacao.hpiRotulo, antes: 100, depois: hpiUlt.v },
            { rotulo: m.habitacao.lciRotulo, antes: 100, depois: lciIdx },
          ],
          rotulos: ["2015", fmtPeriodo(razaoUlt.t)] as [string, string],
          vezes: razaoUlt.v / 100,
        }
      : null;

  /* banda mín–máx de toda a série HPI */
  const banda = hpi
    ? {
        min: Math.min(...hpi.series.map((p) => p.v)),
        max: Math.max(...hpi.series.map((p) => p.v)),
        rotulo: "mín–máx desde 2008",
      }
    : undefined;

  /* variação homóloga trimestral do HPI — últimos 16 trimestres */
  const homologas =
    hpi && hpi.series.length > 4
      ? hpi.series
          .slice(4)
          .map((p, i) => ({
            id: p.t,
            rotulo: fmtPeriodo(p.t),
            valor: (p.v / hpi.series[i].v - 1) * 100,
            t: p.t,
          }))
          .slice(-16)
      : [];

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      {hpi && (
        <JsonLd
          data={dataset({
            nome: "Preços da habitação — Portugal",
            descricao:
              "Índice de preços da habitação (HPI, 2015=100) em Portugal e razão contra o custo do trabalho — Eurostat (prc_hpi_q, ei_lmlc_q).",
            fontes: [{ nome: "Eurostat", url: hpi.meta.url }],
            atualizadoEm: hpi.meta.serieAte,
            licenca:
              "https://ec.europa.eu/eurostat/about/policies/copyright",
            cobertura: `${hpi.series[0]?.t}/${hpi.meta.serieAte}`,
          })}
        />
      )}
      <p className="kicker">{m.habitacao.kicker}</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        {m.habitacao.h1}
      </h1>
      <p className="lede mt-5">{m.habitacao.lede}</p>

      <Figure
        title={m.habitacao.hpiTitulo}
        source={
          <Source
            nome="Eurostat — prc_hpi_q"
            url={hpi?.meta.url}
            serieAte={hpi?.meta.serieAte}
          />
        }
      >
        {hpi ? (
          <>
            <Linha
              chart={m.chart}
              series={[
                {
                  id: "hpi",
                  rotulo: m.habitacao.hpiRotulo,
                  pontos: hpi.series,
                },
              ]}
              unidade="índice"
              eventos={[
                { t: "2020-Q2", rotulo: m.habitacao.evPandemia },
                { t: "2022-Q3", rotulo: m.habitacao.evEuribor },
              ]}
              banda={banda}
              equivalente="tabela"
              titulo={m.habitacao.hpiTitulo}
            />
            <p className="footnote mt-2">{m.habitacao.hpiNota}</p>
          </>
        ) : (
          <p className="footnote">
            Série Eurostat indisponível — sem dados oficiais não há gráfico.
          </p>
        )}
      </Figure>

      <Figure
        title={m.habitacao.decliveTitulo}
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
              titulo={m.habitacao.decliveTitulo}
            />
            <p className="num mt-3 text-lg tabular-nums">
              {t(m.habitacao.decliveConclusao, {
                x: fmtNum(declive.vezes, 1),
              })}
            </p>
            <p className="footnote mt-2">{m.habitacao.decliveNota}</p>
          </>
        ) : (
          <p className="footnote">Indisponível sem dados.</p>
        )}
      </Figure>

      <Figure
        title={m.habitacao.barrasTitulo}
        source={
          <Source
            nome="Eurostat — prc_hpi_q"
            url={hpi?.meta.url}
            serieAte={hpi?.meta.serieAte}
          />
        }
      >
        {homologas.length > 0 ? (
          <Barras
            itens={homologas}
            unidade="%"
            ordenar="tempo"
            titulo={m.habitacao.barrasTitulo}
          />
        ) : (
          <p className="footnote">Série indisponível.</p>
        )}
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">
          O que este índice não diz
        </h2>
        <p>{m.habitacao.metodologiaNota}</p>
        <p>
          Para a prestação do crédito vê{" "}
          <a href="/credito" className="underline decoration-line2 underline-offset-2">
            Crédito
          </a>
          ; para IMT e o simulador de compra,{" "}
          <a href="/casa" className="underline decoration-line2 underline-offset-2">
            Casa
          </a>
          .
        </p>
      </section>
    </div>
  );
}
