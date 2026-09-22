import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { CalculadoraSalario } from "./CalculadoraSalario";
import { Figure } from "@/components/Figure";
import { Source } from "@/components/Source";
import { fmtEUR, fmtPct } from "@/lib/format";
import { m } from "@/lib/messages";
import irs from "@data/fiscal/irs-2026.json";
import ss from "@data/fiscal/ss.json";
import smn from "@data/fiscal/smn.json";
import { JsonLd, webApplication } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Do bruto ao líquido — salário e IRS",
  description:
    "Calculadora de salário líquido em Portugal: Segurança Social, IRS por escalões, deduções e o custo real para a empresa.",
  alternates: { canonical: "/salario", types: ALT_FEED },
};

const ANO = irs.ano;

export default function SalarioPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <JsonLd
        data={webApplication(
          "Calculadora de salário líquido — Portugal",
          "/salario",
          "Do salário bruto ao líquido em Portugal: Segurança Social, retenção de IRS, deduções e o custo total para a empresa."
        )}
      />
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide uppercase">
        Quanto vais receber mesmo?
      </h1>
      <p className="lede mt-5">
        Entre o que a empresa paga e o que tu recebes há três cortes: a tua
        Segurança Social ({fmtPct(ss.trabalhador.taxa, 0)}), o IRS — que depende
        dos escalões, do teu agregado e das tuas deduções — e a TSU da entidade
        patronal ({fmtPct(ss.entidadePatronal.taxa, 2)}), que nem aparece no
        recibo.
      </p>

      <Figure
        title="Calculadora de salário líquido"
        source={
          <Source
            nome="Retenção — Despacho n.º 233-A/2026; escalões — art. 68.º CIRS (Lei 73-A/2025); TSU — seg-social.pt"
            vigencia={irs.vigencia}
          />
        }
      >
        <CalculadoraSalario
          ano={ANO}
          regua={{
            rotulo: m.regua.salarioBruto,
            marcador: { valor: smn.regioes.continente, rotulo: m.regua.minimo },
            presets: [
              { rotulo: m.regua.minimo, valor: smn.regioes.continente },
              { rotulo: m.regua.doisMil, valor: 2000 },
            ],
            descricao: m.regua.dica,
          }}
        />
      </Figure>

      <Figure
        title="Os nove escalões — rendimento a rendimento"
        source={
          <Source
            nome="Art. 68.º CIRS, redação da Lei n.º 73-A/2025 (OE2026)"
            vigencia={irs.vigencia}
          />
        }
      >
        <p className="body-copy">
          A taxa efetiva que a calculadora acima aplica sai destes nove
          escalões — cada um tributa só a fatia de rendimento que lá cabe,
          por isso subir de escalão nunca te faz perder dinheiro. A tabela
          canónica vive na página do IRS, onde os escalões{" "}
          <a href="/irs" className="underline decoration-line2 underline-offset-2">
            enchem-se à medida que o rendimento sobe
          </a>{" "}
          — e onde o mito se desfaz em números.
        </p>
      </Figure>

      <section className="body-copy max-w-2xl stack-sec pb-8 space-y-4">
        <h2 className="font-display text-2xl text-ink">O que a calculadora faz</h2>
        <p>
          1. Soma os 14 meses (salário + subsídios de férias e Natal).{" "}
          2. Abate a <strong>dedução específica</strong> (
          {fmtEUR(irs.deducaoEspecificaFixa)} em {ANO}, ou as tuas contribuições
          para a Segurança Social se forem maiores).{" "}
          3. Aplica o <strong>abatimento por mínimo de existência</strong> — o
          mecanismo que isenta quem ganha até ao salário mínimo.{" "}
          4. Aplica os escalões — em casados, sobre metade do rendimento
          coletável do casal e a dobrar (quociente conjugal).{" "}
          5. Subtrai deduções à coleta: {fmtEUR(irs.despesasGeraisPorTitular)}{" "}
          de despesas gerais por titular e {fmtEUR(irs.deducaoPorDependente)}{" "}
          por dependente.
        </p>
        <p>
          O recibo mensal usa as <strong>tabelas de retenção na fonte</strong>{" "}
          oficiais (continente, sem deficiência) e trata o excedente do
          subsídio de alimentação como salário. O que fica de fora de
          propósito: deduções de saúde/educação/rendas, subsídio de
          desemprego, Açores e Madeira, e regimes especiais. O número certo é
          o da tua liquidação — esta é a mecânica, não o teu caso particular.
        </p>
      </section>
    </div>
  );
}
