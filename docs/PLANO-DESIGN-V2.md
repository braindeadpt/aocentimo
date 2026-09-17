# PLANO-DESIGN-V2 — BRUTO «O Terminal do Salário»

Auditoria total de 2026-09-16: 3 agentes (código/UX, tokens/contraste, pesquisa
criativa externa) + auditoria visual por screenshots (todas as rotas, 2 temas).
Este documento substitui a direcção «A Conta»/«Observatório» parcial.

## 0. Diagnóstico — porque parece "feito por IA"

1. **Uniformidade de template**: todas as páginas usam kicker→manchete→lede→figuras
   na mesma geometria. Nenhuma página tem uma *forma própria*.
2. **A premissa não está no UI**: "seguir 1 €" é texto; o euro não é personagem.
3. **Sem tensão nem revelação**: os números estão todos à vista à chegada — nada
   se desenrola, pergunta ou surpreende.
4. **Micro-tipo ad-hoc**: 6 tamanhos entre 0.62–0.72rem para a mesma função;
   ~20 eyebrows inline divergentes.
5. **Falhas reais de contraste e foco** (ver §2 P0) — o selo de evidência
   (a promessa central) é o texto com pior contraste do site.
6. **Inputs quase invisíveis**: `bg-paper`+`border-line` sobre fundo paper;
   `focus:outline-none` destrói o focus ring em todos os simuladores.
7. Motion subtil existe mas não há **um momento de assinatura** orquestrado.

## 1. Direcção consolidada — «O Terminal do Salário»

Identidade: instrumento público de leitura do dinheiro. Nem jornal, nem app,
nem terminal Bloomberg genérico — um instrumento inventado que "podia ter
existido" (lição Poolsuite). Duas escalas de leitura:

- **Micro**: o euro como unidade viva que atravessa estações e encolhe.
- **Macro**: os painéis de telemetria (dados oficiais com fonte+data).

### Decisões fixas

- **Uma cor por credor**, constante em todo o site:
  Estado=`accent` (vermelhão) · Tu=`keep` (verde) · Banco=`accent-ink`/4ª cor ·
  Fonte/evidência=`mark` (torrado, nunca decoração).
- **Radius 0 em todo o lado** — o site é documento/instrumento.
- **Dupla tipográfica**: Archivo expandido (display) + Space Mono (dados) +
  Space Grotesk (UI) + Source Serif (só lede/prosa editorial).
- **Motion nativa primeiro**: CSS scroll-driven (`animation-timeline`),
  view transitions, `@starting-style`. GSAP só se a CSS não chegar.
- **`prefers-reduced-motion`** = estado final, não animação atenuada.

### Técnicas roubáveis adoptadas (da pesquisa)

1. **Odometer do euro** — dígitos mecânicos que drenam por dedução
   (assinatura principal; substitui CountUp nos pontos-chave).
2. **Sticky scrollytelling com morfismo** — home: um gráfico persistente que
   transita escada→barra→detalhe por steps (`position:sticky`+IntersectionObserver).
3. **Guess-first** — "quantos cêntimos ficam de 1,00 €?" antes de revelar
   (padrão NYT You Draw It; gancho emocional provado).
4. **Visual semantics do talão** — a página /salario renderiza um recibo de
   vencimento real: perfuração lateral, mono, carimbo "RETIDO", perfuração
   de fim. O documento *é* a interface.
5. **Kinetic type = dado** — o peso/largura da variable font acompanha o valor
   retido (`animation-timeline: view()`).
6. **Labels de instrumento** — `RETIDO`, `LIQUIDADO`, timestamps nos painéis.
7. **Dithering/halftone** — substitui o grão: textura Bayer via SVG feTurbulence
   já existente, reforçada em cartões-chave (sem WebGL — tempero, não refeição).

## 2. Saneamento — P0 (defeitos reais, antes de qualquer estética)

| # | Defeito | Fix |
|---|---|---|
| P0.1 | `muted` falha AA nos dois temas (3,2:1 / 4,3:1) | claro→`#6f6a58`, escuro→`#8f8878` |
| P0.2 | `.btn-primary` dark: `#faf9f4`/`#ff6133` = 2,8:1 | `color: var(--paper)` |
| P0.3 | `focus:outline-none` em ~14 inputs | `.field` com `focus-visible` em mark |
| P0.4 | `/estilo` documenta palete morta | reescrever p/ tokens vivos + dark |
| P0.5 | Módulos 02/03 trocados (inflação/impostos) | alinhar à numeração da home |
| P0.6 | `metodologia` tabela sem overflow-x | wrapper |
| P0.7 | Ticker reduced-motion corta itens (overflow hidden) | `overflow-x:auto` no media query |
| P0.8 | `data-theme-anim` nunca removido (transições !important eternas) | remover attr após 350ms; excluir em reduced-motion |
| P0.9 | CountUp SSR renderiza "0 €" | SSR valor final, animar só no cliente |
| P0.10 | Print em dark fica ilegível (tokens não revertidos) | `:root` claro dentro de `@media print` |
| P0.11 | EuroBar accent-ink + texto paper falha AA dark | `texto:` obrigatório ou contraste auto |
| P0.12 | LineChart: série vazia crasha; rect width<0 (✓ já corrigido) | guarda "sem dados" |

## 3. Sistema — P1 (consistência que escala)

- `.eyebrow` única (0.65rem/0.16em) + `.eyebrow-sm` (0.62rem/0.14em);
  substituir ~20 inline. `.body-copy` para o `text-[0.95rem]` repetido ×12.
- `<Field>` componente (label+input+hint) — mata o inputCls duplicado ×14.
- `<EmptyState>` único ("dados indisponíveis — a recolher") — a regra nº1
  merece um componente.
- `aria-live="polite"` nos painéis de resultado de todos os simuladores.
- `sr-only` data-table em `Fluxo` e `LineChart` (padrão `Cascata`).
- Nav: `aria-current` na página activa; `<details>` mobile fecha em
  route-change/Escape/outside-click; skip-link.
- `Logo` com `useId()`; `not-found.tsx`; `Delta` neutro p/ 0.
- Fiscal hardcoded → JSON: IAS em SimuladorDesemprego/IrsJovem,
  TSU em Fluxo/CalculadoraSalario.
- Eliminar mortos: `.srcmark`, `--warn`, `--accent-soft`, `--keep-soft`,
  `--font-body`, `Stat`, imports mortos, `Logo variant="paper"`,
  props mortas `EuroBar.texto/.unidade`, strings mortas em pt.json.
- `DecomposicaoFuel` recebe último preço DGEG real como default;
  `SimuladorPrestacao` recebe Euribor real (como SimuladorCasa já faz).
- `inflacao`: CP01 em falta → "—", nunca CP00 disfarçado.
- Copy das páginas: manter inline (copy editorial = autor) mas apagar
  chaves mortas; documentar a decisão em AGENTS.

## 4. Assinatura — P2 (o que ninguém mais tem)

### 4.1 Home reestruturada — «A viagem de 1 €»
1. Hero: manchete + **guess-first** ("De 1,00 € que a empresa gasta, quantos
   cêntimos chegam ao teu bolso?" — input/range → revelar a escada).
2. Escada do euro (Fluxo waterfall — já existe) como gráfico **sticky**;
   scroll revela anotações por degrau (sticky scrollytelling CSS+IO).
3. Odometer: "1,00 €" drena por estação ao longo do scroll.
4. Capítulos: manter a inversão de tinta (melhor microinteração do site).
5. Manifesto.

### 4.2 /salario — «O Recibo»
- O resultado renderiza como **talão de vencimento físico**: perfuração
  lateral (mask-image zigzag), linha tracejada de corte, carimbo RETIDO
  por item, total LIQUIDADO. Inputs acima como "formulário de emissão".

### 4.3 /dados — «O Quadro de Instrumentos»
- Painéis com labels de estado (`EM DIA`/`ATRASADO`/`A RECOLHER`),
  timestamps visíveis, grid de instrumentos. Euribor chart com rótulos
  corrigidos (✓ fix já aplicado).

### 4.4 View transitions entre páginas
- `<ViewTransition>`/CSS cross-document onde suportado; fallback instantâneo.

### 4.5 Kinetic type na manchete
- `font-variation-settings` do Archivo animado por `view()` no primeiro
  viewport — a palavra "DINHEIRO" emagrece ao descer (metáfora: é comido).

## 5. Execução — fases com gate visual

| Fase | Conteúdo | Verificação |
|---|---|---|
| D0 | §2 P0 completo | screenshots 2 temas + lint/typecheck |
| D1 | §3 sistema | idem + E2E |
| D2 | §4.1 home (guess-first + sticky + odometer) | screenshot sequence scroll |
| D3 | §4.2 /salario recibo + §4.3 /dados | screenshots |
| D4 | §4.4-4.5 transitions+kinetic; gates completos | `npm run ci` |

Regras: nada de fade-up genérico; cada animação com propósito nomeado;
testar claro E escuro E reduced-motion E mobile em cada fase;
cada fase termina com screenshots revistos antes da seguinte.
