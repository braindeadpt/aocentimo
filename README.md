# AO CÊNTIMO

**Seguimos o teu dinheiro ao cêntimo.**

Site gratuito e open source de literacia financeira para Portugal: seguimos 1 €
do salário bruto até ao fim do mês e mostramos quem fica com o quê — Estado,
banco, seguradora, supermercado. Cada número mostra a fonte e a data; quando
uma fonte falha, mostramos a falha — nunca um número inventado.

🔗 **https://aocentimo.pt** (via GitHub Pages)

## O que tem

- **Painel vivo na home** — grelha de leituras oficiais (inflação, Euribor,
  combustíveis, desemprego, habitação, PIB…), cada uma expansível para a
  série completa; mais o storytelling «o teu euro» (1 € bruto cortado à
  fatia, com números do motor fiscal)
- **Páginas temáticas de dados** — `/inflacao` (12 divisões ECOICOP),
  `/precos` (calendário diário de combustíveis), `/emprego`, `/habitacao`,
  `/economia`, e `/dados` (catálogo de 52 séries com filtros e export JSON)
- **Simuladores** — salário líquido (recibo físico), IRS anual e IRS Jovem,
  retenção na fonte, crédito habitação (TAN/TAEG/MTIC), compra de casa
  (IMT+IS), subsídio de desemprego, poupança e juros compostos
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
npm run audit          # mega-audit + overflow + AA (precisa de :3100)
npm run ingest:daily   # recolha diária (BPstat, DGEG)
npm run ingest:monthly # Eurostat IHPC mensal
npm run derive         # data/derived + public/api + feed.xml
npm run validate:data  # gate de frescura das fontes
```

## Aviso

Simuladores indicativos — não constituem aconselhamento financeiro, fiscal ou
de crédito. Para decisões fiscais, consulta um contabilista certificado.

## Licença

Código aberto — vê o repositório. Dados das fontes oficiais citadas em cada
número (Eurostat, INE, BPstat, DGEG, AT, IGCP).
