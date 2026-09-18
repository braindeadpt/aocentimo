# AO CÊNTIMO — produto e sistema

> **Estado: VIGENTE — este documento é o contrato de trabalho.**
> Criado em 2026-09-18, registando a decisão do dono de 2026-09-17.
> Escrito durante a consolidação do sistema visual: onde este texto e o
> código divergirem, **o código manda** e o texto corrige-se — a verdade
> vive em `src/app/globals.css` e em `/estilo`.
>
> Substitui, como contrato, os três planos históricos:
> `PLANO-LITERACIA-FINANCEIRA.md`, `PLANO-REDESIGN-BRUTO.md` e
> `PLANO-DESIGN-V2.md` — ficam como registo do que foi planeado e do que
> sobreviveu. O porquê de cada mudança está datado em `DECISOES.md`.

---

## 1. O que é

Site público e gratuito de literacia financeira para Portugal. Responde,
com dados oficiais e simuladores rigorosos, às perguntas que nenhum site
português cruza num só lugar: para onde vai o salário (bruto → líquido,
SS, IRS, custo para a empresa), quanto subiu o que se compra (inflação
por categoria), quanto do preço é imposto (IVA, ISP, cascata), o que é a
Euribor e porque subiu a prestação, onde rende a poupança.

Não é agregador de notícias, não é comparador comercial, não dá conselhos.
Read-only: sem contas, sem tracking, sem cookies, sem input pessoal.

## 2. Direção — «instrumento vivo», escuro por omissão

Decisão do dono de 2026-09-17: o Observatório deixa de ser um arquivo e
passa a ser um instrumento vivo — mission-control do teu próprio dinheiro,
em português. (O código já chamava «Observatório» ao sistema; a decisão
reenquadra-o, não o renomeia.)

**Escuro por omissão.** `prefers-color-scheme` não distingue «sem
preferência» de «claro» — o light é o fallback universal dos browsers, e
tratar o sinal do SO como escolha escondia o escuro à maioria. Quem
prefere claro usa o toggle (persistido, visível no topo). Os dois temas
não são light+dark: são **o documento** (claro — papel de worksheet,
grelha milimetrada) e **o instrumento** (escuro — ecrã de registo, a mesma
malha em fósforo).

**O papel é a matéria dos artefactos — não do chrome.** Cada documento
fiscal é uma peça física: o recibo de `/salario`, o talão de compras em
duas peças de `/impostos`, a escritura de `/casa`, a declaração da
Segurança Social de `/trabalho`, a caderneta de Aforro de `/poupanca`,
a nota de liquidação de `/irs`. O contraste entre o instrumento frio e
o papel quente é deliberado — é a tese visual. O papel tem paleta fixa
(`--talao-paper`, `--talao-ink`, `papel-sai`/`papel-fica`) que **não
troca com o tema** — um recibo é um recibo, no escuro e no claro.

## 3. Sistema visual

Lido do código (`src/app/globals.css`, `src/app/estilo`) — não de planos.

### Elevação — quatro níveis, um instrumento

| Token | Nível | Uso |
|---|---|---|
| `floor` | 0 | fundo da página — o único nível com textura |
| `panel` | 1 | bloco de conteúdo — a chapa onde as coisas se montam |
| `raised` | 2 | resultado — o que o instrumento devolve (`shadow-raised`) |
| `overlay` | 3 | menu, tooltip — acima de tudo (`shadow-overlay`) |

No claro a elevação é sombra subtil (a superfície recua). No escuro é
luz: luminância crescente na rampa + um fio de 1 px na aresta superior —
sombra não se vê no escuro. `--recess` marca cavidades (`.field`).

Regras: textura só no `floor`; `panel`/`raised`/`overlay` nunca têm
textura; `overlay` não leva texto `muted` — só `ink`/`ink2`; o grão é
global (o vidro do instrumento); `.blueprint` (pontos) não é um nível —
é textura de zona de medição, atrás de diagramas.

### Cor — semântica, não decoração

| Token | Papel |
|---|---|
| `accent` / `accent-ink` | vermilhão-sinal — o que sai do bolso |
| `keep` | verde — **só** o que é teu (líquido, positivo) |
| `mark` | torrado — marcador funcional: fonte, citação, anel de foco |
| `up` / `down` | variação — sempre com ▲/▼, nunca só cor; `Delta` tem estado neutro |
| `warn` | aviso |
| `ink` / `ink2` / `muted` | tinta — `muted` passa AA nos dois temas |
| `line` / `line2` | hairline / regra, borda de campo |

### Tipografia

Archivo expandido (`wdth` 125) para display; Space Grotesk para a
interface; **Space Mono tabular para todos os números** (`.num`);
Source Serif 4 só para ledes/prosa editorial. Escala canónica de
micro-tipografia: `.kicker` / `.kicker-sm` / `.kicker-xs` (mono
maiúsculo, `muted` por defeito — contextos sobrepõem com `text-*`).

### Motion — gramática (M-02)

O site tem movimento porque o movimento **explica transformações** —
não porque fica bonito. Três tipos, e só dois existem:

1. **QUE EXPLICA** — a transformação dos dados acontece à vista: a fita
   rasga, a barra parte-se, a série desenha-se, o número desliza do
   valor anterior para o novo. É o motivo do movimento existir.
2. **QUE RESPONDE** — hover, foco, o gráfico a reagir ao cursor. É o
   que dá sensação de instrumento.
3. **QUE DECORA** — lista negra. Não existe.

**Quatro durações. Só estas** — uma duração é um significado:

| Token | Valor | Significado |
|---|---|---|
| `--dur-micro` | 120ms | resposta ao toque (tipo 2) |
| `--dur-curta` | 320ms | mudança de estado — tema, painel, barra que reparte |
| `--dur-media` | 600ms | transformação explicada (tipo 1) |
| `--dur-longa` | 1200ms | sequência orquestrada — irmãos escalonados |

**Três curvas + linear:**

| Token | Uso |
|---|---|
| `--ease-entra` | o que chega — default |
| `--ease-sai` | o que parte |
| `--ease-rasgo` | o acto físico — elástica contida; só o rasgo |
| `--ease-lin` | só movimento contínuo (ticker); proibida em transições |

**Um escalonamento:** `--stagger` (90ms) entre irmãos — sempre o mesmo,
em cascatas, barras, sparks e odómetro.

**Orquestra de estado (M-09)** — quando um input muda, o que muda no
ecrã transita como uma coisa só: o número (`TweenNum`), a barra e a
cascata partilham o mesmo tempo — `--dur-curta` (320ms), a duração de
"muda de estado". O que é revelação ou explicação (`--dur-media`,
`--dur-longa`) não entra na resposta ao input.

**Nunca anima — três regras de código, não intenções:**

1. o número herói nunca fica ilegível durante a transição — os valores
   mudam já; só a forma (barra, segmento, dígito que desliza) transita;
2. nada acima da dobra entra com fade ao carregar — a animação de
   entrada é armada por JS apenas em elementos nascidos abaixo da
   primeira dobra (`Kinetic`, `Spark`, `LineChart` seguem esta regra);
3. nenhum estado de carregamento decorativo — não existem spinners nem
   esqueletos; o SSR traz sempre o valor final.

**`prefers-reduced-motion` = estado final imediato**, nunca animação
atenuada — corta todas as transições e animações (`!important`,
universal — uma animação nova nasce coberta). O tipo 2 mantém-se:
hover/focus não são motion. O contrato tem teste e2e que percorre todas
as rotas e falha se algum elemento animar.

O número nunca espera pela animação — o valor final está no DOM desde o
primeiro paint.

### Matéria — papel determinista (M-01)

As peças de papel nascem de `src/lib/materia.ts`: rasgo determinista
(irregular, nunca serrilhado), perfurações a sério (buracos que mostram
o fundo), sombra própria por peça. `PecaPapel` e `FitaTalao` são as
primitivas; o painel de instrumento (`Instrumento`) e o `Spark` são os
componentes únicos de leitura de séries.

### Motor de valores (M-03)

`useValorAnimado` é o único motor: interpola do valor anterior, nunca de
zero. `TweenNum` (texto) e `Odometer` (dígitos que rodam) são os dois
apresentadores; o contrato é SSR com valor final + `aria-live` num
só readout.

### Rampas sequenciais (M-04)

Séries ordinais usam `--seq-1…4` (azul-aço). Em SVG inline referem-se
sempre como `var(--seq-N)` directo — os aliases `--color-*` de
`@theme inline` só existem quando há utilidade Tailwind correspondente.
A rampa candidata `seqb` (âmbar escurecido) está desenhada em `/estilo`
à espera da decisão do dono (ver DECISOES.md — pergunta em aberto).

## 4. Intocável

- **O ¢** — o C do wordmark é o sinal de cêntimo desenhado (arco à
  cap-height + haste verde-keep); `LogoMark` é o ¢ sozinho.
- **O talão** — `/salario` renderiza um recibo físico; tem escala
  tipográfica própria (`talao-*`) porque é um documento, não chrome.
- **A semântica das cores** — verde = teu, vermilhão = sai, torrado =
  fonte/foco. Nunca decoração.
- **`radius: 0` em todo o lado** — o site é documento/instrumento.

## 5. Regras de produto — não mudaram

1. **Regra nº1: nunca inventar dados.** Fonte falha → mostra a falha
   (`—`, `EmptyState`, badge de série atrasada) — nunca um número
   plausível.
2. **Cada número tem fonte + data visíveis** (`Source` sob cada figura;
   `data/meta/sources.json` alimenta o selo de frescura).
3. **PT-PT europeu.** Proibido: usuário, tela, você, portfólio
   (portefólio), «descobre/potencia». Segunda pessoa do singular.
4. **Regras fiscais em `data/fiscal/*.json` por ano** com fonte e
   vigência — nunca hardcoded, entram por PR manual com fonte legislativa.
5. **Motores em `src/lib/engines/`** são funções puras testadas, sem UI.
6. **Sem aconselhamento financeiro** — disclaimer permanente.
7. **Copy é do dono.** Agentes propõem estrutura; não publicam texto sem
   revisão.

## 6. Stack e dados

Next.js App Router + TypeScript strict, Tailwind 4, `output:"export"`
(estático — serve-se `out/`, `next start` não funciona). Sem base de
dados: «dados como código» — `scripts/ingest` (Actions cron) →
`data/sources` + `data/derived`, validação zod, watchdog de frescura.
Gráficos SVG à medida. Deploy: GitHub Pages, domínio `aocentimo.pt`.

Gates antes de merge: `lint && typecheck && test:unit && validate:data &&
build && test:e2e`.

## 7. Referência viva

`/estilo` — tokens, tipografia, botões, selo de evidência e padrões de
acessibilidade de gráficos, ao vivo nos dois temas. Quando o sistema mudar,
`/estilo` e este documento mudam juntos.
