import Link from "next/link";
import { Adivinha } from "@/components/Adivinha";
import { FitaTalao } from "@/components/FitaTalao";
import { Kinetic } from "@/components/Kinetic";
import {
  Leitura,
  type LeituraProps,
  type RotulosLeitura,
} from "@/components/Leitura";
import { loadFonte, loadPainel, type PainelSerie } from "@/lib/data";
import { simularSalario } from "@/lib/engines/irs";
import { TSU_ENTIDADE, TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import {
  fmtLitro,
  fmtNum,
  fmtPct,
  fmtEUR0,
  fmtPeriodo,
  fmtDataHora,
} from "@/lib/format";
import { m, t } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";

type Ponto = { t: string; v: number };
type Cartao = Omit<LeituraProps, "rotulos">;

/** janela dos últimos ~10 anos — o ano vem do prefixo do período
    (regra do derivador: mensal, trimestral e semestral servem) */
const janela10 = (s: Ponto[]): Ponto[] => {
  const ult = s[s.length - 1];
  if (!ult) return s;
  const fim = Number(ult.t.slice(0, 4));
  return s.filter((p) => Number(p.t.slice(0, 4)) >= fim - 10);
};

/** taxa homóloga de um índice — v / v[i-passo] − 1, em % */
const homologa = (s: Ponto[], passo: number): Ponto[] =>
  s.slice(passo).map((p, i) => ({ t: p.t, v: (p.v / s[i].v - 1) * 100 }));

/** UM extremo real da janela — a anotação é sempre um dado, nunca
    um ponto inventado; o rótulo já sai formatado do servidor */
const anotacaoDe = (
  s: Ponto[],
  tipo: "max" | "min",
  fmt: (v: number) => string
): Cartao["anotacao"] => {
  if (s.length === 0) return undefined;
  const p = s.reduce((b, q) =>
    tipo === "max" ? (q.v > b.v ? q : b) : q.v < b.v ? q : b
  );
  return {
    t: p.t,
    rotulo: t(tipo === "max" ? m.leitura.pico : m.leitura.minimo, {
      periodo: fmtPeriodo(p.t),
      valor: fmt(p.v),
    }),
  };
};

/** insight «{abs} p.p. {acima|abaixo} da mediana de 10 anos» */
const insightMediana = (item: PainelSerie): string =>
  item.referencia
    ? t(m.painel.insightMediana, {
        abs: fmtNum(Math.abs(item.valor - item.referencia.valor)),
        direcao:
          item.valor >= item.referencia.valor
            ? m.painel.acima
            : m.painel.abaixo,
      })
    : `${fmtNum(item.valor)} ${item.unidade}`;

export default function Home() {
  const h = m.home;
  const painel = loadPainel();
  const pSerie = (id: string) =>
    painel?.series.find((s) => s.id === id) ?? null;
  const c = m.painel.cartoes;

  const rotulosLeitura: RotulosLeitura = {
    leitura: m.leitura.leitura,
    fonte: m.leitura.fonte,
    pagina: m.leitura.pagina,
    json: m.leitura.json,
    estados: {
      "em-dia": m.leitura.emDia,
      atrasada: m.leitura.atrasada,
      "sem-sla": m.leitura.semSla,
    },
    aria: m.leitura.aria,
  };

  // ————— o Leitura-herói: inflação homóloga, histórico de 10 anos —————
  const infl = pSerie("inflacao-homologa");
  const hicp = loadFonte("eurostat", "hicp-pt-cp00");
  const serieInfl = hicp ? janela10(homologa(hicp.series, 12)) : [];
  const hero: Cartao | null =
    infl && serieInfl.length > 1
      ? {
          breadcrumb: c.inflacao.breadcrumb,
          titulo: c.inflacao.titulo,
          insight: insightMediana(infl),
          valor: infl.valor,
          unidade: infl.unidade,
          formato: "pct",
          serie: serieInfl,
          referencia: infl.referencia ?? undefined,
          anotacao: anotacaoDe(serieInfl, "max", (v) => `${fmtNum(v, 1)} %`),
          leitura: fmtPeriodo(infl.rotuloAte ?? infl.t),
          estado: infl.estado,
          fonteNome: infl.fonte,
          fonteUrl: infl.url,
          href: "/inflacao",
          hrefJson: "/api/hicp-pt-cp00.json",
          amplo: true,
        }
      : null;

  // ————— a grelha de leituras —————
  const eur = pSerie("euribor-12m-mensal");
  const eurFonte = loadFonte("bpstat", "euribor-12m-mensal");
  const serieEur = eurFonte ? janela10(eurFonte.series) : [];

  const une = pSerie("une-pt-total");
  const unePt = loadFonte("eurostat", "une-pt-total");
  const uneUe = loadFonte("eurostat", "une-ue27-total");
  const serieUne = unePt ? janela10(unePt.series) : [];
  const serieUe = uneUe ? janela10(uneUe.series) : [];

  const hpi = pSerie("hpi-pt");
  const hpiFonte = loadFonte("eurostat", "hpi-pt");
  const serieHpi = hpiFonte ? janela10(homologa(hpiFonte.series, 4)) : [];
  const valorHpi = serieHpi[serieHpi.length - 1]?.v;

  const gas = pSerie("pmd-gasoleo-diario");
  const gasFonte = loadFonte("dgeg", "pmd-gasoleo-diario");
  const serieGas = gasFonte ? gasFonte.series.slice(-180) : [];
  const centimos = gas ? gas.variacao.abs * 100 : 0;

  const pib = pSerie("pib-pt-homologo");
  const pibFonte = loadFonte("eurostat", "pib-pt-homologo");
  const seriePib = pibFonte ? janela10(pibFonte.series) : [];

  const cartoes: (Cartao | null)[] = [
    eur && serieEur.length > 1
      ? {
          breadcrumb: c.euribor.breadcrumb,
          titulo: c.euribor.titulo,
          insight: insightMediana(eur),
          valor: eur.valor,
          unidade: eur.unidade,
          formato: "pct",
          serie: serieEur,
          referencia: eur.referencia ?? undefined,
          anotacao: anotacaoDe(serieEur, "max", (v) => `${fmtNum(v, 2)} %`),
          leitura: fmtPeriodo(eur.rotuloAte ?? eur.t),
          estado: eur.estado,
          fonteNome: eur.fonte,
          fonteUrl: eur.url,
          href: "/credito",
          hrefJson: "/api/euribor-12m-mensal.json",
        }
      : null,
    une && serieUne.length > 1 && serieUe.length > 1
      ? {
          breadcrumb: c.desemprego.breadcrumb,
          titulo: c.desemprego.titulo,
          insight: une.referencia
            ? t(m.painel.insightUe, {
                abs: fmtNum(Math.abs(une.valor - une.referencia.valor), 1),
                direcao:
                  une.valor >= une.referencia.valor
                    ? m.painel.acima
                    : m.painel.abaixo,
              })
            : `${fmtNum(une.valor, 1)} %`,
          valor: une.valor,
          unidade: une.unidade,
          formato: "pct1",
          serie: serieUne,
          referencia: { pontos: serieUe, rotulo: "UE 27" },
          anotacao: anotacaoDe(serieUne, "max", (v) => `${fmtNum(v, 1)} %`),
          leitura: fmtPeriodo(une.rotuloAte ?? une.t),
          estado: une.estado,
          fonteNome: une.fonte,
          fonteUrl: une.url,
          href: "/trabalho",
          hrefJson: "/api/une-pt-total.json",
        }
      : null,
    hpi && serieHpi.length > 1 && valorHpi !== undefined
      ? {
          breadcrumb: c.habitacao.breadcrumb,
          titulo: c.habitacao.titulo,
          insight: t(m.painel.insightHabitacao, {
            direcao: valorHpi >= 0 ? m.painel.subiu : m.painel.desceu,
            v: fmtNum(Math.abs(valorHpi), 1),
          }),
          valor: valorHpi,
          unidade: "%",
          formato: "pct1",
          serie: serieHpi,
          anotacao: anotacaoDe(serieHpi, "max", (v) => `${fmtNum(v, 1)} %`),
          leitura: fmtPeriodo(hpi.rotuloAte ?? hpi.t),
          estado: hpi.estado,
          fonteNome: hpi.fonte,
          fonteUrl: hpi.url,
          href: "/dados",
          hrefJson: "/api/hpi-pt.json",
        }
      : null,
    gas && serieGas.length > 1
      ? {
          breadcrumb: c.gasoleo.breadcrumb,
          titulo: c.gasoleo.titulo,
          insight:
            Math.abs(centimos) < 0.5
              ? m.painel.insightCombustivelZero
              : t(m.painel.insightCombustivel, {
                  sinal: centimos >= 0 ? "+" : "−",
                  v: fmtNum(Math.abs(centimos), 1),
                }),
          valor: gas.valor,
          unidade: gas.unidade,
          formato: "litro",
          serie: serieGas,
          anotacao: anotacaoDe(serieGas, "max", fmtLitro),
          leitura: fmtPeriodo(gas.rotuloAte ?? gas.t),
          estado: gas.estado,
          fonteNome: gas.fonte,
          fonteUrl: gas.url,
          href: "/precos",
          hrefJson: "/api/pmd-gasoleo-diario.json",
        }
      : null,
    pib && seriePib.length > 1
      ? {
          breadcrumb: c.pib.breadcrumb,
          titulo: c.pib.titulo,
          insight: insightMediana(pib),
          valor: pib.valor,
          unidade: pib.unidade,
          formato: "pct1",
          serie: seriePib,
          referencia: pib.referencia ?? undefined,
          anotacao: anotacaoDe(seriePib, "min", (v) => `${fmtNum(v, 1)} %`),
          leitura: fmtPeriodo(pib.rotuloAte ?? pib.t),
          estado: pib.estado,
          fonteNome: pib.fonte,
          fonteUrl: pib.url,
          href: "/dados",
          hrefJson: "/api/pib-pt-homologo.json",
        }
      : null,
  ];

  // Fronteira servidor/cliente: o motor fiscal corre UMA vez aqui —
  // simularSalario puxa os JSON de data/fiscal (IRS, retenção, SS) que
  // assim nunca entram no bundle do browser. Adivinha/FitaTalao
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

  // a escada narrada, comprimida a legenda plana — a fita já conta a
  // história; estas frases ficam como notas de leitura (M-10)
  const { custo, tsu, irs, ss, liquido, estado, taxaTsu, taxaSs } = medidas;
  const passos = [
    t(m.escada.p0, { valor: fmtEUR0(custo) }),
    t(m.escada.p1, { valor: fmtEUR0(tsu), taxa: fmtPct(taxaTsu, 2) }),
    t(m.escada.p2, { valor: fmtEUR0(custo - tsu) }),
    t(m.escada.p3, { valor: `−${fmtEUR0(irs)}` }),
    t(m.escada.p4, { valor: `−${fmtEUR0(ss)}`, taxa: fmtPct(taxaSs, 0) }),
    t(m.escada.p5, {
      valor: fmtEUR0(liquido),
      custo: fmtEUR0(custo),
      estado: fmtEUR0(estado),
    }),
  ];

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
      {/* manchete compacta — o herói é o instrumento, não o titular;
          comprimida para o quadro do mês entrar na primeira dobra a 375 */}
      <section className="grid items-end gap-4 pt-6 md:grid-cols-12 md:pt-12">
        <div className="md:col-span-8">
          <h1 className="font-display text-4xl leading-[0.95] tracking-wide text-ink sm:text-6xl lg:text-7xl">
            <Kinetic texto={`${h.h1a} ${h.h1b}`} />{" "}
            <Kinetic texto={h.h1c} desde={4} className="text-accent" />
          </h1>
        </div>
        <div className="md:col-span-4">
          <p className="lede !mt-0 text-sm md:text-base">{h.lede}</p>
          <Link href="/salario" className="btn btn-primary mt-4">
            {h.cta}
          </Link>
        </div>
      </section>

      {/* painel — leituras oficiais na linguagem «Leitura»: um cartão
          por ideia, hachura entre a série e a referência, uma anotação
          real por gráfico; o carimbo de recolha vem do derivado */}
      <section className="mt-6 md:mt-10" aria-labelledby="painel-leituras">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
          <h2 id="painel-leituras" className="kicker">
            {m.painel.titulo}
          </h2>
          {painel?.recolhidoEm && (
            <p className="num text-xs text-muted">
              {t(m.painel.recolhido, { quando: fmtDataHora(painel.recolhidoEm) })}
            </p>
          )}
        </div>
        {hero && (
          <div className="mt-5">
            <Leitura {...hero} rotulos={rotulosLeitura} />
          </div>
        )}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {cartoes
            .filter((cartao): cartao is Cartao => cartao !== null)
            .map((cartao) => (
              <Leitura key={cartao.titulo} {...cartao} rotulos={rotulosLeitura} />
            ))}
        </div>
      </section>

      {/* o instrumento — a pergunta primeiro, a fita depois: ao revelar,
          a FitaTalao reimprime-se e rasga-se (remount por ronda). Em
          largura total — é a peça-assinatura. A escada do scrolly foi
          comprimida a legenda plana: a fita já narra sozinha. */}
      <section
        aria-labelledby="instrumento"
        className="stack-sec border border-line bg-panel px-5 py-6 md:px-8 md:py-8"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="instrumento" className="kicker">{h.euroTitulo}</h2>
          <p className="num text-right text-xs text-muted">{h.euroNota}</p>
        </div>
        <Adivinha real={real}>
          <div className="blueprint mt-6 border-t border-dashed border-line2 px-3 py-6">
            <FitaTalao medidas={medidas} />
          </div>
          <ol className="mt-5 grid gap-x-8 gap-y-2 md:grid-cols-2">
            {passos.map((p, i) => (
              <li
                key={i}
                className="border-l-2 border-line pl-4 text-sm leading-relaxed text-ink2"
              >
                {p}
              </li>
            ))}
          </ol>
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
            <li key={c.href} className="border-b border-line">
              <Link
                href={c.href}
                className="chapter-row group grid grid-cols-[1fr] items-baseline gap-4 px-2 py-6 md:grid-cols-[16rem_1fr_2rem] md:gap-8 md:px-4"
              >
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
