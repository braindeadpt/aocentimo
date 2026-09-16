import type { Metadata } from "next";
import Link from "next/link";
import { Delta } from "@/components/Delta";
import { Stat } from "@/components/Stat";
import { Figure } from "@/components/Figure";
import { EuroBar } from "@/components/EuroBar";
import { Source } from "@/components/Source";
import { Logo, LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sistema de design",
  description: "Referência viva do design system do BRUTO — tokens, tipografia e componentes.",
};

const TOKENS: [string, string, string][] = [
  ["paper", "bg-paper", "#faf7ee — fundo areia"],
  ["surface", "bg-surface", "#ffffff — cartões"],
  ["ink", "bg-ink", "#221f19 — tinta"],
  ["ink2", "bg-ink2", "#6b6455 — secundário"],
  ["muted", "bg-muted", "#948c79 — meta"],
  ["line", "bg-line", "#eae4d4 — hairline"],
  ["line2", "bg-line2", "#cfc6b0 — regra"],
  ["accent", "bg-accent", "#7e2b1e — oxblood, o que sai"],
  ["accent-ink", "bg-accent-ink", "#5c1f15 — oxblood fundo"],
  ["accent-soft", "bg-accent-soft", "#f3e5de — destaque"],
  ["keep", "bg-keep", "#2f5d46 — verde-pinheiro, o que é teu"],
  ["keep-soft", "bg-keep-soft", "#e3ece6 — verde suave"],
  ["mark", "bg-mark", "#c99a2e — torrado, só marcador de fonte"],
  ["warn", "bg-warn", "#b07e17 — aviso"],
  ["up", "bg-up", "#8f3120 — sobe (mau em preços)"],
  ["down", "bg-down", "#2f5d46 — desce (bom em preços)"],
];

const REGRAS = [
  "Verde só para «o teu dinheiro» — nunca decoração nem fundo genérico.",
  "Torrado só como marcador funcional: fonte, citação, foco.",
  "Verde e oxblood nunca saturados em contacto directo.",
  "Bandeira evocada, nunca citada — verde-floresta + oxblood + torrado.",
];

export default function EstiloPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 pb-10">
      <p className="kicker">Referência viva</p>
      <h1 className="font-display mt-2 text-4xl uppercase tracking-wide md:text-6xl">
        Sistema de design
      </h1>
      <p className="lede mt-5">
        Direcção C — «A Conta»: quente, cívica, humana. Archivo expandido para
        manchetes, Source Serif para a voz, Space Mono para os números. Oxblood
        é o que sai, verde-pinheiro é o que fica — e o torrado marca a fonte.
      </p>

      <section className="mt-10">
        <h2 className="kicker mb-4">Marca — «O Nível»</h2>
        <div className="card flex flex-wrap items-center gap-10 p-8">
          <Logo className="h-12 w-auto" />
          <LogoMark className="h-16 w-16" />
          <p className="footnote max-w-sm">
            O U é um recipiente cheio a ~62 %: o que fica do custo total do
            trabalho (bruto + TSU da empresa) num salário médio. Um motivo só —
            o mesmo nível aparece no gráfico-assinatura do site.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="kicker mb-4">Tokens de cor</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TOKENS.map(([nome, cls, desc]) => (
            <div key={nome} className="border border-line bg-surface">
              <div className={`h-14 ${cls}`} />
              <p className="num px-2 py-1.5 text-xs text-ink2">{nome}</p>
              <p className="footnote px-2 pb-2">{desc}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1">
          {REGRAS.map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">Tipografia</h2>
        <div className="divide-y divide-line border-y border-line">
          <div className="py-5">
            <p className="kicker mb-2">Display — Archivo expandido (wdth 125)</p>
            <p className="font-display text-5xl uppercase tracking-wide">
              Para onde vai o teu dinheiro.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Corpo — Source Serif 4</p>
            <p className="lede">
              Entre o que a empresa paga e o que tu recebes há três cortes:
              Segurança Social, IRS e a TSU que nunca vês no recibo.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Dados — Space Mono, tabular</p>
            <p className="num text-3xl">1 234 567,89 € · ▲ 12,5 %</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">Botões e superfícies</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/estilo" className="btn btn-primary">
            Acção principal
          </Link>
          <Link href="/estilo" className="btn">
            Acção secundária
          </Link>
          <div className="card px-5 py-3 text-sm text-ink2">
            .card — superfície limpa com hairline
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">A barra do euro — assinatura</h2>
        <EuroBar
          total={25987}
          segmentos={[
            { label: "Fica contigo", valor: 16419.69, cor: "var(--color-keep)" },
            { label: "IRS", valor: 2270.31, cor: "var(--color-accent)" },
            { label: "SS do trabalhador", valor: 2310, cor: "var(--color-accent-ink)" },
            { label: "TSU da empresa", valor: 4987.5, cor: "var(--color-ink2)" },
          ]}
        />
        <p className="footnote mt-3">
          Verde só para o que fica contigo; tudo o que sai vive na família
          oxblood/tinta.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">Selo de evidência</h2>
        <div className="space-y-3">
          <Source
            nome="Eurostat"
            url="https://ec.europa.eu/eurostat"
            serieAte="2025-12"
            recolhidoEm="2026-09-16T02:39:10Z"
          />
          <Source nome="Lei n.º 73-A/2025" vigencia="2026" />
          <Source nome="IGCP — ficha técnica CA Série F" nota="divergência entre fontes, ambas mostradas" />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">Componentes</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Stat label="Exemplo" value="920 €" hint="salário mínimo 2026" />
          <Stat label="Variação" value={<Delta value={0.023} />} hint="preço a subir" />
          <Stat label="Variação" value={<Delta value={-0.015} />} hint="preço a descer" />
          <Stat label="Poupança" value={<Delta value={0.018} goodWhenUp />} hint="taxa a subir é bom" />
        </div>
        <Figure n={1} title="Figura numerada com fonte" source="Exemplo — Eurostat">
          <div className="border border-line bg-surface px-5 py-8 text-center text-muted">
            conteúdo da figura (gráfico, tabela, calculadora)
          </div>
        </Figure>
      </section>
    </div>
  );
}
