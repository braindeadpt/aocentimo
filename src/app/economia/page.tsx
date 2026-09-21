import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { loadFonte, loadSerie } from "@/lib/data";
import { fmtPeriodo } from "@/lib/format";
import { m } from "@/lib/messages";
import { JsonLd, dataset } from "@/lib/jsonld";

const Linha = dynamic(() =>
  import("@/components/instrumentos/Linha").then((mo) => mo.Linha)
);
const Barras = dynamic(() =>
  import("@/components/instrumentos/Barras").then((mo) => mo.Barras)
);
const Multiplos = dynamic(() =>
  import("@/components/instrumentos/Multiplos").then((mo) => mo.Multiplos)
);

export const metadata: Metadata = {
  title: "Economia — PIB, confiança e electricidade",
  description:
    "PIB homólogo trimestral, confiança dos consumidores, electricidade doméstica e desemprego — séries oficiais Eurostat.",
  alternates: { canonical: "/economia", types: ALT_FEED },
};

/** banda mín–máx dos últimos 10 anos */
function banda10(pts: { t: string; v: number }[], rotulo: string) {
  const ult = pts.slice(-120).map((p) => p.v);
  if (!ult.length) return undefined;
  return { min: Math.min(...ult), max: Math.max(...ult), rotulo };
}

export default function EconomiaPage() {
  const pib = loadFonte("eurostat", "pib-pt-homologo");
  const conf = loadFonte("eurostat", "confianca-pt");
  const elec = loadFonte("eurostat", "elec-pt-domestico");
  const une = loadFonte("eurostat", "une-pt-total");
  const cp00 = loadSerie("cp00");

  const pibBarras = pib
    ? pib.series.slice(-16).map((p) => ({
        id: p.t,
        rotulo: fmtPeriodo(p.t),
        valor: p.v,
        t: p.t,
      }))
    : [];

  const elecBarras = elec
    ? elec.series.map((p) => ({
        id: p.t,
        rotulo: fmtPeriodo(p.t),
        valor: p.v,
        t: p.t,
      }))
    : [];

  /* inflação homóloga para o múltiplo — a série oficial é o índice;
     a taxa deriva-se ponto a ponto (v / v[-12]) */
  const hicpHom =
    cp00 && cp00.series.length > 12
      ? cp00.series
          .slice(12)
          .map((p, i) => ({
            t: p.t,
            v: (p.v / cp00.series[i].v - 1) * 100,
          }))
      : [];

  const multiplos = [
    ...(pib
      ? [{ id: "pib", rotulo: m.economia.pibRotulo, pontos: pib.series }]
      : []),
    ...(conf
      ? [{ id: "conf", rotulo: m.economia.confRotulo, pontos: conf.series }]
      : []),
    ...(une
      ? [{ id: "une", rotulo: m.economia.uneRotulo, pontos: une.series }]
      : []),
    ...(hicpHom.length
      ? [{ id: "hicp", rotulo: m.economia.hicpRotulo, pontos: hicpHom }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      {pib && (
        <JsonLd
          data={dataset({
            nome: "Economia portuguesa — PIB, confiança, electricidade",
            descricao:
              "PIB em volume homólogo, confiança dos consumidores, preço da electricidade doméstica e desemprego — Eurostat (namq_10_gdp, ei_bsci_m_r2, nrg_pc_204, une_rt_m).",
            fontes: [{ nome: "Eurostat", url: pib.meta.url }],
            atualizadoEm: pib.meta.serieAte,
            licenca:
              "https://ec.europa.eu/eurostat/about/policies/copyright",
            cobertura: `${pib.series[0]?.t}/${pib.meta.serieAte}`,
          })}
        />
      )}
      <p className="kicker">{m.economia.kicker}</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        {m.economia.h1}
      </h1>
      <p className="lede mt-5">{m.economia.lede}</p>

      <Figure
        title={m.economia.pibTitulo}
        source={
          <Source
            nome="Eurostat — namq_10_gdp"
            url={pib?.meta.url}
            serieAte={pib?.meta.serieAte}
          />
        }
      >
        {pibBarras.length > 0 ? (
          <Barras
            itens={pibBarras}
            unidade="%"
            ordenar="tempo"
            titulo={m.economia.pibTitulo}
          />
        ) : (
          <p className="footnote">
            Série Eurostat indisponível — sem dados oficiais não há gráfico.
          </p>
        )}
      </Figure>

      <Figure
        title={m.economia.confTitulo}
        source={
          <Source
            nome="Eurostat — ei_bsci_m_r2"
            url={conf?.meta.url}
            serieAte={conf?.meta.serieAte}
          />
        }
      >
        {conf ? (
          <>
            <Linha
              chart={m.chart}
              series={[
                {
                  id: "conf",
                  rotulo: m.economia.confRotulo,
                  pontos: conf.series,
                },
              ]}
              unidade="saldo"
              banda={banda10(conf.series, "mín–máx 10 anos")}
              refLinha={{ valor: 0, rotulo: "acima = optimismo" }}
              equivalente="tabela"
              titulo={m.economia.confTitulo}
            />
            <p className="footnote mt-2">{m.economia.confNota}</p>
          </>
        ) : (
          <p className="footnote">Série indisponível.</p>
        )}
      </Figure>

      <Figure
        title={m.economia.elecTitulo}
        source={
          <Source
            nome="Eurostat — nrg_pc_204"
            url={elec?.meta.url}
            serieAte={elec?.meta.serieAte}
          />
        }
      >
        {elecBarras.length > 0 ? (
          <>
            <Barras
              itens={elecBarras}
              unidade="€/kWh"
              ordenar="tempo"
              titulo={m.economia.elecTitulo}
            />
            <p className="footnote mt-2">{m.economia.elecNota}</p>
          </>
        ) : (
          <p className="footnote">Série indisponível.</p>
        )}
      </Figure>

      <Figure
        title={m.economia.multiplosTitulo}
        source={
          <Source
            nome="Eurostat — namq_10_gdp, ei_bsci_m_r2, une_rt_m, prc_hicp_midx"
            url={pib?.meta.url}
            serieAte={pib?.meta.serieAte}
          />
        }
      >
        {multiplos.length > 0 ? (
          <>
            <Multiplos
              chart={m.chart}
              series={multiplos}
              colunas={4}
              unidade=""
              eixoComum={false}
              janela={10}
              titulo={m.economia.multiplosTitulo}
            />
            <p className="footnote mt-2">{m.economia.multiplosNota}</p>
          </>
        ) : (
          <p className="footnote">Indisponível sem dados.</p>
        )}
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">E depois?</h2>
        <p>
          A inflação que corrói esse crescimento está em{" "}
          <a href="/inflacao" className="underline decoration-line2 underline-offset-2">
            Inflação
          </a>
          ; quem fica de fora do PIB conta-se em{" "}
          <a href="/emprego" className="underline decoration-line2 underline-offset-2">
            Emprego
          </a>
          .
        </p>
      </section>
    </div>
  );
}
