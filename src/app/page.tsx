import Link from "next/link";
import { Adivinha } from "@/components/Adivinha";
import { CountUp } from "@/components/CountUp";
import { Delta } from "@/components/Delta";
import { Escada } from "@/components/Escada";
import { Source } from "@/components/Source";
import { loadSerie, variacao, loadFontes } from "@/lib/data";
import { fmtPct, fmtData } from "@/lib/format";
import { m } from "@/lib/messages";
import smn from "@data/fiscal/smn.json";
import ca from "@data/fiscal/ca.json";

export default function Home() {
  const h = m.home;
  const ipc = loadSerie("CP00");
  const alim = loadSerie("CP01");
  const fonteIpc = loadFontes().find((f) => f.id === "hicp-pt-cp00");

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* manchete compacta — o herói é o diagrama, não o titular */}
      <section className="grid items-end gap-6 pt-12 md:grid-cols-12 md:pt-14">
        <div className="md:col-span-8">
          <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-ink sm:text-6xl lg:text-7xl">
            {h.h1a} {h.h1b}{" "}
            <span className="text-accent">{h.h1c}</span>
          </h1>
        </div>
        <div className="md:col-span-4">
          <p className="lede !mt-0 text-base">{h.lede}</p>
          <Link href="/salario" className="btn btn-primary mt-5">
            {h.cta}
          </Link>
        </div>
      </section>

      {/* o instrumento — adivinha primeiro, depois a escada revela */}
      <section className="blueprint mt-10 border border-line bg-surface px-5 py-6 md:px-8 md:py-8">
        <div className="flex justify-end">
          <p className="num text-xs text-muted">{h.euroNota}</p>
        </div>
        <Adivinha>
          <Escada />
        </Adivinha>
      </section>

      {/* quadro do dia — fila de instrumentos */}
      <section className="mt-16 grid grid-cols-2 border border-line bg-surface md:grid-cols-4">
        <div className="border-b border-r border-line px-5 py-5 md:border-b-0">
          <p className="num text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            {h.inflacaoHomologa}
          </p>
          <p className="num mt-2 text-3xl text-ink">
            {ipc ? <Delta value={variacao(ipc, 12)} /> : "—"}
          </p>
          {ipc && <p className="footnote mt-1">{fmtData(ipc.meta.serieAte)}</p>}
        </div>
        <div className="border-b border-line px-5 py-5 md:border-b-0 md:border-r">
          <p className="num text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            {h.alimentacao}
          </p>
          <p className="num mt-2 text-3xl text-ink">
            {alim ? <Delta value={variacao(alim, 12)} /> : "—"}
          </p>
          <p className="footnote mt-1">{h.ihpcCP01}</p>
        </div>
        <div className="border-r border-line px-5 py-5">
          <p className="num text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            {h.salarioMinimo}
          </p>
          <p className="num mt-2 text-3xl text-ink">
            <CountUp valor={smn.serie[smn.serie.length - 1].valor} sufixo=" €" dur={1400} />
          </p>
          <p className="footnote mt-1">{h.smnNota}</p>
        </div>
        <div className="px-5 py-5">
          <p className="num text-[0.62rem] uppercase tracking-[0.14em] text-muted">{h.ca}</p>
          <p className="num mt-2 text-3xl text-ink">
            {fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2)}
          </p>
          <p className="footnote mt-1">{h.caNota}</p>
        </div>
      </section>
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
                className="chapter-row group grid grid-cols-[3.5rem_1fr] items-baseline gap-4 px-2 py-6 md:grid-cols-[5rem_16rem_1fr_2rem] md:gap-8 md:px-4"
              >
                <span className="chapter-dim num text-sm text-muted transition-colors">{c.n}</span>
                <span className="font-display text-3xl tracking-wide transition-colors md:text-4xl">
                  {c.titulo}
                </span>
                <span className="chapter-dim col-span-2 mt-2 max-w-xl text-sm leading-relaxed text-ink2 transition-colors md:col-span-1 md:mt-0">
                  {c.descricao}
                </span>
                <span className="chapter-arrow hidden text-right font-display text-2xl text-line2 md:block">
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
