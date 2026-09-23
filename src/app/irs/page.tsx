import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Source } from "@/components/Source";
import { simularSalario } from "@/lib/engines/irs";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import irs from "@data/fiscal/irs-2026.json";
import retencao from "@data/fiscal/retencao-2026.json";
import deducoes from "@data/fiscal/deducoes-2026.json";
import irsJovem from "@data/fiscal/irs-jovem.json";
import cenariosJson from "@data/derived/cenarios-salario.json";
import type { CenariosSalario } from "@/lib/cenarios";
import { JsonLd, webApplication } from "@/lib/jsonld";
import { ProvedorIrs } from "./contexto";
import { RespostaIrs, FraseIrs } from "./RespostaIrs";
import { ExploraIrs } from "./ExploraIrs";

export const metadata: Metadata = {
  title: "IRS — escalões, retenção e IRS Jovem",
  description:
    "Os escalões de IRS em Portugal, a retenção na fonte mensal e o simulador de IRS Jovem: quanto poupas em cada um dos 10 anos.",
  alternates: { canonical: "/irs", types: ALT_FEED },
};

const ANO = irs.ano;

/**
 * /irs no template de três níveis (sessão 3A-02):
 *
 * 1 · A resposta — UM instrumento (cartão Ledger: régua do rendimento
 *    coletável + o IRS certo como herói + os nove recipientes que
 *    enchem) e a frase que desfaz o mito com números.
 * 2 · Explora — a nota de liquidação (reembolso ou a pagar) e o IRS
 *    Jovem em barra de traços de dez anos.
 * 3 · Confirma — a tabela canónica de escalões (as outras páginas
 *    ligam para aqui), a amostra da retenção, as deduções à coleta e
 *    as fontes.
 *
 * A régua abre no coletável do cenário canónico — o mesmo bruto de
 * 1 500 € que abre /salario.
 */
export default function IrsPage() {
  const cenarios = cenariosJson as unknown as CenariosSalario;

  // o coletável canónico sai do motor no servidor — a mesma conta que
  // /salario faz, sem duplicar regras no componente
  const rcCanonico = simularSalario(
    [cenarios.meta.brutoRef],
    0,
    ANO
  ).coletavelTributado;

  // amostra da tabela I para mostrar a mecânica da retenção
  const amostra = retencao.tabelas.I.linhas
    .filter((l) => l.parcelaAbater !== undefined || l.taxaMarginal === 0)
    .slice(0, 8);

  const cats = deducoes.categorias;

  return (
    <ProvedorIrs
      ano={ANO}
      rcInicial={Math.round(rcCanonico)}
      regua={{
        rotulo: "Rendimento coletável anual",
        min: 0,
        max: 90000,
        passo: 250,
        marcador: {
          valor: Math.round(rcCanonico),
          rotulo: "o cenário canónico",
        },
        descricao:
          "O bruto menos a dedução específica e o mínimo de existência — o número sobre o qual os escalões trabalham (em casados, metade do casal).",
        limites: {
          max: "a régua cobre os nove escalões; acima daí só muda a taxa de solidariedade",
        },
      }}
    >
      <JsonLd
        data={webApplication(
          "Simulador de IRS e IRS Jovem",
          "/irs",
          "Escalões de IRS, retenção na fonte e simulador de IRS Jovem em Portugal: quanto poupas em cada um dos 10 anos."
        )}
      />
      <Pagina
        pergunta="Subir de escalão faz-te perder dinheiro?"
        rota="/irs"
        kicker="Imposto sobre o rendimento"
        resposta={{
          instrumento: <RespostaIrs />,
          frase: <FraseIrs />,
        }}
        explora={<ExploraIrs ano={ANO} ias={irs.ias} reguaJovem={{
          min: cenarios.meta.inicio,
          max: cenarios.meta.fim,
          passo: cenarios.meta.passo,
          pontos: cenarios.linhas.map((l) => l.bruto),
          inicial: cenarios.meta.brutoRef,
        }} />}
        confirma={
          <>
            <PaginaDetalhe rotulo={`A tabela canónica — os nove escalões de ${ANO}`}>
              <p className="body-copy mb-4 max-w-2xl">
                É esta a tabela do site: as outras páginas ligam para
                aqui. Cada escalão tributa só a fatia de rendimento que
                lá cabe — a «taxa média no topo» é a que resulta quando
                o escalão está cheio.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="border-b-2 border-ink text-left">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Escalão
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Rendimento coletável
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Taxa marginal
                      </th>
                      <th scope="col" className="py-2 font-medium text-right">
                        Taxa média no topo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {irs.escaloes.map((e, i) => (
                      <tr key={i} className="border-b border-line">
                        <td className="py-2 pr-4 text-ink2">{i + 1}.º</td>
                        <td className="py-2 pr-4 tabular-nums">
                          {e.ate === null
                            ? `mais de ${fmtEUR0(
                                irs.escaloes[i - 1]?.ate ?? 0
                              )}`
                            : i === 0
                              ? `até ${fmtEUR0(e.ate)}`
                              : `${fmtEUR0(
                                  irs.escaloes[i - 1].ate ?? 0
                                )} – ${fmtEUR0(e.ate)}`}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {fmtPct(e.taxa)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {e.taxaMedia === null ? "—" : fmtPct(e.taxaMedia)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                Acima de {fmtEUR0(irs.solidariedade[0].de)} acresce a taxa
                de solidariedade: {fmtPct(irs.solidariedade[0].taxa, 1)} até{" "}
                {fmtEUR0(irs.solidariedade[1].de ?? 0)} e{" "}
                {fmtPct(irs.solidariedade[1].taxa, 1)} a partir daí. Mínimo
                de existência — {fmtEUR0(irs.minimoExistencia.valorReferencia)}{" "}
                de referência (
                {irs.minimoExistencia.valorReferenciaNota}); não se aplica
                por titular acima de{" "}
                {fmtEUR0(irs.minimoExistencia.naoAplicaAcimaPorTitular)}.
              </p>
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Retenção na fonte — a fatia de cada mês">
              <p className="body-copy mb-4 max-w-2xl">
                A fórmula de {ANO} é progressiva ao cêntimo:{" "}
                <span className="num">
                  retenção = bruto × taxa marginal − parcela a abater −
                  parcela por dependente
                </span>
                . Tabela I (não casado e casado dois titulares), amostra:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="border-b-2 border-ink text-left">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Bruto mensal até
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Taxa marginal
                      </th>
                      <th scope="col" className="py-2 font-medium text-right">
                        Parcela a abater
                      </th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {amostra.map((l, i) => (
                      <tr key={i} className="border-b border-line">
                        <td className="py-2 pr-4 tabular-nums text-ink2">
                          {l.ate === null ? "Sem limite" : fmtEUR(l.ate)}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {fmtPct(l.taxaMarginal, 2)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {l.parcelaAbater !== undefined
                            ? fmtEUR(l.parcelaAbater)
                            : "fórmula de transição"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                Com 3+ dependentes a taxa marginal desce 1&nbsp;p.p. Casado
                único titular e não casado com dependentes usam as tabelas
                III e II — completas no{" "}
                <a
                  href="/salario"
                  className="underline decoration-line2 underline-offset-2"
                >
                  simulador de salário
                </a>
                .
              </p>
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Deduções à coleta">
              <div className="overflow-x-auto">
                <table className="w-full text-corpo-sm">
                  <thead>
                    <tr className="border-b-2 border-ink text-left">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Categoria
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">
                        Dedução
                      </th>
                      <th scope="col" className="py-2 font-medium text-right">
                        Limite
                      </th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">Despesas gerais</td>
                      <td className="py-2 pr-4 text-right tabular-nums">35&nbsp;%</td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(irs.despesasGeraisPorTitular)} por titular
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">Dependentes</td>
                      <td className="py-2 pr-4 text-right tabular-nums">—</td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(irs.deducaoPorDependente)} por dependente
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">Saúde</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtPct(cats.saude.pct ?? 0, 0)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(cats.saude.limite)}
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">Educação</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtPct(cats.educacao.pct ?? 0, 0)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(cats.educacao.limite)}
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">Rendas HPP</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtPct(cats.rendas.pct ?? 0, 0)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(cats.rendas.limite)}
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">Lares e apoio</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtPct(cats.lares.pct ?? 0, 0)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(cats.lares.limite)}
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">IVA das faturas</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        apurado no e-Fatura
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(cats.ivaFatura.limite)}
                      </td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">
                        Pensões de alimentos
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {fmtPct(cats.pensoesAlimentos.pct ?? 0, 0)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {fmtEUR0(cats.pensoesAlimentos.limite)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="footnote mt-3">
                {deducoes.limiteGlobal.nota}
              </p>
            </PaginaDetalhe>

            <PaginaDetalhe rotulo="Legislação e fontes">
              <div className="space-y-2">
                <Source
                  nome={irs.fonte}
                  vigencia={irs.vigencia}
                  url={irs.fonteUrl}
                />
                <Source
                  nome={retencao.fonte}
                  vigencia={retencao.vigencia}
                  url={retencao.fonteUrl}
                />
                <Source
                  nome={deducoes.fonte}
                  vigencia={deducoes.vigencia}
                  url={deducoes.fonteUrl}
                />
                <Source
                  nome={irsJovem.fonte}
                  vigencia={irsJovem.vigencia}
                  url={irsJovem.fonteUrl}
                />
              </div>
            </PaginaDetalhe>
          </>
        }
        seguinte={{ href: "/trabalho", rotulo: "E se ficares sem trabalho?" }}
      />
    </ProvedorIrs>
  );
}
