# NOTAS-NOITE — registo do pack da noite

Registo contínuo das 22 tarefas do PACK-NOITE: dúvidas, hipóteses
conservadoras, copy proposta a rever, medições. Ordem: M-01 → M-22.

---

## M-01 · matéria (rasgo determinista, papel, perfuração, sombra)

**Entregue**

- `src/lib/materia.ts` — PRNG mulberry32 próprio (`prng`), semente estável
  derivada de valor (`sementeDe`), rasgo por pontos (`arestaRasgadaPts` /
  `arestaRasgada`), silhueta fechada (`pecaRasgada`), furos regulares
  (`furos`), sombra por peça (`sombraPeca`), profundidade útil
  (`profundidadeRasgo`). Coordenadas a 1 casa decimal; `-0` normalizado.
- `src/components/Papel.tsx` — `PapelDefs`: superfície em camadas
  (base + tom + fibra + espessura) por `<pattern>` e gradientes — sem
  `feTurbulence`/`feGaussianBlur` na tinta (re-pintam por frame).
- `src/components/PecaPapel.tsx` — pedaço arrancado completo: silhueta
  rasgada nas duas pontas, furos por **máscara** (o fundo da página vê-se
  — demonstrado com a faixa torrada por trás em `/estilo`), sombra
  derivada de ângulo+altura.
- `src/lib/materia.test.ts` — 17 testes: determinismo, limites, forma,
  espaçamento de máquina, variação de sombra.
- `/estilo` — secção "Matéria — papel, rasgo, perfuração" com demos
  vivas: rasgo a 100 %/400 %, perfuração com fundo a ver-se, queda com
  sombras por peça, regras escritas.
- `globals.css` — `--talao-paper`/`--talao-ink` subiram de `.talao` para
  `:root` (a matéria vive fora do talão). Papel fixo nos dois temas por
  decisão: é o mesmo objecto físico.

**Decisões / hipóteses conservadoras**

- Rasgo em cima **e** em baixo por defeito (`rasgoTopo`/`rasgoFundo`
  permitem desligar) — um pedaço arrancado da fita separa-se nas duas
  pontas; laterais rectas porque são as bordas da fita cortada à máquina.
- Filtros CSS de sombra só em elementos estáticos; o que anima usa
  transform/opacity (orçamento escrito no cabeçalho de `materia.ts`).
- Sobreposição de .5px entre formas adjacentes para eliminar costuras
  de subpixel (arredondamento a 1 decimal cria folgas de renderização).

**Screenshots** — `.screenshots/M-01/`: antes/depois × {dark,light} ×
{1440,375} + zoom da secção.

**Copy a rever pelo dono** — secção "Matéria" em `/estilo`: texto de
abertura ("A linguagem material do site é o talão…") e as cinco regras
da lista final.

**Incerteza** — nenhuma pendente.

---

## M-02 · gramática de movimento

**Entregue**

- Gramática escrita em `docs/PRODUTO.md` §Motion e demonstrada em
  `/estilo` (tabelas de tokens ao vivo + MotionDemo).
- Quatro durações: `--dur-micro` 120ms (responde), `--dur-curta` 320ms
  (muda de estado), `--dur-media` 600ms (explica), `--dur-longa` 1200ms
  (orquestra). Três curvas + linear: `--ease-entra`, `--ease-sai`,
  `--ease-rasgo`, `--ease-lin` (só o ticker). Um escalonamento:
  `--stagger` 90ms.
- Varredura completa: os tokens antigos (`--dur-res/mov/in`, `--ease`)
  e TODOS os literais (0.15s, 0.25s, 0.28s, 0.45s, 0.8s, 60/90/110/130/
  140ms, duration-300, cubic-bezier avulsos, 55s) substituídos pelos
  tokens. `Spark atraso` passou de ms a índice de stagger (callers
  0/1/2/3).
- Reduced-motion reforçado: kill universal `animation:none !important`
  — uma animação nova nasce coberta, não precisa de opt-out listado.
  Overrides explícitos dos estados armados por JS (`.spark-armed`
  repõe dashoffset/área no estado final).
- Teste e2e novo: percorre TODAS as rotas derivadas com
  `reducedMotion:'reduce'` e falha se algum elemento tiver
  animation-name≠none ou transition-duration>0.

**Decisões**

- O escalar `--stagger` é o mesmo para irmãos e para os dígitos do
  odómetro (já era 90ms — confirmou a escolha).
- O ciclo do ticker (`--dur-ticker` 55s) é velocidade de loop contínuo,
  fora da escala — documentado como tal.
- Atrasos inline passaram a `calc(i * var(--stagger))` — o token fica
  na casca CSS, os componentes passam só o índice.

**Mutação** — sem `animation:none` universal, o teste falha com
`ticker-scroll`, `kin-up`, `fluxo-cresce` na home. Restaurado.

**Copy a rever** — texto da secção "Movimento — a gramática" em
`/estilo` e a tabela §Motion de PRODUTO.md.

**Screenshots** — `.screenshots/M-02/depois-*` (o "antes" é o estado
de `/estilo` nos shots de M-01).

---

## M-03 · motor de valores animados

**Entregue**

- `src/lib/useValorAnimado.ts` — UM hook de interpolação (rAF,
  cancelável, curva easeEntra da gramática). Máquina pura exportada
  (`valorEm`, `retarget`, `terminado`, `easeEntra`) — testável em node.
- Dois apresentadores, nada mais:
  - `Odometer` — dígitos que rolam, para o momento de revelação
    (agora com `aria-live="polite"` no sr-only);
  - `TweenNum` — contagem simples, reescrito sobre o motor: visual
    `aria-hidden` + `tabular-nums`, sr-only `aria-live` anuncia o valor
    final UMA vez; prop `sufixo` para a unidade estática.
- `CountUp` removido — a única utilização (SMN na home) passou para
  `Odometer`, que é o apresentador de revelação por definição.
- `animar` já estava em todos os heróis de simulador; o líquido do
  talão de `/salario` (que não animava) passou a `TweenNum`.
- `src/lib/animado.test.tsx` — 11 testes: curva monótona, extremos,
  retarget a meio (o `de` é a posição actual — nunca salta), cadeia de
  retargets, contrato SSR (valor final no primeiro paint, aria-live,
  tabular-nums) dos dois apresentadores.
- e2e novo: com reduced-motion, o herói mostra o valor final de imediato
  e ESTÁVEL (leitura dupla a 700ms — interpolação denunciar-se-ia).

**Decisões**

- SSR/first-paint: o estado inicial do hook é sempre o alvo — o valor
  final está no HTML mesmo sem JS; `retarget` garante que mudar o input
  a meio da animação parte da posição visível, nunca do valor anterior.
- O `Odometer` não usa o hook — a interpolação dele vive na transição
  CSS das rodas (é o apresentador, não um segundo motor). Documentado.

**Nota de infra** — o `serve` manual a correr em background morre a
meio do e2e no Windows; o `webServer` do playwright.config gere o
processo sozinho e é estável — não arrancar `serve` à mão antes do
`npm run test:e2e` (excepto para screenshots via `_shots.mjs`).

**Copy a rever** — nenhuma.

**Screenshots** — `.screenshots/M-03/depois-salario-*`.

---

## M-04 · tokens de papel + rampa sequencial (duas opções)

**Entregue**

- Quatro papéis físicos fixos nos dois temas (o objecto não muda com o
  dark mode): `--talao-paper`/`--talao-ink` (já existiam, subidos a
  `:root` no M-01), `--papel-sai`/`--papel-sai-tinta` (rosa torrado —
  o que sai), `--papel-fica`/`--papel-fica-tinta` (verde seco — o que
  fica). Aliases `--color-*` no `@theme inline` para utilitários.
- Alternativa sequencial `--seqb-1..4` (âmbar torrado ~42°) nos dois
  temas, lado a lado com a rampa activa `--seq-1..4` (azul-aço ~215°)
  em `/estilo`, aplicada a dados REAIS: Euribor 1M/3M/6M/12M, últimos
  24 meses BPstat, escala partilhada.
- `scripts/_cores.mjs` (temporário, não commitado) mede os tokens
  directamente do `globals.css` — rácios WCAG + simulação Machado 2009
  de deuteranopia/protanopia.

**Rácios medidos (tokens finais)**

- Tinta sobre papel (texto, AA ≥ 4.5):
  talao-ink **13.61**, papel-sai-tinta **6.94**, papel-fica-tinta **7.57**.
- Limite papel vs chão (fronteira de objecto, ≥3 ideal):
  papel-sai claro **1.26** / escuro **14.07**;
  papel-fica claro **1.13** / escuro **15.69**.
  No tema claro o papel quente quase se funde com o chão — a separação
  fica a cargo da borda/sombra (decisão assumida: o talão real também
  não grita contra a mesa).
- Linha gráfica vs painel (≥3 ideal para componente de gráfico):
  - seq-A claro: 6.41 | 4.14 | **2.69** | **1.93** (degraus 3-4 falham)
  - seq-A escuro: 12.19 | 8.14 | 4.89 | 3.33
  - seq-B claro: 7.33 | 5.24 | 3.64 | 3.09 — **todos ≥3**
  - seq-B escuro: 10.97 | 6.93 | 5.14 | 3.18 — **todos ≥3**
- Daltonismo (Machado 2009, severidade 1.0): ambas as rampas mantêm
  ordenação monótona de luminância em deuteranopia E protanopia, nos
  dois temas.

**DECISÃO PENDENTE (dono)** — a rampa âmbar é estritamente melhor em
contraste gráfico (passa 3:1 nos 8 casos; a azul falha 2). O azul-aço
está mais longe do vermelhão semântico e do verde keep; o âmbar aproxima
-se da família `--mark`/torrado mas não colide (`--mark` é #a07c17,
entre seqb-3 e seqb-4 — convém verificar uso conjunto se for adoptada).
`--seq-*` continua activa até o dono escolher; `/estilo` mostra as duas
com os números.

**Copy a rever** — texto da comparação de rampas em `/estilo`
("a decisão não é minha…").

**Screenshots** — `.screenshots/m04/depois-estilo-*` ×{dark,light}×
{1440,375}.

---

## M-05 — `<FitaTalao>` (peça-assinatura, substitui `Fluxo`)

**Entregue**

- `src/lib/fita.ts` — geometria pura e testável da fita: aresta esquerda
  fixa, direita encolhe por degraus proporcionais ao valor (uma só
  escala para fita e pedaços), perfurações a sério (máscara — o fundo
  vê-se), pilha à direita. `ok:false` para total inválido/zero/∞ →
  `EmptyState`, nunca fita inventada.
- `materia.ts` + `rasgoCantoPts` — o rasgo em L é partilhado entre o
  entalhe da fita e o pedaço arrancado: correspondência perfeita por
  construção, semente derivada do valor.
- `FitaTalao.tsx` — sequência única: cabeça de impressão → wipe de
  cima para baixo → cada pedaço resiste, rasga, roda e cai na pilha →
  valores imprimem ao revelar o troço (`useValorAnimado` + `revelar`
  e `atraso`) → troço final `papel-fica` acende.
- Interrogação: readout fixo (`chart-readout`, aria-live) + régua
  range 0–6 (setas/Home/End/Escape); hover/focus/touch realçam o
  troço; `destaque` da Escada recua os outros ao narrar.
- Casos-limite: pedaço zero imprime `0 €` e "não te toca" (não rasga);
  pedaços em largura mínima marcam `†` + nota "o desenho já não é
  proporcional aí" — a desonestidade é explicada, não escondida.
- Equivalente `<table>` sr-only + SVG aria-hidden; 4 links de
  capítulo do Fluxo mantidos; sem overflow a 375px.
- Reimpressão: `key` derivada dos valores → a sequência reexecuta-se
  inteira, nunca um corte seco.

**Decisões/assunções**

- Orientação vertical apenas — a variante horizontal da spec ficou
  avaliada e descartada: o scrolly da Escada já é vertical e a fita
  lê-se como recibo (a spec permite avaliar, não obriga).
- Notch da fita usa a diferença REAL de largura; só o pedaço clampa à
  largura mínima — a fita é sempre honesta, o pedaço declara-se com `†`.
- `estado` na régua (posição 6) acende os três pedaços — o total é
  a soma dos arrancados.
- Bailout `custo≤0` ANTES de gerar caminhos: sem ele `k` explodia e o
  gerador de rasgo iterava ~27 mil milhões de vezes (OOM no Vitest).

**Testes** — `fita.test.ts` 45 casos (escala única, aresta fixa,
correspondência pedaço/entalhe, zero, enormes, mínimos, inválidos);
e2e novo: teclado nas 7 paradas, Escape, tabela sr-only, aria-hidden,
links de capítulo. Gates: lint ✓ typecheck ✓ unit 169 ✓ data ✓
build 58 ✓ e2e 15/15 ✓.

**Copy a rever** — `fita.*` em `messages/pt.json` ("não te toca",
"EMISSÃO", "cêntimos de cada euro", nota `†`, caption aria).

**Screenshots** — `.screenshots/m05/` {dark,light,mobile}.

---

## M-06 — LineChart: desenho, eventos, morph, série atrasada

**Entregue**

- `data/fiscal/eventos.json` — 4 eventos CURADOS, cada um com fonte
  oficial e URL verificada:
  - `bce-ciclo-subidas` (2022-07-27) — decisão BCE 21 jul 2022, +50 pb,
    ecb.europa.eu;
  - `bce-pico` (2023-09-20) — decisão BCE 14 set 2023, depósito 4 %,
    ecb.europa.eu;
  - `isp-desconto` (2022-03-11) — Portaria 111-A/2022, dre.pt;
  - `iva-zero` (2023-04-18 → 2024-01-04) — Lei 17/2023, dre.pt —
    evento COM duração → faixa sombreada, não linha.
- `eventos` prop no LineChart: tracejado + quadrado torrado no eixo,
  rótulos em duas filas com inversão na borda direita, faixa para
  medidas com `tFim`. Lista de citações por baixo (link → fonte) —
  o SVG é aria-hidden, sem a lista o evento não existia para leitores.
- Desenho animado: cada série mede `--lc-len` no DOM e desenha-se por
  dashoffset à entrada no viewport, escalonada por `--stagger`; banda
  esbate-se depois; `lc-done` limpa o dash no fim (redimensionar não
  deixa lacres). Sem JS/reduced-motion: estado final.
- Morph de dados (e): `grafico.ts` puro — `interpDom`, `interpPts`
  (cauda nova nasce da cauda velha), `chaveSeries` (identidade barata:
  arrays reconstruídos iguais não animam). rAF 600 ms easeEntra;
  interrupções partem do frame actual via `renderedRef`.
- Estado "atrasada": prop `estado` → quadrado de aviso + palavra no
  readout (o mesmo vocabulário do Ticker/Celula). Ligado em `/dados`
  (Euribor) e `/inflacao` (IHPC); `/precos` sem selo por agora.
- `/precos` — janela do gráfico alargada de 12 meses para desde 2022:
  a história (guerra → desconto → normalização) precisa dos eventos.

**LACUNA registada** — a SAÍDA do desconto do ISP não é um dia, é um
desmame por portarias mensais (última confirmada: Portaria
288-A/2023, de 25 set — redução ~15-16 cêntimos). Não encontrei a
portaria que a extingue definitivamente → NÃO criei o evento de saída;
o dono confirma a última portaria e data.

**Lint** — `set-state-in-effect` evitado: a armadura entra por
`classList` no effect; o state só muda em callbacks (IO/animationend).

**Testes** — 9 novos (interpolação + disciplina de fonte: nenhum
evento sem data ISO, rótulo, fonte e URL https). Gates: lint ✓
typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 15/15 ✓.

**Copy a rever** — rótulos/detalhes dos eventos em `eventos.json`
("Pico do ciclo — depósito a 4 %", etc.).

**Screenshots** — verificados `/dados`, `/precos`, `/inflacao`
(1440 + 375): marcadores e faixa alinham com a história real.

---

## M-07 — Cascata + EuroBar na gramática e na matéria

**Entregue**

- O CUIDADO da spec já estava resolvido (sessão anterior): Cascata e
  EuroBar estão no padrão canónico — bloco visual `aria-hidden` +
  tabela irmã (sr-only na Cascata, visível na EuroBar). Nenhuma
  informação anunciada duas vezes — verificado no DOM.
- Curva do ato físico, não scaleX genérico:
  - fatias encaixam com `--ease-rasgo` (overshoot leve = o snap de
    uma peça a assentar) — `.eurobar-seg` deixou `ease-entra`;
  - na Cascata, o que sai usa a nova `.eurobar-cai` + keyframe
    `cascata-cai` (translateY−10→0 com ease-rasgo): o corte CAÍ de
    cima para o lugar — é dinheiro que sai, não barra que cresce.
- Transição de valores: `transition: width` já existia e foi estendida
  à `.eurobar-cai` — nos três simuladores (/salario, /casa,
  /trabalho) as fatias repartem-se por transição, nunca por corte.
- Interrogação: já estava no padrão M-05 (readout fixo + régua +
  Escape + blur) — confirmado, sem mudança necessária.

**Decisão** — ficaram geométricos e limpos, SEM matéria de papel:
uma barra proporcional e uma cascata não são papel nem talão;
forçar a metáfora era decoração. Registado em comentário no CSS
(`globals.css`, bloco `.eurobar-seg`).

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 15/15 ✓.

---

## M-08 — `<Spark>` + `<Instrumento>` como componentes únicos

**Entregue**

- `Spark` (já desenhava-se, marcador torrado e área) ganhou os dois
  requisitos de sistema:
  - `estado` — o marcador final é o selo de frescura: torrado em dia,
    `warn` quando atrasada, **oco** (só contorno) sem SLA;
  - `descricao` — equivalente textual sr-only com a variação da cauda
    ("rótulo: últimos N pontos entre mín e máx; último X").
- `src/components/Instrumento.tsx` — UM painel: rótulo + selo +
  valor herói (`grande` = 3xl na primeira dobra) + spark + rodapé com
  timestamp; a palavra «atrasada»/«sem SLA definido» sai no rodapé
  quando o estado não é limpo. `descricaoSpark` exportada e pura.
- Três variantes consolidadas:
  - `Celula` de `/dados` → wrapper fino sobre `Instrumento`;
  - mini-células Euribor (1M/3M/6M/12M) de `/dados` → `Instrumento`
    (a variação no mês passou ao rodapé `meta`);
  - quadro do mês da home → 4× `Instrumento` com `estado` ligado ao
    `freshness.json` (cp00, cp01, fiscal-smn, fiscal-ca) — a home não
    tinha selo nenhum antes.
- Mensagens `chart.semSla` + `chart.sparkDesc` em `pt.json`; CSS
  `.serie-estado.sem-sla` (quadrado oco).

**Decisões**

- «A recolher» da spec **não existe nos dados** — `freshness.json`
  só distingue em-dia/atrasada/sem-sla. Mapeei sem-sla → quadrado oco
  + «sem SLA definido» (honesto: não verificável ≠ a recolher). Se o
  dono quiser «a recolher», o derive tem de emitir esse estado.
- A descrição sr-only da spark fala da cauda (24 pontos), não da
  série inteira — é o que o desenho mostra.

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 15/15 ✓.

---

## M-09 — transições entre estados de página (orquestra única)

**Entregue**

- **Orquestra (a):** a resposta a um input passou a ter UM tempo —
  `--dur-curta` (320ms, a duração de "muda de estado" da gramática).
  `TweenNum` tinha default 600ms enquanto `EuroBar`/`Cascata`
  transitavam a 320ms — o herói e as barras mexiam-se fora de fase.
  Default do `TweenNum` → 320ms com a razão escrita no prop.
- **Regra de código (b):** as três proibições passaram de intenção a
  mecanismo —
  1. nada acima da dobra entra a animar ao carregar: `Kinetic`,
     `Spark`, `LineChart` e `Odometer` só armam a animação se o
     elemento nascer ABAIXO da primeira dobra
     (`getBoundingClientRect().top >= innerHeight`); visível ao
     carregar → nasce no estado final;
  2. número herói sempre legível — os valores mudam já, só a forma
     transita (já era o contrato M-03, agora escrito);
  3. estados de carregamento decorativos — proibidos na gramática.
- **Violação real apanhada pelo teste novo:** o ponto do `ThemeToggle`
  transitava cor em TODAS as cargas — o SSR adivinha "light", a
  hidratação corrige para o tema real e a `transition-colors` disparava.
  Corrigido de raiz: `.tema-ponto` deriva do atributo `data-theme` em
  CSS (posto pelo script inline antes do paint) — não há flip de classe
  no React para transitar.
- `Odometer`: o roll de entrada passou a disparar no scroll-in
  (IntersectionObserver) em vez de ao montar — antes corria invisível.
- e2e novo: percorre todas as rotas e falha se algum elemento visível
  no primeiro viewport tiver animação/transição de iteração finita a
  correr ao carregar (duas amostras, 120ms e 420ms — loops infinitos
  como o ticker não são entrada).
- PRODUTO.md §Motion: bloco "Orquestra de estado" + as três regras
  escritas como regras de código.

**Decisões**

- Morph do `LineChart` (mudança de janela em /precos) ficou a 600ms —
  é "explica a transformação", não resposta instantânea; documentado.
- A orquestra é por convenção de token (um tempo, um início — o input),
  não por um componente coordenador: os apresentadores já partilham o
  motor e a gramática; um maestro extra não acrescentava nada.

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓
e2e 16/16 ✓ (teste novo incluído).

---

## M-10 — Home: fita herói, adivinha, números na 1ª dobra

**Entregue**

- `FitaTalao` é o herói da secção do instrumento, em **largura total**
  (saiu da grelha 8/12 do scrolly). A adivinha fica por cima — pergunta
  primeiro, revelação depois; o remount por `key={ronda}` re-imprime e
  rasga a fita a cada aposta — o momento de assinatura.
- **Escada avaliada → comprimida a legenda plana** (decisão: não
  remover). O scrolly (sticky + IntersectionObserver + passos a 34vh)
  morreu — a fita já conta a história sozinha (imprime valores, tem
  readout e interrogação por teclado). As seis frases narradas ficam
  como `<ol>` plano de duas colunas por baixo da fita — a voz editorial
  não se perde, o sequestro de scroll sim. `Escada.tsx` apagado.
- **Quadro do mês na primeira dobra, com fonte e data no topo**: a
  `Source` (Eurostat · série até · IGCP) subiu para o cabeçalho da
  secção — a evidência entra na dobra com os números. Manchete
  comprimida (pt-12→pt-6, h1 5xl→4xl em <sm, lede text-sm, gaps).
- Numeração de figuras fora: a coluna `01–06` dos capítulos saiu (a
  grid passou a `[1fr]`/`[16rem_1fr_2rem]`); "MÓDULO 01" não existia
  — verificado. Chaves mortas `barra*`/`seg*` em pt.json ficam (copy,
  decisão do dono).
- Hierarquia: H1 → H2 quadro (`#quadro-mes` + `aria-labelledby`) →
  H2 instrumento (`#instrumento`) → H2 capítulos/ferramentas.

**Medições (scripts/_lcp.mjs, temporário)**

- Antes: 1440px LCP 388ms · num 547 · fonte 616 (vh 900);
  375px LCP 304ms · num 754 · fonte 823 — **FALHAVA** (vh 667).
- Depois: 1440px LCP ~400ms · num 538 · fonte 461;
  375px LCP ~300-480ms · **num 665 · fonte 578 — passa** (vh 667).
- LCP: variância ±50% entre corridas no `serve` local (ruído de fonte/
  rede); o elemento LCP é o mesmo H1 e o DOM acima da dobra só
  encolheu — sem regressão detectável.
- Fronteira servidor/cliente intacta: `simularSalario` corre em
  page.tsx; `FitaTalao`/`Adivinha` recebem números prontos.

**Screenshots** — `.screenshots/m10/` {home,instrumento}×{1440,375}.

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 16/16 ✓.

## M-11 — /salario: resposta primeiro, talão que se reimprime

- Entrada por pergunta: H1 "Quanto vais receber mesmo?" — "Módulo 01"
  e o kicker genérico fora. O lead explica os três cortes antes dos
  inputs.
- Herói `num-hero` (TweenNum, --dur-curta) acima do artefacto: o
  líquido lê-se antes e independentemente do talão — o valor muda já,
  a forma é que transita.
- Talão reimprime linha a linha a cada mudança de input: remount por
  `reciboKey`, cada linha `talao-linha` entra com `talao-imprime`
  (--dur-curta, stagger --linha) — papel, não fade.
- Carimbo `RETIDO` (talao-retido, --dur-micro + ease-rasgo, rotação
  física) apenas nas linhas cortadas: Seg. Social e IRS.
- EuroBar → `FitaTalao compacta` (.fita-compacta): a outra metade da
  história (custo total para a empresa) com o mesmo artefacto da home,
  em escala menor — um sistema, não dois artefactos parecidos.
- Reduced-motion: estados base = impressos; o kill universal cobre as
  classes novas sem CSS extra (verificado no teste 11).
- Fonte oficial (Retenção/escalões/TSU) permanece no rodapé do quadro.

**Screenshots** — `.screenshots/m11/` {topo,reimprime,fita}×{1440,375}.

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 16/16 ✓.

## M-12 — /impostos: o IVA separa-se do preço

- Talão de compras ao padrão de matéria M-01: zig-zag regular fora;
  arestas rasgadas deterministas via `mascaraFaixaRasgo` (materia.ts —
  mask-image SVG, a versão HTML da silhueta para artefactos de altura
  dinâmica). O talão passa a ser DUAS peças — compras e cupão RESUMO
  IVA — separadas por perfuração a sério (furos alpha por máscara,
  vê-se o fundo da página através deles).
- Separação animada: cada linha ganha a mini-decomposição
  [sem IVA | IVA] permanente; ao mudar um preço, um clone da fatia IVA
  desce da linha (iva-voa, --dur-curta, stagger 35ms) e as barras do
  cupão recebem-na (iva-chega, scaleX, atraso compensado). Sem legenda
  escrita — a cor torrada liga linha → cupão. Remount só em spans
  efémeros (runId): os inputs nunca perdem o foco.
- DecomposicaoFuel: barra empilhada → cascata vertical. A pilha
  produto→carbono→ISP sobe por degraus (--dur-curta, stagger 80ms),
  a chaveta "BASE DO IVA" desenha-se a medi-la (stroke-dash, pathLength
  normalizado) e o IVA pousa por cima com ease-rasgo — imposto sobre
  imposto visto, não só escrito. Re-anima por mudança (key fuel+preço).
- Legenda de cor nos números (swatch .sw por linha) — hoje inexistente.
- Reduced-motion verificado: estado base = completo (iva-voa base
  opacity 0; casca-brace desenhada por defeito — o from esconde-a só
  durante o delay); kill universal cobre o resto.
- "Módulo 02" fora — o mesmo rótulo genérico que M-11 removeu.

**Screenshots** — `.screenshots/m12/` {talao,separacao,cascata-meio,cascata-fim}×{1440,375}.

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 16/16 ✓.

## M-13 — /casa: a escritura em papel + a troca juro/capital

- Painel "No dia da escritura" → papel M-01 (talao + arestas rasgadas
  via mascaraFaixaRasgo + carimbo). Linhas com swatch de cor ligado à
  barra de acreção — cada custo tem a sua tinta (família torrada do
  "sai") e a sua camada na pilha.
- Acreção animada duas vezes: as linhas imprimem-se uma a uma
  (talao-linha, --stagger) e a barra .acre empilha uma camada por custo
  ao mesmo ritmo (delay = i×stagger + 80ms).
- Juro vs capital: faixa anual (agregação de prest.linhas por ano) —
  capital em keep ("fica teu", é património), juro em up ("vai para o
  banco"). A divisória troca de peso ao longo dos anos; revelação
  esq→dir (clip-path, --dur-longa) = a passagem do tempo. Régua por ano
  + readout + marcador.
- Regra do verde: varrimento color-keep/color-down — zero violações
  ("A casa (preço)" já usava --color-ink desde a faixa A). O select de
  finalidade já não truncava (corrigido antes).
- "Módulo"-style kicker já não existia aqui ("Comprar casa" — editorial).

**Bug encontrado e corrigido (também em M-11)**
- `<dl key={reciboKey}>` com filhos `<div>/<dt>/<dd>` NÃO remonta —
  duplica: o dl antigo ficava no DOM ao lado do novo (verificado:
  2 dl, 12 linhas). Padrão correcto: `<Fragment key>` dentro do dl
  estável — remonta os filhos, o dl fica. Aplicado em /casa e /salario.

**Gate de dobra — src/lib/useArmado.ts**
- Novo hook partilhado: `arm(cls)` só devolve a classe animada depois
  de o elemento entrar no viewport. Nascer à vista = nascer impresso
  (flag em silêncio; as MUDANÇAS animam). Abaixo da dobra, a primeira
  impressão acontece como revelação ao entrar.
- Aparência separada de animação: .talao-retido/.iva-voa/.iva-barra-f/
  .acre-seg ficam sempre; as animações passaram para -anim
  (.talao-carimbo-anim, .iva-voa-anim, .iva-barra-anim, .acre-anim).
- Aplicado em /casa (escritura+tempo), /salario (recibo+retido),
  /impostos (iva-voa/barra, cascata). FitaTalao mantém o seu sistema
  próprio (está sempre abaixo da dobra nos contextos actuais).

**Screenshots** — `.screenshots/m13/` {escritura,acrecao,tempo,scrub}×{1440,375}.

**Gates** — lint ✓ typecheck ✓ unit 178 ✓ data ✓ build 58 ✓ e2e 16/16 ✓.
