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
**Em aberto:** porquê Pages em vez do Vercel recomendado — o repo não
regista o motivo (ver «Perguntas em aberto»).

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
canonical = CNAME.
**Em aberto:** estado do pedido js.org — não registado no repo.

## 2026-09-17 — Vídeo educativo: avaliado e adiado

**Contexto.** Vídeo como formato editorial complementar ao texto.
**Escolha.** Adiado — custo editorial recorrente não justificado face às
prioridades atuais (decisão do dono, 2026-09-17; não há registo no repo —
fonte: comunicação em sessão).
**Consequência.** Conteúdo editorial continua em texto
(glossário/artigos).
**Em aberto:** que mudança de prioridade o traria de volta.

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

## Perguntas em aberto

- O pedido `aocentimo.js.org` continua pendente ou foi abandonado a favor
  do `.pt`?
- Porquê GitHub Pages em vez do Vercel Hobby recomendado no REDESIGN
  §12.1 — custo, simplicidade de CNAME, ou outro motivo?
- «Observatório»: o código chama assim ao sistema atual (comentário de
  `globals.css`, `/estilo`); o V2 diz que substituiu uma direção
  «Observatório» parcial. Fica por confirmar se era direção formal antes
  do V2 ou o enquadramento do plano master que o código adotou depois.
- Vídeo educativo: que mudança de prioridade o traria de volta?
