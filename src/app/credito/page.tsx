import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { EstadoVazio } from "@/components/EstadoVazio";
import { LineChart } from "@/components/LineChart";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { CreditoProvider } from "./CreditoSim";
import { FrasePrestacao, InstrumentoPrestacao } from "./HeroPrestacao";
import { MapaAmortizacao } from "./MapaAmortizacao";
import { SimuladorPrestacao } from "./SimuladorPrestacao";
import { loadFonte, loadFreshness, loadPainel } from "@/lib/data";
import { fmtPeriodo } from "@/lib/format";
import { estadoDe, rotulosLeitura } from "@/lib/leitura";
import { m } from "@/lib/messages";
import { JsonLd, webApplication } from "@/lib/jsonld";
import eventos from "@data/fiscal/eventos.json";

export const metadata: Metadata = {
  title: "Crédito — Euribor, spread e prestação",
  description:
    "O que é a Euribor, como o spread forma a TAN, e simulador de prestação de crédito habitação com custo total do empréstimo.",
  alternates: { canonical: "/credito", types: ALT_FEED },
};

export default function CreditoPage() {
  const eur = loadFonte("bpstat", "euribor-3m-mensal");
  const ultimo = eur?.series.at(-1) ?? null;
  // o marcador «agora» da régua da taxa é a Euribor 12M — a referência
  // de contrato mais comum; a mediana de 10 anos vem do painel derivado
  const eur12 = loadFonte("bpstat", "euribor-12m-mensal");
  const ultimo12 = eur12?.series.at(-1) ?? null;
  const mediana12 =
    loadPainel()?.series.find((s) => s.id === "euribor-12m-mensal")?.referencia
      ?.valor ?? null;
  const fresh = loadFreshness();
  const estado = estadoDe(fresh, "euribor-3m-mensal");
  const rotulos = rotulosLeitura();

  return (
    <>
      <JsonLd
        data={webApplication(
          "Simulador de prestação de crédito habitação",
          "/credito",
          "Simulador de prestação de crédito habitação em Portugal: Euribor, spread, TAN e custo total do empréstimo."
        )}
      />
      {/* o contrato é um só — a resposta, as réguas e a confirmação
          partilham capital, prazo, Euribor e spread via provider */}
      <CreditoProvider euriborInicial={ultimo?.v ?? null}>
        <Pagina
          pergunta="Quanto vais pagar ao banco, no total?"
          rota="/credito"
          kicker="O banco · Crédito habitação"
          resposta={{
            instrumento: (
              <InstrumentoPrestacao
                euriborAte={ultimo?.t ?? null}
                estado={estado}
                estadoRotulo={rotulos.estados[estado]}
              />
            ),
            frase: <FrasePrestacao />,
          }}
          explora={
            <>
              <Figure
                title="O simulador — mexe no contrato"
                source={
                  <Source
                    nome="Cálculo próprio — sistema de amortização francês · Euribor 3M, BPstat"
                    serieAte={ultimo?.t}
                  />
                }
              >
                <SimuladorPrestacao
                  euriborAtual={ultimo?.v ?? null}
                  euriborAte={ultimo?.t ?? null}
                  euribor12m={ultimo12?.v ?? null}
                  mediana12m={mediana12}
                  rotulos={{
                    capital: m.regua.capital,
                    prazo: "Prazo",
                    euribor: m.regua.euribor,
                    spread: m.regua.spread,
                    agora12m: m.regua.agora12m,
                    mediana10: m.regua.mediana10,
                    menos: m.regua.menos05,
                    mais: m.regua.mais05,
                  }}
                />
              </Figure>

              {/* a linha anotada da Euribor 3M desde 1994 — os eventos
                  BCE têm fonte (data/fiscal/eventos.json) */}
              <Figure
                title="A Euribor desde 1994 — e as decisões do BCE"
                source={
                  <Source
                    nome="Banco de Portugal — BPstat · Euribor 3M, média mensal"
                    url="https://bpstat.bportugal.pt"
                    serieAte={ultimo?.t}
                  />
                }
              >
                {eur ? (
                  <LineChart
                    series={[
                      {
                        name: "Euribor 3M",
                        data: eur.series.map((p) => [p.t, p.v]),
                        cor: "var(--color-ink)",
                      },
                    ]}
                    unidade="%"
                    eventos={eventos.eventos.filter((e) => e.alvo === "euribor")}
                    estado={estado}
                  />
                ) : (
                  <EstadoVazio
                    compacto
                    titulo="a série da Euribor 3M"
                    falha="a recolha do BPstat falhou — sem dados oficiais não há gráfico"
                    fonte={{
                      nome: "Banco de Portugal — BPstat",
                      url: "https://bpstat.bportugal.pt",
                    }}
                  />
                )}
              </Figure>
            </>
          }
          confirma={
            <>
              <PaginaDetalhe rotulo="O mapa de amortização — ano a ano, com os números na mesa">
                <MapaAmortizacao />
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="TAN, TAEG, MTIC — os termos que interessam (e a fórmula)">
                <div className="body-copy max-w-2xl space-y-4">
                  <dl className="space-y-3">
                    <div>
                      <dt className="font-medium text-ink">Euribor</dt>
                      <dd>
                        Taxa interbancária europeia, calculada diariamente. O teu
                        contrato usa um prazo (3, 6 ou 12 meses) — a cada revisão,
                        a prestação reflete a média da Euribor desse prazo.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink">Spread</dt>
                      <dd>
                        A margem do banco, fixada no contrato. É a única parte
                        negociável da TAN — e onde comparar propostas compensa.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink">TAN</dt>
                      <dd>
                        Euribor + spread. A taxa que efetivamente gera os teus
                        juros.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink">TAEG</dt>
                      <dd>
                        TAN + seguros + comissões + custos de manutenção. É o
                        custo real anual do crédito — compara sempre TAEG entre
                        bancos.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink">MTIC</dt>
                      <dd>
                        Montante total imputado ao consumidor: tudo o que pagas
                        até ao fim. É o número que revela quanto a casa realmente
                        custa.
                      </dd>
                    </div>
                  </dl>
                  <p>
                    A prestação constante do sistema francês é{" "}
                    <strong>
                      P = C · i / (1 − (1 + i)<sup>−n</sup>)
                    </strong>
                    , com i = TAN ÷ 12 e n o número de meses. Em cada mês o juro é
                    dívida × i e o resto da prestação amortiza — por isso o juro
                    pesa mais no início.
                  </p>
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="Fontes e dados">
                <div className="body-copy max-w-2xl space-y-3">
                  <Source
                    nome="Euribor 3M e 12M, médias mensais — Banco de Portugal, BPstat"
                    url="https://bpstat.bportugal.pt"
                    serieAte={ultimo?.t}
                  />
                  <Source
                    nome="Decisões do BCE anotadas no gráfico — data/fiscal/eventos.json, com fonte por evento"
                    nota={`curadoria ${fmtPeriodo(eventos.meta.curadoria)}`}
                  />
                  <p className="footnote">
                    API estática:{" "}
                    <a href="/api/euribor-3m-mensal.json" className="lq-link">
                      /api/euribor-3m-mensal.json
                    </a>{" "}
                    ·{" "}
                    <a href="/api/euribor-12m-mensal.json" className="lq-link">
                      /api/euribor-12m-mensal.json
                    </a>
                    . A simulação é cálculo próprio — não inclui seguros nem
                    comissões (por isso é «aprox. MTIC», nunca TAEG).
                  </p>
                </div>
              </PaginaDetalhe>
            </>
          }
          seguinte={{
            href: "/casa",
            rotulo: "Quanto custa mesmo comprar esta casa?",
          }}
        />
      </CreditoProvider>
    </>
  );
}
