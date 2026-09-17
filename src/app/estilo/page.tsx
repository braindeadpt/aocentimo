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
  description: "Referência viva do design system do AO CÊNTIMO — tokens, tipografia e componentes.",
};

const TOKENS: [string, string, string][] = [
  ["paper", "bg-paper", "#f2f1ea / #0e0c09 — fundo"],
  ["surface", "bg-surface", "#faf9f4 / #16130f — painéis"],
  ["ink", "bg-ink", "#1b1811 / #f2ecdd — tinta"],
  ["ink2", "bg-ink2", "#57534a / #aba28c — secundário"],
  ["muted", "bg-muted", "#6f6a58 / #8f8878 — meta (AA nos dois temas)"],
  ["line", "bg-line", "#e0dcc9 / #2c271e — hairline"],
  ["line2", "bg-line2", "#b7b19d / #57503c — regra, borda de campo"],
  ["accent", "bg-accent", "#b93a17 / #ff6133 — vermilhão-sinal, o que sai"],
  ["accent-ink", "bg-accent-ink", "#8f2a10 / #a03012 — corte mais fundo"],
  ["accent-soft", "bg-accent-soft", "#f6e3db / #331b0d — destaque"],
  ["keep", "bg-keep", "#1f6b4d / #63d6a4 — o que é teu"],
  ["keep-soft", "bg-keep-soft", "#dfece4 / #16281f — verde suave"],
  ["mark", "bg-mark", "#a07c17 / #f0c468 — torrado, fonte e foco"],
  ["warn", "bg-warn", "#a3720a / #f0c468 — aviso"],
  ["up", "bg-up", "#b03016 / #ff6133 — sobe (mau em preços)"],
  ["down", "bg-down", "#1f6b4d / #63d6a4 — desce (bom em preços)"],
];

const REGRAS = [
  "Verde só para «o teu dinheiro» — nunca decoração nem fundo genérico.",
  "Torrado só como marcador funcional: fonte, citação, anel de foco.",
  "Vermilhão-sinal para tudo o que sai do bolso — legível nos dois temas.",
  "Dois temas de raiz: claro frio de papel técnico, escuro de instrumento.",
];

export default function EstiloPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 pb-10">
      <p className="kicker">Referência viva</p>
      <h1 className="font-display mt-2 text-3xl uppercase tracking-wide hyphens-auto sm:text-4xl md:text-6xl">
        Sistema de design
      </h1>
      <p className="lede mt-5">
        Direcção «Observatório»: um painel de instrumentos sobre o dinheiro.
        Archivo expandido para manchetes, Space Grotesk para a interface,
        Source Serif para a voz editorial, Space Mono para os números.
        Vermilhão-sinal é o que sai, verde é o que fica — e o torrado marca
        sempre a fonte. Tudo vive em dois temas: claro e escuro.
      </p>

      <section className="mt-10">
        <h2 className="kicker mb-4">Marca — «o cêntimo»</h2>
        <div className="card flex flex-wrap items-center gap-10 p-8">
          <Logo className="text-2xl sm:text-5xl lg:text-6xl" />
          <LogoMark className="h-16 w-16" />
          <p className="footnote max-w-sm">
            O C do wordmark é o sinal de cêntimo — ¢ — cortado por uma haste
            verde. A marca promete o que o site faz: seguir cada euro ao
            cêntimo, do salário à bomba. Verde é sempre o que é teu.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="kicker mb-4">Tokens de cor — claro / escuro</h2>
        <p className="footnote mb-4 max-w-xl">
          Os swatches são ao vivo: mudam com o tema activo (botão no topo da
          página). Os valores listados são claro / escuro.
        </p>
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
            <p className="kicker mb-2">Interface — Space Grotesk · .body-copy</p>
            <p className="body-copy">
              O corpo da interface e das páginas. Neutro, técnico, sem ser
              genérico — o par natural do Space Mono dos números.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Rótulos — .kicker, mono maiúsculo</p>
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <p className="kicker">.kicker · 0.6875rem / 0.14em</p>
              <p className="kicker-sm">.kicker-sm · 0.65rem / 0.16em</p>
              <p className="kicker-xs">.kicker-xs · 0.6rem / 0.14em</p>
            </div>
            <p className="footnote mt-2">
              A cor por defeito é muted; contextos com outra cor sobrepõem com
              text-* (acento, tinta, aviso). O talão tem escala própria
              (talao-*) — é um documento, não chrome do site.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Editorial — Source Serif 4 (só ledes)</p>
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
          <input className="field max-w-56" defaultValue="1 500" aria-label="exemplo de campo" />
        </div>
        <p className="footnote mt-3">
          <code className="num">.field</code> é o único campo de formulário —
          fundo surface, borda line2, foco pelo anel torrado global. Todos os
          simuladores usam esta classe.
        </p>
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
          vermilhão/tinta.
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
