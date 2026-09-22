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

## S1-03 · Tokens de raio e tipografia — escala fechada (2026-09-23)

**O que foi feito**

- Quatro raios com significado em `:root` — `--raio-papel` (0),
  `--raio-pormenor` (2 px, derivado: `instrumento ÷ 7`),
  `--raio-instrumento` (14 px), `--raio-controlo` (999 px) — e os
  utilitários `rounded-papel/pormenor/instrumento/controlo` gerados por
  `@theme inline`. Todos os `border-radius` literais do chrome foram
  substituídos: papel nos talões/campos/picotados; pormenor nos
  carimbos, trilhos, gauges e marcadores quadrados; instrumento no
  cartão `.leitura`; controlo em `.btn`, `.regua-pill`, `.skip-link`,
  `.tema-ponto` e nos discos do euro (50% ≡ pílula).
- Escala tipográfica fechada em `@theme` com `--text-*: initial` — a
  escala por omissão do Tailwind deixou de gerar utilitários; só os
  degraus da casa produzem `text-*`. Sete papéis: kicker, rótulo,
  corpo, insight, número de leitura, número herói, título. Sub-escalas
  com nome próprio: `--text-svg-*` (texto dentro de viewBox — unidades
  do desenho) e `--text-talao-*` (typesetting de impressora térmica —
  o documento não usa o cromado do site).
- Títulos: exactamente dois estilos — `.titulo-pagina` (Archivo
  expandido, `wdth` 125, caixa-alta; 30→36→60 px) e `.titulo-hero`
  (Archivo condensado, `wdth` 75; 36→60→72 px, só na home). Todos os
  `h1` migraram; o 404 passou a usar `.titulo-pagina`. Os `h2` usam a
  escada `text-display-*` + `.font-display` — degraus, não um terceiro
  estilo de título.
- ~140 utilitários `text-*` ad hoc migrados 1:1 (xs→rotulo, sm→
  corpo-sm, lg→grande, xl→display-xs, 2xl→display-sm, 3xl→display-md,
  4xl→display-lg, 5xl→display-xl, 6xl→display-2xl, 7xl→display-3xl,
  arbitrários → mini/kicker/nota). Os que viviam dentro de `.talao`
  migraram para `text-talao-*` (TalaoCompras, CadernetaAforro,
  SimuladorDesemprego). `fontSize` de svg passou a `style` com
  `var(--text-svg-*)` (atributo de apresentação não resolve `var()`).
- OG: `OG_TIPO` em `src/lib/og.tsx` — escala nomeada do cartão raster
  (rótulo 34 · marca 52 · manchete 96 · herói 128 px numa imagem
  1200×630); `opengraph-image.tsx` consome-a.
- `/estilo`: secções «Tipografia — escala fechada» e «Raio — a aresta
  diz a matéria» reescritas com exemplos vivos (o inline
  `borderRadius: 999px` do exemplo «proibido» desapareceu — a pílula
  deixou de ser proibida, é o raio do controlo). `PRODUTO.md` §6 tem a
  tabela da escala e os dois títulos.

**Decisões e fusões (conservadoras, a confirmar)**

- `--raio-pormenor` (2 px) entra como quarto raio — o pedido pedia três,
  mas o carimbo/trilhos/gauges de 2 px existiam e não são papel, papel
  de instrumento (14 px) nem pílula: ficou derivado do instrumento
  (÷7), não um valor avulso. Sem ele, os 2 px ficariam literais.
- Fusões sub-pixéis: `.regua-valor` 28 px → `display-md` (30 px);
  `.eu-li-val` 21,6 px → `numero` (22 px); `.qcell-meta` 11 px →
  `kicker` (11 px = 0,6875 rem); legendas de talão 12 px →
  `talao-head` (11,2 px); nota do desemprego 14 px → `talao-corpo`
  (13,12 px); `[10px]` → `talao-sub` (9,92 px).
- O lede da home tinha `text-sm md:text-base` mortos (a classe `.lede`
  vencia por estar fora das layers) — removidos, o lede manda.
- `text-[11px]` → `text-kicker` (11 px exactos).
- Em razões `em` (`.num-unit`, `.num-sign`, `.regua-un`, print
  `a::after`) não há token — são proporções dentro do mesmo registo,
  não degraus da escala. Documentado em PRODUTO §6.
- `rx`/`ry` de svg e discos a 50 % (geometria) não são raio de objecto.
- O mínimo de 20 px do shrink de `NumHero` é um piso de runtime, não um
  degrau — fica.

**Perguntas ao dono**

- `.titulo-hero` ficou condensado (`wdth` 75) para se separar do
  expandido da página — se preferires o herói também expandido, troca-se
  o `font-variation-settings` numa linha.
- O pormenor (2 px) como quarto raio derivado — ou preferes fundi-lo em
  `instrumento` nos sítios pequenos?

## S1-04 · O motor de pontos e o campo de cêntimos (2026-09-23)

**O que foi feito**

- `src/lib/pontos/repartir.ts` — `repartir(partes, total=100)` pelo
  MAIOR RESTO (Hamilton): floor da quota exacta + os pontos que faltam
  aos maiores restos, empate ganha quem vem primeiro (determinista).
  Invariante: Σpontos = total sempre que a soma dos valores é > 0,
  mesmo com valores a somar 99,99 ou 100,01 (as quotas normalizam-se à
  soma). Devolve `{valor real, pontos}` por parte — o texto escreve o
  real («62,86 c»), o desenho conta pontos. Parte a 0 → 0 pontos, é
  informação («não te toca»), nunca erro. Se TODAS valem 0, os pontos
  ficam em `livres` e desenham-se neutros — o euro tem 100 cêntimos na
  mesma.
- `src/lib/pontos/layouts.ts` — geometria pura dos três estados:
  `faceMoeda`/`geoMoeda`/`posNaFace` (100 pontos na face bicolor do 1 €,
  anel de latão-níquel + disco de cuproníquel via `ANEL_DISCO`,
  espessura da aresta, oscilação limitada — nunca de perfil),
  `geoGrelha`/`slotGrelha` (10×10), `geoMontes`/`slotMonte`/`colsMonte`
  (um aglomerado por parte, centros em fracção da largura — os rótulos
  HTML alinham a qualquer escala e em SSR), `atribuirSectores`/
  `atribuirSequencia`/`reatribuir` (cada ponto tem dono determinista;
  os sem dono têm destino próprio na grelha neutra), `molaPasso`/
  `molaAssentou` (mola amortecida própria — zero bibliotecas).
- `src/lib/pontos/tela.ts` — `CampoTela`: o runtime de canvas. Canvas
  2D com DPR (cap ×2), `ResizeObserver`, rAF só quando activo — pausa
  fora do ecrã (`IntersectionObserver`), com o separador escondido
  (`visibilitychange`) e desliga-se em `prefers-reduced-motion`
  (estado final imediato). Cores lidas de `getComputedStyle` a cada
  arranque/troca de tema — os tokens (`--accent`/`--keep`/`--ink2`)
  mandam nos dois temas. Máquina de estados `repouso → revelar →
  montes|grelha`, `voltar`; a revelação é a coreografia do protótipo:
  a moeda pára de frente, desfaz-se em pontos com o metal da face,
  pausa («um euro são 100 cêntimos»), acendem as cores e cada ponto
  voa para o seu monte com atraso escalonado.
- `src/components/CampoCentimos.tsx` — `"use client"`, props puros.
  SSR: svg do estado pedido (moeda gravada a sério — «1» serifado,
  EURO, seis linhas com doze estrelas, aresta — ou os montes finais)
  com os mesmos números; o canvas cobre-o sem salto (absoluto por
  cima, `data-pronto` esvanece o svg ao primeiro frame). Rótulos e
  legenda são HTML em % sobre o palco. Palco `aria-hidden`; UM
  equivalente `.sr-only[data-cc-equivalente]` por figura, gerado das
  partes se omitido.
- `/estilo`: secção «O campo de cêntimos — 1 ponto = 1 cêntimo» com o
  exemplo vivo (moeda → grelha → montes, três botões) sobre a história
  canónica calculada por `cenarioCanonico(1 500 €)` no servidor + os
  mesmos montes como o SSR os serve + regras de uso.
- Testes: `pontos.test.ts` (21 casos — invariante da soma em ~200
  repartições aleatórias, maior resto, zeros, uma parte, 99,99/100,01,
  geometria e donos); `e2e/campo-centimos.spec.ts` (5 casos — sem JS o
  SVG tem os 100 pontos e o equivalente; um equivalente por figura;
  reduced-motion sem rotação, dois frames idênticos; a revelação
  assenta e acende rótulos; montes estáticos servidos).

**API final (congelada — as sessões paralelas usam-na sem a mudar)**

```ts
<CampoCentimos
  partes={ParteCentimos[]}           // obrigatório — a última é a que fica
  layout?: "moeda" | "grelha" | "montes"   // "moeda" por omissão
  total?: number                     // 100 por omissão (um euro)
  equivalente?: string               // gerado das partes se omitido
  textos?: { pausa?; saiem?; pronto?; zero? }   // frases do palco (ReactNode)
  className?: string
/>
interface ParteCentimos {
  id: string; rotulo: string; rotuloCurto?: string;
  valor: number;                     // real, com decimais — o texto diz-o
  tom: "sai" | "fica" | "neutro";    // vermelhão / verde / cinzento
  detalhe?: string;                  // «356 €/mês»
}
```

Motor: `repartir(partes: {valor}[], total=100) → {partes: {valor,
pontos}[], livres, total}`; layouts e mola exportados por
`src/lib/pontos/index.ts` (`NomeLayout`, `TomParte`, `geoMontes`, …).

**Decisões (conservadoras, a confirmar)**

- Os pontos herdam o metal da face (ouro/prata) até as cores acenderem
  — «a moeda desfaz-se em cêntimos» literal; a cor semântica só chega
  com a pausa, como no protótipo.
- O palco mede-se por `container-type: inline-size` e os montes por
  fracção da largura — os rótulos HTML nunca precisam de medir o
  canvas e coincidem com o svg de SSR.
- `livres` (nenhuma parte com valor) desenha-se na grelha neutra atrás
  dos montes — nunca pontos órfãos a flutuar.
- O svg de SSR da moeda é a face comum simplificada; o canvas repete
  o mesmo desenho — não é uma ilustração diferente à espera de JS.
- Reduced-motion: `mudarLayout` chama `saltarPara` — estado final num
  frame, rótulos/legenda ligados de imediato, sem rAF de rotação.

**Copy novo a rever pelo dono**

- `/estilo`: «O campo de cêntimos — 1 ponto = 1 cêntimo» + parágrafo +
  três regras de uso; botões «Moeda/Grelha/Montes».
- Frases do palco (demo): «Um euro são 100 cêntimos. Cada ponto é
  um.» · «Destes 100 cêntimos, X saem antes de chegar à tua conta.» ·
  «De cada euro, X c chegam-te à conta.» · equivalente «De cada euro
  que a empresa gasta contigo (bruto de 1 500 €): …».
- Rótulos de zero: «não te toca» / «menos de um ponto».

**Perguntas ao dono**

- A demonstração usa o custo total da empresa (1 856 €) como «euro»
  repartido — TSU da empresa incluída. Se preferires o euro do bruto
  (TSU fora), é trocar o denominador na página.

## S1-05 · O catálogo de codificações (2026-09-23)

**O que foi feito**

- `src/components/Isometrico.tsx` — o antigo núcleo `Explodido`
  generalizado e renomeado: camadas `moeda|disco|placa|base` em traço
  fino sobre eixo tracejado, chamadas tracejadas a rótulos mono, tom
  semântico `neutro|corte|fica`, realce de foco por `--iso-tom`, `<ol>`
  como equivalente sempre visível e interrogável (hover/teclado).
  **A API não aceita quantidade** — `texto`/`textoLista` são nós de
  rótulo e a geometria é fixa (viewBox 520×440): é impossível passar um
  valor que dimensione camadas. Todos os selectores `.eu-*` migraram
  para `.iso-*` (componente, CSS, teste, e2e, `_video-euro`, `_video-custo`).
  `EuroExplodido` e `CustoExplodido` mantêm as suas APIs de domínio.
- `src/lib/viz/formatos.ts` — registo serializável de formatos
  (`FormatoViz`: num/num1/eur/eur0/pct/pct1/litro/pp/kwh) + `fmtViz`,
  `casasViz`, `unidadeDeltaViz`. Props de client components não podem
  ser funções — a chave resolve o formatador partilhado, e a variação
  de séries em % escreve-se honestamente em «p.p.».
- `src/components/Haltere.tsx` — «antes ● — ○ agora» por categoria:
  ponto cheio = antes, ponto oco = agora, traço na cor da leitura
  (`--up`/`--down`, semântica do Delta + `bomSubir`), grelha pontilhada
  (família blueprint), coluna de categoria com a variação escrita em
  ▲/▼ — a cor nunca é o único canal. Geometria em px medida por
  ResizeObserver (padrão Leitura); o SSR calcula com W=640 e serve o
  markup completo. Rótulos de valor sempre para fora do par; pontos
  colados → «antes» desce, «agora» sobe. Container query <460 px:
  `rotuloCurto` e só os extremos da grelha.
- `src/components/BarraTracos.tsx` — traços HTML contáveis (gramática
  da `Regua`), «1 traço = x» obrigatório e escrito no cartão, tons
  `neutro|fica|sai|marca|vago`, traço forte a fechar cada bloco
  (passo automático ≤10 blocos) e o último da barra. Varredura
  esq→dir (`clip-path`, linear — mede-se como se conta) só com `.bt-on`.
- `src/components/AnelPontos.tsx` — o ciclo em pontos contáveis
  (viewBox fixa 300×300, sentido dos ponteiros a partir do topo), o
  número do ciclo em HTML ao centro (Archivo), o «agora» com anel de
  marca torrado, rótulos curtos até 16 pontos (só o «atual» sobrevive
  em palco <300 px). Entrada: pontos a assentar em ordem horária
  (`--ad` por ponto), anel e centro a fechar.
- `/estilo`: secção «O catálogo de codificações» com os quatro
  exemplos vivos + usa/não-usa. Dados: Haltere = taxas oficiais do
  painel (inflação, Euribor 3M/12M, CA, desemprego — «há um ano →
  agora» por `valor − variacao.abs`); BarraTracos = os 14 pagamentos
  do ano (estrutura canónica); AnelPontos = os 12 meses do ano
  canónico (`liquidoAno12` ao centro, jun/dez em `fica`, «agora» = mês
  do HICP); Isometrico = a mensalidade do crédito decomposta em
  capital/juro/seguros — estrutura sem medida.
- Testes SSR: `Haltere.test.tsx` (8), `AnelPontos.test.tsx` (7),
  `BarraTracos.test.tsx` (8) — contagem, unidade escrita, direcção
  boa/má, equivalente único, svg decorativo, sem classe de entrada no
  HTML servido.
- `docs/PRODUTO.md` §5: a tabela regista os três componentes novos e o
  `Isometrico` como construídos/congelados (S1-05).

**APIs finais (congeladas — as sessões paralelas usam-nas sem as mudar)**

```ts
<Haltere
  categorias={CategoriaHaltere[]}   // {id, rotulo, rotuloCurto?, antes, agora}
  formato?: FormatoViz              // "num1" por omissão; "pct" → «3,55 %»
  unidadeDelta?: string             // " p.p." por omissão em formatos de %
  rotuloAntes: string               // os dois momentos na legenda
  rotuloAgora: string
  bomSubir?: boolean                // false por omissão (preços)
  equivalente?: string              // omitido → <ul> gerada por categoria
  className?: string
/>

<BarraTracos
  grupos={GrupoTracos[]}            // {n, tom?, rotulo?} — em ordem
  unidadeTraco: string              // escreve-se «1 traço = {unidadeTraco}»
  rotulo: string
  valor?: ReactNode                 // número de leitura («14», «3 de 10»)
  nota?: string
  equivalente?: string              // gerado dos grupos se omitido
  className?: string
/>

<AnelPontos
  pontos={PontoAnel[]}              // {id, rotulo, rotuloCurto?, tom?, atual?}
  centro={{ valor: ReactNode, rotulo?: ReactNode }}
  comRotulos?: boolean              // rótulos curtos até 16 pontos
  equivalente?: string              // gerado dos pontos se omitido
  className?: string
/>

<Isometrico
  camadas={CamadaIsometrica[]}      // {id, forma, rotulo, detalhe, tom,
                                    //  texto?, textoLista?} — sem quantidade
  numero?: NumeroIsometrico         // {kicker, valor, pequeno?, compacto?}
  nome: string                      // data-{nome}-lista na <ol>
/>
```

**Decisões (conservadoras, a confirmar)**

- O Haltere tem escala partilhada por todas as categorias — é o que
  torna os halteres comparáveis entre si; uma linha com valores noutra
  ordem de grandeza deve ir para outro cartão, não alargar a escala.
- A cor de direcção do Haltere é a do Delta (`--up`/`--down` +
  `bomSubir`) — «bom/mau» é leitura, não decoração; e fica sempre
  escrita (▲/▼ + valor).
- A demo do Isometrico em `/estilo` usa `numero.valor="P + J + S"` —
  a fórmula no lugar do número: reforça que ali não há medida.
- O «atual» do AnelPontos vem da série oficial mais recente (HICP do
  painel) — o anel marca o mês real em leitura, não `hoje` do relógio.
- Os traços são HTML, não svg — mesma gramática dos traços da Regua;
  a varredura é `clip-path` na pista inteira (linear, como quem conta).
- `Isometrico` é o nome da codificação; `EuroExplodido`/`CustoExplodido`
  ficam como componentes de domínio (história + dados + invólucro
  `.leitura`) por cima dele — não se renomearam para não partir rotas,
  testes e scripts existentes.

**Copy novo a rever pelo dono**

- `/estilo` secção «O catálogo de codificações»: kickers («haltere —
  antes ● — ○ agora, por categoria», …) e os blocos usa/não-usa.
- BarraTracos: «O ano em pagamentos» / «1 traço = 1 pagamento» /
  «12 salários + 2 subsídios».
- AnelPontos: centro «{líquido ano} — nos 12 meses»; meses jun/dez em
  verde como «meses de subsídio».
- IsometricoDemo: camadas «A mensalidade / Capital / Juro / Seguros /
  A tua conta», textos «amortiza», «ao banco», «à seguradora», «sai
  por mês», número «P + J + S», pé «estrutura — as camadas não medem o
  que pagas».

**Perguntas ao dono**

- Subsídio de férias marcado em junho (e Natal em dezembro) no anel —
  convenção habitual; se preferires julho troca-se o índice.
- O demo do isométrico usa a mensalidade do crédito (estrutura sem
  euros) — se preferires um exemplo com valores reais nas chamadas,
  troca-se `texto`/`textoLista` por valores do motor.


