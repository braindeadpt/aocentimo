import type { Metadata } from "next";
import { Figure } from "@/components/Figure";
import { SimuladorIrsJovem } from "./SimuladorIrsJovem";
import { SimuladorAcerto } from "./SimuladorAcerto";
import deducoes from "@data/fiscal/deducoes-2026.json";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import irs from "@data/fiscal/irs-2026.json";
import retencao from "@data/fiscal/retencao-2026.json";
import irsJovem from "@data/fiscal/irs-jovem.json";

export const metadata: Metadata = {
  title: "IRS — escalões, retenção e IRS Jovem",
  description:
    "Os escalões de IRS em Portugal, a retenção na fonte mensal e o simulador de IRS Jovem: quanto poupas em cada um dos 10 anos.",
};

const ANO = irs.ano;

export default function IrsPage() {
  // amostra da tabela I para mostrar a mecânica da retenção
  const amostra = retencao.tabelas.I.linhas
    .filter((l) => l.parcelaAbater !== undefined || l.taxaMarginal === 0)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Imposto sobre o rendimento</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        IRS — os dois impostos que pagas
      </h1>
      <p className="lede mt-5">
        Pagas IRS duas vezes sem dar por isso: todos os meses, como{" "}
        <strong>retenção na fonte</strong> que o patrão desconta do recibo; e
        uma vez por ano, na <strong>liquidação</strong> que acerta as contas.
        Se retiveste a mais, recebes reembolso — foi um empréstimo grátis ao
        Estado.
      </p>

      <Figure n={1} title={`Escalões de IRS ${ANO}`} source={irs.fonte}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4 font-medium">Rendimento coletável</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Taxa normal</th>
                <th scope="col" className="py-2 font-medium text-right">Taxa média</th>
              </tr>
            </thead>
            <tbody className="num">
              {irs.escaloes.map((e, i) => {
                const de = i === 0 ? 0 : (irs.escaloes[i - 1].ate ?? 0);
                return (
                  <tr key={i} className="border-b border-line">
                    <td className="py-2 pr-4 text-ink2">
                      {e.ate === null
                        ? `Mais de ${fmtEUR(de)}`
                        : de === 0
                          ? `Até ${fmtEUR(e.ate)}`
                          : `${fmtEUR(de)} – ${fmtEUR(e.ate)}`}
                    </td>
                    <td className="py-2 pr-4 text-right">{fmtPct(e.taxa)}</td>
                    <td className="py-2 text-right">
                      {e.taxaMedia === null ? "—" : fmtPct(e.taxaMedia, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="footnote mt-3">
          A taxa <em>normal</em> aplica-se só à fatia dentro do escalão —
          subir de escalão nunca te faz perder dinheiro. Acima de{" "}
          {fmtEUR0(irs.solidariedade[0].de)} acresce a taxa de solidariedade.
        </p>
      </Figure>

      <Figure n={2} title="Retenção na fonte — a fatia de cada mês" source={retencao.fonte}>
        <p className="text-sm text-ink2 mb-4">
          A fórmula de {ANO} é progressiva ao cêntimo:{" "}
          <span className="num">retenção = bruto × taxa marginal − parcela a
          abater − parcela por dependente</span>. Tabela I (não casado e
          casado dois titulares), amostra:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4 font-medium">Bruto mensal até</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Taxa marginal</th>
                <th scope="col" className="py-2 font-medium text-right">Parcela a abater</th>
              </tr>
            </thead>
            <tbody className="num">
              {amostra.map((l, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink2">
                    {l.ate === null ? "Sem limite" : fmtEUR(l.ate)}
                  </td>
                  <td className="py-2 pr-4 text-right">{fmtPct(l.taxaMarginal, 2)}</td>
                  <td className="py-2 text-right">
                    {l.parcelaAbater !== undefined ? fmtEUR(l.parcelaAbater) : "fórmula de transição"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote mt-3">
          Com 3+ dependentes a taxa marginal desce 1 p.p. Casado único
          titular e não casado com dependentes usam as tabelas III e II —
          completas no <a href="/salario" className="underline decoration-line2 underline-offset-2">simulador de salário</a>.
        </p>
      </Figure>

      <Figure n={3} title="O acerto de contas — deduções à coleta" source={deducoes.fonte}>
        <SimuladorAcerto ano={ANO} />
      </Figure>

      <Figure n={4} title="IRS Jovem — quanto vale, ano a ano" source={irsJovem.fonte}>
        <SimuladorIrsJovem ano={ANO} />
      </Figure>

      <section className="max-w-2xl py-8 space-y-4 text-ink2 text-[0.95rem] leading-relaxed">
        <h2 className="font-display text-2xl text-ink">O que contar ao IRS Jovem</h2>
        <p>
          Até aos {irsJovem.idadeMax} anos, nos primeiros{" "}
          {irsJovem.anosMax} anos de rendimentos: {fmtPct(1, 0)} de isenção no
          1.º ano, depois 75 %, 50 % e 25 % — com teto de 55×IAS (
          {fmtEUR0(irsJovem.limiteIsencaoIas * irs.ias)}/ano em {ANO}). O
          simulador trata um titular solteiro; casados, dependentes e
          rendimentos da categoria B mudam a conta.
        </p>
      </section>
    </div>
  );
}
