# AGENTS — Literacia Financeira PT

> **Estado: VIGENTE — este ficheiro é o contrato operacional da casa.**
> Última revisão do conteúdo: 2026-09-16; cabeçalho acrescentado 2026-09-18.
> Não substitui nenhum documento — rege como se trabalha no repo.
> Ressalva: a referência a `docs/PLANO-LITERACIA-FINANCEIRA.md` como
> «documento canónico», que este ficheiro tinha na introdução, está
> superada — os planos em `docs/` são históricos; a direção em vigor é a
> decisão do dono de 2026-09-17 (escuro por omissão, «instrumento vivo»)
> e o documento canónico que a regista está a ser escrito.

Site público de literacia financeira para Portugal. Os planos em `docs/`
são históricos (ver cabeçalho acima): a direção em vigor é a decisão do
dono de 2026-09-17 e o documento canónico de planeamento está a ser
escrito — até lá, este ficheiro e a skill `literacia-pt` são a referência
de trabalho.

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
