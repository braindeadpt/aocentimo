import Link from "next/link";
import dynamic from "next/dynamic";
import type { PassoEuro } from "@/components/Euro";
import { Painel } from "@/components/painel/Painel";
import { loadFonte } from "@/lib/data";
import { decomporCombustivel } from "@/lib/engines/impostos";
import { retencaoNaFonte } from "@/lib/engines/retencao";
import { TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import { fmtNum } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";
import isp from "@data/fiscal/isp.json";
import retencaoJson from "@data/fiscal/retencao-2026.json";
import ssJson from "@data/fiscal/ss.json";

/* abaixo da dobra: SSR mantém o HTML, o chunk hidrata depois */
const Euro = dynamic(() => import("@/components/Euro").then((mo) => mo.Euro));
const Manchete = dynamic(() =>
  import("@/components/Manchete").then((mo) => mo.Manchete)
);

/** passos do storytelling «o teu euro» — tudo calculado dos motores e
 *  das fontes, para um salário bruto de 1 500 €/mês (solteiro, sem
 *  dependentes, regras 2026). Nenhum número é escrito à mão. */
function passosEuro(): PassoEuro[] {
  const bruto = 1500;
  const ss = bruto * TSU_TRABALHADOR;
  const ret = retencaoNaFonte(bruto, "naoCasado", 0, 2026).retencao;
  const liquido = bruto - ss - ret;
  /* 50 L de gasóleo ao PMD mais recente — os impostos dentro do litro
     (ISP + taxa de carbono + IVA) em cêntimos por euro do bruto */
  const pmd = loadFonte("dgeg", "pmd-gasoleo-diario");
  const preco = pmd?.series[pmd.series.length - 1]?.v ?? 0;
  const dec = decomporCombustivel(
    preco,
    isp.gasoleo.ispELitro,
    isp.gasoleo.carbonoELitro
  );
  const impostos50 = dec.impostos * 50;
  const porEuro = (v: number) => (v / bruto) * 100;

  const fontes = {
    ss: { nome: ssJson.fonte, url: ssJson.fonteUrl },
    ret: { nome: retencaoJson.fonte, url: retencaoJson.fonteUrl },
    calc: { nome: "Cálculo AO CÊNTIMO — motor do recibo", url: "/salario" },
    pmd: {
      nome: `${pmd?.meta.fonte ?? "DGEG"} + ${isp.fonte.split(";")[0]}`,
      url: pmd?.meta.url,
    },
  };
  const p = m.home.euro.passos;
  return [
    {
      rotulo: p[0].rotulo,
      curto: p[0].curto,
      detalhe: p[0].detalhe,
      centimos: porEuro(ss),
      fonteNome: fontes.ss.nome,
      fonteUrl: fontes.ss.url,
    },
    {
      rotulo: p[1].rotulo,
      curto: p[1].curto,
      detalhe: p[1].detalhe,
      centimos: porEuro(ret),
      fonteNome: fontes.ret.nome,
      fonteUrl: fontes.ret.url,
    },
    {
      rotulo: p[2].rotulo,
      detalhe: p[2].detalhe,
      centimos: porEuro(liquido),
      fonteNome: fontes.calc.nome,
      fonteUrl: fontes.calc.url,
    },
    {
      rotulo: p[3].rotulo,
      curto: p[3].curto,
      detalhe: t(p[3].detalhe, { preco: fmtNum(preco, 3) }),
      centimos: porEuro(impostos50),
      fonteNome: fontes.pmd.nome,
      fonteUrl: fontes.pmd.url,
    },
    {
      rotulo: p[4].rotulo,
      detalhe: p[4].detalhe,
      centimos: porEuro(liquido - impostos50),
      fonteNome: fontes.calc.nome,
      fonteUrl: fontes.calc.url,
    },
  ];
}

export default function Home() {
  const h = m.home;

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
      {/* C-01 — o painel de leituras oficiais é a primeira dobra;
          tem h2 — o h1 da página é a manchete, abaixo da dobra */}
      <Painel />

      {/* C-03 — a manchete do antigo herói é agora o h1, abaixo do
          painel; a FitaTalao saiu da home (continua em /salario) */}
      <section className="grid items-end gap-4 pt-10 md:grid-cols-12 md:pt-16">
        <div className="md:col-span-8">
          <Manchete
            as="h1"
            className="font-display text-4xl uppercase leading-[0.95] tracking-wide text-ink sm:text-6xl lg:text-7xl"
          >
            {`${h.h1a} ${h.h1b} ${h.h1c}`}
          </Manchete>
        </div>
        <div className="md:col-span-4">
          <p className="lede !mt-0 text-sm md:text-base">{h.lede}</p>
          <Link href="/salario" className="btn btn-primary mt-4">
            {h.cta}
          </Link>
        </div>
      </section>

      {/* C-03 — «o teu euro»: moeda pinned ≥768, lista estática em
          <768 e reduced-motion; números todos dos motores/dados */}
      <Euro passos={passosEuro()} txt={m.home.euro} fonte={m.common.fonte} />

      {/* capítulos — comprimidos a grelha de 2 colunas ≥768; as
          leituras repetidas do painel já não se mostram aqui */}
      <section className="stack-cap">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="font-display text-2xl tracking-wide md:text-3xl">
            {h.capitulosTitulo}
          </h2>
          <span className="num text-xs text-muted">{h.capitulosNota}</span>
        </div>
        <ol className="md:grid md:grid-cols-2">
          {h.capitulos.map((c) => (
            <li key={c.href} className="border-b border-line">
              <Link
                href={c.href}
                className="chapter-row group grid grid-cols-[1fr_1.5rem] items-baseline gap-4 px-2 py-5 md:px-4"
              >
                <span>
                  <span className="font-display text-2xl tracking-wide transition-colors md:text-3xl">
                    {c.titulo}
                  </span>
                  <span className="chapter-dim mt-1 block max-w-md text-sm leading-relaxed text-ink2 transition-colors">
                    {c.descricao}
                  </span>
                </span>
                <span className="chapter-arrow text-right font-display text-2xl text-muted">
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
