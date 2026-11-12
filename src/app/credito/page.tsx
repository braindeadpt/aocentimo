import type { Metadata } from "next";
import { metaDeRota } from "@/lib/seo";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { EstadoVazio } from "@/components/EstadoVazio";
import { LineChart } from "@/components/LineChart";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { CreditoProvider } from "./CreditoSim";
import { FrasePrestacao, InstrumentoPrestacao } from "./HeroPrestacao";
import { MapaAmortizacao } from "./MapaAmortizacao";
import { SimuladorPrestacao } from "./SimuladorPrestacao";
import { SimuladorAmortizacao } from "./SimuladorAmortizacao";
import { SimuladorTaeg } from "./SimuladorTaeg";
import { SimuladorCartao } from "./SimuladorCartao";
import { loadFonte, loadFreshness, loadPainel } from "@/lib/data";
import { FINO, comUnidade, fmtNum, fmtPct, fmtPeriodo } from "@/lib/format";
import { estadoDe, rotulosLeitura } from "@/lib/leitura";
import { m } from "@/lib/messages";
import { JsonLd, webApplication } from "@/lib/jsonld";
import eventos from "@data/fiscal/eventos.json";
import usura from "@data/fiscal/usura-2026.json";
import cartoes from "@data/fiscal/cartoes.json";
import servicosMinimos from "@data/fiscal/servicos-minimos.json";
import creditoHabitacao from "@data/fiscal/credito-habitacao.json";

export const metadata: Metadata = metaDeRota("/credito");

export default function CreditoPage() {
  const eur3 = loadFonte("bpstat", "euribor-3m-mensal");
  const ultimo3 = eur3?.series.at(-1) ?? null;

  const eur6 = loadFonte("bpstat", "euribor-6m-mensal");
  const ultimo6 = eur6?.series.at(-1) ?? null;

  const eur12 = loadFonte("bpstat", "euribor-12m-mensal");
  const ultimo12 = eur12?.series.at(-1) ?? null;

  const painel = loadPainel();
  const mediana3 =
    painel?.series.find((s) => s.id === "euribor-3m-mensal")?.referencia?.valor ?? null;
  const mediana6 =
    painel?.series.find((s) => s.id === "euribor-6m-mensal")?.referencia?.valor ?? null;
  const mediana12 =
    painel?.series.find((s) => s.id === "euribor-12m-mensal")?.referencia?.valor ?? null;

  const taxasEuribor = {
    "3m": {
      valor: ultimo3?.v ?? null,
      serieAte: ultimo3?.t ?? null,
      mediana: mediana3,
    },
    "6m": {
      valor: ultimo6?.v ?? null,
      serieAte: ultimo6?.t ?? null,
      mediana: mediana6,
    },
    "12m": {
      valor: ultimo12?.v ?? null,
      serieAte: ultimo12?.t ?? null,
      mediana: mediana12,
    },
  };

  const taegRenovavel = loadFonte("bpstat", "taeg-renovavel-mensal");
  const taegMediaMercado = taegRenovavel?.series.at(-1)?.v ?? null;
  const taegMediaAte = taegRenovavel?.meta.serieAte ?? null;

  const hoje = new Date().toISOString().slice(0, 10);
  const trimestreUsura =
    usura.trimestres.find((t) => hoje >= t.de && hoje <= t.ate) ??
    usura.trimestres[usura.trimestres.length - 1];
  const taegMaximaUsura = trimestreUsura?.taegMaxima?.renovavel ?? 18.5;
  const rotuloTrimestreUsura = trimestreUsura?.trimestre ?? "2026-T4";

  const fresh = loadFreshness();
  const estado = estadoDe(fresh, "euribor-3m-mensal");
  const rotulos = rotulosLeitura();

  return (
    <div className="rt5">
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
      <CreditoProvider
        euriborInicial={ultimo12?.v ?? ultimo3?.v ?? null}
        taxasEuribor={taxasEuribor}
        regrasCredito={creditoHabitacao}
      >
        <Pagina
          pergunta="Quanto vais pagar ao banco, no total?"
          edificio={{ href: "/#banco", titulo: m.bairro.edificios.banco.titulo }}
          rota="/credito"
          kicker="O banco · Crédito habitação"
          resposta={{
            instrumento: (
              <InstrumentoPrestacao
                euriborAte={ultimo12?.t ?? ultimo3?.t ?? null}
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
                    nome="Cálculo próprio — sistema de amortização francês · Euribor 3M, 6M e 12M, BPstat"
                    serieAte={ultimo12?.t ?? ultimo3?.t}
                  />
                }
              >
                <SimuladorPrestacao
                  euriborAtual={ultimo3?.v ?? null}
                  euriborAte={ultimo3?.t ?? null}
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

              {/* PROPOSTA (revisão do dono) — Amortização Antecipada */}
              <Figure
                title="Quanto poupas se amortizares mais cedo"
                source={
                  <Source
                    nome={`Cálculo próprio — sistema francês · ${creditoHabitacao.reembolsoAntecipado.baseLegal}`}
                    url={creditoHabitacao.fonteUrl}
                    vigencia={creditoHabitacao.vigencia}
                  />
                }
              >
                <SimuladorAmortizacao />
              </Figure>

              {/* Ouro Escondido #1 — Painel TAN vs. TAEG e MTIC */}
              <Figure
                title="Porque é que o spread mais baixo pode sair mais caro (TAN vs. TAEG e MTIC)"
                source={
                  <Source
                    nome="Cálculo próprio — simulação TAEG por bisseção e MTIC (DL n.º 133/2009 e DL n.º 74-A/2017)"
                    nota={`Custos indicativos de mercado: comissão de conta limitada por lei a ${comUnidade(fmtNum(servicosMinimos.tectoComissaoAnual.tectoAnualEuros, 2), "€/ano")} nos Serviços Mínimos Bancários (DL n.º 27-C/2000)`}
                  />
                }
              >
                <SimuladorTaeg
                  smbTectoAnual={servicosMinimos.tectoComissaoAnual.tectoAnualEuros}
                  smbAno={servicosMinimos.tectoComissaoAnual.indexanteApoiosSociais.ano}
                />
              </Figure>

              {/* Ouro Escondido #2 — Simulador Cartão de Crédito Revolving */}
              <Figure
                title="A armadilha do pagamento mínimo no cartão de crédito"
                source={
                  <Source
                    nome="Banco de Portugal — BPstat (série 13168964) e taxas de usura trimestrais (DL n.º 133/2009)"
                    url="https://clientebancario.bportugal.pt/pt-pt/taxas-de-juro-credito-aos-consumidores"
                    serieAte={taegMediaAte ?? undefined}
                    nota="A modalidade de pagamento mínimo é contratual — não existe mínimo legal em Portugal"
                  />
                }
              >
                <SimuladorCartao
                  taegMediaMercado={taegMediaMercado}
                  taegMediaAte={taegMediaAte}
                  taegMaximaUsura={taegMaximaUsura}
                  trimestreUsura={rotuloTrimestreUsura}
                  fonteCartoesUrl={cartoes.fonteUrl}
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
                    serieAte={ultimo3?.t}
                  />
                }
              >
                {eur3 ? (
                  <LineChart
                    series={[
                      {
                        name: "Euribor 3M",
                        data: eur3.series.map((p) => [p.t, p.v]),
                        cor: "var(--color-ink)",
                      },
                    ]}
                    unidade="%"
                    eventos={eventos.eventos.filter((e) => e.alvo === "euribor")}
                    estado={estado}
                    rotulos={m.chart}
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

              {/* PROPOSTA (revisão do dono) — Recomendação Macroprudencial BdP e Reembolso Antecipado */}
              <PaginaDetalhe rotulo="Limites do Banco de Portugal (LTV, DSTI e prazos) e comissão de amortização antecipada (DL 74-A/2017)">
                <div className="body-copy max-w-2xl space-y-4">
                  <p>
                    {/* PROPOSTA (revisão do dono) */}
                    <strong>
                      Comissão de reembolso antecipado (
                      {creditoHabitacao.reembolsoAntecipado.baseLegal}):
                    </strong>{" "}
                    {creditoHabitacao.reembolsoAntecipado.nota}
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-ink">
                      {/* PROPOSTA (revisão do dono) */}
                      Recomendação Macroprudencial do Banco de Portugal:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <strong>Maturidade máxima por idade:</strong>{" "}
                        {comUnidade(
                          fmtNum(
                            creditoHabitacao.recomendacaoMacroprudencialBdP
                              .maturidadeMaxima.ate30Anos,
                            0
                          ),
                          "anos"
                        )}{" "}
                        para mutuários com idade ≤{FINO}30 anos;{" "}
                        {comUnidade(
                          fmtNum(
                            creditoHabitacao.recomendacaoMacroprudencialBdP
                              .maturidadeMaxima.mais30Ate35Anos,
                            0
                          ),
                          "anos"
                        )}{" "}
                        entre 31 e 35 anos;{" "}
                        {comUnidade(
                          fmtNum(
                            creditoHabitacao.recomendacaoMacroprudencialBdP
                              .maturidadeMaxima.mais35Anos,
                            0
                          ),
                          "anos"
                        )}{" "}
                        acima de 35 anos.
                      </li>
                      <li>
                        <strong>Taxa de esforço (DSTI):</strong> limite geral
                        recomendado de{" "}
                        {fmtPct(
                          creditoHabitacao.recomendacaoMacroprudencialBdP.dsti
                            .limiteGeral,
                          0
                        )}{" "}
                        do rendimento líquido mensal, calculado com um choque de
                        +{fmtNum(
                          creditoHabitacao.recomendacaoMacroprudencialBdP.dsti
                            .choqueTaxaJuroPrazosLongos * 100,
                          1
                        )}
                        {FINO}p.p. na taxa de juro para contratos a taxa
                        variável ou mista com prazo superior a 10 anos (Instrução
                        BdP n.º 16/2023).
                      </li>
                      <li>
                        <strong>Rácio financiamento/garantia (LTV):</strong>{" "}
                        máximo de{" "}
                        {fmtPct(
                          creditoHabitacao.recomendacaoMacroprudencialBdP.ltv
                            .hpp,
                          0
                        )}{" "}
                        na habitação própria e permanente e{" "}
                        {fmtPct(
                          creditoHabitacao.recomendacaoMacroprudencialBdP.ltv
                            .outrosFins,
                          0
                        )}{" "}
                        em habitação secundária.
                      </li>
                    </ul>
                  </div>
                  <Source
                    nome={creditoHabitacao.fonte.replace(" c/ ", " e ")}
                    url={creditoHabitacao.fonteUrl}
                    vigencia={creditoHabitacao.vigencia}
                  />
                </div>
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

              {/* Ouro Escondido #3 — Serviços Mínimos Bancários */}
              <PaginaDetalhe rotulo={`Serviços Mínimos Bancários — o tecto legal de ${comUnidade(fmtNum(servicosMinimos.tectoComissaoAnual.tectoAnualEuros, 2), "€/ano")} (DL 27-C/2000)`}>
                <div className="body-copy max-w-2xl space-y-4">
                  <p>
                    {/* PROPOSTA (revisão do dono) */}
                    Quem contrata crédito à habitação é muitas vezes obrigado a manter
                    uma conta de depósito à ordem no banco mutuante. A lei portuguesa
                    garante que qualquer consumidor pode converter essa conta em
                    Conta de Serviços Mínimos Bancários sem custos (art. 4.º-A do DL n.º 27-C/2000).
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-ink">
                      O que a lei garante por 1{FINO}% do IAS ({comUnidade(fmtNum(servicosMinimos.tectoComissaoAnual.tectoAnualEuros, 2), "€/ano")}):
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {servicosMinimos.servicosIncluidos.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-ink">
                      Transferências sem comissão adicional:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {servicosMinimos.transferenciasIncluidasNoTecto.map((t, idx) => (
                        <li key={idx}>{t.replace(/(\d)\s+(€|%)/g, `$1${FINO}$2`)}</li>
                      ))}
                    </ul>
                  </div>
                  <Source
                    nome="Decreto-Lei n.º 27-C/2000 (versão consolidada) · Lei n.º 24/2023"
                    url={servicosMinimos.fonteUrl}
                    vigencia={servicosMinimos.vigencia}
                  />
                </div>
              </PaginaDetalhe>

              {/* Detalhes de Cartões de Crédito */}
              <PaginaDetalhe rotulo="Cartões de crédito — regras de reembolso e tectos de usura (DL 133/2009)">
                <div className="body-copy max-w-2xl space-y-4">
                  <p>
                    {/* PROPOSTA (revisão do dono) */}
                    O crédito aos consumidores através de cartões é regulado pelo Decreto-Lei
                    n.º 133/2009. A lei proíbe cobrança de comissões de processamento de
                    prestações (art. 23.º-A) e impõe limites trimestrais de usura calculados
                    pelo Banco de Portugal a partir da TAEG média do mercado mais 25{FINO}%.
                  </p>
                  <p>
                    {/* PROPOSTA (revisão do dono) */}
                    Não existe percentagem mínima fixada por lei para o pagamento mensal:
                    o montante ou percentagem mínima a pagar é livremente acordado no contrato.
                    Quanto mais baixa for a percentagem paga, mais juros acumulam e mais anos
                    a dívida demora a extinguir.
                  </p>
                  <Source
                    nome="Decreto-Lei n.º 133/2009 (regime dos contratos de crédito aos consumidores)"
                    url={cartoes.fonteUrl}
                    vigencia={cartoes.vigencia}
                  />
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="Fontes e dados">
                <div className="body-copy max-w-2xl space-y-3">
                  <Source
                    nome="Euribor 3M, 6M e 12M, médias mensais — Banco de Portugal, BPstat"
                    url="https://bpstat.bportugal.pt"
                    serieAte={ultimo12?.t ?? ultimo3?.t}
                  />
                  <Source
                    nome="Taxas de juro de crédito ao consumo e limites de usura — Banco de Portugal"
                    url="https://clientebancario.bportugal.pt/pt-pt/taxas-de-juro-credito-aos-consumidores"
                    serieAte={taegMediaAte ?? undefined}
                  />
                  <Source
                    nome={creditoHabitacao.fonte.replace(" c/ ", " e ")}
                    url={creditoHabitacao.fonteUrl}
                    vigencia={creditoHabitacao.vigencia}
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
                    . A simulação de habitação é cálculo próprio baseado no sistema francês
                    de amortização com cálculo de TAEG por bisseção.
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
    </div>
  );
}
