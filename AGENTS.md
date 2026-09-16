# AGENTS — Literacia Financeira PT

Site público de literacia financeira para Portugal. Documento canónico de
planeamento: `docs/PLANO-LITERACIA-FINANCEIRA.md` — ler antes de qualquer
trabalho.

## Contrato rápido

| Camada | Restrição |
|---|---|
| App | Next.js App Router + TypeScript strict, Tailwind 4 + tokens em `globals.css` |
| Dados | "Dados como código": `scripts/ingest` (GitHub Actions) → `data/sources` + `data/derived`. Sem base de dados |
| Regras fiscais | JSON versionados por ano em `data/fiscal/` com fonte e vigência — nunca hardcoded |
| Motores | `src/lib/engines/` = funções puras testadas (IRS, SS, prestação, TAEG, poupança, impostos) |
| Voz | PT-PT europeu; strings em `messages/pt.json`; nunca "usuário/você/portfólio" |
| Qualidade | `lint && typecheck && test:unit && validate:data && build && test:e2e` verdes antes de merge |
| Produto | Read-only, gratuito, sem aconselhamento financeiro; cada número tem fonte + data |

## Regra nº1

Nunca inventar dados. Fonte falha → mostrar falha, nunca um número inventado.

## Skills

Canónicas em `.agents/skills/` (junctions: `.devin/skills`, `.claude/skills`,
`.github/skills`).

- `literacia-pt` — regras de casa; carregar sempre que se toca no produto.
- `frontend-design`, `frontend-ui-engineering`, `web-design-guidelines` —
  gosto e engenharia de UI; nunca sobrepõem `literacia-pt`.
- `vercel-react-best-practices`, `vercel-composition-patterns`,
  `vercel-react-view-transitions` — padrões Next/React.
- `animate`, `improve-animations`, `gsap-*` — motion; mínimo e significativo.
- `owasp-security` — se alguma vez houver input de utilizador.

## Comandos (alvo, Fase 0)

```bash
npm install && npx playwright install chromium
npm run dev            # http://localhost:3000
npm run lint && npm run typecheck
npm run test:unit      # vitest
npm run build
npm run test:e2e       # playwright smoke
npm run ingest:daily   # scripts/ingest --daily (local mirror do Actions)
npm run ingest:monthly # Eurostat mensal (prc_hicp_minr, ECOICOP 2018)
npm run derive         # data/derived + watchdog de frescura
npm run validate:data  # gate de frescura — falha se série oficial atrasar
```

## Limites

- `git config` off-limits; sem force-push; sem `-i`.
- Nunca pedir dados pessoais ou credenciais; produto read-only.
- Conteúdo editorial: autor único (dono do repo); agentes podem propor
  estrutura, não publicar copy sem revisão.
