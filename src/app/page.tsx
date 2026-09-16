import Link from "next/link";
import { Delta } from "@/components/Delta";
import { EuroBar } from "@/components/EuroBar";
import { loadSerie, variacao, loadFontes } from "@/lib/data";
import { simularSalario } from "@/lib/engines/irs";
import { fmtEUR, fmtEUR0, fmtPct, fmtData } from "@/lib/format";
import smn from "@data/fiscal/smn.json";
import ca from "@data/fiscal/ca.json";

const CAPITULOS = [
  {
    n: "01",
    href: "/salario",
    titulo: "O DESCONTO",
    tema: "Salário",
    descricao:
      "O euro nasce no teu recibo: 11 % para a Segurança Social, uma fatia de IRS, e uma TSU de 23,75 % que a empresa paga e tu nunca vês.",
  },
  {
    n: "02",
    href: "/impostos",
    titulo: "O PREÇO",
    tema: "Impostos",
    descricao:
      "O euro gasta-se com imposto já dentro: 6 % no pão, 23 % no telemóvel, e na gasolina mais de metade do litro é Estado.",
  },
  {
    n: "03",
    href: "/inflacao",
    titulo: "A EROSÃO",
    tema: "Inflação",
    descricao:
      "O euro parado encolhe: o índice oficial por categoria — pão, energia, restaurantes — e o que os teus 1 000 € de 2015 valem hoje.",
  },
  {
    n: "04",
    href: "/credito",
    titulo: "O JURO",
    tema: "Crédito",
    descricao:
      "O euro que pediste: Euribor mais spread faz a TAN, a TAEG junta o resto, e o MTIC revela quanto a casa custa de verdade.",
  },
  {
    n: "05",
    href: "/poupanca",
    titulo: "O RESTO",
    tema: "Poupança",
    descricao:
      "O euro que sobra: Certificados de Aforro, depósitos, 28 % de imposto sobre juros — e a taxa real, a única que interessa.",
  },
  {
    n: "06",
    href: "/precos",
    titulo: "O LITRO",
    tema: "Combustíveis",
    descricao:
      "O euro na bomba, ao dia: a única família de bens essenciais com preço oficial quase diário em Portugal.",
  },
];

export default function Home() {
  const ipc = loadSerie("CP00");
  const alim = loadSerie("CP01");
  const fonteIpc = loadFontes().find((f) => f.id === "hicp-pt-cp00");

  // salário mediano de referência: 1 500 € brutos, solteiro — números do motor
  const med = simularSalario([1500], 0, 2026);
  const custo = med.custoEmpresaAnual;
  const tsu = med.brutoAnualTotal * 0.2375;

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* manchete */}
      <section className="grid gap-10 pt-12 md:grid-cols-12 md:pt-16">
        <div className="md:col-span-8">
          <h1 className="font-display text-[3.4rem] leading-[0.95] tracking-wide text-ink sm:text-7xl lg:text-[6.5rem]">
            PARA ONDE{" "}
            <br />
            VAI O TEU{" "}
            <br />
            <span className="text-accent">DINHEIRO</span>
          </h1>
          <p className="lede mt-7 max-w-xl">
            Do salário bruto ao litro de gasóleo, seguimos cada euro: o que o
            Estado leva, o que a inflação come, o que o banco cobra — e o que
            sobra para ti. Com dados oficiais e a fonte à vista.
          </p>
        </div>

        {/* quadro do dia — ledger estreito */}
        <aside className="md:col-span-4 md:border-l md:border-line md:pl-8">
          <p className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            Hoje em Portugal
          </p>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                Inflação, homóloga
                {ipc && (
                  <span className="block text-xs text-muted">{fmtData(ipc.meta.serieAte)}</span>
                )}
              </dt>
              <dd className="num text-xl">
                {ipc ? <Delta value={variacao(ipc, 12)} /> : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                Alimentação
                <span className="block text-xs text-muted">IHPC CP01</span>
              </dt>
              <dd className="num text-xl">
                {alim ? <Delta value={variacao(alim, 12)} /> : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                Salário mínimo
                <span className="block text-xs text-muted">2026 · continente</span>
              </dt>
              <dd className="num text-xl">{fmtEUR0(smn.serie[smn.serie.length - 1].valor)}</dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                Certificados de Aforro
                <span className="block text-xs text-muted">Série F · bruta</span>
              </dt>
              <dd className="num text-xl">{fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2)}</dd>
            </div>
          </dl>
          {fonteIpc && (
            <p className="footnote mt-3">
              Fonte:{" "}
              <a href={fonteIpc.url} className="underline decoration-line2 underline-offset-2">
                Eurostat
              </a>
              , IGCP, DL 139/2025.
            </p>
          )}
        </aside>
      </section>

      {/* a barra do euro — assinatura */}
      <section className="mt-16 border-t-2 border-ink pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl tracking-wide md:text-3xl">
            UM SALÁRIO DE 1 500 €, DESMONTADO
          </h2>
          <p className="num text-xs text-muted">por ano · solteiro · regras 2026</p>
        </div>
        <div className="mt-6">
          <EuroBar
            total={custo}
            segmentos={[
              {
                label: "Fica contigo (líquido)",
                valor: med.liquidoAnual,
                cor: "#0f7a66",
              },
              { label: "IRS", valor: med.irsAnual, cor: "#b3261e" },
              { label: "A tua Seg. Social (11 %)", valor: med.ssAnual, cor: "#d07c1f" },
              {
                label: "TSU da empresa (23,75 %)",
                valor: tsu,
                cor: "#4a463c",
              },
            ]}
          />
        </div>
        <p className="footnote mt-4">
          A empresa paga {fmtEUR(custo)} por ano para te pagar {fmtEUR0(1500)}{" "}
          brutos por mês — {fmtPct(med.pesoEstado, 0)} desse custo vai para o
          Estado antes de chegar ao teu bolso.{" "}
          <Link href="/salario" className="text-accent underline underline-offset-2">
            Calcula o teu
          </Link>
          .
        </p>
      </section>

      {/* capítulos — o percurso do euro */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="font-display text-2xl tracking-wide md:text-3xl">
            O PERCURSO DE UM EURO
          </h2>
          <span className="num text-xs text-muted">seis capítulos</span>
        </div>
        <ol>
          {CAPITULOS.map((c) => (
            <li key={c.n} className="border-b border-line">
              <Link
                href={c.href}
                className="group grid grid-cols-[3.5rem_1fr] items-baseline gap-4 py-6 transition-colors hover:bg-surface md:grid-cols-[5rem_16rem_1fr_2rem] md:gap-8"
              >
                <span className="num text-sm text-muted">{c.n}</span>
                <span className="font-display text-3xl tracking-wide text-ink transition-colors group-hover:text-accent md:text-4xl">
                  {c.titulo}
                </span>
                <span className="col-span-2 mt-2 max-w-xl text-sm leading-relaxed text-ink2 md:col-span-1 md:mt-0">
                  {c.descricao}
                </span>
                <span className="hidden text-right font-display text-2xl text-line2 transition-colors group-hover:text-accent md:block">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* manifesto */}
      <section className="mt-20 grid gap-8 border-t-2 border-ink pt-8 pb-8 md:grid-cols-12">
        <p className="font-display text-3xl leading-tight tracking-wide text-ink md:col-span-5 md:text-4xl">
          NEM CONSELHOS.{" "}
          <br />
          NEM PUBLICIDADE.{" "}
          <br />
          <span className="text-accent">SÓ A MECÂNICA.</span>
        </p>
        <div className="md:col-span-7 md:border-l md:border-line md:pl-8">
          <p className="lede">
            Este site não te diz onde investir nem compara bancos. Mostra como
            o dinheiro funciona em Portugal — escalões, taxas, spreads,
            prémios — para perceberes as regras do jogo.
          </p>
          <p className="footnote mt-4">
            Quem percebe as regras, decide melhor. Simuladores indicativos ·{" "}
            <Link
              href="/metodologia"
              className="underline decoration-line2 underline-offset-2"
            >
              metodologia e fontes
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
