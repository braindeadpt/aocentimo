# NOTAS V4 — registo de trabalho da fundação

> Documento de trabalho local da V4 (sessões do plano em
> `referencias/V4/`). Dúvidas, hipóteses conservadoras e copy a rever,
> por tarefa. Não é contrato — o contrato é `docs/PRODUTO.md`.

## S1-01 · Uma só verdade nos documentos (2026-09-22)

**Feito.** PRODUTO.md reescrito como verdade única (V3 resumida em §3 com
referência a `DIRECAO-V3.md`; V4 em §4–§5: unidade, três níveis, quatro
perguntas, catálogo de codificações em tabela); DIRECAO-V3.md com
cabeçalho «integrada a 2026-09-22»; AGENTS.md com as rotas reais de
`src/app/` e a regra da dobra exacta; DECISOES.md com a entrada V4 e as
perguntas do relatório §7; SKILL.md com as regras visuais V4.

**Decisões tomadas (hipótese conservadora, a confirmar pelo dono):**

- **Componentes que não existem ainda** (`CampoCentimos`, `Haltere`,
  `BarraTracos`, `AnelPontos`, `Isometrico`, `OrbeEstado`, `Cartao`,
  `Pagina`) estão marcados «a construir, S1-xx» no catálogo do PRODUTO —
  o catálogo descreve o contrato, não o inventário.
- **Nav:** o código tem hoje uma lista plana de 11 itens
  (`SiteNav.tsx`); o PRODUTO regista as quatro perguntas como alvo V4
  (S1-07), com nota explícita de que ainda não está implementada — não
  se apagou a descrição do estado actual.
- **Rotas removidas dos docs** (`/emprego`, `/habitacao`, `/economia`):
  revertidas em 86a9830 e não existem em `src/app/`; saíram do AGENTS e
  do PRODUTO. As séries Eurostat associadas continuam no pipeline de
  dados (não se mexeu).
- **«radius 0 em todo o lado»** substituído pelo «raio com significado»
  (papel 0 · instrumento 14 px · controlos pílula) — o código já tinha
  cartões a 14 px; a regra antiga é que estava errada. Tokens formais
  (`--raio-*`) ficam para S1-03.
- **«Space Mono para todos os números»** corrigido para «heróis em
  Archivo tabular; mono só em rótulos/kickers/tabelas» — alinha o doc
  com a regra V4 e prepara o defeito C2 de S1-02. **Pendente:** verificar
  que a Archivo instalada tem `tnum` (S1-02 §2); se não tiver, propor
  alternativa.
- **Tabela de instrumentos → a11y** do PRODUTO antigo listava
  componentes revertidos (`Mostrador`, `Multiplos`, `Calendario`,
  `Barras`, `Declive`, `Catalogo`, `Glifo`, `Manchete`). Reescrita só
  com o que existe em `src/components/` hoje.

**Copy novo a rever pelo dono:** nenhum texto novo virado ao utilizador
— só documentação interna.

**Perguntas ao dono:** registadas em `docs/DECISOES.md` → «Perguntas ao
dono» (C7 vídeos de terceiros; moeda de pontos na home; história
canónica com TSU; protótipo da moeda).

## S1-02 · Correção dos sete defeitos do relatório (2026-09-22)

**Feito.**

1. **Hidratação #418 em `/irs`** — causa: `SimuladorAcerto` embrulhava o
   `NumHero` (que renderiza `<p class="num-hero">`) dentro de outro
   `<p>`; o browser reparava o DOM e o React falhava a hidratação.
   Correcção: o contentor passou a `<div>`. Regressão: `e2e/pageerrors`
   percorre todas as rotas do sitemap e falha em qualquer `pageerror`.
2. **«3 , 55 %»** — causa: `.leitura-valor` em Space Mono — a vírgula
   ocupa uma célula inteira. Correcção: número herói em Archivo +
   `tabular-nums`/`tnum` (medido na fonte real: `11111.11` e `88888.88`
   com a mesma largura; Space Mono não tem tnum por definição).
   `.num-hero` já era Archivo; `.regua-valor` e `.num-read` ficam em
   mono — são registo de instrumento/rótulo, não heróis.
3. **Vermelho no dinheiro que fica** — causa: `PecaExplodida.keep`
   booleano fazia TUDO o que não era «fica» renderizar em `--accent`
   (bruto, custo da empresa, «chega à conta»). Correcção: `tom`
   semântico (`neutro`/`corte`/`fica`) em `Explodido`; o realce de foco
   segue o tom da peça via `--eu-tom`. Regressão:
   `src/components/Explodido.test.tsx` verifica cor por tipo de peça.
4. **Milhares inconsistentes** — causa: `Intl.NumberFormat` pt-PT só
   agrupa a partir de 5 dígitos → «1 500 €» e «1167 €» no mesmo cartão.
   Correcção: `useGrouping:"always"` em todos os formatadores de
   `format.ts`; `Odometer` usa `fmtNum`. Regressão:
   `format.test.ts` cobre agrupamento ≥1 000 e separador não-quebrável.
5. **Rótulos a colidir a 375 px** — causa: o anti-colisão só olhava
   para os rótulos do gutter direito; mediana ∩ ticks, mediana ∩
   anotação, extremo inicial ∩ anotação e tick ∩ tick não tinham guarda.
   Correcção: modelo de caixas único (6,9 px/car., baseline −13/+4);
   anotação anti-colidе contra todos os rótulos fixos; rótulo da
   mediana escolhe posição livre ou não se desenha; ticks com folga
   mínima de 46 px; `.leitura` é `container` e abaixo de 460 px só fica
   a anotação-insight no svg — os outros rótulos viram a linha de texto
   `.lq-legenda`. Regressão: `e2e/rotulos.spec.ts` mede `getBBox()` real
   a 375/1440; `_mega-audit.mjs` verifica sobreposição estimada no HTML
   exportado.
6. **História canónica** — `src/lib/canonico.ts` (`cenarioCanonico` +
   `BRUTO_CANONICO`): custo total da empresa → cortes → líquido do
   recibo × 12. Home consome; `/salario` arranca em `BRUTO_CANONICO` e
   o herói é o mesmo `recibo.liquido`. Documentado em PRODUTO §4 e
   DECISOES (2026-09-22). Regressão: `src/lib/canonico.test.ts`
   (invariante custo−tsu−irs−ss=líquido; equivalência com reciboMensal).
7. **Vídeos de terceiros** — os dois `.mp4` de `docs/brand/referencias/`
   saíram do índice (`git rm --cached`) e foram movidos para
   `referencias/` (gitignored); caminhos actualizados em DIRECAO-V3.md.
   **Ficam na história do git** — apagá-los do historial exige
   force-push; essa decisão é do dono.

**Decisões tomadas (hipótese conservadora, a confirmar):**

- A moeda-mãe da explosão da home continua a ser o bruto (1 500 €); o
  custo total entra na história canónica via razão da adivinha e via
  PRODUTO. Alternativa possível: começar a explosão no custo (1 856 €).
- `.regua-valor`/`.num-read` ficam em Space Mono (voz de instrumento) —
  o defeito era dos heróis.
- Limiar do cartão estreito: 460 px de largura de `.leitura`.
- Em SSR (sem medida) a geometria usa os defaults por variante — o
  rótulo da mediana pode não se desenhar quando não há lugar limpo; os
  valores ficam na `.lq-legenda`/aria.

**Copy novo a rever pelo dono:**

- `/salario`, bloco «O ano inteiro, a 14 meses»: acrescentada a frase
  «Esta leitura é anual e a 14 meses — soma subsídios de férias e de
  Natal e estima o IRS da liquidação; por isso difere do recibo mensal,
  que usa a retenção real.»
- `.lq-legenda` (só visível em cartão <460 px): linha de valores sem
  copy nova — «{valor} {período} → {valor} {período} · {rótulo da
  referência}».

**Perguntas ao dono:**

- A explosão da home deve começar no custo total (1 856 €) em vez do
  bruto (1 500 €)? A história canónica começa no custo; a moeda-mãe
  visual continua no bruto.
- Apagar os .mp4 do historial do git (BFG/filter-repo + force-push) ou
  aceitar que ficam na história? Foram removidos do índice e do worktree.
