import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Leitura } from "@/components/Leitura";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Source } from "@/components/Source";
import desemprego from "@data/fiscal/desemprego.json";
import catb from "@data/fiscal/catb.json";
import irs from "@data/fiscal/irs-2026.json";
import smn from "@data/fiscal/smn.json";
import cenariosJson from "@data/derived/cenarios-salario.json";
import type { CenariosSalario } from "@/lib/cenarios";
import { loadFonte, loadFreshness } from "@/lib/data";
import { comUnidade, fmtEUR0, fmtNum, fmtPct, fmtPeriodo } from "@/lib/format";
import {
  anotacaoDe,
  estadoDe,
  janela10,
  rotulosLeitura,
  type Cartao,
} from "@/lib/leitura";
import { m, t } from "@/lib/messages";
import { JsonLd, webApplication } from "@/lib/jsonld";
import { ProvedorTrabalho } from "./contexto";
import { RespostaTrabalho, FraseTrabalho } from "./RespostaTrabalho";
import { ExploraTrabalho } from "./ExploraTrabalho";

export const metadata: Metadata = {
  title: "Subsídio de desemprego — quanto e por quanto tempo",
  description:
    "Simulador do subsídio de desemprego em Portugal: 65% da remuneração de referência, limites do IAS, duração por idade e descontos.",
  alternates: { canonical: "/trabalho", types: ALT_FEED },
};

const ANO = irs.ano;

/**
 * /trabalho no template de três níveis (sessão 3A-03):
 *
 * 1 · A resposta — UM instrumento (cartão Ledger: régua do salário na
 *    zona de medição + a mensalidade como número herói, com a duração
 *    por baixo) e a frase simples com valor e tempo.
 * 2 · Explora — os controlos do caso (idade, descontos, majoração), a
 *    declaração da Segurança Social, os meses de subsídio em barra de
 *    traços com o degrau de −10 %, e os recibos verdes em campo de
 *    cêntimos.
 * 3 · Confirma — as regras do DL 220/2006, os limites em IAS, o que a
 *    simulação simplifica, o dado do país e as fontes.
 *
 * A régua abre no cenário canónico — o mesmo bruto de 1 500 € que
 * abre /salario e /irs.
 */
export default function TrabalhoPage() {
  const rotulos = rotulosLeitura();
  const fresh = loadFreshness();
  const cenarios = cenariosJson as unknown as CenariosSalario;
  const ias = irs.ias;

  // ————— o dado do país na página do trabalho: desemprego PT com a
  // média europeia como série de referência por baixo —————
  const unePt = loadFonte("eurostat", "une-pt-total");
  const uneUe = loadFonte("eurostat", "une-ue27-total");
  const seriePt = unePt ? janela10(unePt.series) : [];
  const serieUe = uneUe ? janela10(uneUe.series) : [];
  const ultPt = seriePt[seriePt.length - 1];
  const ultUe = serieUe[serieUe.length - 1];
  const cartao: Cartao | null =
    unePt && ultPt && ultUe
      ? {
          breadcrumb: m.painel.cartoes.desemprego.breadcrumb,
          titulo: m.painel.cartoes.desemprego.titulo,
          insight: t(m.painel.insightUe, {
            abs: fmtNum(Math.abs(ultPt.v - ultUe.v), 1),
            direcao: ultPt.v >= ultUe.v ? m.painel.acima : m.painel.abaixo,
          }),
          valor: ultPt.v,
          unidade: "%",
          formato: "pct1",
          serie: seriePt,
          referencia: { pontos: serieUe, rotulo: m.leitura.ue27 },
          anotacao: anotacaoDe(seriePt, "max", (v) => `${comUnidade(fmtNum(v, 1), "%")}`),
          leitura: fmtPeriodo(unePt.meta.serieAte),
          estado: estadoDe(fresh, "une-pt-total"),
          fonteNome: unePt.meta.fonte,
          fonteUrl: unePt.meta.url,
          href: "/trabalho",
          hrefJson: "/api/une-pt-total.json",
          amplo: true,
        }
      : null;

  return (
    <ProvedorTrabalho
      regua={{
        rotulo: "Salário bruto mensal (antes do desemprego)",
        min: cenarios.meta.inicio,
        max: cenarios.meta.fim,
        passo: cenarios.meta.passo,
        pontos: cenarios.linhas.map((l) => l.bruto),
        inicial: cenarios.meta.brutoRef,
        marcador: { valor: smn.regioes.continente, rotulo: m.regua.minimo },
        descricao:
          "Os 11 % que descontas todos os meses pagam isto: 65 % da tua remuneração de referência, dentro de limites e por tempo contado.",
      }}
    >
      <JsonLd
        data={webApplication(
          "Simuladores de trabalho — desemprego e recibos verdes",
          "/trabalho",
          "Simulador do subsídio de desemprego e do trabalho independente em Portugal: quanto recebes e por quanto tempo."
        )}
      />
      <Pagina
        pergunta="Se ficares sem trabalho, quanto recebes e por quanto tempo?"
        rota="/trabalho"
        kicker="Proteção no desemprego"
        resposta={{
          instrumento: <RespostaTrabalho />,
          frase: <FraseTrabalho />,
        }}
        explora={<ExploraTrabalho ias={ias} />}
        confirma={
          <>
            <PaginaDetalhe rotulo="As regras — DL 220/2006">
              <div className="body-copy max-w-2xl space-y-4">
                <p>
                  <strong>Quem tem direito:</strong> desemprego
                  involuntário com {desemprego.prazoGarantia.dias} dias de
                  descontos nos últimos {desemprego.prazoGarantia.meses}{" "}
                  meses (o «prazo de garantia»). O pedido faz-se no IEFP
                  até 90 dias depois do fim do contrato.
                </p>
                <p>
                  <strong>Quanto:</strong>{" "}
                  {fmtPct(desemprego.montante.percentagemRR, 0)} da
                  remuneração de referência — a média dos primeiros 12
                  dos últimos 14 meses, com subsídios incluídos. Com
                  limites: nunca menos que 1×IAS (
                  {fmtEUR0(desemprego.limites.minimoIas * ias)};{" "}
                  {fmtEUR0(
                    desemprego.limites.minimoSeSalarioMinimoIas * ias
                  )}{" "}
                  se o salário era pelo menos o mínimo), nunca mais que
                  2,5×IAS ({fmtEUR0(desemprego.limites.maximoIas * ias)})
                  nem que {fmtPct(desemprego.limites.maximoRRliquida, 0)}{" "}
                  da remuneração líquida de referência.
                </p>
                <p>
                  <strong>O degrau:</strong> a partir do 181.º dia o valor
                  desce {fmtPct(desemprego.reducaoApos180Dias, 0)}.{" "}
                  <strong>A majoração:</strong> +
                  {fmtPct(desemprego.majoracao.taxa, 0)} se o casal está
                  ambos desempregado com dependentes, ou em agregado
                  monoparental.
                </p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="border-b-2 border-ink text-left">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Idade
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        &lt;15 meses de descontos
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        15–24 meses
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        ≥24 meses
                      </th>
                      <th scope="col" className="py-2 font-medium text-right">
                        + por cada 5 anos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {desemprego.duracao.linhas.map((l, i) => (
                      <tr key={i} className="border-b border-line">
                        <td className="py-2 pr-4 text-ink2">
                          {l.idadeAte === null
                            ? "50 ou mais"
                            : `até ${l.idadeAte}`}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {l.duracao[0]} dias
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {l.duracao[1]} dias
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {l.duracao[2]} dias
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          +{l.acrescimoPorCincoAnos} dias
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                {desemprego.duracao.nota}. IAS {ANO} = {fmtEUR0(ias)}.
              </p>
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="O que a simulação simplifica">
              <div className="body-copy max-w-2xl space-y-4">
                <p>
                  Assume salário estável nos últimos 14 meses e descontos
                  contínuos — na realidade a remuneração de referência
                  soma o que efetivamente entrou para a Segurança Social.
                  Não cobre subsídio social de desemprego, trabalhadores
                  independentes, nem as regras transitórias de carreiras
                  antigas. A decisão certa é a da Segurança Social.
                </p>
              </div>
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="O desemprego em Portugal — o dado do país">
              {cartao ? (
                <Leitura {...cartao} rotulos={rotulos} />
              ) : (
                // a falha mostra-se no lugar do instrumento — nunca um
                // buraco
                <EstadoVazio
                  titulo="a série do desemprego em Portugal"
                  falha={
                    !ultUe && unePt
                      ? "a referência UE 27 não chegou — sem ela não há comparação"
                      : m.estados.serieFalhou
                  }
                  desde={
                    unePt?.meta.serieAte
                      ? fmtPeriodo(unePt.meta.serieAte)
                      : undefined
                  }
                  fonte={{
                    nome: unePt?.meta.fonte ?? "Eurostat",
                    url: unePt?.meta.url ?? "https://ec.europa.eu/eurostat",
                  }}
                />
              )}
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Legislação e fontes">
              <div className="space-y-2">
                <Source
                  nome={desemprego.fonte}
                  vigencia={desemprego.vigencia}
                  url={desemprego.fonteUrl}
                />
                <Source
                  nome={catb.fonte}
                  vigencia={catb.vigencia}
                  url={catb.fonteUrl}
                />
                <Source
                  nome={smn.fonte}
                  vigencia={smn.vigencia}
                  url={smn.fonteUrl}
                />
              </div>
            </PaginaDetalhe>
          </>
        }
        seguinte={{
          href: "/impostos",
          rotulo: "E do que ganhas, quanto volta ao Estado quando gastas?",
        }}
      />
    </ProvedorTrabalho>
  );
}
