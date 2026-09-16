import type { Metadata } from "next";
import { Delta } from "@/components/Delta";
import { Stat } from "@/components/Stat";
import { Figure } from "@/components/Figure";

export const metadata: Metadata = {
  title: "Sistema de design",
  description: "Referência viva do design system do Cêntimo — tokens, tipografia e componentes.",
};

const TOKENS = [
  ["paper", "bg-paper", "#faf8f2 — fundo"],
  ["surface", "bg-surface", "#fffdf8 — cartões"],
  ["ink", "bg-ink", "#1a1610 — texto"],
  ["ink2", "bg-ink2", "#4c4437 — texto secundário"],
  ["muted", "bg-muted", "#847a64 — meta"],
  ["line", "bg-line", "#e6dfcf — hairline"],
  ["line2", "bg-line2", "#c6bb9f — regra forte"],
  ["accent", "bg-accent", "#14532d — verde-garrafa"],
  ["accent-soft", "bg-accent-soft", "#e8f0e9 — fundo de destaque"],
  ["up", "bg-up", "#b3401e — sobe (mau em preços)"],
  ["down", "bg-down", "#0f6f66 — desce (bom em preços)"],
];

export default function EstiloPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14 pb-10">
      <p className="kicker">Referência viva</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-2">Sistema de design</h1>
      <p className="lede mt-5">
        Broadsheet financeiro português: papel claro, tinta escura, uma cor de
        acento. Serifada para voz, monoespaçada para números.
      </p>

      <section className="mt-10">
        <h2 className="kicker mb-4">Tokens de cor</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TOKENS.map(([nome, cls, desc]) => (
            <div key={nome} className="border border-line bg-surface">
              <div className={`h-14 ${cls}`} />
              <p className="num text-xs px-2 py-1.5 text-ink2">{nome}</p>
              <p className="footnote px-2 pb-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4">Tipografia</h2>
        <div className="border-y border-line divide-y divide-line">
          <div className="py-5">
            <p className="kicker mb-2">Display — Fraunces</p>
            <p className="font-display text-4xl tracking-tight">Para onde vai o teu dinheiro.</p>
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
        <h2 className="kicker mb-4">Componentes</h2>
        <div className="grid md:grid-cols-4 gap-6">
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
