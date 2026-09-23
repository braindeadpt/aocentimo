import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { Leitura } from "@/components/Leitura";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { CasaProvider } from "./CasaSim";
import { FraseEscritura, InstrumentoEscritura } from "./HeroEscritura";
import { SimuladorCasa } from "./SimuladorCasa";
import { loadFonte, loadDerivado, loadFreshness } from "@/lib/data";
import { fmtEUR0, fmtNum, fmtPeriodo, fmtPct } from "@/lib/format";
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
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Comprar casa — IMT, Imposto de Selo e prestação",
  description:
    "O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual do Banco de Portugal.",
  alternates: { canonical: "/casa", types: ALT_FEED },
};

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
      <CasaProvider euriborInicial={ultimo?.v ?? null}>
        <Pagina
          pergunta="Quanto custa mesmo comprar esta casa?"
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

              <PaginaDetalhe rotulo="IMT Jovem — a isenção dos ≤35 anos">
                <div className="body-copy max-w-2xl space-y-3">
                  <p>{imt.jovem.nota}</p>
                  <p>
                    O IMT Jovem isenta também o Imposto de Selo da compra na
                    mesma proporção — nunca o IS do crédito. Ilhas e imóveis
                    para arrendamento têm regras próprias.
                  </p>
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

              <PaginaDetalhe rotulo="Fontes e dados">
                <div className="body-copy max-w-2xl space-y-3">
                  <Source
                    nome={imt.fonte}
                    url={imt.fonteUrl}
                    vigencia={imt.vigencia}
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
  );
}
