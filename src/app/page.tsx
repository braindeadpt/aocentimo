import Link from "next/link";
import { Stat } from "@/components/Stat";
import { Delta } from "@/components/Delta";
import { loadSerie, variacao, loadFontes } from "@/lib/data";
import { fmtEUR0, fmtPct, fmtData } from "@/lib/format";
import smn from "@data/fiscal/smn.json";
import ca from "@data/fiscal/ca.json";

const MODULOS = [
  {
    href: "/salario",
    titulo: "Do bruto ao líquido",
    descricao:
      "Quanto descontas de Segurança Social e IRS, em que escalão estás, e o que a empresa paga por ti além do teu salário.",
  },
  {
    href: "/inflacao",
    titulo: "Quanto subiu o que compras",
    descricao:
      "A inflação oficial por categoria — pão, carne, energia, restaurantes — e o que os teus euros de há dez anos valem hoje.",
  },
  {
    href: "/impostos",
    titulo: "O imposto dentro do preço",
    descricao:
      "IVA por produto e a decomposição do litro de gasolina: quanto vai para o Estado antes de chegar à bomba.",
  },
  {
    href: "/credito",
    titulo: "Euribor, spread e a tua prestação",
    descricao:
      "O que é a Euribor, como o spread entra na TAN, e quanto custa mesmo o teu crédito habitação (MTIC).",
  },
  {
    href: "/poupanca",
    titulo: "Onde rende o que poupas",
    descricao:
      "Certificados de Aforro, depósitos a prazo, tributação de 28 % — e a diferença entre taxa nominal e taxa real.",
  },
  {
    href: "/precos",
    titulo: "Combustíveis, dia a dia",
    descricao:
      "O preço por litro com variação diária, semanal, mensal e anual — a única família de bens essenciais com dados diários oficiais.",
  },
];

export default function Home() {
  const ipc = loadSerie("CP00");
  const alim = loadSerie("CP01");
  const fontes = loadFontes();
  const fonteIpc = fontes.find((f) => f.id === "hicp-pt-cp00");

  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* Hero editorial */}
      <section className="pt-16 pb-12 md:pt-24">
        <p className="kicker mb-4">Literacia financeira · Portugal</p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl">
          Para onde vai o teu dinheiro.
        </h1>
        <p className="lede mt-6">
          Do salário bruto ao litro de gasóleo, seguimos cada euro: o que o
          Estado leva em impostos, o que a inflação come, o que o banco cobra
          em juros — e o que sobra para ti. Tudo com dados oficiais e a fonte
          à vista.
        </p>
      </section>

      {/* Números do momento */}
      <section className="rule-strong pt-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat
            label={`Inflação homóloga${ipc ? ` · ${fmtData(ipc.meta.serieAte)}` : ""}`}
            value={ipc ? <Delta value={variacao(ipc, 12)} casas={1} /> : "—"}
            hint={ipc ? "IHPC, Eurostat" : "dados ainda não carregados"}
          />
          <Stat
            label="Alimentação, homóloga"
            value={alim ? <Delta value={variacao(alim, 12)} casas={1} /> : "—"}
            hint="IHPC CP01, Eurostat"
          />
          <Stat
            label="Salário mínimo 2026"
            value={fmtEUR0(smn.serie[smn.serie.length - 1].valor)}
            hint="Continente · DL 139/2025"
          />
          <Stat
            label="Certificados de Aforro"
            value={fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2)}
            hint={`Série F, bruta · ${ca.vigencia}`}
          />
        </div>
        {fonteIpc && (
          <p className="footnote mt-6">
            Dados de preços até {fmtData(fonteIpc.serieAte)} · recolhidos em{" "}
            {fmtData(fonteIpc.recolhidoEm.slice(0, 10))} ·{" "}
            <a href={fonteIpc.url} className="underline decoration-line2 underline-offset-2">
              Eurostat
            </a>
          </p>
        )}
      </section>

      {/* Índice de módulos */}
      <section className="py-6">
        <h2 className="kicker mb-6">Os módulos</h2>
        <ol className="divide-y divide-line border-y border-line">
          {MODULOS.map((m, i) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="group flex gap-6 py-5 items-baseline hover:bg-surface transition-colors -mx-3 px-3"
              >
                <span className="num text-sm text-muted w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="font-display text-xl md:text-2xl text-ink group-hover:text-accent transition-colors">
                    {m.titulo}
                  </span>
                  <span className="block text-sm text-ink2 mt-1 max-w-xl">
                    {m.descricao}
                  </span>
                </span>
                <span className="text-muted group-hover:text-accent transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Manifesto curto */}
      <section className="py-10 max-w-2xl">
        <p className="lede">
          Este site não te diz em que investir nem compara produtos de bancos.
          Mostra a mecânica do dinheiro em Portugal — escalões, taxas, spreads,
          prémios — para que percebas as regras do jogo. Quem percebe as regras,
          decide melhor.
        </p>
        <p className="footnote mt-4">
          Simuladores indicativos ·{" "}
          <Link href="/metodologia" className="underline decoration-line2 underline-offset-2">
            metodologia e fontes
          </Link>
        </p>
      </section>
    </div>
  );
}
