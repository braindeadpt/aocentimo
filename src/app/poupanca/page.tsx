import type { Metadata } from "next";
import { metaDeRota } from "@/lib/seo";
import { Figure } from "@/components/Figure";
import { Leitura } from "@/components/Leitura";
import { Source } from "@/components/Source";
import { EstadoVazio } from "@/components/EstadoVazio";
import { CampoCentimos } from "@/components/CampoCentimos";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { PoupancaProvider, PRAZO_CA, PRAZO_CT } from "./PoupancaSim";
import { FraseTaxaReal, InstrumentoTaxaReal } from "./HeroTaxaReal";
import { ComparadorPoupanca } from "./ComparadorPoupanca";
import { CadernetaAforro } from "./CadernetaAforro";
import { SimuladorPpr } from "./SimuladorPpr";
import { SimuladorMaisValias } from "./SimuladorMaisValias";
import { loadDerivado, loadFonte, loadFreshness } from "@/lib/data";
import { comUnidade, fmtData, fmtEUR0, fmtNum, fmtPct, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  insightMediana,
  janela10,
  mediana,
  rotulosLeitura,
  type Cartao,
  type Ponto,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import ca from "@data/fiscal/ca.json";
import ct from "@data/fiscal/ct.json";
import capitais from "@data/fiscal/capitais.json";
import ppr from "@data/fiscal/ppr.json";
import maisValias from "@data/fiscal/mais-valias.json";
import irs2026 from "@data/fiscal/irs-2026.json";
import ss from "@data/fiscal/ss.json";
import type { RegrasIRS } from "@/lib/engines/irs";
import { JsonLd, webApplication } from "@/lib/jsonld";
export const metadata: Metadata = metaDeRota("/poupanca");

/** derivado ca-base: taxa base mensal dos CA Série F (IGCP oficial +
    Euribor 3M indicativa) — o meta é mais rico que uma fonte crua */
interface CaBase {
  meta: {
    fonte: string;
    url: string;
    serieAte: string;
    oficialPct?: number;
  };
  series: Ponto[];
}

/** derivado hicp-resumo: um resumo por série Eurostat — usa-se a
    variação homóloga do IHPC total como inflação «agora» */
interface HicpResumo {
  derivadoEm: string;
  series: { id: string; serieAte: string; varHomologa: number }[];
}

export default function PoupancaPage() {
  const rotulos = rotulosLeitura();
  // frescura real das tabelas CA (IGCP) — o selo do instrumento nunca é literal
  const estadoFiscal = estadoDe(loadFreshness(), "fiscal-ca");

  // ————— a taxa base dos Certificados como instrumento —————
  const caBase = loadDerivado<CaBase>("ca-base");
  const serieCa = caBase ? janela10(caBase.series) : [];
  const ultCa = serieCa[serieCa.length - 1];
  const medCa = mediana(serieCa.map((p) => p.v));
  const cap = caBase?.meta.oficialPct;
  const cartao: Cartao | null =
    caBase && ultCa
      ? {
          breadcrumb: m.leitura.certificados.breadcrumb,
          titulo: m.leitura.certificados.titulo,
          insight:
            cap !== undefined && ultCa.v >= cap
              ? t(m.leitura.certificados.cap, {
                  valor: `${comUnidade(fmtNum(cap, 2), "%")}`,
                })
              : insightMediana(
                  ultCa.v,
                  medCa !== null ? { valor: medCa } : null,
                  "%"
                ),
          valor: ultCa.v,
          unidade: "%",
          formato: "pct",
          serie: serieCa,
          referencia:
            medCa !== null
              ? { valor: medCa, rotulo: m.leitura.mediana10 }
              : undefined,
          anotacao: anotacaoDe(serieCa, "max", (v) => `${comUnidade(fmtNum(v, 1), "%")}`),
          leitura: fmtPeriodo(caBase.meta.serieAte),
          estado: "sem-sla",
          fonteNome: caBase.meta.fonte,
          fonteUrl: caBase.meta.url,
          href: "/poupanca",
          hrefJson: "/api/ca-base.json",
          amplo: true,
        }
      : null;

  // ————— a inflação «agora»: variação homóloga real do IHPC —————
  const hicp = loadDerivado<HicpResumo>("hicp-resumo");
  const hicpTot = hicp?.series.find((s) => s.id === "hicp-pt-cp00");
  const inflacaoReal =
    hicpTot !== undefined
      ? Math.round(hicpTot.varHomologa * 1000) / 10
      : null;

  // ————— a taxa média real dos novos depósitos a prazo até 1 ano (BPstat) —————
  const depFonte = loadFonte("bpstat", "deposito-prazo-ate1a-mensal");
  const ultDep = depFonte?.series[depFonte.series.length - 1];
  const taxaBpstat = ultDep !== undefined ? ultDep.v : null;
  const depReal = loadDerivado<{
    meta: { fonte: string; url: string; serieAte: string };
    series: Ponto[];
  }>("deposito-real");
  const ultDepReal = depReal?.series[depReal.series.length - 1];

  // ————— os cêntimos do imposto — calculados do JSON, nunca escritos —————
  const centimosFisco = capitais.retencaoLiberatoria.taxa * 100;
  const centimosFica = 100 - centimosFisco;

  const premiosNota = ca.serieF.premiosPermanencia
    .map((p) => `+${p.pp.toFixed(2).replace(".", ",")} p.p. ${p.anos} ano`)
    .join(" · ");

  return (
    <div className="rt5">
    <>
      <JsonLd
        data={webApplication(
          "Comparador de poupança — Portugal",
          "/poupanca",
          "Comparador de poupança em Portugal: Certificados de Aforro, depósitos, PPR e mais-valias — a taxa real, não só a nominal."
        )}
      />
      {/* a poupança é uma só — a resposta, o comparador e a caderneta
          partilham capital, prazo e inflação via provider */}
      <PoupancaProvider
        taxaCA={ca.serieF.taxaBrutaNovasSubscricoes}
        premiosCA={ca.serieF.premiosPermanencia}
        maximoEurosCA={ca.serieF.maximoEuros}
        minimoSubscricaoCA={ca.serieF.minimoEuros}
        taxasCT={ct.serie5.taxasPorAno}
        minimoSubscricaoCT={ct.serie5.minimoSubscricao.euros}
        maximoEurosCT={ct.serie5.maximoPorConta.euros}
        taxaImposto={capitais.retencaoLiberatoria.taxa}
        taxaDepositoInicial={taxaBpstat}
        inflacaoInicial={inflacaoReal ?? 2}
      >
        <Pagina
          pergunta="Onde rende mais o teu dinheiro — depois de impostos e inflação?"
          edificio={{ href: "/#correios", titulo: m.bairro.edificios.correios.titulo }}
          rota="/poupanca"
          kicker="O banco · Poupança"
          resposta={{
            instrumento: (
              <InstrumentoTaxaReal
                estado={estadoFiscal}
                estadoRotulo={rotulos.estados[estadoFiscal]}
              />
            ),
            frase: <FraseTaxaReal />,
          }}
          explora={
            <>
              {/* o imposto em cêntimos — de cada euro de juro, o que sai
                  e o que fica; o valor sai do JSON fiscal */}
              <Figure
                title="De cada euro de juro"
                source={
                  <Source
                    nome={capitais.fonte}
                    url={capitais.fonteUrl}
                    vigencia={capitais.vigencia}
                  />
                }
              >
                <CampoCentimos
                  layout="montes"
                  partes={[
                    {
                      id: "fisco",
                      rotulo: "Vão para o Estado",
                      rotuloCurto: "Fisco",
                      valor: centimosFisco,
                      tom: "sai",
                      detalhe: `retenção de ${fmtPct(capitais.retencaoLiberatoria.taxa, 0)}`,
                    },
                    {
                      id: "fica",
                      rotulo: "Ficam contigo",
                      valor: centimosFica,
                      tom: "fica",
                      detalhe: "juro líquido",
                    },
                  ]}
                  equivalente={`De cada euro de juro: ${fmtNum(centimosFica)} cêntimos ficam contigo; ${fmtNum(centimosFisco)} vão para o Estado (retenção liberatória).`}
                  textos={{
                    pronto: (
                      <>
                        De cada euro de juro,{" "}
                        <b>{fmtNum(centimosFisco)} cêntimos</b> vão para o
                        Estado.
                      </>
                    ),
                  }}
                />
              </Figure>

              <Figure
                title="Quatro destinos para o mesmo dinheiro"
                source={
                  <Source
                    /* PROPOSTA (revisão do dono) */
                    nome="Cálculo próprio — taxas CA Série F e CT Série 5 (IGCP), depósitos (BPstat) e retenção CIRS"
                    vigencia={ct.vigencia}
                    nota={`${capitais.fonte} · vigente ${fmtData(capitais.vigencia)}${
                      depFonte?.meta.serieAte
                        ? ` · depósitos BPstat até ${fmtData(depFonte.meta.serieAte)}`
                        : ""
                    }`}
                  />
                }
              >
                <ComparadorPoupanca
                  taxaCA={ca.serieF.taxaBrutaNovasSubscricoes}
                  premiosCA={ca.serieF.premiosPermanencia}
                  taxasCT={ct.serie5.taxasPorAno}
                  taxaBpstat={taxaBpstat}
                  inflacaoReal={inflacaoReal}
                />
              </Figure>

              {/* a caderneta — o papel onde o Estado regista o aforro;
                  lê o mesmo capital, prazo e inflação do comparador */}
              <Figure
                title="A caderneta — Certificados de Aforro, Série F"
                source={<Source nome={ca.fonte} vigencia={ca.vigencia} />}
              >
                <CadernetaAforro
                  taxaCA={ca.serieF.taxaBrutaNovasSubscricoes}
                  premiosCA={ca.serieF.premiosPermanencia}
                  premiosNota={premiosNota}
                  garantia={ca.serieF.garantia}
                />
              </Figure>

              {/* a taxa base dos CA agora — contra a mediana de 10 anos */}
              {cartao ? (
                <Leitura {...cartao} rotulos={rotulos} />
              ) : (
                <EstadoVazio
                  titulo="a taxa base dos Certificados"
                  falha={m.estados.serieFalhou}
                  desde={
                    caBase?.meta.serieAte
                      ? fmtPeriodo(caBase.meta.serieAte)
                      : undefined
                  }
                  fonte={{
                    nome: caBase?.meta.fonte ?? "IGCP",
                    url: caBase?.meta.url ?? "https://www.igcp.pt",
                  }}
                />
              )}
            </>
          }
          confirma={
            <>
              <PaginaDetalhe rotulo="Certificados de Aforro — as regras da Série F">
                <div className="body-copy max-w-2xl space-y-4">
                  <p>
                    A taxa base é a {ca.serieF.base.toLowerCase()}. Os juros
                    vencem e capitalizam trimestralmente; o prémio de
                    permanência soma-se à base conforme o ano de vida do
                    certificado:
                  </p>
                  <table className="w-full text-corpo-sm bg-raised border border-line shadow-raised">
                    <thead>
                      <tr className="text-left border-b-2 border-ink">
                        <th scope="col" className="px-4 py-2 font-medium">Ano de vida</th>
                        <th scope="col" className="px-4 py-2 font-medium text-right">Prémio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ca.serieF.premiosPermanencia.map((p) => (
                        <tr key={p.anos} className="border-b border-line last:border-0">
                          <td className="px-4 py-1.5 text-ink2">{p.anos}</td>
                          <td className="px-4 py-1.5 text-right num">
                            +{fmtNum(p.pp, 2)}&#8239;p.p.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p>
                    Prazo máximo de {PRAZO_CA} anos, com resgate possível a
                    partir do 3.º mês. Subscrição mínima de{" "}
                    {fmtEUR0(ca.serieF.minimoEuros)} e tecto legal acumulado de{" "}
                    <strong>{fmtEUR0(ca.serieF.maximoEuros)}</strong> por
                    titular ({fmtNum(ca.serieF.maximoUnidades, 0)} unidades,
                    Portaria 149-A/2023). {ca.serieF.garantia}. Tributação:{" "}
                    {ca.serieF.tributacao.toLowerCase()}.
                  </p>
                </div>
              </PaginaDetalhe>

              {/* PROPOSTA (revisão do dono): CT Série 5 + secção dobrada CTPC suspenso */}
              <PaginaDetalhe rotulo="Certificados do Tesouro Série 5 — as regras (e o que mudou face aos CTPC)">
                <div className="body-copy max-w-2xl space-y-4">
                  <p>
                    Em comercialização desde {fmtData(ct.serie5.subscricaoDesde)}{" "}
                    ({ct.serie5.criacao}). Prazo de {PRAZO_CT} anos, subscrição
                    mínima de {fmtEUR0(ct.serie5.minimoSubscricao.euros)} e
                    máximo por conta de {fmtEUR0(ct.serie5.maximoPorConta.euros)}.
                    Ao contrário dos Certificados de Aforro,{" "}
                    <strong>não há capitalização</strong>: os juros vencem uma
                    vez por ano e são transferidos líquidos de IRS para o IBAN.
                  </p>
                  <table className="w-full text-corpo-sm bg-raised border border-line shadow-raised">
                    <thead>
                      <tr className="text-left border-b-2 border-ink">
                        <th scope="col" className="px-4 py-2 font-medium">Ano de vida</th>
                        <th scope="col" className="px-4 py-2 font-medium text-right">Taxa bruta fixa</th>
                        <th scope="col" className="px-4 py-2 font-medium text-right">Taxa líquida (após 28 %)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ct.serie5.taxasPorAno.map((tx, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          <td className="px-4 py-1.5 text-ink2">{i + 1}.º ano</td>
                          <td className="px-4 py-1.5 text-right num">{fmtPct(tx, 2)}</td>
                          <td className="px-4 py-1.5 text-right num">
                            {fmtPct(tx * (1 - capitais.retencaoLiberatoria.taxa), 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="footnote">
                    <strong>Resgate antecipado:</strong> só permitido decorrido
                    o 1.º ano, e implica a perda total dos juros corridos desde
                    o último aniversário anual até ao dia do resgate.
                  </p>
                  <div className="border-t border-line pt-3 space-y-2">
                    <p className="kicker">
                      Já tenho CTPC antigos — fechados a novas subscrições em 2021
                    </p>
                    <p className="text-corpo-sm text-ink2">
                      Os <strong>Certificados do Tesouro Poupança Crescimento (CTPC)</strong>{" "}
                      e os <strong>CTPV</strong> estão fechados a novas
                      subscrições (os CTPC desde{" "}
                      {fmtData(ca.ctpc.subscricaoSuspensaDesde)}, pela{" "}
                      {ca.ctpc.subscricaoBase}; os CTPV desde{" "}
                      {fmtData(ct.seriesSuspostas.ctpv.suspensaDesde)}). Quem já
                      os detém mantém os direitos até ao fim dos{" "}
                      {ca.ctpc.prazo}: taxas base de{" "}
                      {fmtPct(ca.ctpc.taxasPorAno[0], 2)} a{" "}
                      {fmtPct(ca.ctpc.taxasPorAno[ca.ctpc.taxasPorAno.length - 1], 2)}{" "}
                      acrescidas do prémio ligado ao PIB a partir do 2.º ano
                      (em vigor: {fmtPct(ca.ctpc.premio.atual, 2)}, tecto de{" "}
                      {fmtPct(ca.ctpc.premio.cap, 1)}).
                    </p>
                  </div>
                </div>
              </PaginaDetalhe>

              {/* PROPOSTA (revisão do dono): Garantia da República vs. FGD */}
              <PaginaDetalhe rotulo="Quem garante o capital — República Portuguesa vs. Fundo de Garantia de Depósitos">
                <div className="body-copy max-w-2xl space-y-3">
                  <p>
                    <strong>Certificados de Aforro e do Tesouro (IGCP):</strong>{" "}
                    são dívida pública directa da República Portuguesa. Não têm
                    intermediário bancário nem tecto de garantia — o reembolso
                    do capital investido é garantido na totalidade pelo Estado
                    português (respeitando os tectos de subscrição de{" "}
                    {fmtEUR0(ca.serieF.maximoEuros)} na Série F dos CA e{" "}
                    {fmtEUR0(ct.serie5.maximoPorConta.euros)} na Série 5 dos CT).
                  </p>
                  <p>
                    <strong>Depósitos bancários a prazo:</strong> são
                    responsabilidade do banco comercial onde estão depositados e
                    estão protegidos pelo{" "}
                    <strong>Fundo de Garantia de Depósitos (FGD)</strong> até ao
                    limite legal de <strong>{fmtEUR0(100000)}</strong> por
                    depositante e por instituição de crédito (Regime Geral das
                    Instituições de Crédito e Sociedades Financeiras, art.
                    166.º).{taxaBpstat !== null && ultDepReal !== undefined ? (
                      <>
                        {" "}A taxa média dos novos depósitos a prazo até 1 ano
                        dos particulares era de{" "}
                        <strong>{comUnidade(fmtNum(taxaBpstat, 2), "%")}</strong>{" "}
                        brutos em {fmtPeriodo(depFonte!.meta.serieAte)} (diferença
                        face à inflação homóloga:{" "}
                        <strong>
                          {comUnidade(fmtNum(ultDepReal.v, 2), "p.p.")}
                        </strong>
                        ).
                      </>
                    ) : null}
                  </p>
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="O imposto — a retenção e o englobamento">
                <div className="body-copy max-w-2xl space-y-3">
                  <p>{capitais.retencaoLiberatoria.nota}</p>
                  <p>
                    A retenção de {fmtPct(capitais.retencaoLiberatoria.taxa, 0)}{" "}
                    é <strong>liberatória</strong>: sai logo do vencimento e
                    fica resolvido. Podes optar por <strong>englobar</strong>{" "}
                    os juros no IRS — compensa se a tua taxa marginal for
                    inferior a {fmtPct(capitais.retencaoLiberatoria.taxa, 0)}
                    (rendimentos baixos); nesse caso o excesso retido é
                    devolvido no acerto anual.
                  </p>
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="PPR — o benefício fiscal, dos dois lados">
                <div className="space-y-4">
                  <p className="body-copy max-w-2xl">
                    O PPR paga-te à entrada (dedução à coleta) e cobra menos
                    à saída — dentro das condições legais. Fora delas devolves
                    o benefício com penalização: é dinheiro preso.
                  </p>
                  <SimuladorPpr
                    taxaLiberatoria={capitais.retencaoLiberatoria.taxa}
                    regrasPpr={{
                      deducao: {
                        pct: ppr.deducao.pct,
                        limitesPorIdade: ppr.deducao.limitesPorIdade,
                      },
                      saida: {
                        taxaEfetivaDentro: ppr.saida.taxaEfetivaDentro,
                      },
                    }}
                  />
                </div>
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="Mais-valias — o imposto sobre o ganho">
                <SimuladorMaisValias
                  regrasMV={{
                    mobiliarios: {
                      taxaAutonoma: maisValias.mobiliarios.taxaAutonoma,
                      exclusoesDetencao: maisValias.mobiliarios.exclusoesDetencao,
                    },
                    cripto: {
                      isencaoDetencaoDias: maisValias.cripto.isencaoDetencaoDias,
                      taxa: maisValias.cripto.taxa,
                    },
                    imoveis: {
                      percentagemEnglobada: maisValias.imoveis.percentagemEnglobada,
                    },
                  }}
                  regrasIrs={irs2026 as RegrasIRS}
                  ssTrab={ss.trabalhador.taxa}
                />
              </PaginaDetalhe>

              <PaginaDetalhe rotulo="Fontes e dados">
                <div className="body-copy max-w-2xl space-y-3">
                  <Source nome={ca.fonte} url={ca.fonteUrl} vigencia={ca.vigencia} />
                  <Source nome={ct.fonte} url={ct.fonteUrl} vigencia={ct.vigencia} />
                  {depFonte && (
                    <Source
                      nome={`${depFonte.meta.fonte} — ${depFonte.meta.dataset}`}
                      url={depFonte.meta.url}
                      serieAte={depFonte.meta.serieAte}
                      recolhidoEm={depFonte.meta.recolhidoEm}
                    />
                  )}
                  <Source
                    nome={capitais.fonte}
                    url={capitais.fonteUrl}
                    vigencia={capitais.vigencia}
                  />
                  <Source nome={ppr.fonte} url={ppr.fonteUrl} vigencia={ppr.vigencia} />
                  <Source
                    nome={maisValias.fonte}
                    url={maisValias.fonteUrl}
                    vigencia={maisValias.vigencia}
                  />
                  <Source
                    nome={caBase?.meta.fonte ?? "IGCP — taxa base CA"}
                    url={caBase?.meta.url}
                    serieAte={caBase?.meta.serieAte}
                    nota="a fórmula oficial está nas regras da Série F, acima"
                  />
                  <p className="footnote">
                    API estática:{" "}
                    <a href="/api/ca-base.json" className="lq-link">
                      /api/ca-base.json
                    </a>
                    . A simulação é cálculo próprio — não prevê taxas futuras
                    nem o prémio PIB por determinar.
                  </p>
                </div>
              </PaginaDetalhe>
            </>
          }
          seguinte={{
            href: "/dados",
            rotulo: "Como está Portugal hoje?",
          }}
        />
      </PoupancaProvider>
    </>
    </div>
  );
}
