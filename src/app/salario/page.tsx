import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { Pagina, PaginaDetalhe } from "@/components/Pagina";
import { Source } from "@/components/Source";
import { fmtEUR, fmtPct } from "@/lib/format";
import { m } from "@/lib/messages";
import irs from "@data/fiscal/irs-2026.json";
import ss from "@data/fiscal/ss.json";
import smn from "@data/fiscal/smn.json";
import sa from "@data/fiscal/subsidio-alimentacao.json";
import irsJovem from "@data/fiscal/irs-jovem.json";
import cenariosJson from "@data/derived/cenarios-salario.json";
import type { CenariosSalario } from "@/lib/cenarios";
import { JsonLd, webApplication } from "@/lib/jsonld";
import { ProvedorSalario } from "./contexto";
import { RespostaSalario, FraseSalario } from "./RespostaSalario";
import { ExploraSalario } from "./ExploraSalario";
import { AnoDetalhe, TaxasDetalhe } from "./ConfirmaSalario";

export const metadata: Metadata = {
  title: "Do bruto ao líquido — salário e IRS",
  description:
    "Calculadora de salário líquido em Portugal: Segurança Social, IRS por escalões, deduções e o custo real para a empresa.",
  alternates: { canonical: "/salario", types: ALT_FEED },
};

const ANO = irs.ano;

/**
 * /salario no template de três níveis (sessão 3A-01):
 *
 * 1 · A resposta — UM instrumento (cartão Ledger: régua do bruto na
 *    zona de medição + o líquido canónico como número herói) e a frase
 *    simples com o custo da empresa, o líquido e os cêntimos de cada
 *    euro.
 * 2 · Explora — os controlos físicos, o talão de vencimento (a melhor
 *    peça do site), o custo total em cêntimos (CampoCentimos montes) e
 *    o dia da liberdade fiscal num anel de 365 dias.
 * 3 · Confirma — o ano a 14 vs 12 meses, efetiva vs marginal, a
 *    mecânica e as fontes.
 *
 * O estado é partilhado pelos três níveis via ProvedorSalario: a
 * régua no nível 1 e os controlos no nível 2 alimentam o mesmo
 * recibo.
 */
export default function SalarioPage() {
  return (
    <ProvedorSalario
      ano={ANO}
      cenarios={cenariosJson as unknown as CenariosSalario}
      saIsento={sa.isentoPorDia}
      irsJovemIsencao={irsJovem.isencaoPorAno}
      seloNaoRetido={m.salario.naoRetido}
      regua={{
        rotulo: m.regua.salarioBruto,
        marcador: { valor: smn.regioes.continente, rotulo: m.regua.minimo },
        presets: [
          { rotulo: m.regua.minimo, valor: smn.regioes.continente },
          { rotulo: m.regua.doisMil, valor: 2000 },
        ],
        descricao: m.regua.dica,
        limites: {
          min: m.regua.limiteRazaoMin,
          max: m.regua.limiteRazaoMax,
        },
      }}
    >
      <JsonLd
        data={webApplication(
          "Calculadora de salário líquido — Portugal",
          "/salario",
          "Do salário bruto ao líquido em Portugal: Segurança Social, retenção de IRS, deduções e o custo total para a empresa."
        )}
      />
      <Pagina
        pergunta="Quanto vais receber mesmo?"
        rota="/salario"
        kicker="Do bruto ao líquido"
        resposta={{
          instrumento: <RespostaSalario />,
          frase: <FraseSalario />,
        }}
        explora={<ExploraSalario />}
        confirma={
          <>
            <PaginaDetalhe rotulo="O ano inteiro — líquido a 14 e a 12 meses">
              <AnoDetalhe />
              <p className="body-copy mt-3 max-w-2xl">
                Há dois líquidos porque há duas contas: o do recibo —
                a retenção real de cada mês, que é o número do nível 1 —
                e a média anual, que divide os subsídios de férias e de
                Natal e estima o IRS da liquidação, repartida por 14
                meses ou por 12 em duodécimos. O recibo adianta; a
                liquidação acerta.
              </p>
            </PaginaDetalhe>
            <PaginaDetalhe rotulo="Taxa efetiva e taxa marginal">
              <TaxasDetalhe />
              <p className="body-copy mt-3 max-w-2xl">
                A efetiva é a média — quanto de cada euro vai para o
                Estado. A marginal é a taxa do escalão onde cai o
                próximo euro — e só se aplica a esse euro, nunca a todo
                o salário. «Para o Estado» soma IRS, a tua Segurança
                Social ({fmtPct(ss.trabalhador.taxa, 0)}) e a TSU da
                empresa ({fmtPct(ss.entidadePatronal.taxa, 2)}) sobre o
                custo total.
              </p>
            </PaginaDetalhe>
            <PaginaDetalhe rotulo="Como se calcula">
              <div className="body-copy max-w-2xl space-y-4">
                <p>
                  1. Soma os 14 meses (salário + subsídios de férias e
                  Natal). 2. Abate a <strong>dedução específica</strong> (
                  {fmtEUR(irs.deducaoEspecificaFixa)} em {ANO}, ou as tuas
                  contribuições para a Segurança Social se forem
                  maiores). 3. Aplica o{" "}
                  <strong>abatimento por mínimo de existência</strong> —
                  o mecanismo que isenta quem ganha até ao salário
                  mínimo. 4. Aplica os escalões — em casados, sobre
                  metade do rendimento coletável do casal e a dobrar
                  (quociente conjugal). 5. Subtrai deduções à coleta:{" "}
                  {fmtEUR(irs.despesasGeraisPorTitular)} de despesas
                  gerais por titular e{" "}
                  {fmtEUR(irs.deducaoPorDependente)} por dependente.
                </p>
                <p>
                  O recibo mensal usa as{" "}
                  <strong>tabelas de retenção na fonte</strong> oficiais
                  (continente, sem deficiência) e trata o excedente do
                  subsídio de alimentação como salário. O que fica de
                  fora de propósito: deduções de saúde/educação/rendas,
                  subsídio de desemprego, Açores e Madeira, e regimes
                  especiais. O número certo é o da tua liquidação — esta
                  é a mecânica, não o teu caso particular.
                </p>
              </div>
            </PaginaDetalhe>
            <PaginaDetalhe rotulo="Legislação e fontes">
              <div className="space-y-2">
                <Source
                  nome="Retenção na fonte — Despacho n.º 233-A/2026"
                  vigencia={irs.vigencia}
                />
                <Source
                  nome="Escalões — art. 68.º CIRS, redação da Lei n.º 73-A/2025 (OE2026)"
                  vigencia={irs.vigencia}
                  url={irs.fonteUrl}
                />
                <Source
                  nome="TSU — Segurança Social"
                  vigencia={ss.vigencia}
                  url={ss.fonteUrl}
                />
                <Source
                  nome={sa.fonte}
                  vigencia={sa.vigencia}
                  url={sa.fonteUrl}
                />
                <Source
                  nome={irsJovem.fonte}
                  vigencia={irsJovem.vigencia}
                  url={irsJovem.fonteUrl}
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
        seguinte={{ href: "/irs", rotulo: "E no fim do ano, recebes ou pagas?" }}
      />
    </ProvedorSalario>
  );
}
