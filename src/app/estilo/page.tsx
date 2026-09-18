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

export const metadata: Metadata = {
  title: "Sistema de design",
  description: "Referência viva do design system do AO CÊNTIMO — tokens, tipografia e componentes.",
  alternates: { canonical: "/estilo", types: ALT_FEED },
  // indexável de propósito: é peça de portefólio, ligada do rodapé
};

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
          <div className="border border-line bg-panel px-5 py-4">
            <p className="kicker mb-3">Rampa sequencial — um só matiz</p>
            <svg viewBox="0 0 300 90" className="block w-full" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <polyline
                  key={i}
                  fill="none"
                  stroke={`var(--color-seq-${i + 1})`}
                  strokeWidth={2.5}
                  points={Array.from({ length: 13 }, (_, j) => {
                    const x = 8 + j * 24;
                    const y = 14 + i * 14 + Math.sin(j * 0.9 + i * 0.7) * 5;
                    return `${x},${y}`;
                  }).join(" ")}
                />
              ))}
            </svg>
            <div className="mt-1 flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="num text-xs" style={{ color: `var(--color-seq-${i})` }}>
                  seq-{i}
                </span>
              ))}
            </div>
            <p className="footnote mt-3">
              Euribor por prazo, escalões de IRS, anos do IRS Jovem — famílias
              ordenadas. Azul-aço (~215°), longe do vermelhão e do verde. Os
              degraus separam-se por luminância: a ordem lê-se em
              deuteranopia e protanopia porque não depende do matiz.
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
                <span key={i} className="num text-xs" style={{ color: `var(--color-dink-${i})` }}>
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
                    <stop offset="1" stopColor="var(--color-seq-1)" />
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
            <p className="kicker-xs">3 — overlay</p>
            <p className="footnote mt-2">
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
        <h2 className="kicker mb-4">Motion — transformação, não decoração</h2>
        <p className="footnote mb-4 max-w-xl">
          O motion conta uma transformação: o número desliza do valor
          anterior para o novo quando o input muda, a cascata acumula
          degrau a degrau, a sparkline desenha-se uma vez ao entrar no
          ecrã. Três durações — resposta 180ms, movimento 550ms, entrada
          900ms — e uma curva. Nada se mexe sem explicar; com
          prefers-reduced-motion, todos entregam o estado final de
          imediato. Ao vivo:
        </p>
        <MotionDemo />
        <ul className="mt-4 space-y-1">
          {[
            "dur-res 180ms — hover e interrogação; dur-mov 550ms — valores e geometria; dur-in 900ms — entrada única duma figura.",
            "O número nunca salta nem reparte de zero: TweenNum interpola do valor anterior; Odometer roda só os dígitos que mudam.",
            "Sem motion decorativo: se não explica uma transformação, não se move.",
          ].map((r) => (
            <li key={r} className="footnote">
              <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 bg-mark align-middle" />
              {r}
            </li>
          ))}
        </ul>
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
        <h2 className="kicker mb-4">Componentes</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Stat label="Exemplo" value="920 €" hint="salário mínimo 2026" />
          <Stat label="Variação" value={<Delta value={0.023} />} hint="preço a subir" />
          <Stat label="Variação" value={<Delta value={-0.015} />} hint="preço a descer" />
          <Stat label="Poupança" value={<Delta value={0.018} goodWhenUp />} hint="taxa a subir é bom" />
        </div>
        <Figure
          n={1}
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
            "O equivalente textual é um irmão <table>: .sr-only quando é só para leitores de ecrã (Fluxo, Cascata, LineChart), visível quando já faz parte do desenho (EuroBar).",
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
    </div>
  );
}
