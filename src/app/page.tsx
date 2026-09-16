import Link from "next/link";
import { Delta } from "@/components/Delta";
import { EuroBar } from "@/components/EuroBar";
import { Source } from "@/components/Source";
import { loadSerie, variacao, loadFontes } from "@/lib/data";
import { simularSalario } from "@/lib/engines/irs";
import { fmtEUR, fmtEUR0, fmtPct, fmtData } from "@/lib/format";
import { m, t } from "@/lib/messages";
import smn from "@data/fiscal/smn.json";
import ca from "@data/fiscal/ca.json";

export default function Home() {
  const h = m.home;
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
            {h.h1a}{" "}
            <br />
            {h.h1b}{" "}
            <br />
            <span className="text-accent">{h.h1c}</span>
          </h1>
          <p className="lede mt-7 max-w-xl">{h.lede}</p>
          <Link href="/salario" className="btn btn-primary mt-8">
            {h.cta}
          </Link>
        </div>

        {/* quadro do dia — ledger estreito */}
        <aside className="md:col-span-4 md:border-l md:border-line md:pl-8">
          <p className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            {h.hoje}
          </p>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                {h.inflacaoHomologa}
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
                {h.alimentacao}
                <span className="block text-xs text-muted">{h.ihpcCP01}</span>
              </dt>
              <dd className="num text-xl">
                {alim ? <Delta value={variacao(alim, 12)} /> : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                {h.salarioMinimo}
                <span className="block text-xs text-muted">{h.smnNota}</span>
              </dt>
              <dd className="num text-xl">{fmtEUR0(smn.serie[smn.serie.length - 1].valor)}</dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-ink2">
                {h.ca}
                <span className="block text-xs text-muted">{h.caNota}</span>
              </dt>
              <dd className="num text-xl">{fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2)}</dd>
            </div>
          </dl>
          {fonteIpc && (
            <div className="mt-3">
              <Source
                nome={fonteIpc.fonte}
                url={fonteIpc.url}
                serieAte={fonteIpc.serieAte}
                nota="IGCP · DL 139/2025"
              />
            </div>
          )}
        </aside>
      </section>

      {/* a barra do euro — assinatura */}
      <section className="mt-16 border-t-2 border-ink pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl tracking-wide md:text-3xl">
            {h.barraTitulo}
          </h2>
          <p className="num text-xs text-muted">{h.barraNota}</p>
        </div>
        <div className="mt-6">
          <EuroBar
            total={custo}
            segmentos={[
              {
                label: h.segLiquido,
                valor: med.liquidoAnual,
                cor: "var(--color-keep)",
              },
              { label: h.segIrs, valor: med.irsAnual, cor: "var(--color-accent)" },
              { label: h.segSs, valor: med.ssAnual, cor: "var(--color-accent-ink)" },
              {
                label: h.segTsu,
                valor: tsu,
                cor: "var(--color-ink2)",
              },
            ]}
          />
        </div>
        <p className="footnote mt-4">
          {t(h.barraFoot, {
            custo: fmtEUR(custo),
            bruto: fmtEUR0(1500),
            peso: fmtPct(med.pesoEstado, 0),
          })}{" "}
          <Link href="/salario" className="text-accent underline underline-offset-2">
            {m.common.calculaOTeu}
          </Link>
          .
        </p>
      </section>

      {/* capítulos — o percurso do euro */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="font-display text-2xl tracking-wide md:text-3xl">
            {h.capitulosTitulo}
          </h2>
          <span className="num text-xs text-muted">{h.capitulosNota}</span>
        </div>
        <ol>
          {h.capitulos.map((c) => (
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

      {/* ferramentas — os simuladores novos */}
      <section className="mt-20">
        <div className="border-b-2 border-ink pb-3">
          <h2 className="font-display text-2xl tracking-wide md:text-3xl">
            {h.ferramentasTitulo}
          </h2>
        </div>
        <ul className="grid gap-px border-b border-line md:grid-cols-3">
          {h.ferramentas.map((f) => (
            <li key={f.href} className="border-t border-line md:border-t-0 md:border-l md:first:border-l-0">
              <Link href={f.href} className="group block px-0 py-6 md:px-6 md:first:pl-0">
                <span className="font-display text-2xl tracking-wide text-ink transition-colors group-hover:text-accent">
                  {f.titulo}
                </span>
                <span className="mt-2 block max-w-xs text-sm leading-relaxed text-ink2">
                  {f.descricao}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* manifesto */}
      <section className="mt-20 grid gap-8 border-t-2 border-ink pt-8 pb-8 md:grid-cols-12">
        <p className="font-display text-3xl leading-tight tracking-wide text-ink md:col-span-5 md:text-4xl">
          {h.manifesto1}{" "}
          <br />
          {h.manifesto2}{" "}
          <br />
          <span className="text-accent">{h.manifesto3}</span>
        </p>
        <div className="md:col-span-7 md:border-l md:border-line md:pl-8">
          <p className="lede">{h.manifestoLede}</p>
          <p className="footnote mt-4">
            {h.manifestoFoot}{" "}
            <Link
              href="/metodologia"
              className="underline decoration-line2 underline-offset-2"
            >
              {h.metodologia}
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
