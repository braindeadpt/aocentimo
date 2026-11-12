import type { Metadata } from "next";
import { metaDeRota } from "@/lib/seo";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { Leitura } from "@/components/Leitura";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { CasaProvider } from "./CasaSim";
import { FraseEscritura, InstrumentoEscritura } from "./HeroEscritura";
import { SimuladorCasa } from "./SimuladorCasa";
import { SimuladorImi } from "./SimuladorImi";
import { loadFonte, loadDerivado, loadFreshness } from "@/lib/data";
import { FINO, fmtEUR, fmtEUR0, fmtNum, fmtPeriodo, fmtPct, MENOS } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  janela10,
  rotulosLeitura,
  type Cartao as CartaoLeitura,
  type Ponto,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import imt from "@data/fiscal/imt-2026.json";
import imiDados from "@data/fiscal/imi-2026.json";
import creditoHabitacao from "@data/fiscal/credito-habitacao.json";
import type { RegrasImi } from "@/lib/engines/imi-puro";
import type { RegrasImt } from "@/lib/engines/imt-puro";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = metaDeRota("/casa");

/** derivado casa-em-salarios: índice de preços da habitação ÷ custo do
    trabalho reindexado (2015=100) — razão de índices, não salários reais */
interface CasaSalarios {
  meta: {
    fonte: string;
    url: string;
    serieAte: string;
    rotuloAte?: string;
  };
  series: Ponto[];
}

/** escalão da tabela de IMT — ate null = último escalão sem tecto */
interface EscalaoImt {
  ate: number | null;
  taxa: number;
  taxaUnica?: boolean;
  parcelaAbater: number;
}

function TabelaImt({
  titulo,
  escaloes,
  nota,
}: {
  titulo: string;
  escaloes: readonly EscalaoImt[];
  nota?: string;
}) {
  return (
    <div>
      <p className="kicker-xs mb-3">{titulo}</p>
      <table className="w-full text-corpo-sm bg-raised border border-line shadow-raised">
        <thead>
          <tr className="text-left border-b-2 border-ink">
            <th scope="col" className="px-4 py-2 font-medium">Valor tributável</th>
            <th scope="col" className="px-4 py-2 font-medium text-right">Taxa</th>
            <th scope="col" className="px-4 py-2 font-medium text-right">Parcela a abater</th>
          </tr>
        </thead>
        <tbody>
          {escaloes.map((e, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="px-4 py-1.5 text-ink2">
                {i === 0
                  ? `até ${fmtEUR0(e.ate ?? 0)}`
                  : e.ate === null
                    ? `acima de ${fmtEUR0(escaloes[i - 1].ate ?? 0)}`
                    : `de ${fmtEUR0(escaloes[i - 1].ate ?? 0)} a ${fmtEUR0(e.ate)}`}
              </td>
              <td className="px-4 py-1.5 text-right num">
                {fmtPct(e.taxa, 1)}
                {e.taxaUnica && (
                  <span className="block text-rotulo text-muted">taxa única</span>
                )}
              </td>
              <td className="px-4 py-1.5 text-right num">
                {e.parcelaAbater > 0 ? fmtEUR0(e.parcelaAbater) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {nota && <p className="footnote mt-2">{nota}</p>}
    </div>
  );
}

export default function CasaPage() {
  // a Euribor 3M é a mesma de /credito — mesma fonte, mesma data (3C-04)
  const eur = loadFonte("bpstat", "euribor-3m-mensal");
  const ultimo = eur?.series.at(-1) ?? null;
  const rotulos = rotulosLeitura();
  const fresh = loadFreshness();

  // ————— a casa contra o salário: o derivado razão de índices
  //   (preços da habitação ÷ custo do trabalho, 2015=100) — a linha
  //   anotada do catálogo com o nível de 2015 como referência —————
  const razao = loadDerivado<CasaSalarios>("casa-em-salarios");
  const serieRazao = razao ? janela10(razao.series) : [];
  const ultRazao = serieRazao[serieRazao.length - 1];
  const cartaoRazao: CartaoLeitura | null =
    razao && ultRazao
      ? {
          breadcrumb: "O BANCO / CASA VS TRABALHO · EUROSTAT",
          titulo: "A casa contra o salário",
          insight: t(m.painel.insightCasaTrabalho, {
            v: fmtNum(Math.abs(ultRazao.v - 100), 0),
            direcao: ultRazao.v >= 100 ? m.painel.acima : m.painel.abaixo,
          }),
          valor: ultRazao.v,
          unidade: "",
          formato: "num",
          serie: serieRazao,
          referencia: { valor: 100, rotulo: "nível de 2015" },
          anotacao: anotacaoDe(serieRazao, "max", (v) => fmtNum(v, 0)),
          leitura: fmtPeriodo(ultRazao.t),
          estado: estadoDe(fresh, "casa-em-salarios"),
          fonteNome: razao.meta.fonte,
          fonteUrl: razao.meta.url,
          href: "/casa",
          hrefJson: "/api/casa-em-salarios.json",
          amplo: true,
        }
      : null;

  return (
    <div className="rt5">
    <>
      <JsonLd
        data={webApplication(
          "Custo de comprar casa — simulador",
          "/casa",
          "O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual."
        )}
      />
      {/* a compra é uma só — a resposta, a escritura e as tabelas
          partilham preço, entrada e contrato via provider */}
      <CasaProvider
        euriborInicial={ultimo?.v ?? null}
        regrasImt={imt as unknown as RegrasImt}
        regrasCredito={creditoHabitacao}
      >
        <Pagina
          pergunta="Quanto custa mesmo comprar esta casa?"
          edificio={{ href: "/#casa", titulo: m.bairro.edificios.casa.titulo }}
          rota="/casa"
          kicker="O banco · Comprar casa"
          resposta={{
            instrumento: (
              <InstrumentoEscritura
                anoImt={imt.ano}
                estado={estadoDe(fresh, "fiscal-imt-2026")}
                estadoRotulo={
                  rotulos.estados[estadoDe(fresh, "fiscal-imt-2026")]
                }
              />
            ),
            frase: <FraseEscritura />,
          }}
          explora={
            <>
              <Figure
                title="A escritura, camada a camada — e os trinta anos"
                source={
                  <Source
                    nome={`IMT — ${imt.fonte}; Euribor 3M — BPstat (Banco de Portugal)`}
                    vigencia={imt.vigencia}
                    serieAte={ultimo?.t}
                  />
                }
              >
                <SimuladorCasa
                  euriborAtual={ultimo?.v ?? null}
                  euriborAte={ultimo ? fmtPeriodo(ultimo.t) : null}
                />
              </Figure>

              {/* PROPOSTA (revisão do dono) */}
              <Figure
                title="Depois da escritura: o IMI todos os anos"
                source={
                  <Source
                    nome={`${imiDados.fonte}; ${imiDados.porto.fonte}`}
                    url={imiDados.fonteUrl}
                    vigencia={imiDados.vigencia}
                  />
                }
              >
                <SimuladorImi
                  regras={imiDados as unknown as RegrasImi}
                  estado={estadoDe(fresh, "fiscal-imi-2026")}
                  estadoRotulo={
                    rotulos.estados[estadoDe(fresh, "fiscal-imi-2026")]
                  }
                  rotuloFonte={m.common.fonte}
                  fonteCimi={{
                    nome: "CIMI — Portal das Finanças",
                    url: imiDados.fonteUrl,
                  }}
                  fontePorto={{
                    nome: "Assembleia Municipal do Porto",
                    url: imiDados.porto.fonteUrl,
                  }}
                />
              </Figure>

              {/* a casa contra o salário — a razão de índices, com o
                  nível de 2015 a tracejado como referência */}
              {cartaoRazao ? (
                <Leitura {...cartaoRazao} rotulos={rotulos} />
              ) : (
                <EstadoVazio
                  titulo="a razão casa/trabalho"
                  falha={m.estados.serieFalhou}
                  desde={
                    razao?.meta.serieAte
                      ? fmtPeriodo(razao.meta.serieAte)
                      : undefined
                  }
                  fonte={{
                    nome: razao?.meta.fonte ?? "Eurostat",
                    url: razao?.meta.url ?? "https://ec.europa.eu/eurostat",
                  }}
                />
              )}
            </>
          }
          confirma={
            <>
              <PaginaDetalhe rotulo={`A tabela do IMT ${imt.ano} — habitação própria e permanente`}>
                <TabelaImt
                  titulo="IMT — habitação própria e permanente"
                  escaloes={imt.hpp}
                  nota="IMT incide sobre o maior valor entre o preço de escritura e o valor patrimonial tributário (VPT). O imposto é valor × taxa − parcela a abater; nos dois últimos escalões a taxa é única."
                />
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="IMT — segunda habitação ou investimento">
                <TabelaImt
                  titulo="IMT — secundária / investimento"
                  escaloes={imt.secundaria}
                />
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="IMT Jovem — a isenção dos ≤35 anos e a compra a dois">
                <div className="body-copy max-w-2xl space-y-3">
                  <p>{imt.jovem.nota}</p>
                  <p>
                    O IMT Jovem isenta também o Imposto de Selo da compra na
                    mesma proporção — nunca o IS do crédito. Ilhas e imóveis
                    para arrendamento têm regras próprias.
                  </p>
                  <p>
                    {/* PROPOSTA (revisão do dono) */}
                    <strong>Compra a dois (quotas-partes, art. 9.º do CIMT):</strong>{" "}
                    quando um imóvel é adquirido em compropriedade (50{FINO}% / 50{FINO}%)
                    e apenas um dos compradores cumpre os requisitos do IMT Jovem
                    (idade ≤{FINO}{imt.jovem.idadeMax} anos e não ser titular de
                    outro imóvel habitacional), a isenção aplica-se à sua quota-parte
                    (50{FINO}% do imposto apurado pela tabela Jovem) e o outro
                    comprador liquida 50{FINO}% do imposto apurado pela tabela
                    geral de habitação própria e permanente.
                  </p>
                </div>
              </PaginaDetalhe>

              {/* PROPOSTA (revisão do dono) — Garantia Pública Jovem */}
              <PaginaDetalhe rotulo={`Garantia Pública do Estado (≤${FINO}${creditoHabitacao.garantiaPublicaJovem.idadeMax} anos, até ${fmtEUR0(creditoHabitacao.garantiaPublicaJovem.precoMax)})`}>
                <div className="body-copy max-w-2xl space-y-3">
                  <p>
                    {/* PROPOSTA (revisão do dono) */}
                    Ao abrigo do{" "}
                    <strong>
                      {creditoHabitacao.garantiaPublicaJovem.baseLegal}
                    </strong>
                    , o Estado pode prestar garantia pessoal até{" "}
                    {fmtPct(
                      creditoHabitacao.garantiaPublicaJovem.garantiaMaxPct,
                      0
                    )}{" "}
                    do valor da transação para viabilizar financiamento bancário
                    até{" "}
                    {fmtPct(
                      creditoHabitacao.garantiaPublicaJovem.financiamentoMaxPct,
                      0
                    )}{" "}
                    do preço de compra (dispensando os 10{FINO}% de entrada
                    exigidos pelo limite de LTV do Banco de Portugal).
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {creditoHabitacao.garantiaPublicaJovem.condicoes.map(
                      (c, idx) => (
                        <li key={idx}>{c}</li>
                      )
                    )}
                  </ul>
                  <Source
                    nome={creditoHabitacao.garantiaPublicaJovem.baseLegal}
                    url={creditoHabitacao.fonteUrl}
                    vigencia={creditoHabitacao.vigencia}
                  />
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="Imposto de Selo e registos">
                <div className="body-copy max-w-2xl space-y-3">
                  <p>{imt.impostoSelo.aquisicao.nota}</p>
                  <p>{imt.impostoSelo.credito.nota}</p>
                  <p>
                    Registos: {fmtEUR0(imt.registos.semCredito)} sem crédito,{" "}
                    {fmtEUR0(imt.registos.comCredito)} com crédito —{" "}
                    {imt.registos.nota}.
                  </p>
                </div>
              </PaginaDetalhe>

              {/* PROPOSTA (revisão do dono) */}
              <PaginaDetalhe rotulo={`IMI ${imiDados.ano} — faixas legais, IMI Familiar e prestações`}>
                <div className="space-y-6">
                  <div>
                    <p className="kicker-xs mb-3">
                      Faixas legais do IMI (art. 112.º do CIMI)
                    </p>
                    <table className="w-full text-corpo-sm bg-raised border border-line shadow-raised">
                      <thead>
                        <tr className="text-left border-b-2 border-ink">
                          <th scope="col" className="px-4 py-2 font-medium">
                            Tipo de prédio / referência
                          </th>
                          <th scope="col" className="px-4 py-2 font-medium text-right">
                            Taxa
                          </th>
                          <th scope="col" className="px-4 py-2 font-medium">
                            Regra legal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-line">
                          <td className="px-4 py-1.5 text-ink2">
                            Prédios urbanos (intervalo nacional)
                          </td>
                          <td className="px-4 py-1.5 text-right num">
                            {fmtPct(imiDados.taxasLegais.urbanos.min, 2)} a{" "}
                            {fmtPct(imiDados.taxasLegais.urbanos.max, 2)}
                          </td>
                          <td className="px-4 py-1.5 text-ink2">
                            Fixada anualmente por cada assembleia municipal
                          </td>
                        </tr>
                        <tr className="border-b border-line">
                          <td className="px-4 py-1.5 text-ink2">
                            Município do Porto (referência curada)
                          </td>
                          <td className="px-4 py-1.5 text-right num">
                            {fmtPct(imiDados.porto.taxa, 3)}
                          </td>
                          <td className="px-4 py-1.5 text-ink2">
                            Taxa bruta deliberada para prédios urbanos
                          </td>
                        </tr>
                        <tr className="border-b border-line last:border-0">
                          <td className="px-4 py-1.5 text-ink2">
                            Prédios rústicos
                          </td>
                          <td className="px-4 py-1.5 text-right num">
                            {fmtPct(imiDados.taxasLegais.rusticos, 1)}
                          </td>
                          <td className="px-4 py-1.5 text-ink2">
                            Taxa fixa nacional (art. 112.º n.º 1 al. a) CIMI)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="body-copy max-w-2xl space-y-3">
                    <p>{imiDados.nota.replace(/(\d)\s+(€|%)/g, `$1${FINO}$2`)}</p>
                    <p>
                      <strong>IMI Familiar ({imiDados.imiFamiliar.base}):</strong>{" "}
                      dedução fixa à coleta de{" "}
                      {imiDados.imiFamiliar.deducoes
                        .map(
                          (d) =>
                            `${MENOS}${fmtEUR0(d.valor)} (${d.dependentes === 3 ? "3 ou mais" : d.dependentes} ${d.dependentes === 1 ? "dependente" : "dependentes"})`
                        )
                        .join(", ")}
                      , em habitação própria e permanente nos municípios que o
                      deliberem. {imiDados.imiFamiliar.nota.replace(/(\d)\s+(€|%)/g, `$1${FINO}$2`)}
                    </p>
                    <p>
                      <strong>Regime de prestações ({imiDados.prestacoes.base}):</strong>{" "}
                      até {fmtEUR0(100)} paga-se numa prestação única em maio; de{" "}
                      {fmtEUR(100.01)} a {fmtEUR0(500)} em duas prestações (maio e
                      novembro); acima de {fmtEUR0(500)} em três prestações (maio,
                      agosto e novembro). {imiDados.prestacoes.atraso.replace(/(\d)\s+(€|%)/g, `$1${FINO}$2`)}
                    </p>
                  </div>
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="Fontes e dados">
                <div className="body-copy max-w-2xl space-y-3">
                  <Source
                    nome={imt.fonte}
                    url={imt.fonteUrl}
                    vigencia={imt.vigencia}
                  />
                  <Source
                    nome={imiDados.fonte}
                    url={imiDados.fonteUrl}
                    vigencia={imiDados.vigencia}
                  />
                  <Source
                    nome={imiDados.porto.fonte}
                    url={imiDados.porto.fonteUrl}
                    vigencia={imiDados.vigencia}
                  />
                  <Source
                    nome={creditoHabitacao.fonte.replace(" c/ ", " e ")}
                    url={creditoHabitacao.fonteUrl}
                    vigencia={creditoHabitacao.vigencia}
                  />
                  <Source
                    nome="Euribor 3M, média mensal — Banco de Portugal, BPstat"
                    url="https://bpstat.bportugal.pt"
                    serieAte={ultimo?.t}
                  />
                  <Source
                    nome={razao?.meta.fonte ?? "Eurostat — prc_hpi_q ÷ ei_lmlc_q"}
                    url={razao?.meta.url}
                    serieAte={razao?.meta.serieAte}
                    nota="razão de índices oficiais — não mede salários reais"
                  />
                  <p className="footnote">
                    API estática:{" "}
                    <a href="/api/euribor-3m-mensal.json" className="lq-link">
                      /api/euribor-3m-mensal.json
                    </a>{" "}
                    ·{" "}
                    <a href="/api/casa-em-salarios.json" className="lq-link">
                      /api/casa-em-salarios.json
                    </a>
                    .
                  </p>
                </div>
              </PaginaDetalhe>
            </>
          }
          seguinte={{
            href: "/poupanca",
            rotulo: "Onde rende mais o teu dinheiro?",
          }}
        />
      </CasaProvider>
    </>
    </div>
  );
}
