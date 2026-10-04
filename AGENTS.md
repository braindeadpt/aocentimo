# AGENTS — Literacia Financeira PT

> **Estado: VIGENTE — este ficheiro é o contrato operacional da casa.**
> Última revisão: **2026-10-04** (V5 «O Bairro» em produção). Não
> substitui nenhum documento — rege como se trabalha no repo.

Site público de literacia financeira para Portugal. **A home é um mapa:** o
bairro do Porto visto de cima, com onze edifícios que são onze cenas por
âncora. Documento canónico: `docs/PRODUTO.md` — direção **V5 «O Bairro»**
(§2 e §6b), sistema visual e regras de produto; ler antes de qualquer
trabalho. Decisões datadas: `docs/DECISOES.md`. Registo de trabalho:
`docs/NOTAS-V5.md`. A direcção V3 «Ledger» e a V4 «o cêntimo como
unidade» estão **arquivadas** em `docs/historico/PRODUTO-V3-V4.md` (o que
delas ainda manda está em `PRODUTO.md` §2.5). Os planos em `docs/` são
históricos — registo, não contrato.

## Contrato rápido

| Camada | Restrição |
|---|---|
| App | Next.js App Router + TypeScript strict, Tailwind 4 + tokens em `globals.css` |
| Bairro | `src/lib/bairro/` = TypeScript puro que devolve SVG; 11 edifícios = 11 cenas por âncora (`/#financas`); cenas em `next/dynamic`; dados em `public/cenas/*.json` |
| Dados | "Dados como código": `scripts/ingest` (GitHub Actions) → `data/sources` + `data/derived` + `public/cenas/`. Sem base de dados |
| Regras fiscais | JSON versionados por ano em `data/fiscal/` com fonte e vigência — nunca hardcoded |
| Motores | `src/lib/engines/` = funções puras testadas (IRS, SS, prestação, TAEG, poupança, impostos) — as cenas usam os mesmos, nada reimplementado |
| Voz | PT-PT europeu; strings em `messages/pt.json` e nos `textos*.ts` das cenas; nunca "usuário/você/portfólio" |
| Qualidade | `lint && typecheck && test:unit && validate:data && build && _gate-html && test:e2e` + `audit` verdes antes de merge |
| Produto | Read-only, gratuito, sem aconselhamento financeiro; cada número tem fonte + data; **copy é do dono** |

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
npm run derive         # data/derived + public/cenas/*.json + watchdog de frescura
npm run validate:data  # gate de frescura — falha se série oficial atrasar
node scripts/_gate-html.mjs        # tecto de 80 KB gzip da home + o mapa não vai no flight (depois do build)
node scripts/_dieta-html.mjs       # o mesmo HTML por blocos + experimentos; só lê e imprime
node scripts/_js-por-rota.mjs      # JS inicial/total por rota (precisa de :3100)
node scripts/_bundle-top.mjs [chunks] # top de módulos por chunk (build com productionBrowserSourceMaps)
node scripts/_revisao-copy.mjs      # regenera docs/REVISAO-COPY-V5.md (--check não escreve)
```

`_gate-html.mjs` e `_dieta-html.mjs` lêem `out/index.html`: **correr
depois de `npm run build`.** O `_gate-html` está no CI logo a seguir ao
build; o `_dieta-html` é de diagnóstico (é ele que mede por blocos e
experimenta sobre uma cópia em memória, sem escrever nada).

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

### Regras de viz/motion da V5 — «O Bairro» (vigente desde 2026-09-30)

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
- **A câmara mede o alvo em unidades do mundo, nunca `getCTM()`** — que
  devolve px do viewport da camada e punha a personagem fora do mapa.
- **Animações relativas:** em GSAP, deslocações de balanço usam `"+=n"`,
  nunca valores absolutos sobre um `transform` que já posiciona.
- **A animação ambiente é permitida no bairro** — é a home. Nas cenas
  anima-se o que ensina (moedas, gavetas, camadas do litro, quadro da
  Euribor). Tudo tem estado final sem animação em
  `prefers-reduced-motion`, e o número certo está sempre no HTML.
- **As cenas abrem por âncora** (`/#financas`), não por rota. `next/dynamic`
  só quando se entra no edifício: o bundle inicial da home não traz nenhuma
  cena. `_js-por-rota.mjs` não pode passar de 350 KB **gzip** na home
  (medido 2026-10-04: 223,7 KB gzip / ~608 KB wire).
- **Os valores dos marcadores chegam prontos.** A planta recebe texto já
  formatado por `src/lib/format.ts`; nunca escreve `€/L`, `+n %` ou um
  separador de milhares à mão. Um formato escrito na página é um formato que
  ninguém revê.
- **Se um dado falta, o texto é `—`**, nunca `0`, `null` nem o valor de
  outro dia. Ver `FALHOU` em `src/lib/bairro/dados.ts`.
- **Toda a copy vinda do protótipo é PROPOSTA.** A lista que o dono revê
  antes do lançamento é **`docs/REVISAO-COPY-V5.md`**, gerada por
  `node scripts/_revisao-copy.mjs` — não a escrever à mão, nem a manter
  numa secção do NOTAS. Nada de cenas nem de cartas publicam sem essa
  revisão (P4).

### O contrato de dados do bairro

- **Cada cena tem um `public/cenas/<id>.json`**, escrito pelo
  `npm run derive` (`scripts/derive/cenas.ts`) a partir da MESMA
  `dadosCenas()` do servidor. Nenhuma lógica duplicada.
- **O cliente lê por `fetch` ao abrir**, com cache por id. Nenhum JSON de
  `data/` chega ao cliente — só números crus e fontes, por props.
- **O gerador falha alto**: nunca escreve `null` (que a aritmética leria
  como 0) nem `undefined`.
- **A ingestão diária commita `public/cenas/`** (`git add data/
  public/api/ public/cenas/`). Um `public/cenas` não committado é um bug
  de dado, não um detalhe de higiene.
- **As contas são sempre os motores de `src/lib/engines/`** — as gavetas do
  IRS são testadas contra `impostoPorEscaloes`, a prestação é
  `simularPrestacao()`, o litro é `decomporCombustivel()`, os recibos
  verdes são `simularIndependente()`. Nada recalculado dentro de um
  componente.

### As regras de qualidade que o bairro ensinou

- **Testes de geometria, não só de DOM.** `src/lib/bairro/*.test.ts` fixa
  a projeção, a contagem de edifícios, os `data-id` e os valores dos
  marcadores; o e2e mede em `getBoundingClientRect` a 1440/1024/768/375.
  Uma asserção que não mede nada é uma asserção que não falha.
- **`_gate-html.mjs` está no CI** depois do build: mede o HTML da home
  contra o tecto de 80 KB gzip **e verifica que o mapa não está no
  payload RSC**. Se alguém passar o mapa por prop, o gate aponta-lhe o
  dedo.
- **`npm run audit` corre no CI**, na ordem do deploy. Foi ele que
  apanhou o contraste a 4,31:1 em `/inflacao` e a 1,37:1 na `/estilo`.
- **O `next build` é o portão, não o typecheck.** Uma função passada por
  prop a um client component passa o `tsc` limpo e é recusada pelo build.
  Os pontos viajam como **dados**.
- **A letra é exemplar.** O `_lettering` corre no CI e apanha o que se
  escreve à mão; a própria `/estilo`, por ser a especificação, passa por
  `comUnidade()` como qualquer outra página.

## Rotas

**Só estas existem em `src/app/`** — não criar rotas novas sem entrada aqui
e no `PRODUTO.md`:

| Rota | O que é | Edifício de volta |
|---|---|---|
| `/` | **a home = o mapa do bairro** (não é uma lista de perguntas) | — |
| `/salario` | bruto → líquido, SS, IRS, custo para a empresa | Fábrica · Segurança Social |
| `/irs` | escalões, simulador do imposto | Finanças |
| `/impostos` | IVA, ISP, cascata | Finanças |
| `/poupanca` | Certificados de Aforro, poder de compra | Correios |
| `/credito` | Euribor, prestação, TAEG | Banco |
| `/casa` | casa vs. salário | Casa da Inês |
| `/inflacao` | por categoria (ECOICOP) | Mercearia · Pastelaria |
| `/precos` | combustíveis, eletricidade | Bomba || `/trabalho` | subsídio de desemprego, IAS por idade | Quiosque |
| `/dados` | o país em leituras | Quiosque |
| `/aprender` + `/aprender/[slug]` | glossário | Escola |
| `/metodologia` | como se calcula | — (sem edifício) |
| `/estilo` | **o contrato visual «O Bairro», ao vivo** | — (sem edifício) |
| `/sobre` | quem faz isto | — (sem edifício) |

As **cenas não são rotas**: abrem por âncora na home (`/#financas`,
`/#bomba`, …) e cada cena acaba com a ligação à rota onde se aprofunda. O
mapa dos onze edifícios — `data-id`, cena e rota — está em
`docs/PRODUTO.md` §6b.1.

Cada rota de conteúdo embrulha o conteúdo num `<div class="rt5">` (a pele
V5) e passa `edificio={{ href, titulo }}` ao `<Pagina>`, que escreve a
ligação «← Voltar ao bairro: …». Os títulos vêm de
`messages/pt.json` (`bairro.edificios.<chave>.titulo`).

## Limites

- `git config` off-limits; sem force-push; sem `-i`.
- Nunca pedir dados pessoais ou credenciais; produto read-only.
- Conteúdo editorial: autor único (dono do repo); agentes podem propor
  estrutura, não publicar copy sem revisão.
- **Nenhuma rota nova** sem entrada na secção «Rotas» acima e no
  `docs/PRODUTO.md` §6b.1. As cenas abrem por âncora.
- **Docs e código não divergem sem o registo.** O que muda em
  `docs/PRODUTO.md` ou no `AGENTS.md` é contrato; o que muda no código
  é facto. Onde divergirem, o código manda e o texto corrige-se.
