import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Cartao } from "@/components/Cartao";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Haltere } from "@/components/Haltere";
import { LineChart } from "@/components/LineChart";
import { Odometer } from "@/components/Odometer";
import { Source } from "@/components/Source";
import { loadFonte, loadFreshness, type Serie } from "@/lib/data";
import { fmtData, fmtEUR, fmtLitro } from "@/lib/format";
import { estadoDe, rotulosLeitura } from "@/lib/leitura";
import { m } from "@/lib/messages";
import isp from "@data/fiscal/isp.json";
import eventos from "@data/fiscal/eventos.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Preços — combustíveis dia a dia",
  description:
    "Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG.",
  alternates: { canonical: "/precos", types: ALT_FEED },
};

const COMBUSTIVEIS: {
  id: string;
  rotulo: string;
  rotuloCurto: string;
}[] = [
  { id: "pmd-gasoleo-diario", rotulo: m.leitura.combustiveis.gasoleo.titulo, rotuloCurto: "Gasóleo" },
  { id: "pmd-gasolina95-diario", rotulo: m.leitura.combustiveis.gasolina95.titulo, rotuloCurto: "Gasolina" },
  { id: "pmd-gpl-diario", rotulo: m.leitura.combustiveis.gpl.titulo, rotuloCurto: "GPL" },
];

/** variação absoluta (€/L) entre o último ponto e o ponto com pelo
    menos `dias` dias de distância — em cêntimos multiplica-se por 100 */
function deltaDias(s: Serie, dias: number): number | null {
  const alvo = s.series[s.series.length - 1];
  const alvoMs = Date.parse(alvo.t);
  const anterior = [...s.series].reverse().find(
    (p) => alvoMs - Date.parse(p.t) >= dias * 86_400_000
  );
  return anterior ? alvo.v - anterior.v : null;
}

/** o ponto com pelo menos `dias` dias de distância do último — para o
    haltere «semana passada ● ○ hoje» */
function pontoDias(s: Serie, dias: number) {
  const alvo = s.series[s.series.length - 1];
  const alvoMs = Date.parse(alvo.t);
  return (
    [...s.series].reverse().find(
      (p) => alvoMs - Date.parse(p.t) >= dias * 86_400_000
    ) ?? null
  );
}

/** mínimo/máximo da série com a data — para «a série em números» */
function extremos(s: Serie) {
  const min = s.series.reduce((b, p) => (p.v < b.v ? p : b), s.series[0]);
  const max = s.series.reduce((b, p) => (p.v > b.v ? p : b), s.series[0]);
  return { min, max };
}

export default function PrecosPage() {
  const fresh = loadFreshness();
  const rotulos = rotulosLeitura();

  const series = COMBUSTIVEIS.map((c) => ({
    ...c,
    s: loadFonte("dgeg", c.id),
  }));
  const gasoleo = series[0].s;
  const ult = gasoleo?.series[gasoleo.series.length - 1] ?? null;

  /* ————— nível 1 — o depósito: 50 L de gasóleo ao PMD de hoje ————— */
  const LITROS = 50;
  const custo50 = ult ? ult.v * LITROS : null;
  const d7 = gasoleo ? deltaDias(gasoleo, 7) : null;
  const d7eur = d7 !== null && d7 !== undefined ? d7 * LITROS : null;
  const fraseDeposito =
    custo50 === null
      ? "O preço médio do gasóleo não chegou da fonte — vê a falha abaixo."
      : d7eur === null
        ? `Encher ${LITROS} litros de gasóleo custa hoje ${fmtEUR(custo50)}.`
        : Math.abs(d7eur) < 0.005
          ? `Encher ${LITROS} litros de gasóleo custa hoje ${fmtEUR(custo50)} — o mesmo que há uma semana.`
          : `Encher ${LITROS} litros de gasóleo custa hoje ${fmtEUR(
              custo50
            )} — ${d7eur > 0 ? "mais" : "menos"} ${fmtEUR(
              Math.abs(d7eur)
            )} do que há uma semana.`;

  /* ————— nível 2 — a linha diária desde jan 2021 (a janela que cobre
     o evento anotado) e o haltere semana passada ● ○ hoje ————— */
  const DESDE_LINHA = "2021-01-01";
  const linhaOk = series.every(({ s }) => s && s.series.length > 1);
  const estadoLinha = series.some(
    ({ s }) => s && estadoDe(fresh, s.meta.id) === "atrasada"
  )
    ? ("atrasada" as const)
    : ("em-dia" as const);

  const haltere = series
    .map(({ id, rotulo, rotuloCurto, s }) => {
      if (!s) return null;
      const agora = s.series[s.series.length - 1];
      const antes = pontoDias(s, 7);
      if (!agora || !antes) return null;
      return {
        id,
        rotulo,
        rotuloCurto,
        antes: antes.v,
        agora: agora.v,
        tAntes: antes.t,
        tAgora: agora.t,
      };
    })
    .filter((x) => x !== null);

  return (
    <>
      <JsonLd
        data={webApplication(
          "Preços dos combustíveis — Portugal",
          "/precos",
          "Preços dos combustíveis em Portugal em euros por litro — série diária DGEG, variações e os impostos dentro do litro."
        )}
      />
      <Pagina
        pergunta="Quanto custa encher o depósito hoje?"
        rota="/precos"
        kicker="Preços oficiais, quase diários"
        resposta={{
          instrumento: gasoleo && ult ? (
            <Cartao
              breadcrumb="PREÇOS / O DEPÓSITO · 50 L GASÓLEO · DGEG"
              icone="precos"
              meta={[
                `${fmtLitro(ult.v)} o litro`,
                `leitura ${fmtData(gasoleo.meta.serieAte)}`,
              ]}
              estado={estadoDe(fresh, "pmd-gasoleo-diario")}
              estadoRotulo={
                rotulos.estados[estadoDe(fresh, "pmd-gasoleo-diario")]
              }
              fonte={{
                rotulo: m.common.fonte,
                itens: [{ nome: gasoleo.meta.fonte, url: gasoleo.meta.url }],
              }}
              acoes={[
                {
                  copiar: "/api/pmd-gasoleo-diario.json",
                  rotulo: rotulos.json,
                  ariaLabel: rotulos.jsonAria,
                },
              ]}
            >
              {/* o odómetro de bomba — cada dígito é uma roda; o valor
                  final está no HTML sem JS */}
              <p className="num-hero">
                <Odometer
                  valor={custo50 ?? 0}
                  casas={2}
                  sufixo="€"
                  className="text-ink"
                />
              </p>
              <p className="footnote mt-1">
                {LITROS} litros de gasóleo simples ao preço médio nacional
                de hoje.
              </p>
            </Cartao>
          ) : (
            <EstadoVazio
              titulo="o preço do gasóleo"
              falha={m.estados.serieFalhou}
              fonte={{
                nome: "DGEG",
                url: "https://precoscombustiveis.dgeg.gov.pt",
              }}
            />
          ),
          frase: fraseDeposito,
        }}
        explora={
          <div className="stack-fig space-y-10">
            {/* a série diária anotada — o desconto extraordinário do ISP
                tem fonte e data em data/fiscal/eventos.json */}
            {linhaOk ? (
              <Cartao
                amplo
                breadcrumb="PREÇOS / A SÉRIE DIÁRIA · PMD DESDE JAN 2021 · DGEG"
                icone="precos"
                estado={estadoLinha}
                estadoRotulo={rotulos.estados[estadoLinha]}
                fonte={{
                  rotulo: m.common.fonte,
                  itens: series.map(({ s }) => ({
                    nome: s!.meta.dataset,
                    url: s!.meta.url,
                  })),
                }}
                acoes={series.map(({ s }) => ({
                  copiar: `/api/${s!.meta.id}.json`,
                  rotulo: `JSON ${s!.meta.id.replace("pmd-", "").replace("-diario", "")}`,
                  ariaLabel: rotulos.jsonAria,
                }))}
              >
                <LineChart
                  series={series.map(({ rotulo, s }) => ({
                    name: rotulo,
                    data: s!.series
                      .filter((p) => p.t >= DESDE_LINHA)
                      .map((p) => [p.t, p.v] as [string, number]),
                  }))}
                  unidade="€/L"
                  eventos={eventos.eventos.filter(
                    (e) => e.alvo === "combustiveis"
                  )}
                  estado={estadoLinha}
                />
              </Cartao>
            ) : (
              <EstadoVazio
                titulo="a série diária de preços"
                falha={m.estados.serieFalhou}
                fonte={{
                  nome: "DGEG",
                  url: "https://precoscombustiveis.dgeg.gov.pt",
                }}
              />
            )}

            {/* semana passada ● ○ hoje — um haltere por combustível */}
            {haltere.length > 0 ? (
              <Cartao
                breadcrumb="PREÇOS / HÁ UMA SEMANA → HOJE · DGEG"
                icone="precos"
                meta={["€ por litro"]}
                fonte={{
                  rotulo: m.common.fonte,
                  itens: series.map(({ s }) => ({
                    nome: s!.meta.dataset,
                    url: s!.meta.url,
                  })),
                }}
              >
                <Haltere
                  categorias={haltere.map((h) => ({
                    id: h.id,
                    rotulo: h.rotulo,
                    rotuloCurto: h.rotuloCurto,
                    antes: h.antes,
                    agora: h.agora,
                  }))}
                  formato="litro"
                  rotuloAntes={fmtData(haltere[0].tAntes)}
                  rotuloAgora={fmtData(haltere[0].tAgora)}
                  bomSubir={false}
                />
              </Cartao>
            ) : (
              <EstadoVazio
                compacto
                titulo="a comparação semanal"
                falha={m.estados.serieFalhou}
                fonte={{
                  nome: "DGEG",
                  url: "https://precoscombustiveis.dgeg.gov.pt",
                }}
              />
            )}
          </div>
        }
        confirma={
          <>
            <PaginaDetalhe rotulo="A série completa, em números">
              <div className="overflow-x-auto">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-ink">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Combustível
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Início da série
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Mínimo
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Máximo
                      </th>
                      <th scope="col" className="py-2 font-medium text-right">
                        Último
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map(({ id, rotulo, s }) => {
                      if (!s) return null;
                      const { min, max } = extremos(s);
                      const ini = s.series[0];
                      const fim = s.series[s.series.length - 1];
                      return (
                        <tr key={id} className="border-b border-line">
                          <td className="py-2 pr-4 text-ink2">{rotulo}</td>
                          <td className="py-2 pr-4 text-right num">
                            {fmtLitro(ini.v)}{" "}
                            <span className="text-rotulo text-muted">
                              {fmtData(ini.t)}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right num">
                            {fmtLitro(min.v)}{" "}
                            <span className="text-rotulo text-muted">
                              {fmtData(min.t)}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right num">
                            {fmtLitro(max.v)}{" "}
                            <span className="text-rotulo text-muted">
                              {fmtData(max.t)}
                            </span>
                          </td>
                          <td className="py-2 text-right num">
                            {fmtLitro(fim.v)}{" "}
                            <span className="text-rotulo text-muted">
                              {fmtData(fim.t)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                A série diária completa ({series[0].s?.series[0]?.t
                  ? fmtData(series[0].s.series[0].t)
                  : "—"}{" "}
                em diante) está nos ficheiros JSON de cada combustível —
                acções «JSON» nos cartões acima.
              </p>
              <Source
                nome="DGEG — Preços dos Combustíveis"
                url={series[0].s?.meta.url}
                serieAte={series[0].s?.meta.serieAte}
                recolhidoEm={series[0].s?.meta.recolhidoEm}
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="As portarias do ISP dentro deste preço">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="bg-panel border border-line px-5 py-4">
                  <dt className="kicker">Gasóleo simples</dt>
                  <dd className="num text-grande mt-1">
                    {fmtLitro(isp.gasoleo.ispELitro)}{" "}
                    <span className="text-rotulo text-muted">ISP</span>
                  </dd>
                  <dd className="num mt-1">
                    {fmtLitro(isp.gasoleo.carbonoELitro)}{" "}
                    <span className="text-rotulo text-muted">carbono</span>
                  </dd>
                  <dd className="footnote mt-2">{isp.gasoleo.nota}</dd>
                </div>
                <div className="bg-panel border border-line px-5 py-4">
                  <dt className="kicker">Gasolina 95</dt>
                  <dd className="num text-grande mt-1">
                    {fmtLitro(isp.gasolina95.ispELitro)}{" "}
                    <span className="text-rotulo text-muted">ISP</span>
                  </dd>
                  <dd className="num mt-1">
                    {fmtLitro(isp.gasolina95.carbonoELitro)}{" "}
                    <span className="text-rotulo text-muted">carbono</span>
                  </dd>
                  <dd className="footnote mt-2">{isp.gasolina95.nota}</dd>
                </div>
              </dl>
              <Source
                nome={isp.fonte}
                url={isp.fonteUrl}
                vigencia={isp.vigencia}
                nota={isp.nota}
              />
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Metodologia DGEG — e porque não há preços de supermercado">
              <div className="body-copy space-y-4">
                <p>
                  A DGEG publica o PMD — preço médio declarado — de cada
                  combustível, calculado a partir dos preços comunicados
                  pelos postos de abastecimento, quase todos os dias. É a
                  única família de bens essenciais em Portugal com preços
                  oficiais quase diários: é aqui que a variação dia a dia
                  e semana a semana faz sentido.
                </p>
                <p>
                  Não existe uma API oficial com o preço do leite ou do pão
                  em cada loja, ao longo do tempo. O Estado publica índices
                  (o que está na página de{" "}
                  <a
                    href="/inflacao"
                    className="underline decoration-line2 underline-offset-2"
                  >
                    Inflação
                  </a>
                  ), não tickets de caixa. Preços por produto exigem
                  crowdsourcing ou recolha própria — está no plano, com
                  fonte e metodologia explícitas, nunca disfarçado de dado
                  oficial.
                </p>
              </div>
              <Source
                nome="DGEG — Preços dos Combustíveis"
                url="https://precoscombustiveis.dgeg.gov.pt"
              />
            </PaginaDetalhe>
          </>
        }
        seguinte={{
          href: "/inflacao",
          rotulo: "Quanto mais caro está o que compras?",
        }}
      />
    </>
  );
}
