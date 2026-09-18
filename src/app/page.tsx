import Link from "next/link";
import { Adivinha } from "@/components/Adivinha";
import { Odometer } from "@/components/Odometer";
import { Delta } from "@/components/Delta";
import { Escada } from "@/components/Escada";
import { Kinetic } from "@/components/Kinetic";
import { Source } from "@/components/Source";
import { Instrumento } from "@/components/Instrumento";
import {
  loadSerie,
  variacao,
  loadFontes,
  loadDerivado,
  loadFreshness,
} from "@/lib/data";
import { simularSalario } from "@/lib/engines/irs";
import { TSU_ENTIDADE, TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import { fmtPct, fmtData } from "@/lib/format";
import { m } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";
import smn from "@data/fiscal/smn.json";
import ca from "@data/fiscal/ca.json";

interface CaBase {
  meta: { oficialPct: number; vigenciaOficial: string; serieAte: string; url?: string };
  series: { t: string; v: number }[];
}

export default function Home() {
  const h = m.home;
  const ipc = loadSerie("CP00");
  const alim = loadSerie("CP01");
  const caBase = loadDerivado<CaBase>("ca-base");
  const fonteIpc = loadFontes().find((f) => f.id === "hicp-pt-cp00");
  const fresh = loadFreshness();
  const estadoDe = (id: string) =>
    fresh?.series.find((s) => s.id === id)?.estado;

  // Fronteira servidor/cliente: o motor fiscal corre UMA vez aqui —
  // simularSalario puxa os JSON de data/fiscal (IRS, retenção, SS) que
  // assim nunca entram no bundle do browser. Adivinha/Escada/FitaTalao
  // recebem números prontos por props (serializáveis); interactivos
  // ficam só o form da aposta e o observer do scrolly.
  const med = simularSalario([1500], 0, 2026);
  const mensal = (v: number) => v / 14;
  const medidas = {
    custo: mensal(med.custoEmpresaAnual),
    tsu: mensal(med.brutoAnualTotal * TSU_ENTIDADE),
    irs: mensal(med.irsAnual),
    ss: mensal(med.ssAnual),
    liquido: mensal(med.liquidoAnual),
    estado: mensal(med.brutoAnualTotal * TSU_ENTIDADE + med.irsAnual + med.ssAnual),
    taxaTsu: TSU_ENTIDADE,
    taxaSs: TSU_TRABALHADOR,
  };
  const real = (med.liquidoAnual / med.custoEmpresaAnual) * 100;

  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AO CÊNTIMO",
    url: SITE_URL,
    inLanguage: "pt-PT",
    description:
      "Literacia financeira para Portugal — seguimos 1 € do salário bruto até ao fim do mês. Simuladores e dados oficiais, cada número com fonte e data.",
  };

  return (
    <div className="mx-auto max-w-6xl px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      {/* manchete compacta — o herói é o diagrama, não o titular */}
      <section className="grid items-end gap-6 pt-12 md:grid-cols-12 md:pt-14">
        <div className="md:col-span-8">
          <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-ink sm:text-6xl lg:text-7xl">
            <Kinetic texto={`${h.h1a} ${h.h1b}`} />{" "}
            <Kinetic texto={h.h1c} desde={4} className="text-accent" />
          </h1>
        </div>
        <div className="md:col-span-4">
          <p className="lede !mt-0 text-base">{h.lede}</p>
          <Link href="/salario" className="btn btn-primary mt-5">
            {h.cta}
          </Link>
        </div>
      </section>

      {/* os números do mês — primeira dobra: cada célula com a micro-série
          de 24 meses, último ponto a torrado, fonte e data */}
      <section className="mt-8 border border-line bg-panel" aria-labelledby="quadro-mes">
        <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
          <h2 id="quadro-mes" className="kicker">
            {h.hoje}
          </h2>
          {ipc && (
            <span className="num text-xs text-muted">
              {fmtData(ipc.meta.serieAte)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Instrumento
            className="border-b border-r border-line px-5 py-4 md:border-b-0"
            rotulo={h.inflacaoHomologa}
            estado={estadoDe("hicp-pt-cp00")}
            atraso={0}
            grande
            valor={ipc ? <Delta value={variacao(ipc, 12)} /> : "—"}
            spark={ipc?.series}
            meta={ipc ? fmtData(ipc.meta.serieAte) : "—"}
          />
          <Instrumento
            className="border-b border-line px-5 py-4 md:border-b-0 md:border-r"
            rotulo={h.alimentacao}
            estado={estadoDe("hicp-pt-cp01")}
            atraso={1}
            grande
            valor={alim ? <Delta value={variacao(alim, 12)} /> : "—"}
            spark={alim?.series}
            meta={h.ihpcCP01}
          />
          <Instrumento
            className="border-r border-line px-5 py-4"
            rotulo={h.salarioMinimo}
            estado={estadoDe("fiscal-smn")}
            atraso={2}
            grande
            valor={
              <Odometer
                valor={smn.serie[smn.serie.length - 1].valor}
                sufixo=" €"
              />
            }
            spark={smn.serie.map((s) => ({ t: String(s.ano), v: s.valor }))}
            meta={h.smnNota}
          />
          <Instrumento
            className="px-5 py-4"
            rotulo={h.ca}
            estado={estadoDe("fiscal-ca")}
            atraso={3}
            grande
            valor={fmtPct(ca.serieF.taxaBrutaNovasSubscricoes, 2)}
            spark={caBase?.series}
            meta={h.caNota}
          />
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

      {/* o instrumento — adivinha primeiro, depois a escada revela.
          blueprint = textura da zona de medição: fica só atrás do
          diagrama (na Escada), não atrás do texto da aposta */}
      <section className="stack-sec border border-line bg-panel px-5 py-6 md:px-8 md:py-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="kicker">{h.euroTitulo}</h2>
          <p className="num text-right text-xs text-muted">{h.euroNota}</p>
        </div>
        <Adivinha real={real}>
          <Escada medidas={medidas} />
        </Adivinha>
      </section>

      {/* capítulos — o percurso do euro */}
      <section className="stack-cap">
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
                <span className="chapter-arrow hidden text-right font-display text-2xl text-muted md:block">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ferramentas — os simuladores novos */}
      <section className="stack-cap">
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
      <section className="stack-cap grid gap-8 border-t-2 border-ink pt-8 pb-8 md:grid-cols-12">
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
