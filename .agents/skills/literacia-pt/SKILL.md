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
- Documento vigente: `docs/PRODUTO.md` (os três planos em `docs/` são
  históricos; decisões em `docs/DECISOES.md`).

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
- Strings em `messages/pt.json`, lidas via `src/lib/messages.ts` (`m`,
  `t()`) — sem next-intl; sem texto hardcoded em JSX.

## Design — "sem cara de IA"

- Direção V4 = V3 «Ledger» + a unidade + a arquitetura (PRODUTO.md §3–§5):
  instrumento vivo, escuro por omissão (o claro é o documento). Escala de
  elevação floor/panel/raised/overlay; textura só no floor.
- **A unidade: 1 ponto = 1 cêntimo.** Partes de um todo em dinheiro
  desenham-se em pontos contáveis. Regra de ouro: isométrico = estrutura
  (o que é); pontos = quantidade (quanto é) — nunca o contrário.
- **Três níveis em cada página:** 1 · A resposta (pergunta + um
  instrumento + uma frase ≤ 25 palavras), 2 · Explora (controlos),
  3 · Confirma (tabelas/legislação/fontes em `<details>` fechado).
- Cor semântica: verde (`--keep`) = só o que fica contigo; vermelhão
  (`--accent`) = só o dinheiro que sai; ocre (`--mark`) = só fonte/foco;
  **bruto e custo total são neutros**. Cor nunca é decoração.
- Raio com significado: papel = 0 (é cortado); instrumento = 14 px;
  controlos = pílula. O papel é a matéria dos artefactos documentais
  (recibo, talão, escritura, caderneta) — nunca do chrome.
- Tipografia: números heróis em Archivo com algarismos tabulares
  (`tabular-nums`); Space Mono só em rótulos, kickers e tabelas; serifada
  para a frase-insight; 1 acento só.
- Proibido: gradientes hero, roxo/violeta, glassmorphism, grelhas de
  cards idênticos, emoji-bullets, iconografia stock, sombras grossas,
  mostradores de agulha, scroll-jacking, fade-up genérico, paleta
  categórica em séries ordinais, qualquer animação que atrase um número.
- Variações sempre com ▲/▼ + cor semântica (nunca só cor).
- Motion mínimo e significativo; `prefers-reduced-motion` = estado final
  imediato. Nada entra com animação acima da dobra ao carregar (valor
  final no HTML do servidor); animação ambiente só no herói da home.
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
