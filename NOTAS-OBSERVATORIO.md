# NOTAS — Observatório

Registo de execução do PACK-OBSERVATORIO. Uma entrada por milestone.

## A-01 — ingest resiliente (2026-09-20)

- `scripts/ingest/_http.ts`: `fetchJson` com timeout 20 s
  (`AbortSignal.timeout`), 3 tentativas, backoff 1 s·2^n e log por
  tentativa. `ResultadoFonte` = `{ok, docs}` | `{ok, erro}` — as fontes
  nunca lançam para o orquestrador.
- `index.ts`: isola falhas por fonte; grava `data/meta/ingest-log.json`;
  sai com 1 só se TODAS as fontes do modo falharem. `AOC_FALHAR=<fonte>`
  força falha para teste de aceitação (documentado no cabeçalho).
- `sources.json` só actualiza ids de fontes que correram bem — a entrada
  anterior mantém-se nas que falharam.
- Zod nos três fornecedores (Eurostat ganhou `jsonStatSchema` mínimo).
- Workflows: `concurrency: dados`, `git pull --rebase` antes do push,
  `issues: write` + github-script: em falha abre/comenta issue
  «Ingest … falhou — data» com label `dados`; em sucesso fecha as abertas
  desse título.
- Aceitação: `AOC_FALHAR=dgeg tsx scripts/ingest/index.ts --daily` →
  Euribor gravou (12 séries), exit 0, log regista a falha.

## A-02 — séries novas + painel (2026-09-20)

- 8 séries Eurostat (§1) em `runEurostat`, `sinceTimePeriod=2000`,
  meta.frequencia própria. `serieAte` em ISO (fim do período) +
  `rotuloAte` com o rótulo Eurostat ("2026-Q1", "2025-S2").
- Guarda de dimensões: falha ruidosa se vier dimensão fora do filtro.
  `nrg_pc_204` devolve `siec` sempre fixado a `E7000` — declarado em
  `dimsFixas` só nessa série (verificado ao vivo; size=1).
- freshness: SLA em períodos próprios (mensal 2, trimestral 2,
  semestral 2 — §1); granularidade `semestre` nova; `esperadoAte` sai em
  ISO de fim de período. `folgaPeriodos` na /metodologia passou a
  índice-de-período (aceita "2026-08", "2026-09-30", "2026").
- Derivados: `casa-em-salarios` (HPI ÷ LCI encadeado a 2015=100) e
  `desemprego-gap` (PT − UE27, p.p.) com meta de fontes + fórmula.
- `painel.json`: 16 instrumentos — valor, unidade curta, variação
  (abs e pct; pct=null com base ≤ 0), spark 24 pontos, estado do
  watchdog, fonte+url. Copiado para `public/api/painel.json`.
- `messages/pt.json`: bloco `series` com rótulo + descrição por série.

## D-04 — rotas temáticas (2026-09-21)

- /emprego, /habitacao, /economia criadas (figuras com fonte, sitemap,
  OG, JSON-LD). Painel já não usa `data-futuro`; excepção removida do
  `_mega-audit`.
- **COPY NOVO PARA REVISÃO DO DONO**: `messages/pt.json` blocos
  `emprego.*`, `habitacao.*`, `economia.*` (kickers, h1, ledes, notas)
  e `nav.grupoDinheiro/grupoPrecos/grupoPais`.
- O `Declive` HPI÷LCI moveu-se de /casa para /habitacao; /casa fica com
  a frase-conclusão e link.
- SiteNav reorganizado em 3 grupos com rótulo kicker; menu mobile
  (`<details>`) lista os grupos.

## D-05 — /dados catálogo completo (2026-09-21)

- `Catalogo` (src/components/instrumentos/Catalogo.tsx): 52 múltiplos
  — todas as séries numéricas das fontes + 3 derivados — com filtros
  multi (fonte/frequência/estado, aria-pressed), janela 10 a/máx,
  Flip na reordenação, rótulo-link para a página temática
  (`rotaDaSerie` em src/lib/meta.ts) ou o JSON, export «JSON» por
  célula (/api/<id>.json — api.ts exporta agora casa-em-salarios e
  desemprego-gap).
- Contadores no cabeçalho de /dados: séries · fontes · em dia · em
  falha/sem SLA (derivados contam como sem SLA — não têm SLA próprio).
- TAEG sem página temática → o rótulo abre o JSON directamente.
- **COPY NOVO PARA REVISÃO DO DONO**: `dados.*`, nomes das
  sub-divisões ECOICOP e agregados em `divisoes` (CP0111–CP0118,
  CP045, CP0722, NRG, FOOD, TOT_X_NRG_FOOD — nomes oficiais Eurostat),
  e `series.*` para euribor-1m/6m, pmd-gpl e as 8 TAEG.
- Nota lint: handlers de filtro passam por prop `onMudar` ao
  `BotaoFiltro` (o react-hooks/refs não consegue seguir props de
  componente — padrão do GrelhaPainel via contexto).

## E-01 — performance (2026-09-21)

### Causas reais encontradas e corrigidas

- `messages/pt.json` inteiro ia para o cliente: `SiteNav` (layout) e
  `Source` importavam `m` — e `Source` era importado por client
  components (`Euro`, `GrelhaPainel`), o que arrastava o JSON para o
  chunk da home. Agora: `SiteNav` recebe `nav` por prop do
  `SiteHeader` (servidor); `t` separado em `src/lib/t.ts`; `Source`
  dividido em `SourceBase` (rótulo por prop, client-safe) + wrapper
  `Source` (servidor). Resultado: `pt.json` em 0 chunks do cliente.
- `data/*.json` no cliente: `MotorDemo`/`BarrasDemo` importavam
  `painel.json`; os simuladores recebem agora medidas calculadas no
  servidor. Strings localizadas passam por props (`chart`, `txt`).
- `zod`: só em `src/lib/data.ts` (servidor) — nunca entrou no cliente.
- `date`/`Intl`: `Intl.DateTimeFormat` nativo em `format.ts` — sem
  polyfill próprio (o polyfill pesado é o chunk do Next, ver abaixo).
- `Adivinha.tsx` apagado (componente morto, importava `m` + zod).
- `next/dynamic` (ssr:true, inline por rota — um barril partilhado
  fundiria todos os instrumentos num chunk-union pior): Linha,
  Multiplos, Calendario, Barras, Mostrador, Declive, EuroBar nas
  páginas temáticas; `Catalogo` em /dados; `Euro`+`Manchete` e demos
  em / e /estilo. Nota honesta: com ssr:true o Next pré-carrega os
  chunks para hidratação — os bytes continuam a chegar antes do
  `load`, o «inicial» medido quase não desce por isto; ganha-se
  granularidade de cache/parse, não bytes.
- Fontes: `next/font` com `subsets:["latin"]`, `display: swap` —
  5 woff2 preloaded (4 famílias usadas acima da dobra; Space Mono tem
  2 pesos). OG images: todas ≤ 53 KB (17 ficheiros).
- `browserslist` moderno experimentado: sem efeito — o chunk de
  polyfills é emitido incondicionalmente pelo Next/Turbopack.

### Top-10 módulos do bundle partilhado (via sourcemaps temporários)

    196,0 KB  next/dist/compiled/react-dom-client.production.js
    112,6 KB  chunk de polyfills pré-compilado (URL/whatwg, Symbol,
              Array.flat — sem sourcemap, emitido pelo Next)
     22,6 KB  react-server-dom-turbopack-client.production.js
     21,7 KB  next/src/client/components/segment-cache/cache.ts
     13,1 KB  segment-cache/scheduler.ts
     10,2 KB  router-reducer/ppr-navigations.ts
      7,6 KB  react.production.js
      6,4 KB  next/src/lib/constants.ts
      6,3 KB  segment-cache/navigation.ts
      5,4 KB  app-router.tsx

Código nosso no partilhado: ~10 KB (SiteNav 3,6 KB + layout). O piso
medido (/metodologia, sem instrumentos) é **459 KB** — ou seja, o alvo
de 450 KB inicial é impossível neste stack sem sair do Next 16:
o framework + polyfills sozinhos passam o orçamento. O que sobrou
acima do piso por rota são os instrumentos de cada página.

### JS inicial por rota — antes → depois (KB, wire)

    /            698 → 531      /emprego    547 → 566
    /salario     521 → 502      /habitacao  582 → 527
    /impostos    570 → 559      /economia   544 → 528
    /inflacao    548 → 532      /dados      545 → 528
    /credito     580 → 533      /estilo     586 → 551
    /casa        501 → 555      /sobre      558 → 531
    /irs         512 → 493      /metodologia 550 → 459
    /trabalho    509 → 490
    /poupanca    596 → 504
    /precos      555 → 538

(Valores «depois» do `_js-por-rota` sobre o build final. O Turbopack
refaz as fronteiras de chunks a cada build — variações ±20–60 KB entre
builds idênticos; a tendência real: pt.json/data fora do cliente,
home −167 KB. /casa e /emprego mediram pior — fusão de chunks, não
peso novo: os módulos são os mesmos.)

### LCP/CLS/AA (sweep final)

- AA: 0 falhas nos dois temas (42 páginas).
- LCP: 280–884 ms (máx. /irs 884, /precos 856).
- CLS: 0–0,068 excepto /aprender/limite-deducoes 0,188 (pré-existente,
  fora do âmbito — anotado para revisão).
