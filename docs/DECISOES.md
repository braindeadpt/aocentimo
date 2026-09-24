# DECISÕES — registo datado (ADR)

> **Estado: VIGENTE — é o registo corrente de decisões do produto.**
> Criado em 2026-09-18. Uma entrada por decisão, em ordem cronológica.
> Entradas não se apagam nem se reescrevem: uma decisão superada fica
> registada e a entrada que a substitui refere-a. Fontes: os planos em
> `docs/` (hoje históricos), o `git log` e decisões do dono comunicadas
> em sessão. O que não tiver fonte verificável fica em «Perguntas em
> aberto» — um ADR inventado é pior que um ADR em falta.

---

## 2026-09-16 — Dados como código, sem base de dados

**Contexto.** Site público de dados oficiais e simuladores; orçamento 0 €;
autor único; máxima automação.
**Alternativas.** Supabase free tier; CMS.
**Escolha.** Séries e regras como JSON versionado no repo (`data/`),
ingerido por GitHub Actions; sem base de dados (PLANO-LITERACIA §4.1–4.2).
**Consequência.** Auditável em git, custo €0, rollback por `git revert`; o
pipeline regenera derivados. Uma BD adicionaria estado, manutenção e o
free tier pausa projetos inativos. Reavaliar se algum dia houver contas
ou dados gerados pelo próprio site — nessa altura Supabase volta à mesa.

## 2026-09-16 — Regras fiscais por PR manual, nunca scraped

**Contexto.** Não há API para legislação (escalões, retenção, IVA, TSU).
**Alternativas.** Scraping de tabelas publicadas; API fiscal de terceiros
(não existe).
**Escolha.** `data/fiscal/*.json` curado à mão a partir do DR/AT/OE, por
ano, com `fonte` e `vigência` declaradas; entrada sempre por PR com fonte
legislativa (PLANO §5.5, REDESIGN §9).
**Consequência.** Dado correto e defensável — e é a parte do projeto que
não é automática por desígnio (ver «Estado da automação» no fim).

## 2026-09-16 — Gráficos SVG à medida, sem ECharts

**Contexto.** O plano master tinha escolhido Apache ECharts para séries
financeiras densas.
**Alternativas.** ECharts (~1 MB de bundle para gráficos usados a 10 %);
Chart.js/Recharts (o mesmo «look genérico»).
**Escolha.** Componentes SVG próprios estilizados ao sistema (REDESIGN
§11) — referência FT/The Pudding: gráficos que *são* o design.
**Consequência.** `LineChart`, `Cascata`, `Fluxo`, `EuroBar` próprios;
bundle sem dependência de gráficos; cada gráfico nasce já no sistema
visual.

## 2026-09-16 — Nome: BRUTO (era Cêntimo)

**Contexto.** O scaffold inicial chamava-se Cêntimo (commit `9c9823d`); o
plano de redesign resolveu a inconsistência BRUTO-vs-Cêntimo.
**Alternativas.** Cêntimo; BRUTO.
**Escolha.** BRUTO — «ganho X brutos», a primeira palavra do pipeline
(REDESIGN §1; commit `07b484b`).
**Consequência.** Rename total (package, UI, docs); logótipo «O Nível».
**Superada por** a entrada «AO CÊNTIMO» de 2026-09-17.

## 2026-09-16 — Direção visual «A Conta»

**Contexto.** Auditoria de redesign com três direções candidatas.
**Escolha.** «C — A Conta»: quente, cívica, humana — papel areia, oxblood,
verde-pinheiro, torrado só funcional (REDESIGN §3).
**Consequência.** Executada nas fases 0–5 em 2026-09-16: tokens,
logótipo e todos os simuladores construídos sobre ela.
**Superada por** «O Terminal do Salário» (2026-09-17), depois de a
auditoria visual ler o resultado como template «feito por IA».

## 2026-09-16 — Sem analytics, sem cookies, sem banner

**Contexto.** Site read-only; qualquer tracking exigiria banner de
consentimento.
**Alternativas.** Analytics com banner (Plausible, GA).
**Escolha.** Zero tracking, zero cookies (REDESIGN §1).
**Consequência.** Nenhum banner; a partilha de simulações faz-se por URL
(`?bruto=…`) em vez de servidor. Perde-se telemetria de uso — aceite.

## 2026-09-17 — Export estático, publicação em GitHub Pages

**Contexto.** Site 100% read-only com dados-como-código; o REDESIGN §12.1
recomendava Vercel Hobby mantendo o build exportável.
**Alternativas.** Vercel Hobby; Cloudflare Pages; GitHub Pages.
**Escolha.** `output:"export"` + workflow de GitHub Pages com CNAME
(commit `dc1eb6b`).
**Consequência.** `next start` não funciona — serve-se `out/`; sem ISR nem
endpoints dinâmicos (a «API» é JSON estático em `public/api/`); zero
servidor = zero custo e zero superfície de ataque; migrar de host é
trivial.
**Motivo** (dono, 2026-09-18): Pages era mais prático e simples.

## 2026-09-17 — Direção «O Terminal do Salário»

**Contexto.** Auditoria total de 2026-09-16: «A Conta» executada lia-se
como template — uniformidade de geometria, euro ausente do UI, sem tensão
nem revelação (PLANO-DESIGN-V2 §0).
**Escolha.** Instrumento público de leitura do dinheiro: uma cor por
credor, radius 0, odometer do euro, talão físico em `/salario`,
guess-first na home. O próprio documento declara substituir «A
Conta»/«Observatório» parcial (V2 §1).
**Consequência.** Fases D0–D4 executadas em 2026-09-17 — saneamento AA,
escala kicker, home assinatura, talão, view transitions.
**Superada por** «instrumento vivo», escuro por omissão (2026-09-17) — o
talão sobrevive como único artefacto de papel, por decisão expressa.

## 2026-09-17 — Nome: AO CÊNTIMO

**Contexto.** O âmbito alargou-se para além do salário (impostos,
inflação, crédito, casa, poupança, preços); BRUTO ficou preso ao salário.
**Escolha.** AO CÊNTIMO — a unidade que atravessa todos os módulos é o
cêntimo; o C do wordmark é o ¢ cortado por uma haste verde (PLANO §3;
commit `3dbe581`).
**Consequência.** Tagline «seguimos o teu dinheiro ao cêntimo»; domínio
canónico `aocentimo.pt`.

## 2026-09-17 — Direção vigente: «instrumento vivo», escuro por omissão

**Contexto.** Com o Terminal do Salário executado, o dono consolidou a
tese visual numa direção nova.
**Escolha.** Mission-control do teu próprio dinheiro: o Observatório deixa
de ser arquivo e passa a instrumento vivo. **Escuro por omissão** —
`prefers-color-scheme` não distingue «sem preferência» de «claro» e o
light é o fallback universal dos browsers; tratar o sinal do SO como
escolha escondia o escuro à maioria. Quem prefere claro usa o toggle
(racional registado em `src/app/layout.tsx`). O talão de `/salario` é o
único artefacto de papel: o contraste entre o instrumento frio e o
recibo quente é deliberado e é a tese visual.
**Consequência.** Sistema de elevação em quatro níveis
(floor/panel/raised/overlay) a substituir paper/surface; temas tratados
como «documento» e «instrumento», não light+dark. Em construção à data
desta entrada.

## 2026-09-18 — Domínio canónico aocentimo.pt

**Contexto.** O plano previa `aocentimo.js.org` (subdomínio comunitário
pendente de aprovação) com `eu.org` em paralelo;
`aocentimo.duckdns.org` serviu de temporário (commit `d37fa8a`).
**Escolha.** `aocentimo.pt` como fonte única de verdade — CNAME,
canonical, OG e sitemap convergem (commit `9725e85`).
**Consequência.** Um domínio só em todo o lado; o e2e verifica
canonical = CNAME. O pedido `aocentimo.js.org` continua pendente mas está
decidido que morre — o `.pt` é o canónico definitivo (dono, 2026-09-18).

## 2026-09-17 — Vídeo educativo: avaliado e adiado

**Contexto.** Vídeo como formato editorial complementar ao texto.
**Escolha.** Adiado — custo editorial recorrente não justificado face às
prioridades atuais (decisão do dono, 2026-09-17; não há registo no repo —
fonte: comunicação em sessão).
**Consequência.** Conteúdo editorial continua em texto
(glossário/artigos).
**Critério de retorno** (dono, 2026-09-18): volta se for automatizável —
não há tempo disponível para produção editorial recorrente de vídeo.

---

## Estado da automação (registo de 2026-09-18)

O pipeline de dados públicos é automático: `ingest-daily` (cron 06:00 UTC,
Euribor + DGEG) e `ingest-monthly` (dia 13, Eurostat/INE), com watchdog de
frescura e validação zod. **A camada fiscal nunca foi automática** — é
curadoria manual por desígnio (entrada de 2026-09-16), e o IGCP é
semi-manual (JSON curado). «100 % automatizado» nunca foi verdade nesta
camada — não por regressão, por decisão. Os inputs manuais recorrentes
são a revisão fiscal anual e a curadoria IGCP, documentados em
`data/fiscal/README.md`.


## 2026-09-19 — Noite de execução M-01…M-22 (sistema completo)

**Contexto.** O pack de noite (PACK-NOITE.md) executou o redesenho
completo: matéria, gramática, motor de valores, rampas, e o redesenho de
cada rota como artefacto documental.
**Escolhas.**

- **Papel como matéria transversal** — a decisão «o talão de /salario é o
  único artefacto de papel» (2026-09-17) fica superada: o papel passa a
  ser a matéria de todos os documentos fiscais do site (recibo, talão de
  compras, escritura, declaração SS, caderneta, nota de liquidação). O
  chrome continua instrumento — o contraste mantém-se porque o papel
  tem paleta fixa que não troca com o tema.
- **Rasgo determinista, nunca serrilhado** (`materia.ts`): zig-zag
  regular é decoração e está proibido — mostrado em /estilo §Proibido.
- **`useArmado` é a regra da dobra em código**: nasce visível → estado
  final; abaixo da dobra → anima ao entrar no viewport; reduced-motion
  → sempre final. Substitui `animation-timeline: view()` (que animava
  o já-visível) e o gate por intenção.
- **`--seq-*` directo em SVG inline** — `var(--color-seq-3)` resolvia a
  vazio em escuro: `@theme inline` só emite a var quando existe a
  utilidade Tailwind correspondente. Em `fill`/`stroke`/props de cor
  usa-se a paleta `:root` directa. Alternativa considerada: emitir todas
  as vars sem `inline` — rejeitada, muda a semântica do theme inteiro.
- **Texto nunca carrega cor de rampa** — legendas de série passaram a
  tick colorido + nome em `--ink2`. A cor é redundância, não canal único.
- **«Fig. N» removido** — nada no texto remetia para a numeração; a
  Figure fica título+fonte.
- **Nav `/trabalho`** — a rota cobre desemprego e trabalho independente;
  «Desemprego» na nav mentia metade da página. «Trabalho» bate com a
  rota e cobre os dois.
- **`scripts/_serve-static.mjs`** — `npx serve` morre a meio do e2e
  nesta máquina (≥4×); o servidor estático mínimo aguentou a suite toda.

**Consequência.** `/estilo` documenta o sistema completo com exemplos
vivos e os casos proibidos mostrados; o e2e passou de 16 para 18 testes
(AA em todas as rotas nos dois temas — medido, não presumido —,
equivalente único por gráfico, herói no HTML sem JS).

## Perguntas ao dono (em aberto — não decididas)

- **Rampa sequencial (M-04b)**: `seq` azul-aço (actual) vs `seqb` âmbar
  escurecido (proposta) — as duas estão desenhadas lado a lado em
  `/estilo` com Euribor real. Falta a decisão.
- **Copy novo da noite para revisão**: `/salario` (entrada por pergunta
  «Quanto vais receber mesmo?»), `/irs` (nota de liquidação, sequência
  IRS Jovem), `/trabalho` (declaração SS), `/poupanca` (caderneta),
  `/impostos` (talão em duas peças), `/metodologia` (quadro vivo) —
  texto novo escrito por agente, sujeito à regra «copy é do dono».
- **JS ~500KB/rota**: medido encodedBodySize sobre build estático local;
  sem análise de cobertura por rota. Vale uma sessão de dieta?
- **`npx serve` instável** — substituir o webServer do playwright.config
  por `_serve-static.mjs` permanentemente?
- **«Observatório»** — pergunta anterior continua por responder.
- **V4 · C7 — vídeos de terceiros no repositório público** (relatório §7.1):
  tirar `docs/brand/referencias/*.mp4` do repo? Recomendação: sim — movê-los
  para `referencias/` (gitignored). Apagá-los do histórico exige reescrita
  + force-push, que o AGENTS proíbe — decisão do dono.
- **V4 · moeda de pontos na home** (relatório §7.2): o campo de cêntimos
  substitui a explosão isométrica como momento da home? Recomendação: sim
  (a explosão não é proporcional); a explosão continua para estrutura.
- **V4 · história canónica do «teu euro»** (relatório §7.3): inclui a TSU
  (a partir do custo total)? Recomendação: sim — é o facto mais revelador
  do site; a Sessão 1 alinha home e `/salario`.
- **V4 · protótipo da moeda de pontos** (relatório §7.4): testar o
  conceito animado antes das sessões longas?

## Perguntas em aberto (arquivo)

- «Observatório»: o código chama assim ao sistema atual (comentário de
  `globals.css`, `/estilo`); o V2 diz que substituiu uma direção
  «Observatório» parcial. Fica por confirmar se era direção formal antes
  do V2 ou o enquadramento do plano master que o código adotou depois.

## 2026-09-21 — Fase C–E: o observatório (painel vivo, storytelling, rotas temáticas)

**Decisões do dono** (comunicadas em sessão):
- Evoluir a identidade para «instrumento/documento» escuro; adoptar
  GSAP + d3 (d3 calcula, nós desenhamos).
- Alargar dados (Eurostat 8 séries novas, BPstat, DGEG) e páginas;
  **home = painel vivo** — a primeira dobra é a grelha de leituras,
  não um herói editorial.
- Referência fora do domínio do mostrador/gráfico: não desenhar o
  tick — fica só no texto (mediana Euribor −0,08 em escala 0–6 %).
- Nav em dropdowns aceite (14 links não cabiam — 3 grupos kicker +
  Aprender).

**Decisões de agente** (registadas para revisão):
- **GSAP fora do bundle inicial**: `import("gsap")` memoizado em
  `carregarGsap()`, só com `motionActiva()` + abaixo da dobra ou
  interacção. Em reduced-motion o chunk (~150 KB) nem desce — e2e
  prova-o por interceptação de pedidos.
- **Pie do euro**: sector restante desenhado das 12h; cada corte cai
  para a régua como segmento ∝ cêntimos; «chega à conta» é marcador
  na fronteira corte/resto (não é um corte); o restante fica `--keep`.
- **Taxa de carbono incluída** nos impostos do passo 4 do euro
  (ISP+carbono+IVA — esconder ~0,17 €/L mentia o número).
- **Instrumentos por `next/dynamic` (ssr:true)** inline por rota —
  barril partilhado testado e rejeitado (funde os instrumentos num
  chunk-union que todas as rotas carregam).
- **`pt.json` fora do cliente**: client components recebem strings por
  props do servidor; `Source`/`SourceBase` partidos pelo rótulo.
- **Estados de frescura**: `em-dia/atrasada/sem-sla` — «no limite»
  não existe; derivados contam como sem SLA (verdade honesta).

**Alternativas rejeitadas**: escala auto do mostrador (drama vem do
dado); tick de referência fora da escala (distorce o eixo); rótulos
flutuantes no euro (tudo fica na moeda ou na régua); animação acima
da dobra (regra M-09 mantida); barril de dynamics (ver acima).

**Em aberto**: copy novo para revisão do dono (blocos `emprego.*`,
`habitacao.*`, `economia.*`, `dados.*`, `nav.grupo*`, sub-divisões
ECOICOP, `series.*` novas — listado em NOTAS-OBSERVATORIO.md);
«no limite» como estado de frescura futuro (aviso antes de atrasar);
o residual de ~460 KB é o piso do Next 16 — só desce mudando de stack.

## 2026-09-22 — Direcção V4: «o cêntimo como unidade» e a verdade única

**Contexto.** O relatório `referencias/V4/00-RELATORIO.md` (2026-09-22)
diagnosticou: os componentes melhoraram muito mas o produto não — a home é
uma colagem de três gerações (V1/V3), cada página repete a mesma história
com números diferentes, e os documentos canónicos estavam em deriva
(PRODUTO sem V3, DIRECAO-V3 órfã, AGENTS com rotas revertidas e regra de
movimento a colidir com o herói animado). As referências novas convergem
todas para **unidades contáveis** (pontos, traços) — e o produto chama-se
AO CÊNTIMO.

**Alternativas.** (a) Substituir a V3 por uma linguagem nova — rejeitado,
as peças V3 são boas e o relatório manda não deitar nada fora;
(b) manter a V3 e só corrigir defeitos — rejeitado, não resolve a
arquitectura («confuso/massudo») nem aproveita a unidade; (c) biblioteca
de visualização pesada para os campos de pontos — rejeitado, Canvas 2D
nativo chega para centenas de pontos a 60 fps.

**Escolha.** V4 = V3 «Ledger» + a unidade + a arquitectura:
- **Unidade:** 1 ponto = 1 cêntimo — partes de um todo em dinheiro
  desenham-se em pontos contáveis (maior resto; o texto diz o decimal).
- **Arquitectura:** três níveis em todas as páginas de conteúdo
  (1 · A resposta / 2 · Explora / 3 · Confirma) e navegação por quatro
  perguntas (O que ganhas · O que pagas · O banco · O país) + Aprender.
- **Catálogo fechado de codificações** (PRODUTO.md §5): cada tipo de
  dado tem a sua forma. Regra de ouro: isométrico = estrutura (o que é),
  pontos = quantidade (quanto é).
- **Regras visuais V4:** vermelhão só no dinheiro que sai (bruto e custo
  total neutros); raio com significado (papel 0 · instrumento 14 px ·
  controlos pílula); números heróis em Archivo tabular (Space Mono só em
  rótulos, kickers e tabelas).
- **Verdade única:** PRODUTO.md integra V3 + V4; DIRECAO-V3.md fica como
  registo com cabeçalho de estado; AGENTS.md corrige as rotas e a regra
  da dobra (nada entra com animação acima da dobra; animação ambiente só
  no herói da home, com pausa fora do ecrã/separador escondido e
  reduced-motion).

**Consequências.** Um agente que leia AGENTS → PRODUTO encontra a V3 e a
V4 sem contradições com o código. A Sessão 1 (`v4/fundacao`) corrige os
defeitos do relatório e constrói os componentes partilhados
(`CampoCentimos`, catálogo, `Cartao`/`Pagina`, nav por perguntas,
`OrbeEstado`), que **congelam** antes das sessões paralelas 2 e 3A–3D.
As decisões em aberto do relatório §7 entraram em «Perguntas ao dono»
acima.

## 2026-09-22 — A história canónica do euro (uma só, em `canonico.ts`)

**Contexto.** O relatório V4 apontou que a home e `/salario` contavam o
mesmo euro com números diferentes: a home calculava à mão
(`TSU_TRABALHADOR`, `retencaoNaFonte`, `simularSalario` — três motores,
histórias distintas) e a razão «cêntimos por euro de custo» da adivinha
saía da estimativa anual a 14 meses, não do recibo.

**Escolha.** Uma só função — `cenarioCanonico(bruto, ano)` em
`src/lib/canonico.ts` — produz o cenário de referência a partir de
`reciboMensal` (solteiro, sem dependentes, sem SA, continente). A
história começa no custo total para a empresa (bruto + TSU patronal) e
o «líquido» é sempre o recibo mensal com retenção real × 12. A média a
14 meses e a estimativa anual ficam em `/salario`, explicadas com uma
frase. A home consome `cenarioCanonico`; `/salario` parte da régua em
`BRUTO_CANONICO` e o herói é o mesmo `recibo.liquido`.

**Consequência.** Um número, uma fonte de verdade: mudar o ano fiscal ou
o caso-base muda as duas páginas de uma vez. Em aberto para o dono
(NOTAS-V4 §S1-02): se a explosão da home deve começar no custo total
(1 856 €) em vez do bruto (1 500 €) — hoje mantém-se o bruto como
moeda-mãe.

## 2026-09-23 — O motor fiscal carrega lazy: nunca no first-load de /salario

**Contexto.** S1-09 gerou a grelha canónica (`cenarios-salario.json`) e o
perfil canónico passou a ler dela por props. Ficava a questão do
simulador completo: casado, dependentes, subs. alimentação e IRS Jovem
têm dimensões não tabeláveis (o bruto do cônjuge é um número livre) e o
motor calculava no cliente — incluído no bundle inicial da rota.

**Alternativas.** (a) Cortar os controlos avançados; (b) aceitar o motor
no bundle de /salario; (c) `import()` dinâmico.

**Escolha (dono).** (c) — o motor chega por `import()` só quando um
controlo sai do perfil canónico. O first-load de /salario não o inclui
(medido com `scripts/_js-por-rota.mjs` e por inspecção dos scripts do
HTML exportado: `retencaoNaFonte`/`escalaoMarginal` só existem em chunks
lazy). Enquanto carrega, o recibo mostra o último valor calculado — a
linha canónica do bruto actual, sem saltar nem ficar em branco.

**Consequência.** `/salario` abre sem o motor nem os JSON fiscais do
motor; constantes e rótulos necessários (TSU 23,75 %/11 %, isenções do
SA e do IRS Jovem, `brutoRef`) chegam pela tabela de cenários e por
props do servidor. Quem desvia do canónico paga o custo do chunk uma
vez (~60 KB) e fica com o simulador completo.

## 2026-09-22 — Logótipo redesenhado a partir dos contornos da Archivo

**Contexto.** O wordmark anterior era texto vivo (Archivo expandido) com
um ¢ desenhado à mão no meio: dependia da fonte carregar, do espaçamento
do navegador e da linha de base — e o arco do C era mais fino e estreito
que as letras à volta. A revisão de marca de 22.09.2026
(`referencias/V4/logo/apresentacao-marca.html`) leu os contornos reais
da Archivo variável (instância wdth 125 · wght 800) e propôs duas hastes
e dois símbolos.

**Alternativas.** Haste interrompida (a construção do ¢ da Archivo —
mais fina, mas a ler-se como dois traços soltos nos tamanhos pequenos);
símbolo em moeda (perde para o azulejo a 16 px). Manter texto vivo —
rejeitado: frágil e dependente da fonte.

**Escolha (do dono, 22.09.2026).** HASTE A contínua + SÍMBOLO EM
QUADRADO (azulejo `#1B1811`, C `#F2ECDD`, haste `#63D6A4` a sangrar de
ponta a ponta, raio 22 %). `Logo.tsx` passa a ser vetor de dois `<path>`
(tinta `currentColor`, haste `var(--keep)`); `LogoMark` o azulejo de
três `<path>`; favicon/apple-icon/OG regenerados dos mesmos contornos —
a imagem OG usa a palavra em paths, não texto com a fonte.

**Regras que ficam.** A haste é sempre `--keep` (nunca `--accent` nem a
tinta); mestre `normal` ≥ 20 px de capitular, `pequeno` 12–20 px, abaixo
ou em quadrado o símbolo; área de proteção x = capitular; proibido haste
noutra cor, haste sem recorte, esticar/redesenhar letras. Os paths não
se editam à mão — regeneram-se com `scratchpad/logo/gerar-ficheiros.mjs`.
Registado em PRODUTO.md §6 «Marca»; demonstrado em `/estilo`.

## 2026-09-23 — Sistema de ícones: traço próprio, conjunto fechado

**Contexto.** Até aqui não havia sistema de símbolos — só o ¢ do
logótipo e os glifos ▲▼ do `Delta`. As referências da V4 (cartões com
ícone de traço num quadrado de contorno tracejado, controlos com
ícones) pedem um sistema partilhado antes das sessões paralelas
(1B-01). Existia ainda o `<Glifo>` 12×12 do trabalho B-03, revertido em
86a9830 — a tarefa mandava avaliá-lo antes de desenhar do zero.

**Avaliação do Glifo revertido (commit 2da28c6).** Reutiliza-se a
técnica, não o componente: `pathLength=1` + `stroke-dashoffset` em
`currentColor`, terminações redondas, `aria-hidden`. Não serve de base
directa porque: (a) grelha 12×12 — a referência pede 20×20 e as
metáforas de página precisam do espaço; (b) cinco tipos soltos
(sobe/desce/euro/pct/fluxo), não um conjunto fechado por função;
(c) é `"use client"` com `useLayoutEffect` para redesenhar numa
mudança de `tipo` — o novo gatilho é o hover/focus do controlo, que em
CSS puro não precisa de JS nenhum e serve em server components
(o `Cartao` é um). O `Glifo` era um mecanismo para o `Delta`; o
`Icone` é um sistema para o produto.

**Alternativas.** (a) Biblioteca de ícones (Lucide/Feather) — proibida
pelo brief e pela lista negra (iconografia stock); (b) glifos de texto
(▲▼, emoji) — dependem da fonte e não são desenho próprio; (c) recuperar
o `Glifo` tal qual — os três motivos acima.

**Escolha.** `Icone`/`IconeEmblema`: 25 desenhos à mão na grelha 20×20,
traço 1,5 px, terminações redondas, sem preenchimento, conjunto fechado
(nome fora da lista falha). Três famílias: páginas (11), acções (9),
estado (5 — a família do `OrbeEstado` em pontos de traço).
`aria-hidden` por omissão; acções sempre dentro de controlo nomeado;
`rotulo` só para o ícone sozinho com significado próprio. O traço
desenha-se uma vez ao hover/focus do controlo (`--dur-micro` + passo
por traço, CSS puro); estático em reduced-motion. `IconeEmblema` =
quadrado de contorno tracejado no cabeçalho do `Cartao` (prop `icone`
nova, opcional — API alargada antes do congelamento das paralelas). O ¢
fica fora do conjunto: as suas posições permitidas fora do logótipo
(azulejo/`LogoMark` e o selo «1 ponto = 1 cêntimo») e proibidas (nunca
ícone, nunca unidade junto de número, nunca decoração) estão escritas
em PRODUTO.md §6.

**Consequência.** Existe uma voz de símbolos própria e fechada; um
nome novo exige tarefa de fundação. Os ▲▼ do `Delta`/`Haltere` ficam —
são sinais tipográficos de variação escritos em texto, não ícones de
controlo (pode reavaliar-se numa sessão de polimento). Folha completa
em `/estilo` §Ícones; testes unit (conjunto, aria, falha) e e2e
(folha, controlos nomeados, desenho micro, reduced-motion).

## 2026-09-23 — Lettering: fino U+202F, menos U+2212, «», e o <Valor> único

**Contexto.** Cada peça compunha número e unidade à sua maneira —
`sufixo=" €"`, `` `${n} ${unidade}` ``, `"€"` colado, NBSP do Intl —
e o sinal negativo saía como hífen ASCII. A referência 1B-02 pede os
pormenores tipográficos finos: uma ponte só, um sinal só, uma peça de
composição só. A varrida inicial também apanhou dados de geometria
SVG (`viewBox`, `points`, `d`) e a fonte do canvas — reposto; o
contracto passou a ser auditado no HTML exportado, não na fonte.

**Alternativas.** (a) NBSP U+00A0 — quebrável em alguns motores de
texto e largo demais entre número e símbolo; (b) espaço fino
tipográfico U+2009 — não é inquebrável; (c) hífen U+002D — é
pontuação, não sinal matemático; (d) cada componente compor a sua
unidade — era exactamente o defeito a eliminar.

**Escolha.** `FINO` (U+202F, NBSP estreita) entre número e qualquer
unidade-símbolo (`€`, `%`, `c`, `p.p.`, `€/L`, `€/kWh`, `/mês`) e no
agrupamento de milhares; `MENOS` (U+2212) em todo o valor negativo ou
delta — ambos exportados de `src/lib/format.ts`, que normaliza a saída
do Intl (o ICU emite NBSP largo). A composição visual é uma peça:
`<Valor>` (`.num-sign` semântico + número + `.num-unit` a ~45 % na
mesma linha de base), usada pelo `NumHero`, `Leitura`, hero de
`/salario`, `Adivinha` e demos da `/estilo`. Apresentadores animados
(`TweenNum`, `Odometer`) recebem a unidade sem espaço e põem o FINO
eles próprios — o `texto` sr-only leva o número e a unidade visível
completa o anúncio, sem duplicar. Aspas PT-PT são «…»; reticências são
«…» (U+2026); `hyphens: auto` só no corpo (`text-wrap: pretty`), nunca
em títulos (`text-wrap: balance`). Tracking passou a tokens por papel
(`--tracking-*` em `@theme`) — zero literais `letter-spacing` em CSS.
O eixo `wdth` do Archivo mantém-se como expressão estática (125
manchete / 75 monumento): o peso cinético no herói interactivo de
`/salario` foi medido mentalmente e rejeitado — `wght`/`wdth` animado
por input lutaria contra `tabular-nums` e daria shift de layout a cada
tick da régua. Auditoria: `scripts/_lettering.mjs` corre no
`npm run audit` sobre o `out/` — texto visível apenas (atributos,
`<script>`, `<code>` e geometria SVG ficam de fora), falha em hífen
numérico, espaço largo junto a unidade, aspas erradas e `...`.

**Consequência.** Existe uma ponte número→unidade, um sinal de menos e
uma peça de composição — quem compõe à mão falha a auditoria do build.
Strings de copy em `data/fiscal/*.json` seguem a mesma regra porque são
renderizadas verbatim. O FINO nunca entra em dados de máquina (paths,
viewBox, fontes de canvas, fórmulas).

## 2026-09-23 — Botões e controlos: um sistema, todos os estados (1B-03)

**Contexto.** A casa tinha `.btn`/`.btn-primary` mais peças avulsas:
checkboxes nativas nos simuladores, pills da régua próprias, botões de
ícone à mão, e nenhum padrão de «a carregar», «desactivado com razão»
ou «copiado». A referência 1B-03 pede o que distingue o premium do
correcto: um sistema único de controlos com todos os estados.

**Alternativas.** (a) `disabled` nativo — esconde o controlo da ordem
de tabulação e da árvore de acessibilidade: a razão morreria com ele;
(b) `aria-description` para a razão — o lint
(`role-supports-aria-props`) não o suporta em `button`/`link`/
`switch`/`radio`, e o suporte de AT ainda é irregular; (c) `button` +
`aria-pressed` também para o segmentado — mistura papéis: é uma escolha
exclusiva, `radiogroup` é a semântica certa; (d) tooltip novo em todos
os lados — recusado: dicas só onde já existiam (o quadro de frescura).

**Escolha.** Seis peças, uma física (pílula `--raio-controlo`, alvo
≥44 px, pressão `scale(.97)` em `--dur-micro`, foco no anel torrado
global): `Botao` (primário·secundário·terciário·ícone — `href` desenha
ligação, não botão-fingido), `Interruptor` (`role="switch"`),
`Chip` (`aria-pressed`, três canais de selecção), `Segmentado`
(`radiogroup` com tabindex itinerante — setas movem foco+selecção e
saltam desactivados), `BotaoCopiar` («Copiado»/«Não copiado» num
`role="status"` residente; relativo → URL absoluta na clipboard),
`Regua` (range nativo único; presets = `Chip`; polegar com ressalto de
encaixe — `key` por nonce rearma a keyframe `--dur-micro` +
`--ease-rasgo` a cada snap no arrasto e à aterragem via
`transitionend`). Desactivado = `aria-disabled` focável + `razao`
obrigatória em `title` e **dentro do nome acessível** (texto sr-only
no rótulo ou a nota visível do interruptor) — nunca um controlo morto
sem explicação. A carregar = mini-orbe `OrbeEstado` no lugar do ícone
+ rótulo que diz o que se passa + `aria-busy`. A `.dica` usa CSS
anchor positioning com `flip-block` e fallback absoluto — e é **irmã**
da âncora (`.dica-alvo` agrupa as duas) porque um posicionado não se
pode ancorar a um elemento da sua cadeia de containing block.
`.btn`/`.regua-pill` removidos; quatro simuladores migraram as
checkboxes para `Interruptor`.

**Consequência.** Um só contrato para acção, escolha e confirmação:
todos os estados existem na mesma peça e demonstram-se em `/estilo`
(`#controlos`). `Botao`/`Chip`/`Interruptor`/`Segmentado` são client
components (onClick não serializa) sem estado próprio — server
components renderizam-nos com props serializáveis. Reduced-motion
corta pressão, deslize e ressalto; o valor final está sempre no lugar.
Cobertura: `Controlos.test.tsx` (11 unitários) + `e2e/controlos.spec.ts`
(16 casos — nomes acessíveis, switch, radios, régua por teclado,
«Copiado», dica por âncora, foco, reduced-motion).

## 2026-09-23 — Respostas do dono às perguntas da 1B (1D-02)

**Decidido pelo dono** (aplicar, não redesenhar):

1. **Voo entre páginas**: `--dur-media` (600 ms) é o tecto — nenhum voo
   passa de 600 ms.
2. **O cartão «a pergunta seguinte» viaja visível** até ao h1: o
   snapshot antigo mantém-se opaco durante todo o voo em vez de
   desvanecer rápido; o h1 novo cristaliza no fim. Reduced-motion: sem
   voo.
3. **Talão com IRS zero**: carimbo NEUTRO «Não retido» (tinta do papel
   atenuada — nunca `--accent`, que é dinheiro que sai; nunca
   `--keep`, porque um corte inexistente não é dinheiro que fica). A
   linha «0,00 € — não te toca» mantém-se. String em
   `messages/pt.json` → `salario.naoRetido`, na lista de copy a rever.
4. **Ilustração do `EstadoVazio`: FIXA** — a mesma em todo o lado; não
   criar variações.
5. **Copy novo da 1B fica como está**, marcado para revisão do dono
   (autor único) — nada se reescreve.
6. **`public/brand/logo.svg` e `public/brand/mark.svg` apagados** —
   confirmado que nada os referencia; ficam no histórico do git.

## 2026-09-23 — Sessão 4: fecho — decisões de consolidação

**Aplicado (decisões do dono da revisão de copy, generalizadas ao site):**

1. **«sem SLA» → «sem prazo» em todo o site** — `chart.semSla`,
   `leitura.semSla`, o mural da `/metodologia` (legenda, folga e
   resumo) e a legenda do orbe em `/estilo`. O id de estado
   `sem-sla` e a chave `semSla` ficam — são vocabulário interno,
   não copy.
2. **Percentagens com espaço fino (U+202F) onde faltava** — talão de
   `/salario` («SEG. SOCIAL 11 %»), `SimuladorAcerto` («PPR · 20 %»),
   meta descrição de `/trabalho`, nota de zoom em `/estilo` e a migalha
   do herói («1 € de custo…»).
3. **Componentes sem uso removidos** — `Adivinha`, `Kinetic`,
   `EuroExplodido` (S2) saíram; `Cascata`/`CustoExplodido` (3A) já
   tinham saído na integração. O teste de tons do isométrico aponta
   agora ao `Isometrico` directo; `.kin-*` saiu do `globals.css`;
   `m.guess` ficou só com as chaves que o herói usa.
4. **`CampoCentimos` ganha `data-assentou`** — sinal público no
   `.cc-palco` (pedido da sessão 2): liga quando os rótulos acendem
   (fim da coreografia; imediato em reduced-motion). O herói deixou
   de espreitar `.cc-rot.on`.
5. **Armadilha de foco da `nav-sheet` endurecida** — Tab com o foco
   fora da folha (p.ex. a meio da hidratação) volta ao primeiro
   elemento; antes só o sumário e o último item eram interceptados.

**Registado como questão aberta (não aplicado — identidade visual):**

- `--accent` fora do dinheiro que sai: linha principal do `Leitura`
  («a cor de sinal do cartão», convenção V3-2), estado activo/hover da
  nav e dos links, a banda preenchida da `Regua`, o selo «próximo» em
  `/dados`. A leitura estrita de «vermelhão só no que sai» (§Cor)
  pediria `--mark` ou tinta nesses sítios — proposta em NOTAS-V4.md,
  o dono decide.

## 2026-09-24 — Sessão 4B: vermelhão só no dinheiro que sai (4B-01)

**Decidido pelo dono:** `--accent` sai de todo o chrome — a regra
«vermelhão-sinal = dinheiro que sai do bolso» passa a ser absoluta.

- **Chrome → `mark`/`ink`:** indicador e estado activo da nav (tinta +
  barra/sublinhado ocre), hovers de links (tinta + sublinhado
  `decoration-mark`), `::selection` (fundo `mark` + tinta do talão),
  banda e polegar da `Regua`, selo «próximo» e barras de teto em
  `/dados`, foco do `.jovem-passo`. O ocre falha AA em texto pequeno
  (3,5:1) → a regra nesses sítios é **tinta + sublinhado `mark`**.
- **`Leitura`:** a linha principal passa a `--l-ink` (var nova
  `--l-serie`); só veste `--l-accent` quando a série É dinheiro que
  sai — prop `sai` → classe `.leitura-sai`. Nenhum cartão actual é
  «sai» (taxas/preços/índices, não fluxos que saem do bolso); o
  mecanismo fica pronto. `.lq-link:hover` → tinta + `l-mark`.
- **Fica:** `--accent` nos pontos/camadas «sai» (CampoCentimos,
  Isometrico, portas, talões), na hachura «acima da referência» do
  Leitura (direcção do gap = sai/fica) e nas demos do `/estilo`.
- **Limpo:** `.chapter-*` (capítulos saíram da home na S2-04).
- **Guarda:** `e2e/nav.spec.ts` falha se algum elemento da nav
  computar a cor do `--accent`.

## 2026-09-24 — Sessão 4B: /irs nível 1 em bruto anual (4B-02)

**Decidido pelo dono:** a régua do nível 1 mede o salário bruto
anual — o número do contrato — e nunca o rendimento coletável.

- `ProvedorIrs` guarda `bruto`; o motor converte-o em coletável
  (`simularSalario`, 14 meses, um titular) antes dos escalões — as
  regras fiscais continuam todas no motor e nos JSON.
- Nível 1: régua «Salário bruto anual», frase «com {bruto} brutos
  por ano pagas {coleta} de IRS», caixa do desmentido com «Contam
  para o IRS, depois das deduções» = coletável — sem nomear o termo.
- Nível 2: cartão novo «RENDIMENTO COLETÁVEL» com a conversão do
  canónico em números (bruto − dedução específica − mínimo de
  existência = coletável). Nível 3 e glossário mantêm o termo.
- Copy nova assinalada como PROPOSTA em NOTAS-V4.md.

