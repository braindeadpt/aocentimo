# PACK OBSERVATÓRIO — de arquivo a instrumento vivo

> Plano de execução. Decisões do dono (2026-09-20): evoluir a identidade
> actual (escuro, instrumento + papel, mono editorial); motor GSAP + d3;
> alargar dados (Eurostat/INE/BdP) e páginas; **home = painel vivo**.
> Objectivo: peça de currículo — único em Portugal, nível profissional,
> sem cara de IA. Regra nº1 mantém-se: nunca inventar dados.

## 0. Diagnóstico (o que muda e porquê)

| Camada | Hoje | Alvo |
|---|---|---|
| Gráficos | SVG artesanal (`LineChart`, `Spark`, `EuroBar`) — correcto, mas plano | Família de instrumentos com escalas d3, transições GSAP, interrogáveis, cada um com assinatura própria |
| Home | Editorial, 6 capítulos | **Painel** na primeira dobra (8 instrumentos, hierarquia por importância) + storytelling scroll abaixo |
| Lettering | Archivo `wdth` estático | Manchetes cinéticas (SplitText sobre o eixo `wdth`), glifos SVG desenhados (▲▼€%) |
| Dados vivos | 41 séries, 3 fontes, `fetch` sem timeout/retry, ingest tudo-ou-nada, `git push` sem rebase | 48+ séries, fetch resiliente por fonte, falha isolada, issue automática, push com rebase |
| Alcance | inflação, Euribor, TAEG, combustíveis, fiscal | + desemprego (total/jovem), preços da habitação, PIB, custo do trabalho, confiança, electricidade |
| Rotas | 12 temáticas | + `/emprego`, `/habitacao`, `/economia` |

Invariantes que **não** se tocam: paleta de papel fixa; tokens de movimento;
reduced-motion = estado final imediato; nada acima da dobra anima ao carregar;
SSR traz o valor final; um equivalente textual por gráfico; AA nos dois temas;
PT-PT; sem gradientes/glass/cards idênticos.

## 1. Fontes novas — filtros exactos (verificados 2026-09-20)

Base: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/`

| id | dataset | filtros | freq | SLA | último visto |
|---|---|---|---|---|---|
| `une-pt-total` | `une_rt_m` | `geo=PT&s_adj=SA&age=TOTAL&unit=PC_ACT&sex=T` | mensal | 2 meses | 2026-08 = 5,7 % |
| `une-pt-jovem` | `une_rt_m` | `geo=PT&s_adj=SA&age=Y_LT25&unit=PC_ACT&sex=T` | mensal | 2 meses | 2026-08 = 20,1 % |
| `une-ue27-total` | `une_rt_m` | `geo=EU27_2020&s_adj=SA&age=TOTAL&unit=PC_ACT&sex=T` | mensal | 2 meses | comparador |
| `hpi-pt` | `prc_hpi_q` | `geo=PT&purchase=TOTAL&unit=I15_Q` | trimestral | 2 trimestres | 2026-Q1 = 290,98 |
| `pib-pt-homologo` | `namq_10_gdp` | `geo=PT&na_item=B1GQ&unit=CLV_PCH_SM&s_adj=SCA` | trimestral | 2 trimestres | 2026-Q2 = 2,5 % |
| `confianca-pt` | `ei_bsco_m` | `geo=PT&indic=BS-CSMCI&s_adj=SA&unit=BAL` | mensal | 2 meses | 2026-08 = −20,4 |
| `lci-pt-homologo` | `ei_lmlc_q` | `geo=PT&indic=LM-LCI-TOT&nace_r2=B-S&s_adj=SCA&unit=PCH_SM&p_adj=NV` | trimestral | 2 trimestres | 2026-Q1 |
| `elec-pt-domestico` | `nrg_pc_204` | `geo=PT&nrg_cons=KWH2500-4999&tax=I_TAX&currency=EUR&unit=KWH` | semestral | 2 semestres | 2025-S2 = 0,2435 €/kWh |

Regra de ingestão: se a resposta tiver mais de uma categoria numa dimensão
não-temporal, **falhar ruidosamente** (nunca escolher a primeira). Todas com
`sinceTimePeriod` amplo (2000) para série histórica completa.

Derivados honestos (só razões entre séries oficiais, nunca estimativas):
- `casa-em-salarios`: HPI deflacionado pelo LCI → «a casa cresce X vezes mais depressa do que o custo do trabalho desde 2015» (índices, base 2015 = 100).
- `desemprego-gap`: PT − UE27, mensal.

## 2. Milestones

> **Estado: Fases A–E concluídas (2026-09-21).** Cada milestone tem o hash do commit.

Cada milestone: gates verdes (`lint typecheck test:unit validate:data build test:e2e`) → commit → próximo. Notas em `NOTAS-OBSERVATORIO.md`.

### Fase A — Fundações de dados (robustez primeiro)

**A-01 · Ingest resiliente** ✅ `bc0f33e`
- `scripts/ingest/_http.ts`: `fetchJson(url, {timeout: 20s, retries: 3, backoff: 1s·2^n})` com `AbortSignal`; log estruturado por tentativa. Usado por todas as fontes.
- Isolamento por fonte: cada `run*` apanha o seu erro, grava o que conseguiu, devolve `{ok, erro}`; o `index.ts` só sai com código ≠ 0 se **todas** falharem. Fontes que falharam ficam registadas em `data/meta/ingest-log.json` (última tentativa, erro, série anterior mantida).
- Workflows: `concurrency: {group: data, cancel-in-progress: false}`; antes do push `git pull --rebase origin main`; em falha do job abrir/actualizar issue «ingest falhou» via `actions/github-script` (label `dados`), fechar quando volta a correr bem.
- Zod nos payloads Eurostat/BPstat/DGEG (já há zod).
- Teste unitário de `_http.ts` (retry, timeout, backoff) com servidor fake.
- Aceitação: simular falha de DGEG → Euribor grava, job passa com aviso, log regista.

**A-02 · Séries novas** ✅ `39330e0`
- Adicionar as 8 séries da §1 ao `runEurostat` (mensal) — as trimestrais/semestrais correm no job mensal também.
- `freshness.ts`: suporte a `trimestral` e `semestral` com os SLA da tabela; testes.
- `data/derived/painel.json` (novo, gerado no `derive`): por série → `{id, rotulo, valor, unidade, t, variacao: {abs, pct, periodo}, spark: últimos 24 pontos, estado, fonte, url}`. **A home lê só este ficheiro.**
- Derivados `casa-em-salarios`, `desemprego-gap` em `data/derived/`.
- `messages/pt.json`: rótulos e descrições de cada série (PT-PT, uma frase que explique o que mede e o que não mede).

### Fase B — Motor de visualização

**B-01 · Motor** ✅ `a27c356`
- `npm i gsap @gsap/react d3-scale d3-shape d3-array d3-interpolate` (+ types). GSAP registado uma vez em `src/lib/motion/gsap.ts` com `gsap.matchMedia()` — em reduced-motion, todos os tweens têm `duration: 0`. Durações lidas dos tokens CSS (`--dur-*`) em runtime — uma fonte de verdade.
- `src/lib/viz/`: `escalas.ts` (tempo PT, linear com «nice» em €/%), `eixos.ts` (ticks em PT-PT: «jan 24», «2,5 %»), `formas.ts` (linha/área/step com `curveMonotoneX`), `cores.ts` (rampas `seq`/`dink` já existentes). Testes unitários.
- `/estilo`: secção «Motor» com uma linha, uma área, um eixo — e o contrato reduced-motion demonstrado.

**B-02 · Família de instrumentos** ✅ `9d2c193` (SVG desenhado por nós; d3 só calcula)
| Instrumento | Uso | Assinatura |
|---|---|---|
| `Linha` | séries temporais (substitui `LineChart`) | DrawSVG ao entrar; eventos anotados com ligação à fonte; scrub teclado/rato; banda de contexto (mín–máx histórico) |
| `Mostrador` | uma taxa (Euribor, desemprego, inflação) | arco 240° com agulha; escala fixa e honesta (0–20 %); posição histórica (mediana dos 10 anos) marcada |
| `Calendario` | diário (combustíveis) | heatmap ano × dia, célula = €/L; tooltip; legenda contínua em `seq` |
| `Multiplos` | 12 categorias ECOICOP | small multiples 4×3, eixo comum, destaque por hover |
| `Declive` | antes/depois (PT vs UE, 2015 vs hoje) | slope chart com rótulos que se afastam para não colidir |
| `Barras` | comparações | Flip ao reordenar |
Todos: `aria-label` único + equivalente `<table class="sr-only">` **ou** `<dl>` (nunca ambos), SSR no estado final, `useArmado` para a dobra, foco visível, `--stagger` para entradas em série.

**B-03 · Lettering e glifos** ✅ `3243214` (inclui correcções pós-B-2)
- `Manchete`: SplitText por caracteres; entrada animando `font-stretch` 62→100 % (o eixo `wdth` da Archivo), nunca opacidade-de-zero; só abaixo da dobra ou em mudanças.
- `Glifo`: ▲ ▼ € % ⌁ desenhados como paths (DrawSVG em mudanças de valor); substituem os caracteres em `Delta` e nos mostradores.
- `Contador`: unificar `Odometer` + `TweenNum` sobre `gsap.to` com `snap`; mantém-se «anima do valor anterior, nunca de zero».

### Fase C — Home = painel vivo

**C-01 · Painel** ✅ `f4b82a1` + fix `dbc50d2`
- Primeira dobra: grelha assimétrica 12 colunas. Inflação e Euribor em `Mostrador` grande (col-span 4 cada); gasóleo, desemprego, habitação, PIB, CA taxa base, electricidade em instrumentos médios com `Spark` + variação + `Glifo`. Cada instrumento: valor, unidade, data da leitura, selo de frescura, fonte clicável.
- Cabeçalho do painel: «Leituras a {data}» + «actualizado há X» (do `recolhidoEm`) — honesto, sem relógio falso.
- SSR: `painel.json` renderiza tudo no servidor; LCP < 1 s a 375 px; zero animação de entrada. Animações só em: hover/foco, expansão, mudança de tema.
- Ticker mantém-se sob o cabeçalho.

**C-02 · Expansão (Flip)** ✅ `3e6e5a3`
- Clicar/Enter num instrumento expande-o inline (GSAP Flip) para `Linha` completa com selector de período (1a · 5a · máx) e eventos; Escape fecha; URL `#instrumento=euribor` para link directo. Sem modal.

**C-03 · Storytelling «o teu euro»** ✅ `b984a79` + fix `624f118`
- Secção pinned (ScrollTrigger, `scrub`): uma moeda de 1 € de salário bruto atravessa a página; a cada passo de scroll uma fatia é cortada (SS, IRS, IVA médio, ISP se conduz…) com valores do motor real para o salário mediano PT. No fim: «ficam-te X cêntimos». Reduced-motion: mesma sequência como lista estática de passos.
- Capítulos actuais seguem abaixo, comprimidos.

### Fase D — Páginas com visualização-assinatura

- **D-01 `/inflacao`** ✅ `b119cc8`: `Multiplos` ECOICOP (12) + `Linha` total vs. alimentação vs. energia com banda; euro a encolher mantém-se.
- **D-02 `/credito` + `/casa`** ✅ `7d8f72a`: `Mostrador` Euribor com mediana histórica; `JuroCapital` migra para transições GSAP; `/casa` ganha `casa-em-salarios` em `Declive` 2015→hoje.
- **D-03 `/precos`** ✅ `0cbc11a` + fix `1ac4f08`: `Calendario` gasóleo/gasolina/GPL (ano corrente + anterior) + odómetro existente; evento ISP anotado.
- **D-04 rotas novas** ✅ `c869cf8` (mesma arquitectura: pergunta no H1, instrumento, equivalente, fonte, glossário):
  - `/emprego` — desemprego PT vs UE27 (`Linha` dupla + `Declive` 2015→hoje), jovens em `Mostrador`, custo do trabalho homólogo.
  - `/habitacao` — HPI PT (`Linha` com eventos: 2020 pandemia, 2022 subida juros), `casa-em-salarios`, ligação a `/casa`.
  - `/economia` — PIB homólogo (`Barras` trimestrais, negativo em `accent`), confiança dos consumidores (`Linha` com zero marcado), electricidade doméstica (`Barras` semestrais €/kWh).
  - Nav: agrupar em 3 grupos (Dinheiro · Preços · País) para não passar de 14 itens em linha.
- **D-05 `/dados`** ✅ `0bc9a5b` + fix `8692426`: observatório completo — todas as séries em `Multiplos` filtráveis por fonte/frequência/estado; export JSON por série (já existe em `/api`).

### Fase E — Qualidade e fecho

- **E-01 Performance** ✅ `78f1e08`: GSAP e d3 só em client components por rota (import dinâmico onde não há interacção acima da dobra); orçamento: JS ≤ 350 KB/rota (hoje ~500), LCP ≤ 1 s, CLS ≤ 0,05 — medir com `scripts/_sweep.mjs`.
- **E-02 Testes** ✅ `d1bd936`: e2e por instrumento (equivalente único, reduced-motion sem animação, SSR com valor, teclado), `_mega-audit` e `_overflow-sweep` como testes; unit em `viz/` e `motion/`.
- **E-03 Docs** ✅ (commit E-03): `PRODUTO.md` (novas rotas/séries), `DECISOES.md` (GSAP/d3, home=painel, séries), `design-system.md` + `/estilo` (instrumentos, glifos, manchete), `AGENTS.md` (comandos e regras de viz), `PLANO-LITERACIA-FINANCEIRA.md` §9 actualizado (escuro por omissão, GSAP adoptado).

## 3. Riscos

- **Bundle**: GSAP core ~70 KB + plugins usados; d3 módulos ~30 KB. Mitigar com imports por rota e `E-01`.
- **Eurostat muda dimensões** (aconteceu no ECOICOP 2018): zod + falha ruidosa + issue automática — nunca silêncio.
- **Séries lentas** (semestral): frescura «em dia» com dados de há 8 meses é verdade e mostra-se assim: «última leitura 2025-S2 · próxima esperada ~jun 2026».
- **Efeito wow vs. honestidade**: o mostrador tem escala fixa e mediana histórica — o drama vem do dado, não da escala.

## 4. Inspiração externa

Não é preciso media gerada (Seedance/Gemini) — tudo é procedural (SVG + dados reais), que é precisamente o argumento de currículo. Se quiseres um vídeo-teaser para o CV no fim, gravamos o próprio site com Playwright.
