# Design system — AO CÊNTIMO

> Referência escrita do sistema vivo em `/estilo`. Os tokens são a
> fonte de verdade (`globals.css`); este documento fixa os contratos.

## Identidade

Escuro por omissão («o instrumento»), claro = «o documento» (papel
milimetrado). Mono editorial (`--font-mono`) para números e rótulos;
Archivo (display, eixo `wdth` animável); Source Serif 4 para ledes;
Space Grotesk UI. Elevação em 4 níveis (`--floor` → `--panel` →
`--overlay`), sombras próprias por nível.

## Instrumentos (`src/components/instrumentos/`)

| Componente | Quando usar | Contrato |
|---|---|---|
| `Linha` | série temporal | eventos ligados à fonte; banda mín–máx + mediana tracejada; scrub teclado/rato; equivalente = tabela |
| `Mostrador` | uma taxa | arco 240°, **escala fixa declarada**, traço por unidade, extremos em `10px --muted`; referência fora da escala → só texto |
| `Multiplos` | N séries comparáveis | eixo comum; linha do zero tracejada se cruza; `janela` (anos) + «10 a · máx» `aria-pressed`; rótulo ellipsis+title |
| `Calendario` | diário | quantis reais na legenda; `role=grid`, setas + `aria-valuetext`; equivalente = médias mensais |
| `Barras` | comparação discreta | negativos em `--accent` |
| `Declive` | antes/depois | rótulos afastam-se sem colidir |
| `Catalogo` | /dados | filtros multi `aria-pressed`, Flip na reordenação, link → página temática ou `/api/<id>.json` |
| `Spark`/`Odometer`/`Glifo` | micro | valor final no SSR; animam só ao entrar ou em mudança |

## Painel (`src/components/painel/`)

Grelha 12 colunas de `InstrumentoPainel` — cabeçalho = `<button
aria-expanded>` ≥ 44 px. Expansão Flip para `grid-column: 1/-1` com
`Expandido` (selector de período + `Linha` + descrição + fonte +
«página →»). Um expandido de cada vez; Escape fecha e devolve o foco;
`#painel=<id>` nasce expandido sem tween. A tabela sr-only traz todas
as leituras no SSR.

## Storytelling «o teu euro» (`Euro.tsx`)

Pie com sector restante das 12h (contorno `--ink`, fill `--panel`);
corte = wedge `--accent` que cai na régua como segmento ∝ cêntimos;
passo 3 «chega à conta» = marcador na fronteira corte/resto +
troço restante `--keep` 30 %; passo 5 fixa `--keep` com «ficam-te N c»
no centro. Régua com ticks a cada 10 c. `<768` e reduced-motion =
`<ol>` visível (é o equivalente, não fallback).

## Contrato de motion

- GSAP só via `carregarGsap()` (dynamic import memoizado); nunca
  `import gsap` estático.
- Só corre se `motionActiva()` — reduced-motion nem descarrega o chunk.
- Nada acima da dobra anima ao carregar; SSR nasce no estado final.
- Durações = 4 tokens (`--dur-micro|curta|media|longa`), curvas = 4
  easings; valores lidos por `dur()`/`ease()` — nunca números soltos.
- `prefers-reduced-motion` = estado final imediato, universal
  `!important` em CSS + gate `motionActiva()` em JS.
- Número nunca espera pela animação; valor sempre legível.

## Períodos

Sempre `fmtPeriodo(t)` — `2026-Q1`→«1.º trim. 2026», `2025-S2`→«2.º
sem. 2025», `2026-08`→«ago 2026», ISO→«17 set 2026», ano→«2026».
Proibido mostrar `YYYY-Qn`/`YYYY-Sn` ao utilizador.

## Proibido (defeitos reais — todos já aconteceram)

- ✗ rótulo flutuante a meio do ecrã — o euro fica na moeda ou na
  régua, nunca no ar (fix pós-D-03).
- ✗ escala auto no mostrador — a escala é fixa e lê-se (traços +
  extremos); o drama vem do dado (fix pós-C-01).
- ✗ animação acima da dobra ao carregar — teste e2e cobre todas as
  rotas.
- ✗ borda serrilhada a fingir papel; cor de rampa em texto; duração
  fora da gramática; «Fig. N»; aliases `--color-*` em SVG inline;
  número herói vazio à espera de JS.
