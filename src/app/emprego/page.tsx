import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { loadFonte } from "@/lib/data";
import { fmtPeriodo } from "@/lib/format";
import { m } from "@/lib/messages";
import { JsonLd, dataset } from "@/lib/jsonld";

const Linha = dynamic(() =>
  import("@/components/instrumentos/Linha").then((mo) => mo.Linha)
);
const Mostrador = dynamic(() =>
  import("@/components/instrumentos/Mostrador").then((mo) => mo.Mostrador)
);
const Declive = dynamic(() =>
  import("@/components/instrumentos/Declive").then((mo) => mo.Declive)
);
const Barras = dynamic(() =>
  import("@/components/instrumentos/Barras").then((mo) => mo.Barras)
);

export const metadata: Metadata = {
  title: "Emprego — quem está sem trabalho",
  description:
    "Taxa de desemprego em Portugal e na UE27, desemprego jovem e custo do trabalho — séries oficiais Eurostat, mensais e trimestrais.",
  alternates: { canonical: "/emprego", types: ALT_FEED },
};

/** banda mín–máx dos últimos 10 anos de uma série mensal */
function banda10(pts: { t: string; v: number }[], rotulo: string) {
  const ult = pts.slice(-120).map((p) => p.v);
  if (!ult.length) return undefined;
  return { min: Math.min(...ult), max: Math.max(...ult), rotulo };
}

export default function EmpregoPage() {
  const une = loadFonte("eurostat", "une-pt-total");
  const ue27 = loadFonte("eurostat", "une-ue27-total");
  const jovem = loadFonte("eurostat", "une-pt-jovem");
  const lci = loadFonte("eurostat", "lci-pt-homologo");

  /* o pico vem do próprio dado — o máximo da série, não uma data
     escrita à mão */
  const pico = une?.series.reduce((a, b) => (b.v > a.v ? b : a));
  const evs = [
    ...(pico ? [{ t: pico.t, rotulo: m.emprego.evPico }] : []),
    { t: "2020-03", rotulo: m.emprego.evPandemia },
  ];

  const ultJovem = jovem?.series.at(-1) ?? null;
  const ultUne = une?.series.at(-1) ?? null;

  /* declive 2015 → último mês, PT e UE27 */
  const v2015 = (s: typeof une) => s?.series.find((p) => p.t === "2015-01")?.v;
  const ultUe = ue27?.series.at(-1) ?? null;
  const declive =
    une && ue27 && ultUne && ultUe && v2015(une) && v2015(ue27)
      ? {
          itens: [
            {
              rotulo: m.emprego.declivePt,
              antes: v2015(une)!,
              depois: ultUne.v,
            },
            {
              rotulo: m.emprego.decliveUe,
              antes: v2015(ue27)!,
              depois: ultUe.v,
            },
          ],
          rotulos: ["2015", fmtPeriodo(ultUne.t)] as [string, string],
        }
      : null;

  /* últimos 12 trimestres do custo do trabalho homólogo */
  const lciBarras = lci
    ? lci.series.slice(-12).map((p) => ({
        id: p.t,
        rotulo: fmtPeriodo(p.t),
        valor: p.v,
        t: p.t,
      }))
    : [];

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      {une && (
        <JsonLd
          data={dataset({
            nome: "Desemprego — Portugal e UE27",
            descricao:
              "Taxa de desemprego mensal em Portugal e na UE27, desemprego jovem e custo do trabalho homólogo — Eurostat (une_rt_m, ei_lmlc_q).",
            fontes: [{ nome: "Eurostat", url: une.meta.url }],
            atualizadoEm: une.meta.serieAte,
            licenca:
              "https://ec.europa.eu/eurostat/about/policies/copyright",
            cobertura: `${une.series[0]?.t}/${une.meta.serieAte}`,
          })}
        />
      )}
      <p className="kicker">{m.emprego.kicker}</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        {m.emprego.h1}
      </h1>
      <p className="lede mt-5">{m.emprego.lede}</p>

      <Figure
        title={m.emprego.linhaTitulo}
        source={
          <Source
            nome="Eurostat — une_rt_m"
            url={une?.meta.url}
            serieAte={une?.meta.serieAte}
          />
        }
      >
        {une && ue27 ? (
          <>
            <Linha
              chart={m.chart}
              series={[
                { id: "pt", rotulo: "Portugal", pontos: une.series },
                { id: "ue27", rotulo: "UE27", pontos: ue27.series },
              ]}
              unidade="%"
              eventos={evs}
              banda={banda10(une.series, "mín–máx 10 anos")}
              equivalente="tabela"
              titulo={m.emprego.linhaTitulo}
            />
            <p className="footnote mt-2">{m.emprego.linhaNota}</p>
          </>
        ) : (
          <p className="footnote">
            Série Eurostat indisponível — sem dados oficiais não há gráfico.
          </p>
        )}
      </Figure>

      <Figure
        title={m.emprego.jovemTitulo}
        source={
          <Source
            nome="Eurostat — une_rt_m (15–24)"
            url={jovem?.meta.url}
            serieAte={jovem?.meta.serieAte}
          />
        }
      >
        {ultJovem && ultUne ? (
          <>
            <Mostrador
              valor={ultJovem.v}
              unidade="%"
              min={0}
              max={50}
              mediana={{ valor: ultUne.v, rotulo: "total PT" }}
              rotulo={m.emprego.jovemRotulo}
              t={ultJovem.t}
            />
            <p className="footnote mt-2">{m.emprego.jovemNota}</p>
          </>
        ) : (
          <p className="footnote">Série indisponível.</p>
        )}
      </Figure>

      <Figure
        title={m.emprego.decliveTitulo}
        source={
          <Source
            nome="Eurostat — une_rt_m"
            url={une?.meta.url}
            serieAte={une?.meta.serieAte}
          />
        }
      >
        {declive ? (
          <Declive
            itens={declive.itens}
            rotulos={declive.rotulos}
            unidade="%"
            titulo={m.emprego.decliveTitulo}
          />
        ) : (
          <p className="footnote">Indisponível sem dados.</p>
        )}
      </Figure>

      <Figure
        title={m.emprego.lciTitulo}
        source={
          <Source
            nome="Eurostat — ei_lmlc_q"
            url={lci?.meta.url}
            serieAte={lci?.meta.serieAte}
          />
        }
      >
        {lciBarras.length > 0 ? (
          <>
            <Barras
              itens={lciBarras}
              unidade="%"
              ordenar="tempo"
              titulo={m.emprego.lciTitulo}
            />
            <p className="footnote mt-2">{m.emprego.lciNota}</p>
          </>
        ) : (
          <p className="footnote">Série indisponível.</p>
        )}
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">E depois?</h2>
        <p>
          Sem trabalho, o apoio é o subsídio de desemprego — simula-o em{" "}
          <a href="/trabalho" className="underline decoration-line2 underline-offset-2">
            Trabalho
          </a>
          . Com trabalho, o recibo explica-se em{" "}
          <a href="/salario" className="underline decoration-line2 underline-offset-2">
            Salário
          </a>
          .
        </p>
      </section>
    </div>
  );
}
