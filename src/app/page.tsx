import Link from "next/link";
import { Painel } from "@/components/Painel";
import type { EstadoOrbe } from "@/components/OrbeEstado";
import { loadFonte, loadPainel } from "@/lib/data";
import { cartoesHome, opcoesJanela, ROTULO_JANELA } from "@/lib/paineis";
import { fmtDataHora } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";
import type { CenariosSalario } from "@/lib/cenarios";
import cenariosJson from "@data/derived/cenarios-salario.json";
import ivaJson from "@data/fiscal/iva.json";
import { HeroMoeda } from "./_home/HeroMoeda";
import { EscolhePergunta } from "./_home/EscolhePergunta";
import type { PortaRecibo } from "./_home/portas-previews";

export default function Home() {
  const h = m.home;
  const painel = loadPainel();

  // «Hoje em Portugal» — a composição <Painel> (1B-06, codificações
  // revistas na S2-02): seis cartões, cada um com a codificação certa
  // para o seu dado; construída em paineis.ts sobre as fontes reais
  const cartoes = cartoesHome();

  // ————— «Escolhe a tua pergunta» (S2-03) — dados reais do build —————
  // O recibo é a linha canónica da grelha (S1-09); o talão usa os PMD
  // do dia da DGEG com o IVA normal de iva.json (S2-05); a prestação
  // usa os defeitos do simulador de /credito com a Euribor 3M mais
  // recente — se uma série falhar passa null e o cartão diz a falha
  // (regra nº1).
  const cenarios = cenariosJson as unknown as CenariosSalario;
  const linha =
    cenarios.linhas.find((l) => l.bruto === cenarios.meta.brutoRef) ??
    cenarios.linhas[0];
  const recibo: PortaRecibo = {
    bruto: linha.bruto,
    ss: linha.ss,
    irs: linha.irs,
    liquido: linha.liquido,
    tabela: linha.tabela,
    ano: cenarios.meta.ano,
  };
  // o nome da taxa é o contrato do JSON fiscal — se mudar, o build
  // falha aqui em voz alta em vez de servir um IVA inventado
  const taxaNormal = (() => {
    const x = ivaJson.taxas.find((tx) => tx.nome === "Normal");
    if (!x) throw new Error("iva.json: taxa «Normal» não existe");
    return x.taxa;
  })();
  // o talão de «O que pagas» mostra os PMD do dia da DGEG — se uma
  // série falhar a porta diz a falha, nunca inventa o preço (S2-05)
  const fonteGasoleo = loadFonte("dgeg", "pmd-gasoleo-diario");
  const fonteGasolina = loadFonte("dgeg", "pmd-gasolina95-diario");
  const ultGasoleo = fonteGasoleo?.series.at(-1);
  const ultGasolina = fonteGasolina?.series.at(-1);
  const combustiveis =
    fonteGasoleo && ultGasoleo && ultGasolina
      ? {
          gasoleo: { preco: ultGasoleo.v, quando: ultGasoleo.t },
          gasolina95: { preco: ultGasolina.v, quando: ultGasolina.t },
          fonte: fonteGasoleo.meta.fonte,
        }
      : null;
  const eur3m = loadFonte("bpstat", "euribor-3m-mensal");
  const eurUltimo = eur3m?.series[eur3m.series.length - 1]?.v ?? null;
  const estados = Object.fromEntries(
    (painel?.series ?? []).map((s) => [s.id, s.estado])
  ) as Record<string, EstadoOrbe>;

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

      {/* S2-01 — o herói é o instrumento: a moeda de 1 € que se desfaz
          em 100 cêntimos e voa para os quatro montes (TSU · IRS · SS ·
          o que chega à conta). O h1 é o LCP — SSR puro */}
      <HeroMoeda />

      {/* «Hoje em Portugal» — o painel composto: três tamanhos numa
          grelha que nunca deixa órfãos, codificações que nunca se
          repetem em cartões seguidos, mediana de 10 anos como
          comparação por omissão, uma janela temporal partilhada e a
          frescura sempre à vista */}
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

      {/* S2-03 — a navegação como produto: as quatro perguntas dos
          menus, cada uma com a mini-prévia viva da página que abre */}
      <EscolhePergunta
        recibo={recibo}
        ivaNormal={taxaNormal}
        combustiveis={combustiveis}
        prestacao={{
          capital: 200000,
          meses: 360,
          euribor: eurUltimo,
          spread: 1,
        }}
        estados={estados}
      />

      {/* faixa final — o manifesto reduzido, com as ligações de
          confiança: fontes, metodologia e a API aberta */}
      <section className="stack-cap grid gap-6 border-t-2 border-ink pt-8 pb-8 md:grid-cols-12">
        <p className="font-display text-display-md leading-tight tracking-manchete-xl text-ink md:col-span-5">
          {h.manifesto1} {h.manifesto2}{" "}
          <span className="text-mark">{h.manifesto3}</span>
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
            </Link>{" "}
            ·{" "}
            <a
              href="/api/index.json"
              className="underline decoration-line2 underline-offset-2"
            >
              {h.api}
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
