import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Delta } from "@/components/Delta";
import { DecomposicaoFuel } from "../impostos/DecomposicaoFuel";
import { Source } from "@/components/Source";
import { loadFonte, type Serie } from "@/lib/data";
import { fmtData } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { Odometer } from "@/components/Odometer";
import isp from "@data/fiscal/isp.json";
import iva from "@data/fiscal/iva.json";
import eventos from "@data/fiscal/eventos.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

const Calendario = dynamic(() =>
  import("@/components/instrumentos/Calendario").then((mo) => mo.Calendario)
);
const Linha = dynamic(() =>
  import("@/components/instrumentos/Linha").then((mo) => mo.Linha)
);

export const metadata: Metadata = {
  title: "Preços — combustíveis dia a dia",
  description:
    "Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG.",
  alternates: { canonical: "/precos", types: ALT_FEED },
};

const COMBUSTIVEIS: [string, string][] = [
  ["pmd-gasoleo-diario", "Gasóleo simples"],
  ["pmd-gasolina95-diario", "Gasolina 95"],
  ["pmd-gpl-diario", "GPL auto"],
];

function varDias(s: Serie, dias: number): number | null {
  const alvo = s.series[s.series.length - 1];
  const alvoMs = Date.parse(alvo.t);
  // último ponto com pelo menos `dias` dias de distância
  const anterior = [...s.series].reverse().find(
    (p) => alvoMs - Date.parse(p.t) >= dias * 86_400_000
  );
  if (!anterior || anterior.v === 0) return null;
  return alvo.v / anterior.v - 1;
}

export default function PrecosPage() {
  const series = COMBUSTIVEIS.map(([id, nome]) => ({
    id,
    nome,
    serie: loadFonte("dgeg", id),
  }));
  const temDados = series.every((s) => s.serie !== null);
  const ultimo = series[0].serie?.meta.serieAte;
  // janela do gráfico: desde 2022 — a guerra, o desconto do ISP e o
  // pico são a história; 12 meses escondiam os eventos que a explicam
  const corte = "2022-01-01";

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Decomposição do preço dos combustíveis",
          "/precos",
          "Decomposição do preço dos combustíveis em Portugal: ISP, taxa de carbono, IVA e margens — dados DGEG."
        )}
      />
      <p className="kicker">Preços oficiais, quase diários</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Quanto custa o litro hoje?
      </h1>
      <p className="lede mt-5">
        A gasolina e o gasóleo são os únicos bens essenciais em Portugal com
        preços oficiais publicados quase diariamente — pela DGEG. É aqui que a
        variação diária e semanal faz sentido; para os outros bens, a inflação
        oficial é mensal (vê <a href="/inflacao" className="underline decoration-line2 underline-offset-2">Inflação</a>).
      </p>

      <Figure
        title="Preço médio nacional, por litro"
        source={
          <Source
            nome="DGEG — preços médios diários"
            url={series[0].serie?.meta.url ?? "https://precoscombustiveis.dgeg.gov.pt"}
            serieAte={ultimo}
          />
        }
      >
        {temDados ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line mb-6">
              {series.map(({ id, nome, serie }) => {
                const p = serie!.series[serie!.series.length - 1];
                return (
                  <div key={id} className="bg-panel px-4 py-4">
                    <p className="kicker">{nome}</p>
                    {/* contador da bomba — rodas mecânicas por dígito;
                        rolamento só na revelação abaixo da dobra (M-09) */}
                    <p className="num-read mt-1">
                      <Odometer valor={p.v} casas={3} sufixo=" €/L" />
                    </p>
                    <p className="text-xs text-muted mt-1 flex gap-3">
                      <span>sem <Delta value={varDias(serie!, 7)} casas={1} /></span>
                      <span>ano <Delta value={varDias(serie!, 365)} casas={1} /></span>
                    </p>
                  </div>
                );
              })}
            </div>
            <Linha
              chart={m.chart}
              series={series.map(({ nome, serie }) => ({
                id: nome,
                rotulo: nome,
                pontos: serie!.series.filter((p) => !corte || p.t >= corte!),
              }))}
              unidade="€"
              eventos={eventos.eventos.filter((e) => e.alvo === "combustiveis")}
              equivalente="tabela"
              titulo="Gasóleo e gasolina — série diária"
            />
          </>
        ) : (
          <div className="border border-line bg-panel px-5 py-10 text-center">
            <p className="num-read text-muted">—</p>
            <p className="footnote mt-3 max-w-md mx-auto">
              Dados DGEG indisponíveis — corre{" "}
              <code className="num">npm run ingest:daily</code>. Nenhum número
              inventado: a honestidade é a regra nº 1 deste site.
            </p>
          </div>
        )}
      </Figure>

      {/* D-03 — cada dia em calendário: o ano corrente e o anterior,
          cor por quantis reais da série. A nota ISP fica datada por
          baixo — o desconto de 2022 explica o que se lê no mapa */}
      {(
        [
          ["pmd-gasoleo-diario", m.precosPag.calGasoleo],
          ["pmd-gasolina95-diario", m.precosPag.calGasolina],
        ] as const
      ).map(([id, titulo]) => {
        const serie = series.find((s) => s.id === id)?.serie;
        const ultimoDia = serie?.series.at(-1);
        const ano = ultimoDia ? Number(ultimoDia.t.slice(0, 4)) : null;
        const ispEvento = eventos.eventos.find((e) => e.id === "isp-desconto");
        return (
          <Figure
            key={id}
            title={titulo}
            source={
              <Source
                nome="DGEG — preços médios diários"
                url={serie?.meta.url}
                serieAte={serie?.meta.serieAte}
              />
            }
          >
            {serie && ano ? (
              <>
                <Calendario
                  chart={m.chart}
                  pontos={serie.series}
                  anos={[ano - 1, ano]}
                  unidade="€/L"
                  titulo={titulo}
                />
                {ispEvento && (
                  <p className="footnote mt-3">
                    {t(m.precosPag.notaIsp, {
                      data: fmtData(ispEvento.t),
                      rotulo: ispEvento.rotulo,
                      detalhe: ispEvento.detalhe,
                    })}{" "}
                    <a
                      href={ispEvento.url}
                      className="underline decoration-line2 underline-offset-2"
                    >
                      {ispEvento.fonte}
                    </a>
                  </p>
                )}
              </>
            ) : (
              <p className="footnote">
                Série DGEG indisponível — sem dados oficiais não há mapa.
              </p>
            )}
          </Figure>
        );
      })}

      <Figure
        title="Enquanto isso: quanto do litro é imposto?"
        source={
          <Source
            nome={isp.fonte}
            vigencia={isp.vigencia}
            nota={`IVA — ${iva.fonte} · vigente ${fmtData(iva.vigencia)}`}
          />
        }
      >
        <DecomposicaoFuel />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">Porque não há preços de supermercado aqui</h2>
        <p>
          Não existe uma API oficial com o preço do leite ou do pão em cada
          loja, ao longo do tempo. O Estado publica índices (o que está na
          página de Inflação), não tickets de caixa. Preços por produto exigem
          crowdsourcing ou recolha própria — está no plano, com fonte e
          metodologia explícitas, nunca disfarçado de dado oficial.
        </p>
      </section>
    </div>
  );
}
