---
name: literacia-pt
description: Regras de produto do site de literacia financeira para Portugal (AO CÊNTIMO). Usar sempre que se edite copy, dados, simuladores, layout ou se adicionem features a este repo.
---

# Regras de produto — Literacia Financeira PT

## O que é (não negociável)

- Site público de literacia financeira para Portugal: inflação por categoria,
  impostos sobre preços e salários, Euribor/spread/crédito, poupança (CA).
- **Não é** tracker de preços, comparador comercial, ou ferramenta de
  aconselhamento. Nunca sinais de compra, nunca conselho financeiro.
- Documento canónico: `docs/PLANO-LITERACIA-FINANCEIRA.md`.

## Regra nº1 — nunca inventar dados

- Nunca fabricar preços, taxas, escalões, percentagens ou datas. Se uma fonte
  falha: `—` / "indisponível" / aviso de série atrasada. Nunca um número
  inventado.
- Todo o dado exibido tem fonte clicável + data da série + data de recolha
  (`data/meta/sources.json` alimenta o selo de frescura).
- Regras fiscais vivem em `data/fiscal/*.json` versionadas por ano com fonte
  (DR/AT/OE) e vigência — nunca hardcoded em componentes.
- Correlação: "consistente com", nunca "causado por".

## Dados & pipeline

- Arquitetura "dados como código": `scripts/ingest` (Actions cron) →
  `data/sources` brutos → `data/derived` calculados. Sem base de dados.
- Toda a ingestão valida com zod; falha = não commita + issue, nunca dado mau.
- Motores em `src/lib/engines/` são funções puras (irs, seg-social, prestacao,
  taeg, poupanca, impostos) — sem UI, com casos golden em Vitest.

## Voz — PT-PT europeu

- Segunda pessoa (tu/imperativo). Proibido: usuário, tela, senha, você,
  portfólio (é portefólio), "descobre/potencia" e copy genérica de marketing.
- Termos técnicos sempre explicados com exemplo numérico; cada conceito tem
  entrada no glossário (`/aprender`).
- Strings em `messages/pt.json` (next-intl); sem texto hardcoded em JSX.

## Design — "sem cara de IA"

- Direção: broadsheet financeiro português — papel claro, tinta escura, serif
  display + mono tabular para números, 1 acento só. Grelha editorial
  assimétrica, notas de rodapé com fontes, tabelas com regras finas.
- Proibido: gradientes hero, glassmorphism, grelhas de cards idênticos,
  emoji-bullets, iconografia stock, sombras grossas.
- Variações sempre com ▲/▼ + cor semântica (nunca só cor).
- Motion mínimo e significativo; `prefers-reduced-motion` sempre.
- Tokens em `globals.css`; living reference em `/estilo`.
- Antes de UI: carregar `frontend-design` + `frontend-ui-engineering`;
  revisão com `web-design-guidelines`. Estas skills genéricas nunca sobrepõem
  estas regras de casa.

## Qualidade (gates antes de merge)

`lint && typecheck && test:unit && build && test:e2e` — todos verdes.
Casos golden fiscais validados contra tabelas oficiais AT. Freshness CI falha
se série oficial atrasar além do esperado.

## Limites

- Produto read-only: nunca pede dados pessoais, credenciais bancárias, ou
  executa qualquer transação.
- Disclaimer permanente: simuladores indicativos; fiscal → contabilista
  certificado.
