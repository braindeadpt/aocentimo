import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import Link from "next/link";
import { Delta } from "@/components/Delta";
import { NumHero } from "@/components/NumHero";
import { Stat } from "@/components/Stat";
import { Figure } from "@/components/Figure";
import { EuroBar } from "@/components/EuroBar";
import { Source } from "@/components/Source";
import { Logo, LogoMark } from "@/components/Logo";
import { MotionDemo } from "./MotionDemo";
import { MotorDemo } from "./MotorDemo";
import { BarrasDemo } from "./BarrasDemo";
import { Linha } from "@/components/instrumentos/Linha";
import { Mostrador } from "@/components/instrumentos/Mostrador";
import { Calendario } from "@/components/instrumentos/Calendario";
import { Multiplos } from "@/components/instrumentos/Multiplos";
import { Declive } from "@/components/instrumentos/Declive";
import { Manchete } from "@/components/Manchete";
import { Glifo } from "@/components/Glifo";
import painel from "@data/derived/painel.json";
import pmdGasoleo from "@data/sources/dgeg/pmd-gasoleo-diario.json";
import { PapelDefs } from "@/components/Papel";
import { PecaPapel } from "@/components/PecaPapel";
import { arestaRasgada } from "@/lib/materia";
import eur1m from "@data/sources/bpstat/euribor-1m-mensal.json";
import eur3m from "@data/sources/bpstat/euribor-3m-mensal.json";
import eur6m from "@data/sources/bpstat/euribor-6m-mensal.json";
import eur12m from "@data/sources/bpstat/euribor-12m-mensal.json";

export const metadata: Metadata = {
  title: "Sistema de design",
  description: "Referência viva do design system do AO CÊNTIMO — tokens, tipografia e componentes.",
  alternates: { canonical: "/estilo", types: ALT_FEED },
  // indexável de propósito: é peça de portefólio, ligada do rodapé
};

// Euribor por prazo — cauda real de 24 meses para a comparação de rampas
const EURIBOR = [eur1m, eur3m, eur6m, eur12m].map((s) =>
  s.series.slice(-24)
);

// dados reais do painel para a secção Instrumentos (B-03)
const PAINEL = painel.series;
const painelSerie = (id: string) => PAINEL.find((s) => s.id === id);
const PMD_2026 = pmdGasoleo.series.filter(
  (p) => p.t >= "2026-01-01" && p.t <= "2026-12-31"
);
const DECLIVE_ITENS = ["euribor-3m-mensal", "euribor-12m-mensal", "ca-base", "une-pt-total", "pib-pt-homologo", "lci-pt-homologo"]
  .map((id) => painelSerie(id))
  .filter((s) => s !== undefined)
  .map((s) => ({
    rotulo: s.rotulo.split(",")[0],
    antes: Math.round((s.valor - s.variacao.abs) * 100) / 100,
    depois: s.valor,
  }));
const MULTIPLOS = ["euribor-3m-mensal", "euribor-12m-mensal", "ca-base", "une-pt-total"]
  .map((id) => painelSerie(id))
  .filter((s) => s !== undefined)
  .map((s) => ({ id: s.id, rotulo: s.rotulo, pontos: s.spark }));

const TOKENS: [string, string, string][] = [
  ["floor", "bg-floor", "#f4f3ec / #0d0b08 — nível 0, fundo"],
  ["panel", "bg-panel", "#fbfaf6 / #1a1611 — nível 1, conteúdo"],
  ["raised", "bg-raised", "#fdfcf9 / #251f18 — nível 2, resultado"],
  ["overlay", "bg-overlay", "#ffffff / #342e20 — nível 3, sobreposição"],
  ["ink", "bg-ink", "#1b1811 / #f2ecdd — tinta"],
  ["ink2", "bg-ink2", "#57534a / #aba28c — secundário"],
  ["muted", "bg-muted", "#6f6a58 / #8f8878 — meta (AA nos dois temas)"],
  ["line", "bg-line", "#e0dcc9 / #2c271e — hairline"],
  ["line2", "bg-line2", "#b7b19d / #57503c — regra, borda de campo"],
  ["accent", "bg-accent", "#b93a17 / #ff6133 — vermilhão-sinal, o que sai"],
  ["accent-ink", "bg-accent-ink", "#8f2a10 / #a03012 — corte mais fundo"],
  ["keep", "bg-keep", "#1f6b4d / #63d6a4 — o que é teu"],
  ["mark", "bg-mark", "#a07c17 / #f0c468 — torrado, fonte e foco"],
  ["warn", "bg-warn", "#a3720a / #f0c468 — aviso"],
  ["up", "bg-up", "#b03016 / #ff6133 — sobe (mau em preços)"],
  ["down", "bg-down", "#1f6b4d / #63d6a4 — desce (bom em preços)"],
  ["papel-sai", "bg-papel-sai", "#f0d5c6 — papel avermelhado, o troço arrancado (fixo nos dois temas)"],
  ["papel-sai-tinta", "bg-papel-sai-tinta", "#7a2a10 — a tinta desse papel (6,9:1)"],
  ["papel-fica", "bg-papel-fica", "#dcead4 — papel esverdeado, o que é teu (fixo)"],
  ["papel-fica-tinta", "bg-papel-fica-tinta", "#1d4f31 — a tinta desse papel (7,6:1)"],
];

const REGRAS = [
  "Verde só para «o teu dinheiro» — nunca decoração nem fundo genérico.",
  "Torrado só como marcador funcional: fonte, citação, anel de foco.",
  "Vermilhão-sinal para tudo o que sai do bolso — legível nos dois temas.",
  "Escuro por omissão — o instrumento é a cara; o claro é o documento.",
];

const REGRAS_SUPERFICIE = [
  "Textura só no nível 0: papel milimetrado no claro; no escuro a mesma malha em fósforo esbatido — ecrã de registo, não papel.",
  "panel, raised e overlay nunca têm textura — a leitura manda.",
  "O fio de luz de 1px na aresta superior só existe no escuro; no claro é a sombra subtil que eleva.",
  "overlay não leva texto muted — só ink/ink2. Meta e fontes vivem nos níveis baixos.",
  "O grão é global — o vidro do instrumento; cobre todos os níveis por igual.",
  ".blueprint (pontos) não é um nível: é a textura de uma zona de medição, atrás de diagramas.",
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
        sempre a fonte. Escuro por omissão: o instrumento é a cara do
        produto; o tema claro é o documento.
      </p>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Marca — «o cêntimo»</h2>
        <div className="border border-line bg-panel flex flex-wrap items-center gap-10 p-8">
          <Logo className="text-2xl sm:text-5xl lg:text-6xl" />
          <LogoMark className="h-16 w-16" />
          <p className="footnote max-w-sm">
            O C do wordmark é o sinal de cêntimo — ¢ — cortado por uma haste
            verde. A marca promete o que o site faz: seguir cada euro ao
            cêntimo, do salário à bomba. Verde é sempre o que é teu.
          </p>
        </div>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Cor — semântica primeiro, dados depois</h2>
        <p className="footnote mb-4 max-w-xl">
          Três cores com significado fixo — vermelhão é o que sai, verde é o
          que fica contigo, torrado marca a fonte. Os dados vivem fora delas:
          uma rampa azul-aço para famílias ordinais e uma rampa neutra de
          «data ink» para contexto. Os swatches são ao vivo — mudam com o
          tema (botão no topo).
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TOKENS.map(([nome, cls, desc]) => (
            <div key={nome} className="border border-line bg-panel">
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

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-panel px-5 py-4 md:col-span-2">
            <p className="kicker mb-1">Rampa sequencial — duas opções, escolha do dono</p>
            <p className="footnote mb-4 max-w-xl">
              As Euribor reais (1M→12M, últimos 24 meses, mesma escala)
              desenhadas pelas duas rampas candidatas. A decisão fica
              registada em NOTAS-NOITE — os rácios AA e a leitura em
              daltonismo estão lá medidos.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {(["seq", "seqb"] as const).map((rampa, ri) => (
                <div key={rampa} className="border border-line px-4 py-3">
                  <p className="kicker-xs">
                    {ri === 0 ? "A — azul-aço (actual)" : "B — âmbar escurecido (proposta)"}
                  </p>
                  <svg viewBox="0 0 300 110" className="mt-2 block w-full" aria-hidden>
                    {EURIBOR.map((serie, i) => {
                      const vs = EURIBOR.flat().map((p) => p.v);
                      const mn = Math.min(...vs);
                      const mx = Math.max(...vs);
                      const span = mx - mn || 1;
                      return (
                        <polyline
                          key={i}
                          fill="none"
                          stroke={`var(--color-${rampa}-${i + 1})`}
                          strokeWidth={2.5}
                          strokeLinejoin="round"
                          points={serie
                            .map((p, j) => {
                              const x = 6 + (j / (serie.length - 1)) * 288;
                              const y = 100 - ((p.v - mn) / span) * 88;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(" ")}
                        />
                      );
                    })}
                  </svg>
                  <div className="mt-1 flex justify-between">
                    {["1M", "3M", "6M", "12M"].map((k, i) => (
                      <span key={k} className="num flex items-center gap-1.5 text-xs text-muted">
                        <span aria-hidden className="inline-block size-2.5" style={{ background: `var(--color-${rampa}-${i + 1})` }} />
                        {k}
                      </span>
                    ))}
                  </div>
                  <p className="footnote mt-2">
                    {ri === 0
                      ? "Único matiz fora da identidade quente. No claro, os degraus 3–4 caem abaixo de 3:1 no painel."
                      : "Da família do torrado — a mesma tinta da evidência. Os 4 degraus passam 3:1 nos dois temas; colide em matiz com o mark (fonte/foco)."}
                  </p>
                </div>
              ))}
            </div>
            <p className="footnote mt-3">
              Euribor por prazo, escalões de IRS, anos do IRS Jovem — famílias
              ordenadas. Os degraus separam-se por luminância: a ordem lê-se
              em deuteranopia e protanopia porque não depende do matiz.
            </p>
          </div>
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker mb-3">Data ink — contexto que recua</p>
            <svg viewBox="0 0 300 90" className="block w-full" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <polyline
                  key={i}
                  fill="none"
                  stroke={`var(--color-dink-${i + 1})`}
                  strokeWidth={2}
                  points={Array.from({ length: 13 }, (_, j) => {
                    const x = 8 + j * 24;
                    const y = 18 + i * 13 + Math.sin(j * 0.8 + i * 1.3) * 4;
                    return `${x},${y}`;
                  }).join(" ")}
                />
              ))}
            </svg>
            <div className="mt-1 flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="num flex items-center gap-1.5 text-xs text-muted">
                  <span aria-hidden className="inline-block size-2.5" style={{ background: `var(--color-dink-${i})` }} />
                  dink-{i}
                </span>
              ))}
            </div>
            <p className="footnote mt-3">
              Séries de contexto (média histórica, referência) recuam pela
              rampa neutra — ink → ink2 → muted → line2. Sem matiz, sem
              leitura falsa.
            </p>
          </div>
        </div>

        <div className="mt-4 border border-line bg-panel px-5 py-4">
          <p className="kicker mb-3">Proibido — o sistema também é o que recusa</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <svg viewBox="0 0 200 60" className="block w-full" aria-hidden>
                <polyline fill="none" stroke="var(--color-accent)" strokeWidth={2.5}
                  points="8,45 40,30 72,38 104,18 136,26 168,12 192,20" />
                <polyline fill="none" stroke="var(--color-keep)" strokeWidth={2.5}
                  points="8,40 40,42 72,35 104,40 136,30 168,34 192,28" />
                <polyline fill="none" stroke="var(--color-mark)" strokeWidth={2.5}
                  points="8,50 40,48 72,44 104,46 136,40 168,42 192,38" />
              </svg>
              <p className="footnote mt-2">
                Cores semânticas como cor de série — «sai»/«fica» não são
                legendas de dados.
              </p>
            </div>
            <div>
              <svg viewBox="0 0 200 60" className="block w-full" aria-hidden>
                <polyline fill="none" stroke="#b93a17" strokeWidth={2.5}
                  points="8,45 40,30 72,38 104,18 136,26 168,12 192,20" />
                <polyline fill="none" stroke="#1f6b4d" strokeWidth={2.5}
                  points="8,40 40,42 72,35 104,40 136,30 168,34 192,28" />
                <polyline fill="none" stroke="#a07c17" strokeWidth={2.5}
                  points="8,50 40,48 72,44 104,46 136,40 168,42 192,38" />
              </svg>
              <p className="footnote mt-2">
                Paleta categórica em série ordinal — três matizes sem relação
                para uma família ordenada (o que as Euribor eram antes).
              </p>
            </div>
            <div>
              <svg viewBox="0 0 200 60" className="block w-full" aria-hidden>
                <defs>
                  <linearGradient id="proibido-grad" x1="0" x2="1">
                    <stop offset="0" stopColor="var(--color-accent)" />
                    <stop offset="1" stopColor="var(--seq-1)" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="184" height="44" fill="url(#proibido-grad)" />
              </svg>
              <p className="footnote mt-2">
                Gradiente decorativo — cor que não codifica dados.
              </p>
            </div>
          </div>
          <p className="footnote mt-3">
            Regra do verde verificada a cada revisão: <code className="num">color-keep</code>{" "}
            só aparece onde o dinheiro fica contigo — «Fica contigo» na barra
            do euro, poupança líquida, dedução ao IRS. O preço de uma casa
            não é verde: sai do teu bolso para o vendedor.
          </p>
        </div>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Superfícies — escala de elevação</h2>
        <p className="footnote mb-4 max-w-xl">
          Quatro níveis, um instrumento. No claro a elevação é sombra subtil
          e a superfície recua; no escuro é luz — luminância crescente na
          rampa e um fio de 1px na aresta superior. Troca o tema para ver as
          duas mecânicas.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-line bg-floor px-4 py-6">
            <p className="kicker-xs">0 — floor</p>
            <p className="footnote mt-2">
              fundo da página · a grelha vive só aqui
            </p>
          </div>
          <div className="border border-line bg-panel px-4 py-6">
            <p className="kicker-xs">1 — panel</p>
            <p className="footnote mt-2">
              bloco de conteúdo · sem textura
            </p>
          </div>
          <div className="border border-line bg-raised px-4 py-6 shadow-raised">
            <p className="kicker-xs">2 — raised</p>
            <p className="footnote mt-2">
              resultado de simulador · o que o instrumento devolve
            </p>
          </div>
          <div className="border border-line bg-overlay px-4 py-6 shadow-overlay">
            <p className="kicker-xs text-ink">3 — overlay</p>
            <p className="mt-2 text-[0.8125rem] leading-normal text-ink2">
              menu e tooltip · só ink/ink2, nunca muted
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1">
          {REGRAS_SUPERFICIE.map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Ritmo — três degraus de respiro</h2>
        <p className="footnote mb-4 max-w-xl">
          O ar entre blocos é medido, não sentido. Três degraus nomeados
          — figura, secção, capítulo — aplicados como margin-block para
          colapsarem como margens de texto. O pé de página fecha sempre
          com o degrau de capítulo. À escala: 2 · 4 · 6 rem.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["fig", "2rem", "h-8", "entre figuras e instrumentos duma secção — .stack-fig"],
            ["sec", "4rem", "h-16", "entre secções duma página — .stack-sec"],
            ["cap", "6rem", "h-24", "capítulos da home e o pé de página — .stack-cap"],
          ].map(([nome, val, h, uso]) => (
            <div key={nome} className="border border-line bg-panel px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="kicker-xs">{nome}</span>
                <span className="num text-xs text-muted">{val}</span>
              </div>
              <div className={`${h} my-3 w-full border-y border-dashed border-line2`} aria-hidden />
              <p className="footnote">{uso}</p>
            </div>
          ))}
        </div>
        <p className="kicker mb-3 mt-8">Larguras — três molduras, sem excepções</p>
        <div className="space-y-3" aria-hidden>
          <div className="border border-line bg-panel px-4 py-2.5">
            <span className="num text-xs text-muted">referência — esta página · max-w-6xl</span>
          </div>
          <div className="mx-auto max-w-5xl border border-line bg-panel px-4 py-2.5">
            <span className="num text-xs text-muted">instrumento — todas as páginas de dados e simuladores · max-w-5xl</span>
          </div>
          <div className="mx-auto max-w-2xl border border-line bg-panel px-4 py-2.5">
            <span className="num text-xs text-muted">leitura — prosa corrida, ~68 caracteres · max-w-2xl</span>
          </div>
        </div>
        <p className="footnote mt-4">
          Texturas, três papéis: a malha milimetrada vive só no nível 0;
          o grão fino é o vidro do instrumento — global, igual nos dois
          temas; <code className="num">.blueprint</code> é textura duma
          zona de medição, atrás de diagramas. Nenhuma fica em cima de
          texto corrido.
        </p>
      </section>

      <section className="stack-sec">
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

      <section className="stack-sec">
        <h2 className="kicker mb-4">Números — três registos</h2>
        <p className="footnote mb-4 max-w-xl">
          A escala de números tem três registos com papéis diferentes. O
          herói é a resposta do instrumento — um por painel de resultado.
          Unidade e sinal são membros da mesma linha de base, compostos em
          tinta secundária — nunca notas de rodapé.
        </p>
        <div className="divide-y divide-line border-y border-line">
          <div className="py-6">
            <p className="kicker mb-2">
              Herói — .num-hero · Archivo expandido, dígitos tabulares
            </p>
            <NumHero valor="1 234,56 €" sufixo="/mês" />
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <NumHero valor="1 234,56 €" sinal="+" className="text-keep" compacto />
              <NumHero valor="412 345,67 €" compacto className="text-muted" />
            </div>
            <p className="footnote mt-3">
              O sinal herda a cor semântica (keep/up) e sobe ao óptico; a
              unidade fica em ink2. Valores sem teto usam .num-hero-compact.
              No talão o herói fala a língua do artefacto — double-strike de
              impressora térmica, não Archivo.
            </p>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Leitura — .num-read · Space Mono ~1.4rem</p>
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
              <p className="num-read">4 320,00 €</p>
              <p className="num-read text-up">23,0 %</p>
              <p className="num-read text-keep">+1 024,00 €</p>
            </div>
          </div>
          <div className="py-5">
            <p className="kicker mb-2">Denso — .num-dense · tabelas e séries</p>
            <p className="num-dense">
              2026-01 · 2,516 % &nbsp;&nbsp; 2026-02 · 2,489 % &nbsp;&nbsp;
              2026-03 · 2,441 %
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1">
          {[
            "tabular-nums é obrigatório em qualquer registo — medido na Archivo real: «11111.11» e «88888.88» têm a mesma largura; sem tnum dançam.",
            "Um herói por painel de resultado — a resposta do instrumento. Os apoios ficam em leitura.",
            "«—» é um estado, não um erro — renderiza-se no mesmo registo do número que falhou.",
          ].map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Botões e campos</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/estilo" className="btn btn-primary">
            Acção principal
          </Link>
          <Link href="/estilo" className="btn">
            Acção secundária
          </Link>
          <input className="field max-w-56" defaultValue="1 500" aria-label="exemplo de campo" />
        </div>
        <p className="footnote mt-3">
          <code className="num">.field</code> é o único campo de formulário —
          chapa de nível 1 com recess (cavidade), borda line2, foco pelo anel
          torrado global. Todos os simuladores usam esta classe.
        </p>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Raio — zero, porque isto é uma régua</h2>
        <p className="footnote mb-4 max-w-xl">
          Um instrumento de medida tem arestas. <code className="num">border-radius</code>{" "}
          é 0 em todo o chrome — campos, botões, painéis, tabelas. A única
          excepção é o carimbo (2px): é tinta de borracha, um objecto
          físico — a excepção prova a regra. Pílulas e cartões macios são
          linguagem de app de consumo; aqui mede-se dinheiro.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-panel px-5 py-4">
            <input className="field w-full" defaultValue="1 500" aria-label="campo real — raio zero" />
            <p className="footnote mt-3">
              ✓ o campo é uma cavidade — arestas rectas, recess interno,
              foco pelo anel torrado
            </p>
          </div>
          <div className="border border-line bg-panel px-5 py-4">
            <div
              aria-hidden
              className="num border-2 border-line2 bg-panel px-3 py-2 text-muted"
              style={{ borderRadius: "999px" }}
            >
              1 500
            </div>
            <p className="footnote mt-3">
              ✗ proibido — a pílula arredondada promete um toque que o
              instrumento não dá
            </p>
          </div>
        </div>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Movimento — a gramática</h2>
        <p className="footnote mb-4 max-w-xl">
          Três tipos de movimento: o que <em>explica</em> (a transformação
          dos dados à vista — a fita a rasgar, a série a desenhar-se), o
          que <em>responde</em> (hover, foco, o gráfico ao cursor — a
          sensação de instrumento) e o que <em>decora</em> — na lista
          negra, não existe. Uma duração é um significado, não um gosto:
        </p>
        <div className="grid gap-px border border-line bg-line md:grid-cols-4">
          {[
            ["--dur-micro", "120ms", "resposta ao toque"],
            ["--dur-curta", "320ms", "mudança de estado"],
            ["--dur-media", "600ms", "transformação explicada"],
            ["--dur-longa", "1200ms", "sequência orquestrada"],
          ].map(([tok, ms, uso]) => (
            <div key={tok} className="bg-panel px-4 py-3">
              <p className="num text-sm text-ink">{ms}</p>
              <p className="kicker-xs mt-1">{tok}</p>
              <p className="footnote mt-1">{uso}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-px border border-line bg-line md:grid-cols-4">
          {[
            ["--ease-entra", "o que chega — arranca rápido, pousa devagar"],
            ["--ease-sai", "o que parte — sai depressa"],
            ["--ease-rasgo", "o acto físico — elástica contida, só o rasgo"],
            ["--ease-lin", "só movimento contínuo (ticker); nunca em transições"],
          ].map(([tok, uso]) => (
            <div key={tok} className="bg-panel px-4 py-3">
              <p className="kicker-xs">{tok}</p>
              <p className="footnote mt-1">{uso}</p>
            </div>
          ))}
        </div>
        <p className="footnote mt-4 max-w-xl">
          Um escalonamento entre irmãos — <span className="num">--stagger</span> (90ms)
          em cascatas, barras, sparks e odómetro. Nunca anima: números que a
          pessoa precisa de ler já; conteúdo acima da dobra ao carregar.
          Com prefers-reduced-motion o estado final é imediato — corta-se
          tudo, e um teste e2e percorre todas as rotas a verificar que
          nada anima. Ao vivo — o número desliza do valor anterior:
        </p>
        <div className="mt-4">
          <MotionDemo />
        </div>
        <ul className="mt-4 space-y-1">
          {[
            "O número nunca salta nem reparte de zero: TweenNum interpola do valor anterior; Odometer roda só os dígitos que mudam.",
            "Sem movimento decorativo: se não explica uma transformação, não se move.",
          ].map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Motor — GSAP + d3, a gramática intacta</h2>
        <p className="footnote mb-4 max-w-xl">
          O motor novo: o d3 só calcula escalas, marcas e formas — o SVG é
          desenhado à mão e o movimento é GSAP com os tokens{" "}
          <code className="num">--dur-*</code>/<code className="num">--ease-*</code>.
          Com prefers-reduced-motion nenhum tween arranca — o estado final é
          o estado base — e acima da dobra nada revela: o gate continua a
          ser o <code className="num">useArmado</code>.
        </p>
        <MotorDemo />
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Os dois papéis — porquê o talão não muda de cor</h2>
        <div className="grid items-start gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="footnote max-w-xl">
              Dois artefactos físicos vivem dentro do instrumento: o recibo
              de vencimento em /salario — o euro que entra — e o talão de
              compras em /impostos — o euro que sai. Um talão de papel não
              muda de cor quando apagas a luz: por isso{" "}
              <code className="num">--talao-paper</code> é fixo nos dois
              temas, e no escuro o contraste até os favorece — lêem-se como
              objectos colados no painel. Têm typesetting próprio
              (escala <code className="num">talao-*</code>, impressora
              térmica) e o carimbo SIMULAÇÃO porque são objetos gerados,
              não documentos reais.
            </p>
            <ul className="mt-4 space-y-1">
              {[
                "Papel quente fixo (#f7f1e1) — não é um nível da escala de superfícies.",
                "Picotado em cima e em baixo, código de barras, fibra — a linguagem do objecto real.",
                "São os únicos artefactos que rodam (−0,4°) — o papel está pousado, não colado ao ecrã.",
              ].map((r) => (
                <li key={r} className="footnote">
                  <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="talao-wrap w-56 justify-self-center">
            <div className="talao">
              <div className="talao-face px-5 pb-4 pt-5">
                <p className="talao-head text-center">Papel fixo</p>
                <p className="talao-sub talao-dim mt-1 text-center">
                  #f7f1e1 nos dois temas
                </p>
                <div className="talao-barras mt-4" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stack-sec">
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

      <section className="stack-sec">
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

      <section className="stack-sec">
        <h2 className="kicker mb-4">Matéria — papel, rasgo, perfuração</h2>
        <p className="footnote mb-4 max-w-xl">
          A linguagem material do site é o talão: papel, linhas impressas,
          fibra, perfurações, rasgos, carimbos. O dinheiro viaja como fita
          de papel e o que sai é arrancado. Três regras: o rasgo nunca é
          regular (passo e amplitude variam, e há fibras); a perfuração é um
          buraco — vê-se o fundo, não um ponto pintado; cada pedaço cai com
          a sua sombra.
        </p>
        <PapelDefs />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker-xs">O rasgo — determinista por semente</p>
            <svg viewBox="0 0 300 60" className="mt-3 block w-full" aria-hidden>
              <path
                d={`${arestaRasgada(300, { semente: 2026, grosseria: 0.6 })} L300,60 L0,60 Z`}
                fill="var(--talao-paper)"
              />
              <path
                d={`${arestaRasgada(300, { semente: 2026, grosseria: 0.6 })} L300,60 L0,60 Z`}
                fill="url(#papel-tom-x)"
              />
              <path
                d={`${arestaRasgada(300, { semente: 2026, grosseria: 0.6 })} L300,60 L0,60 Z`}
                fill="url(#papel-fibra)"
              />
            </svg>
            <p className="footnote mt-3">
              A mesma semente dá o mesmo rasgo — o mesmo salário rasga igual
              entre renders. A 400 %:
            </p>
            <svg viewBox="60 -2 60 18" className="mt-2 block w-full border border-line" aria-hidden>
              <path
                d={`${arestaRasgada(300, { semente: 2026, grosseria: 0.6 })} L300,18 L0,18 Z`}
                fill="var(--talao-paper)"
              />
              <path
                d={`${arestaRasgada(300, { semente: 2026, grosseria: 0.6 })} L300,18 L0,18 Z`}
                fill="url(#papel-fibra)"
              />
            </svg>
          </div>
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker-xs">A perfuração — um buraco, não um ponto</p>
            <div className="relative mt-3">
              {/* prova de que o furo é transparente: o quadrado mark por
                  trás aparece dentro dos buracos */}
              <div
                aria-hidden
                className="absolute inset-x-8 top-1/2 h-4 -translate-y-1/2 bg-mark"
              />
              <PecaPapel
                comp={280}
                alt={34}
                semente={73}
                grosseria={0.35}
                furoY={17}
                rasgoTopo={false}
                rasgoFundo={false}
                sombra={false}
                className="relative block w-full"
              />
            </div>
            <p className="footnote mt-3">
              Os furos são máscara: o torrado atravessa-os. Espaçamento
              regular de máquina — ao contrário do rasgo, feito à mão.
            </p>
          </div>
          <div className="border border-line bg-panel px-5 py-4 md:col-span-2">
            <p className="kicker-xs">A queda — cada pedaço com a sua sombra</p>
            <div className="mt-3 flex items-end gap-6 overflow-visible px-2 pb-6">
              {[3, 7, 11].map((a, i) => (
                <div key={a} style={{ transform: `rotate(${a - 7}deg)` }}>
                  <PecaPapel
                    comp={120}
                    alt={26 + i * 6}
                    semente={a * 31}
                    grosseria={0.5}
                    angulo={a - 7}
                    altura={0.2 + i * 0.35}
                    className="block w-full"
                  />
                </div>
              ))}
            </div>
            <p className="footnote">
              Direção e desfoque derivam do ângulo e da altura de queda —
              não há sombra uniforme. Filtros só em estático; o que anima
              usa transform e opacity.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1">
          {[
            "O rasgo sai de arestaRasgada(comprimento, {semente, grosseria}) — PRNG próprio, nunca Math.random.",
            "A superfície é camadas: base, tom, fibra, espessura — pattern+gradiente, nunca filtros na tinta.",
            "O furo é máscara (o fundo vê-se) + sombra interna mínima no bordo.",
            "A sombra é por peça: sombraPeca({ângulo, altura}).",
            "Filtros só em elementos estáticos; animações em transform/opacity apenas.",
          ].map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Componentes</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Stat label="Exemplo" value="920 €" hint="salário mínimo 2026" />
          <Stat label="Variação" value={<Delta value={0.023} />} hint="preço a subir" />
          <Stat label="Variação" value={<Delta value={-0.015} />} hint="preço a descer" />
          <Stat label="Poupança" value={<Delta value={0.018} goodWhenUp />} hint="taxa a subir é bom" />
        </div>
        <Figure
          title="Figura numerada com fonte"
          source={
            <Source
              nome="Eurostat, IHPC mensal"
              url="https://ec.europa.eu/eurostat"
              serieAte="2026-08"
              recolhidoEm="2026-09-17"
            />
          }
        >
          <div className="border border-line bg-panel px-5 py-8 text-center text-muted">
            conteúdo da figura (gráfico, tabela, calculadora)
          </div>
        </Figure>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Gráficos — interrogar, um equivalente</h2>
        <p className="footnote mb-4 max-w-xl">
          Todo o gráfico e diagrama se interroga da mesma maneira:
          ponteiro, toque ou teclado — e responde num readout fixo
          (<code className="num">.chart-readout</code>) por cima, nunca
          num tooltip flutuante que tapa os dados. A régua{" "}
          <code className="num">.chart-scrub</code> dá o caminho de
          teclado: setas percorrem ponto a ponto, Home/End vão aos
          extremos, Escape limpa. O ponto activo ganha marca torrada e
          o resto recua; o readout é a única fonte — sem anúncios
          duplicados. Vê-lo a funcionar na barra do euro acima.
        </p>
        <ul className="space-y-1 max-w-2xl">
          {[
            "O elemento visual leva aria-hidden — seja <svg>, cascata ou barra proporcional.",
            "O equivalente textual é um irmão <table>: .sr-only quando é só para leitores de ecrã (FitaTalao, Cascata, Linha), visível quando já faz parte do desenho (EuroBar).",
            "Nunca role=\"img\" com aria-label E equivalente ao mesmo tempo — o leitor de ecrã anuncia a mesma informação duas vezes.",
            "O próximo gráfico nasce assim.",
          ].map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Instrumentos — o motor aplicado</h2>
        <p className="footnote mb-4 max-w-xl">
          Os seis instrumentos do observatório, com dados reais de{" "}
          <code className="num">data/derived/painel.json</code> e das fontes.
          Todos partilham o contrato: um só equivalente textual, estado
          final no SSR, revelação só abaixo da dobra via{" "}
          <code className="num">useArmado</code>.
        </p>
        <div className="space-y-6">
          <Figure
            title="Linha — Euribor por prazo"
            source={<Source nome="Banco de Portugal — BPstat" />}
          >
            <Linha
              series={EURIBOR.map((pts, i) => ({
                id: `euribor-${i}`,
                rotulo: `Euribor ${["1M", "3M", "6M", "12M"][i]}`,
                cor: `var(--seq-${i + 1})`,
                pontos: pts,
              }))}
              unidade="%"
              equivalente="tabela"
              titulo="Euribor por prazo — últimos 24 meses"
            />
          </Figure>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-line bg-panel px-5 py-4">
              <p className="kicker-xs mb-2">Mostrador — desemprego vs. UE27</p>
              <Mostrador
                valor={painelSerie("une-pt-total")?.valor ?? 0}
                unidade="%"
                min={0}
                max={15}
                mediana={{
                  valor: painelSerie("une-ue27-total")?.valor ?? 0,
                  rotulo: "UE27",
                }}
                rotulo="Desemprego"
                t={painelSerie("une-pt-total")?.t ?? ""}
              />
            </div>
            <div className="border border-line bg-panel px-5 py-4">
              <p className="kicker-xs mb-2">Declive — variação homóloga</p>
              <Declive
                itens={DECLIVE_ITENS}
                rotulos={["há um ano", "agora"]}
                unidade="%"
                titulo="Variação homóloga dos instrumentos"
              />
            </div>
          </div>
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker-xs mb-2">Multiplos — quatro séries, eixo comum</p>
            <Multiplos
              series={MULTIPLOS}
              colunas={4}
              unidade="%"
              eixoComum
              titulo="Quatro séries do painel, últimos 24 pontos"
            />
          </div>
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker-xs mb-2">Barras — variação homóloga, reordenável</p>
            <BarrasDemo />
          </div>
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker-xs mb-2">Calendario — gasóleo, dias de 2026</p>
            <Calendario
              pontos={PMD_2026}
              anos={[2026]}
              unidade="€/L"
              titulo="Preço médio do gasóleo, por dia, em 2026"
            />
          </div>
        </div>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Lettering — a manchete que abre</h2>
        <p className="footnote mb-4 max-w-xl">
          <code className="num">Manchete</code> abre cada carácter de
          font-stretch 62 % → 100 %, escalonado por{" "}
          <code className="num">--stagger</code> — a Archivo tem o eixo wdth
          carregado, a compressão é real. Só corre abaixo da dobra ou com
          runKey nova; SSR e reduced-motion trazem o texto final.
        </p>
        <div className="space-y-6">
          <Manchete className="font-display text-3xl uppercase tracking-wide sm:text-4xl">
            O cêntimo mede o teu dinheiro
          </Manchete>
          <Manchete as="h2" className="font-display text-xl uppercase tracking-wide text-ink2">
            Cada número com fonte e data
          </Manchete>
          <Manchete as="p" className="footnote max-w-md">
            E em corpo de texto a mesma abertura lê-se como um sussurro —
            discreta, nunca um truque.
          </Manchete>
        </div>
      </section>

      <section className="stack-sec">
        <h2 className="kicker mb-4">Glifos — sinais desenhados à mão</h2>
        <p className="footnote mb-4 max-w-xl">
          Cinco glifos 12×12 em <code className="num">currentColor</code>,
          decorativos (aria-hidden): o significado mora no texto ao lado.
          Na mudança de tipo o traço redesenha-se em{" "}
          <code className="num">--dur-curta</code>.
        </p>
        <div className="flex flex-wrap items-end gap-8">
          {(["sobe", "desce", "euro", "pct", "fluxo"] as const).map((g) => (
            <span key={g} className="flex flex-col items-center gap-2">
              <Glifo tipo={g} className="h-6 w-6 text-ink" />
              <span className="kicker-xs">{g}</span>
            </span>
          ))}
        </div>
        <p className="footnote mt-4">
          No Delta o glifo substitui o carácter visível e o sinal fica em
          sr-only: <Delta value={0.023} /> sobe em preços,{" "}
          <Delta value={-0.015} /> desce,{" "}
          <Delta value={0.018} goodWhenUp /> sobe em poupança (bom).
        </p>
      </section>

      {/* M-22: os casos proibidos mostrados — cada um foi um defeito real
          apanhado no varrimento, com a forma correcta ao lado */}
      <section className="stack-sec">
        <h2 className="kicker mb-4">Proibido — os defeitos que já aconteceram</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-line px-4 py-3">
            <p className="kicker-xs mb-2">✗ borda serrilhada a fingir papel</p>
            <div
              aria-hidden
              className="h-10 w-full"
              style={{
                background: "var(--talao-paper)",
                clipPath:
                  "polygon(0 0,100% 0,100% 100%,97% 92%,94% 100%,91% 92%,88% 100%,85% 92%,82% 100%,79% 92%,76% 100%,73% 92%,70% 100%,67% 92%,64% 100%,61% 92%,58% 100%,55% 92%,52% 100%,49% 92%,46% 100%,43% 92%,40% 100%,37% 92%,34% 100%,31% 92%,28% 100%,25% 92%,22% 100%,19% 92%,16% 100%,13% 92%,10% 100%,7% 92%,4% 100%,1% 92%,0 100%)",
              }}
            />
            <p className="footnote mt-2">
              Zig-zag regular = decoração, não matéria. O papel rasga num
              trajecto determinista e irregular (materia.ts).
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="kicker-xs mb-2">✓ rasgo determinista + sombra própria</p>
            <div className="h-10 w-full talao-face" aria-hidden />
            <p className="footnote mt-2">
              A peça de papel tem face, fibra, espessura e sombra que a
              acompanha — vê a fita em /salario a 400%.
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="kicker-xs mb-2">✗ nome de série pintado com a cor da rampa</p>
            <p className="footnote">
              <code className="num">&lt;text fill=&quot;var(--seq-2)&quot;&gt;Euribor 12M&lt;/text&gt;</code>
            </p>
            <p className="footnote mt-2">
              Cor de rampa em texto falha AA nos dois temas (1.8–3.6:1
              medido). A cor vai no traço/tick; o nome fica em tinta.
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="kicker-xs mb-2">✓ tick com a cor da série, nome em tinta</p>
            <p aria-hidden className="num text-sm text-ink2 flex items-center gap-2">
              <span className="inline-block h-0.5 w-3" style={{ background: "var(--seq-2)" }} />
              Euribor 12M — 2,95 %
            </p>
            <p className="footnote mt-2">
              A legibilidade nunca depende da rampa — a cor é redundância,
              não o único canal.
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="kicker-xs mb-2">✗ duração inventada fora da gramática</p>
            <p className="footnote">
              <code className="num">animation: x 420ms ease</code> — 420ms não
              significa nada na gramática. Toda a duração é um dos quatro
              tokens; toda a curva é um dos quatro easings.
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="kicker-xs mb-2">✓ duração = significado</p>
            <p className="footnote">
              <code className="num">--dur-media var(--ease-lin)</code> — a
              chaveta que mede a base tributável: transformação explicada,
              linear porque é medição.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1">
          {[
            "Sem \"Fig. N\" onde nada remete para a figura — a legenda identifica, o número decorava.",
            "Sem aliases --color-seq-* em SVG inline: @theme inline só emite a var quando há utilidade — em fill/stroke usa-se --seq-* directo.",
            "Sem tinta de tema sobre papel fixo — o papel tem a sua tinta (--talao-ink, papel-sai-tinta, papel-fica-tinta).",
            "Sem número herói vazio à espera de JS — o SSR traz o valor final.",
          ].map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
