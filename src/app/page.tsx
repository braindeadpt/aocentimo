import Link from "next/link";
import { Adivinha } from "@/components/Adivinha";
import { Botao } from "@/components/Botao";
import {
  EuroExplodido,
  type PassoEuro,
  type RotulosEuro,
} from "@/components/EuroExplodido";
import { Kinetic } from "@/components/Kinetic";
import { Painel } from "@/components/Painel";
import { loadFonte, loadPainel } from "@/lib/data";
import { cartoesHome, opcoesJanela, ROTULO_JANELA } from "@/lib/paineis";
import { decomporCombustivel } from "@/lib/engines/impostos";
import { TSU_TRABALHADOR } from "@/lib/engines/seg-social";
import { BRUTO_CANONICO, cenarioCanonico } from "@/lib/canonico";
import isp from "@data/fiscal/isp.json";
import retencaoJson from "@data/fiscal/retencao-2026.json";
import ssJson from "@data/fiscal/ss.json";
import { fmtEUR0, fmtPct, fmtPeriodo, fmtDataHora } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";

export default function Home() {
  const h = m.home;
  const painel = loadPainel();

  // «Hoje em Portugal» — a composição <Painel> (1B-06): seis cartões,
  // três tamanhos, codificações alternadas; construída em paineis.ts
  // sobre as fontes reais
  const cartoes = cartoesHome();

  // Fronteira servidor/cliente: o cenário canónico corre UMA vez aqui
  // — cenarioCanonico puxa os motores e os JSON de data/fiscal que
  // assim nunca entram no bundle do browser. Adivinha recebe a
  // «realidade» pronta por props; a decomposição completa é contada
  // pelo EuroExplodido mais abaixo. A história é a mesma de /salario:
  // custo total da empresa → cortes → líquido do mês (retenção real).
  const can = cenarioCanonico(BRUTO_CANONICO, retencaoJson.ano);
  const real = can.centimosPorEuroCusto;

  // ————— «o teu euro» (R-02, valores em € do mês desde R-07) —————
  // Tudo sai do cenário canónico e das fontes, para um salário bruto de
  // 1 500 €/mês (solteiro, sem dependentes, regras 2026): SS do
  // trabalhador, retenção de IRS, líquido, os impostos dentro de 50 L
  // de gasóleo ao PMD mais recente (ISP + carbono + IVA) e o que fica
  // — os mesmos euros do recibo de /salario. Nada escrito à mão.
  const e3 = m.euroV3;
  const brutoMes = can.brutoMes;
  const ssEuro = can.ssMes;
  const retEuro = can.irsRetidoMes;
  const liquidoEuro = can.liquidoMes;
  const pmdEuro = loadFonte("dgeg", "pmd-gasoleo-diario");
  const precoEuro = pmdEuro?.series[pmdEuro.series.length - 1]?.v ?? 0;
  const decGasoleo = decomporCombustivel(
    precoEuro,
    isp.gasoleo.ispELitro,
    isp.gasoleo.carbonoELitro
  );
  const impostos50 = decGasoleo.impostos * 50;
  const temGasoleo = pmdEuro !== null && precoEuro > 0;
  // o selo do cabeçalho: o que o Estado e os impostos levam do mês
  const estadoMes = ssEuro + retEuro + (temGasoleo ? impostos50 : 0);
  const motorEuro = { nome: e3.motor, url: "/salario" };
  const passoGasoleo: PassoEuro | null =
    pmdEuro && precoEuro > 0
      ? {
          id: "gasoleo",
          rotulo: e3.passos.gasoleo.rotulo,
          detalhe: t(e3.passos.gasoleo.detalhe, {
            quando: fmtPeriodo(pmdEuro.meta.serieAte),
          }),
          euros: impostos50,
          corte: true,
          fonteNome: `${pmdEuro.meta.fonte} + ${isp.fonte.split(";")[0]}`,
          fonteUrl: pmdEuro.meta.url,
        }
      : null;
  const passosEuro: PassoEuro[] = [
    {
      id: "ss",
      rotulo: e3.passos.ss.rotulo,
      detalhe: t(e3.passos.ss.detalhe, {
        taxa: fmtPct(TSU_TRABALHADOR, 0),
      }),
      euros: ssEuro,
      corte: true,
      fonteNome: ssJson.fonte,
      fonteUrl: ssJson.fonteUrl,
    },
    {
      id: "irs",
      rotulo: e3.passos.irs.rotulo,
      detalhe: e3.passos.irs.detalhe,
      euros: retEuro,
      corte: true,
      fonteNome: retencaoJson.fonte,
      fonteUrl: retencaoJson.fonteUrl,
    },
    {
      id: "liquido",
      rotulo: e3.passos.liquido.rotulo,
      detalhe: e3.passos.liquido.detalhe,
      euros: liquidoEuro,
      fonteNome: motorEuro.nome,
      fonteUrl: motorEuro.url,
    },
    {
      id: "fica",
      rotulo: e3.passos.fica.rotulo,
      detalhe: e3.passos.fica.detalhe,
      euros: liquidoEuro - (temGasoleo ? impostos50 : 0),
      fonteNome: motorEuro.nome,
      fonteUrl: motorEuro.url,
    },
  ];
  // o gasóleo entra antes do «fica» — só com PMD real (regra nº1)
  if (passoGasoleo) passosEuro.splice(passosEuro.length - 1, 0, passoGasoleo);
  const rotulosEuro: RotulosEuro = {
    titulo: e3.titulo,
    nota: e3.nota,
    breadcrumb: e3.breadcrumb,
    meta: t(e3.meta, { valor: fmtEUR0(estadoMes) }),
    brutoRotulo: e3.brutoRotulo,
    brutoDetalhe: e3.brutoDetalhe,
    ficamTe: e3.ficamTe,
    porMes: e3.porMes,
    fontes: e3.fontes,
    simulador: e3.simulador,
  };

  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AO CÊNTIMO",
    url: SITE_URL,
    inLanguage: "pt-PT",
    description:
      "Literacia financeira para Portugal — seguimos 1 € do salário bruto até ao fim do mês. Simuladores e dados oficiais, cada número com fonte e data.",
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
          <h1 className="titulo-hero">
            <Kinetic texto={`${h.h1a} ${h.h1b}`} />{" "}
            <Kinetic texto={h.h1c} desde={4} className="text-accent" />
          </h1>
        </div>
        <div className="md:col-span-4">
          <p className="lede !mt-0">{h.lede}</p>
          <Botao href="/salario" variante="primario" className="mt-4">
            {h.cta}
          </Botao>
        </div>
      </section>

      {/* «Hoje em Portugal» — o painel composto (1B-06): três
          tamanhos numa grelha que nunca deixa órfãos, codificações
          que nunca se repetem em cartões seguidos, mediana de 10
          anos como comparação por omissão, uma janela temporal
          partilhada e a frescura sempre à vista */}
      <section className="mt-6 md:mt-10" aria-labelledby="painel-leituras">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
          <h2 id="painel-leituras" className="kicker">
            {m.painel.titulo}
          </h2>
          {painel?.recolhidoEm && (
            <p className="num text-rotulo text-muted">
              {t(m.painel.recolhido, { quando: fmtDataHora(painel.recolhidoEm) })}
            </p>
          )}
        </div>
        <Painel
          className="mt-5"
          cartoes={cartoes}
          rotuloJanela={ROTULO_JANELA()}
          opcoesJanela={opcoesJanela()}
        />
      </section>

      {/* a pergunta antes da resposta — o visitante aposta quantos
          cêntimos de cada euro de custo lhe chegam; a decomposição
          completa vem depois, na explosão */}
      <section
        aria-labelledby="instrumento"
        className="stack-sec border border-line bg-panel px-5 py-6 md:px-8 md:py-8"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="instrumento" className="kicker">{h.euroTitulo}</h2>
          <p className="num text-right text-rotulo text-muted">{h.euroNota}</p>
        </div>
        <Adivinha real={real} />
      </section>

      {/* «O TEU EURO» (R-02/R-07) — o salário do mês em explosão
          isométrica: camadas wireframe afastadas na vertical, chamadas
          tracejadas até aos rótulos mono; a lista é o equivalente
          sempre visível. Depois do painel de leituras e da adivinha —
          é a resposta à pergunta —, antes dos capítulos. */}
      <EuroExplodido passos={passosEuro} rotulos={rotulosEuro} bruto={brutoMes} />

      {/* capítulos — o percurso do euro */}
      <section className="stack-cap">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="font-display text-display-sm tracking-manchete-xl md:text-display-md">
            {h.capitulosTitulo}
          </h2>
          <span className="num text-rotulo text-muted">{h.capitulosNota}</span>
        </div>
        <ol>
          {h.capitulos.map((c) => (
            <li key={c.href} className="border-b border-line">
              <Link
                href={c.href}
                className="chapter-row group grid grid-cols-[1fr] items-baseline gap-4 px-2 py-6 md:grid-cols-[16rem_1fr_2rem] md:gap-8 md:px-4"
              >
                <span className="font-display text-display-md tracking-manchete-xl transition-colors md:text-display-lg">
                  {c.titulo}
                </span>
                <span className="chapter-dim col-span-2 mt-2 max-w-xl text-corpo-sm leading-relaxed text-ink2 transition-colors md:col-span-1 md:mt-0">
                  {c.descricao}
                </span>
                <span className="chapter-arrow hidden text-right font-display text-display-sm text-muted md:block">
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
          <h2 className="font-display text-display-sm tracking-manchete-xl md:text-display-md">
            {h.ferramentasTitulo}
          </h2>
        </div>
        <ul className="grid gap-px border-b border-line md:grid-cols-3">
          {h.ferramentas.map((f) => (
            <li key={f.href} className="border-t border-line md:border-t-0 md:border-l md:first:border-l-0">
              <Link href={f.href} className="group block px-0 py-6 md:px-6 md:first:pl-0">
                <span className="font-display text-display-sm tracking-manchete-xl text-ink transition-colors group-hover:text-accent">
                  {f.titulo}
                </span>
                <span className="mt-2 block max-w-xs text-corpo-sm leading-relaxed text-ink2">
                  {f.descricao}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* manifesto */}
      <section className="stack-cap grid gap-8 border-t-2 border-ink pt-8 pb-8 md:grid-cols-12">
        <p className="font-display text-display-md leading-tight tracking-manchete-xl text-ink md:col-span-5 md:text-display-lg">
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
