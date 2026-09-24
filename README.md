# AO CÊNTIMO

**Seguimos o teu dinheiro ao cêntimo.**

Site gratuito e open source de literacia financeira para Portugal. A unidade
do site é física: **1 ponto = 1 cêntimo** — partes de um todo em dinheiro
desenham-se em pontos contáveis que voam para o monte de quem os leva;
estruturas (o que compõe algo) desenham-se em isométrico de traço fino;
séries temporais são linhas anotadas com um facto. A forma é sempre do dado,
nunca decorativa.

Cada página de conteúdo responde a uma pergunta em **três níveis**: 1 · a
resposta (um instrumento e uma frase que um leitor de 12 anos entende),
2 · Explora (os controlos para mexer nos números reais), 3 · Confirma
(tabelas, legislação e fontes em `<details>`). A navegação organiza-se por
quatro perguntas — O que ganhas · O que pagas · O banco · O país — mais
`/aprender`, o glossário com mini-instrumentos por termo.

Cada número mostra a fonte e a data; quando uma fonte falha, mostramos a
falha — nunca um número inventado. Read-only, sem contas, sem tracking, e
não é aconselhamento financeiro.

🔗 **https://aocentimo.pt** (via GitHub Pages)

## O que tem

- **Home V4** — a moeda de 1 € que se desfaz nos seus 100 cêntimos (o teu
  palpite contra a realidade do motor fiscal), o painel «Hoje em Portugal»
  com leituras oficiais e as quatro portas com prévias vivas
- **Páginas de conteúdo** — `/salario` `/irs` `/trabalho` `/impostos`
  `/precos` `/inflacao` `/credito` `/casa` `/poupanca` `/dados`, cada uma
  nos três níveis e ligada à pergunta seguinte
- **Simuladores** — salário líquido (recibo físico), IRS anual e IRS Jovem,
  crédito habitação (TAN/TAEG/MTIC), compra de casa (IMT+IS), subsídio de
  desemprego, poupança e juros compostos
- **Dados oficiais ao dia** — Eurostat (IHPC, desemprego, HPI, LCI, PIB,
  confiança, electricidade), BPstat (Euribor, TAEG), DGEG (combustíveis),
  tabelas fiscais versionadas (AT, IGCP), tetos de usura, calendário fiscal
- **API pública** — `/api/*.json` estático com as séries e regras usadas
- **Feed RSS** de mudanças fiscais — `/feed.xml`
- Tema claro («o documento», papel milimetrado) e escuro («o instrumento»),
  view transitions, reduced-motion respeitado (o motor de animação nem é
  descarregado), a11y com equivalentes tabulares e AA nos dois temas

## Stack

Next.js App Router · TypeScript strict · Tailwind 4 (tokens em
`src/app/globals.css`) · **sem base de dados** — «dados como código»:
`scripts/ingest` (GitHub Actions) → `data/sources` → `data/derived` →
`public/api`. Regras fiscais em JSON versionados por ano em `data/fiscal/`,
motores puros e testados em `src/lib/engines/`. Export estático
(`output: "export"`) servido pelo GitHub Pages.

## Desenvolvimento

```bash
npm install && npx playwright install chromium
npm run dev            # http://localhost:3000
npm run lint && npm run typecheck
npm run test:unit      # vitest
npm run build          # export estático → out/
npm run test:e2e       # playwright serve o out/ (como o Pages)
npm run serve:out      # serve o out/ em http://localhost:3100
npm run audit          # mega-audit + overflow + AA + lettering (precisa de :3100)
npm run ingest:daily   # recolha diária (BPstat, DGEG)
npm run ingest:monthly # Eurostat IHPC mensal
npm run derive         # data/derived + public/api + feed.xml
npm run validate:data  # gate de frescura das fontes
```

Em sessões paralelas cada worktree define `PORTA` (3102+) — o servidor
estático, o Playwright e os scripts de auditoria seguem-na.

## Aviso

Simuladores indicativos — não constituem aconselhamento financeiro, fiscal ou
de crédito. Para decisões fiscais, consulta um contabilista certificado.

## Licença

Código aberto — vê o repositório. Dados das fontes oficiais citadas em cada
número (Eurostat, INE, BPstat, DGEG, AT, IGCP).
