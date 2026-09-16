import type { Metadata } from "next";
import { Delta } from "@/components/Delta";
import { Stat } from "@/components/Stat";
import { Figure } from "@/components/Figure";
import { EuroBar } from "@/components/EuroBar";

export const metadata: Metadata = {
  title: "Sistema de design",
  description: "Referência viva do design system do Cêntimo — tokens, tipografia e componentes.",
};

const TOKENS = [
  ["paper", "bg-paper", "#fbfaf6 — fundo"],
  ["surface", "bg-surface", "#ffffff — cartões"],
  ["ink", "bg-ink", "#161512 — texto"],
  ["ink2", "bg-ink2", "#4a463c — secundário"],
  ["muted", "bg-muted", "#8b8471 — meta"],
  ["line", "bg-line", "#e4e0d2 — hairline"],
  ["line2", "bg-line2", "#b9b19c — regra"],
  ["accent", "bg-accent", "#b3261e — rubrica"],
  ["accent-soft", "bg-accent-soft", "#f7e9e5 — destaque"],
  ["up", "bg-up", "#b3261e — sobe (mau em preços)"],
  ["down", "bg-down", "#0f7a66 — desce (bom em preços)"],
];

export default function EstiloPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 pb-10">
      <p className="kicker">Referência viva</p>
      <h1 className="font-display mt-2 text-4xl uppercase tracking-wide md:text-6xl">
        Sistema de design
      </h1>
      <p className="lede mt-5">
        Cartaz de contas: papel claro, tinta fria, um vermelho-rubrica.
        Condensada para voz, monoespaçada para números — e a barra do euro
        como assinatura.
      </p>

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
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">Tipografia</h2>
        <div className="divide-y divide-line border-y border-line">
          <div className="py-5">
            <p className="kicker mb-2">Display — Anton</p>
            <p className="font-display text-5xl uppercase tracking-wide">
              Para onde vai o teu dinheiro.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Corpo — Inter</p>
            <p className="lede">
              Entre o que a empresa paga e o que tu recebes há três cortes:
              Segurança Social, IRS e a TSU que nunca vês no recibo.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Dados — IBM Plex Mono, tabular</p>
            <p className="num text-3xl">1 234 567,89 € · ▲ 12,5 %</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">A barra do euro</h2>
        <EuroBar
          total={25987}
          segmentos={[
            { label: "Fica contigo", valor: 16419.69, cor: "#0f7a66" },
            { label: "IRS", valor: 2270.31, cor: "#b3261e" },
            { label: "SS do trabalhador", valor: 2310, cor: "#d07c1f" },
            { label: "TSU da empresa", valor: 4987.5, cor: "#4a463c" },
          ]}
        />
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
