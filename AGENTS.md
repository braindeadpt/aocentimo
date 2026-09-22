# AGENTS — Literacia Financeira PT

> **Estado: VIGENTE — este ficheiro é o contrato operacional da casa.**
> Última revisão: 2026-09-22. Não substitui nenhum documento — rege como
> se trabalha no repo.

Site público de literacia financeira para Portugal. Documento canónico:
`docs/PRODUTO.md` — direção (V3 «Ledger» + V4 «o cêntimo como unidade»),
sistema visual e regras de produto; ler antes de qualquer trabalho.
`docs/DIRECAO-V3.md` está integrada no PRODUTO.md (registo datado).
Decisões datadas: `docs/DECISOES.md`. Os três planos em `docs/` são
históricos — registo, não contrato.

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

## Comandos

```bash
npm install && npx playwright install chromium
npm run dev            # http://localhost:3000
npm run lint && npm run typecheck
npm run test:unit      # vitest
npm run build          # export estático → out/
npm run serve:out      # serve o out/ em http://localhost:3100
npm run test:e2e       # playwright (faz build e serve sozinho)
npm run audit          # _mega-audit + _overflow-sweep + _sweep (precisa de :3100)
npm run ingest:daily   # scripts/ingest --daily (local mirror do Actions)
npm run ingest:monthly # Eurostat mensal (prc_hicp_minr, ECOICOP 2018)
npm run derive         # data/derived + watchdog de frescura
npm run validate:data  # gate de frescura — falha se série oficial atrasar
node scripts/_js-por-rota.mjs        # JS inicial/total por rota (precisa de :3100)
node scripts/_bundle-top.mjs [chunks] # top de módulos por chunk (build com productionBrowserSourceMaps)
```

## Regras de viz/motion (vigente)

- **GSAP só via `carregarGsap()`** — nunca `import gsap` estático; só
  corre com `motionActiva()` e abaixo da dobra ou em interacção. Em
  reduced-motion o chunk nem é pedido (há teste e2e).
- **Períodos sempre por `fmtPeriodo()`** — `2026-Q1`→«1.º trim. 2026»;
  nunca `YYYY-Qn`/`YYYY-Sn`/`YYYY-MM` cru ao utilizador.
- **Client components não importam `messages/pt.json` nem `data/*.json`** —
  strings e dados chegam por props do servidor (`m`/`t` ficam em server
  components; `t` isolado em `src/lib/t.ts`; `Source` é server —
  em client usa-se `SourceBase` com `rotuloFonte` por prop).
- Um equivalente textual por figura; AA nos dois temas.
- **Movimento acima da dobra:** nada ENTRA com animação acima da dobra ao
  carregar; o valor final está no HTML do servidor. Animação ambiente só
  no herói da home: pausa fora do ecrã e com o separador escondido, e
  desliga-se em prefers-reduced-motion.

## Rotas

`/` (home) · `/salario` `/irs` `/impostos` `/poupanca` `/credito`
`/casa` (dinheiro) · `/inflacao` `/precos` (preços) · `/trabalho`
`/dados` (país) · `/aprender` + `/aprender/[slug]` · `/metodologia`
`/estilo` `/sobre`. Só estas existem em `src/app/` — não criar rotas
novas sem entrada aqui e no PRODUTO.md.

## Limites

- `git config` off-limits; sem force-push; sem `-i`.
- Nunca pedir dados pessoais ou credenciais; produto read-only.
- Conteúdo editorial: autor único (dono do repo); agentes podem propor
  estrutura, não publicar copy sem revisão.
