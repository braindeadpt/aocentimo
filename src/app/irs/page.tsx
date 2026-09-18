import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { SimuladorIrsJovem } from "./SimuladorIrsJovem";
import { SimuladorAcerto } from "./SimuladorAcerto";
import { EscaloesEnchem } from "./EscaloesEnchem";
import deducoes from "@data/fiscal/deducoes-2026.json";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import irs from "@data/fiscal/irs-2026.json";
import retencao from "@data/fiscal/retencao-2026.json";
import irsJovem from "@data/fiscal/irs-jovem.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "IRS — escalões, retenção e IRS Jovem",
  description:
    "Os escalões de IRS em Portugal, a retenção na fonte mensal e o simulador de IRS Jovem: quanto poupas em cada um dos 10 anos.",
  alternates: { canonical: "/irs", types: ALT_FEED },
};

const ANO = irs.ano;

export default function IrsPage() {
  // amostra da tabela I para mostrar a mecânica da retenção
  const amostra = retencao.tabelas.I.linhas
    .filter((l) => l.parcelaAbater !== undefined || l.taxaMarginal === 0)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Simulador de IRS e IRS Jovem",
          "/irs",
          "Escalões de IRS, retenção na fonte e simulador de IRS Jovem em Portugal: quanto poupas em cada um dos 10 anos."
        )}
      />
      <p className="kicker">Imposto sobre o rendimento</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Subir de escalão faz-te perder dinheiro?
      </h1>
      <p className="lede mt-5">
        <strong>Não.</strong> Cada escalão tributa só a fatia de rendimento
        que lá cabe — os euros anteriores continuam na taxa deles. E pagas
        IRS duas vezes sem dar por isso: todos os meses, como{" "}
        <strong>retenção na fonte</strong> que o patrão desconta do recibo; e
        uma vez por ano, na <strong>liquidação</strong> que acerta as contas.
      </p>

      <Figure
        title={`Os escalões enchem — IRS ${ANO}`}
        source={<Source nome={irs.fonte} vigencia={irs.vigencia} />}
      >
        <p className="text-sm text-ink2 mb-5">
          Põe o teu rendimento coletável e vê os nove recipientes a encher
          por ordem: cada um cobra a sua taxa só sobre a fatia que recebe.
        </p>
        <EscaloesEnchem ano={ANO} />
      </Figure>

      <Figure
        title="Retenção na fonte — a fatia de cada mês"
        source={<Source nome={retencao.fonte} vigencia={retencao.vigencia} />}
      >
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
                  <td className="py-2 pr-4 text-ink2 tabular-nums">
                    {l.ate === null ? "Sem limite" : fmtEUR(l.ate)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{fmtPct(l.taxaMarginal, 2)}</td>
                  <td className="py-2 text-right tabular-nums">
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

      <Figure
        title="A nota de liquidação — o acerto de contas"
        source={<Source nome={deducoes.fonte} vigencia={deducoes.vigencia} />}
      >
        <SimuladorAcerto ano={ANO} />
      </Figure>

      <Figure
        title="IRS Jovem — dez anos em sequência"
        source={<Source nome={irsJovem.fonte} vigencia={irsJovem.vigencia} />}
      >
        <SimuladorIrsJovem ano={ANO} />
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
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
