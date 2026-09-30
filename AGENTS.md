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
                       # + _lettering (fino U+202F, menos U+2212, «», «…» no out/)
npm run ingest:daily   # scripts/ingest --daily (local mirror do Actions)
npm run ingest:monthly # Eurostat mensal (prc_hicp_minr, ECOICOP 2018)
npm run derive         # data/derived + watchdog de frescura
npm run validate:data  # gate de frescura — falha se série oficial atrasar
node scripts/_js-por-rota.mjs        # JS inicial/total por rota (precisa de :3100)
node scripts/_bundle-top.mjs [chunks] # top de módulos por chunk (build com productionBrowserSourceMaps)
```

Em sessões paralelas, cada worktree define `PORTA` (3102–3106) e corre o
dev com `-p 30xx` — o servidor estático, o Playwright e os scripts de
auditoria seguem-na (sem `PORTA`, tudo assume 3100 e o e2e reutiliza o
servidor existente; com `PORTA`, porta ocupada falha alto).

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

### Regras de viz/motion da V5 — «O Bairro» (P0, vigente desde 2026-09-30)

As de cima continuam válidas. Estas acrescentam-se e só valem dentro do
bairro. O protótipo em `design/prototipos/` é o contrato visual; onde ele e
estas regras divergirem, **ganha o protótipo**, excepto nas regras da casa
(Regra nº1, acessibilidade, PT-PT), que ganham sempre.

- **O kit de desenho é TypeScript puro que devolve SVG**
  (`src/lib/bairro/`). Sem DOM, sem `import` de CSS, sem estado. O SVG é
  gerado no servidor e entra com `dangerouslySetInnerHTML` — é seguro porque
  não entra texto de utilizador: tudo vem do código e de `data/`.
- **O terreno é sempre argumento.** `iso.ts` não tem global. Cada peça
  recebe a função `Terreno`; um `definirTerreno()` à moda do protótipo
  tornaria o mapa dependente da ordem de chamada.
- **Os ids de padrões SVG levam `b-`.** O mapa entra na mesma página que o
  resto do site; `azAzul` ou `granito` sem prefixo colidiriam.
- **A câmara nunca mexe no `viewBox`.** O mundo desenha-se uma vez em
  camadas SVG grandes e a câmara só as desloca e escala com `transform`
  CSS. Regras de desempenho obrigatórias em `design/prototipos/README.md`:
  nuvens, barcos e metro são SVG solto animado por CSS; reflexos são cópias
  paradas; a câmara enquadra-se com `ResizeObserver`.
- **Animações relativas:** em GSAP, deslocações de balanço usam `"+=n"`,
  nunca valores absolutos sobre um `transform` que já posiciona.
- **A animação ambiente é permitida no bairro** — é a home. Nas cenas
  anima-se o que ensina (moedas, gavetas, camadas do litro). Tudo tem estado
  final sem animação em `prefers-reduced-motion`, e o número certo está
  sempre no HTML.
- **As cenas abrem por âncora** (`/#financas`), não por rota. `next/dynamic`
  só quando se entra no edifício: o bundle inicial da home não traz nenhuma
  cena. `_js-por-rota.mjs` não pode passar de 350 KB na home.
- **Os valores dos marcadores chegam prontos.** A planta recebe texto já
  formatado por `src/lib/format.ts`; nunca escreve `€/L`, `+n %` ou um
  separador de milhares à mão. Um formato escrito na página é um formato que
  ninguém revê.
- **Se um dado falta, o texto é `—`**, nunca `0`, `null` nem o valor de
  outro dia. Ver `FALHOU` em `src/lib/bairro/dados.ts`.
- **Toda a copy vinda do protótipo é PROPOSTA** e está listada em
  `docs/NOTAS-V5.md` até o dono a rever. Nada de cenas publicam sem essa
  revisão (P4).

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
