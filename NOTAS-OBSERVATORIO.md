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
