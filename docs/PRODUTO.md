# AO CÊNTIMO — produto e sistema

> **Estado: VIGENTE — este documento é a verdade única do produto.**
> Criado em 2026-09-18; actualizado em 2026-09-22 para integrar a direcção
> V3 «Ledger» (resumida em §3 — o texto completo e datado fica em
> `DIRECAO-V3.md`, hoje documento de registo) e a direcção V4 «o cêntimo
> como unidade» (§4–§6, do relatório `referencias/V4/00-RELATORIO.md`).
> Onde este texto e o código divergirem, **o código manda** e o texto
> corrige-se — a verdade vive em `src/app/globals.css` e em `/estilo`.
>
> Substitui, como contrato, os três planos históricos:
> `PLANO-LITERACIA-FINANCEIRA.md`, `PLANO-REDESIGN-BRUTO.md` e
> `PLANO-DESIGN-V2.md` — ficam como registo do que foi planeado e do que
> sobreviveu. O porquê de cada mudança está datado em `DECISOES.md`.

---

## 1. O que é

Site público e gratuito de literacia financeira para Portugal. Responde,
com dados oficiais e simuladores rigorosos, às perguntas que nenhum site
português cruza num só lugar: para onde vai o salário (bruto → líquido,
SS, IRS, custo para a empresa), quanto subiu o que se compra (inflação
por categoria), quanto do preço é imposto (IVA, ISP, cascata), o que é a
Euribor e porque subiu a prestação, onde rende a poupança.

Não é agregador de notícias, não é comparador comercial, não dá conselhos.
Read-only: sem contas, sem tracking, sem cookies, sem input pessoal.

**Público: dos 12 anos aos profissionais.** O nível 1 de cada página
lê-se sem saber nada; o nível 3 satisfaz um jornalista (ver §5).

## 2. Direcção — «instrumento vivo», escuro por omissão

Decisão do dono de 2026-09-17: o Observatório deixa de ser um arquivo e
passa a ser um instrumento vivo — mission-control do teu próprio dinheiro,
em português.

**Escuro por omissão.** `prefers-color-scheme` não distingue «sem
preferência» de «claro» — o light é o fallback universal dos browsers, e
tratar o sinal do SO como escolha escondia o escuro à maioria. Quem
prefere claro usa o toggle (persistido, visível no topo). Os dois temas
não são light+dark: são **o documento** (claro — papel de worksheet,
grelha milimetrada) e **o instrumento** (escuro — ecrã de registo, a mesma
malha em fósforo).

**O papel é a matéria dos artefactos — não do chrome.** Cada documento
fiscal é uma peça física: o recibo de `/salario`, o talão de compras em
duas peças de `/impostos`, a escritura de `/casa`, a declaração da
Segurança Social de `/trabalho`, a caderneta de Aforro de `/poupanca`,
a nota de liquidação de `/irs`. O contraste entre o instrumento frio e
o papel quente é deliberado — é a tese visual. O papel tem paleta fixa
(`--talao-paper`, `--talao-ink`, `papel-sai`/`papel-fica`) que **não
troca com o tema** — um recibo é um recibo, no escuro e no claro.

## 3. A linguagem V3 «Ledger» — dez regras (resumo)

Adoptada em 2026-09-21 a partir das referências do dono; o texto completo
e as decisões extraídas ficam em `docs/DIRECAO-V3.md` (documento de
registo — **integrada neste PRODUTO.md a 2026-09-22**). As dez regras:

1. **Cartão = objecto completo.** Cabeçalho (breadcrumb mono · estado),
   corpo com UMA ideia, rodapé com fonte + acções («ver →», «JSON»).
   Nunca células coladas de grelha.
2. **Uma cor de sinal** por cartão; tudo o resto em cinzentos quentes.
3. **Gráfico = uma frase.** O insight escreve-se no gráfico com linha de
   chamada tracejada; a área entre duas séries é hachurada (codifica uma
   diferença, não enfeita); a comparação em cinzento por baixo.
4. **Foco = impressão.** O cartão focado inverte para papel e a anotação
   desenha-se — o observatório imprime a leitura quando lhe pegas.
5. **Controlos físicos.** Inputs de valor são réguas com traços de
   unidade, marcador «agora» e presets em pílula; toggles com nó. Nunca
   `<input type=range>` com cara de browser.
6. **Explosão isométrica de traço fino** para composições — na V4 fica
   reservada à **estrutura** (ver §4 e §6).
7. **Números contam, nunca nascem.** Odometer do valor anterior; acima da
   dobra, SSR final.
8. **Sem teatro de scroll.** Os cartões entram com
   `IntersectionObserver` + `--stagger`; a narrativa vive dentro deles.
9. **Copy curto e afirmativo.** Uma frase por insight; metodologia em
   footnote ou `/metodologia`.
10. **Três níveis tipográficos apenas:** kicker mono caixa-alta, display
    Archivo, serifada para a frase-insight.

Anti-padrões V3 (somam-se à lista negra de §9): mostradores de agulha,
grelhas de cartões idênticos, moedas/ícones a rolar com scroll, anotações
sem linha de chamada ou mais de uma por gráfico, qualquer animação cuja
ausência não se note. Verificação de movimento: nenhuma animação se
aprova por screenshot — grava-se vídeo (`scripts/_video.mjs`) e revêem-se
os fotogramas antes do commit.

## 4. A direcção V4 — «o cêntimo como unidade»

Do relatório `referencias/V4/00-RELATORIO.md` (2026-09-22).
**V4 = V3 «Ledger» + a unidade + a arquitectura.** Não substitui a V3:
completa-a.

### A unidade: 1 ponto = 1 cêntimo

Partes de um todo em dinheiro desenham-se em **pontos contáveis**: de cada
euro, 100 pontos; os que saem (TSU, IRS, SS, IVA…) e os que ficam. É o
nome do produto feito sistema; uma criança conta pontos, um profissional
lê a proporção exacta (arredondamento pelo maior resto — os pontos somam
sempre o total e o texto diz o valor com casas decimais). O movimento é a
explicação: os pontos voam de onde estão para quem os leva.

**Unidades contáveis** são a codificação principal de quantidade na V4:
pontos para dinheiro, traços para contagens e limites («1 traço = x»,
com a unidade escrita no cartão).

**Regra de ouro:** *isométrico = estrutura (o que é); pontos = quantidade
(quanto é).* Nunca o contrário — um diagrama isométrico nunca dimensiona
peças por valor.

### A arquitectura: três níveis em todas as páginas de conteúdo

| Nível | Para quem | O que tem |
|---|---|---|
| **1 · A resposta** | toda a gente, incluindo 12 anos | a pergunta (h1), UM instrumento, UMA frase simples com o número (≤ 25 palavras, sem jargão) |
| **2 · Explora** | quem quer mexer | os controlos (réguas, presets), cenários, a visualização própria da página |
| **3 · Confirma** | profissionais, jornalistas | tabelas, legislação, fórmulas, fontes, JSON — em `<details>` fechado por omissão |

Cada página termina com **a pergunta seguinte**, para ninguém chegar a um
beco. Os níveis têm marcação semântica coerente (landmarks/headings):
cada nível é uma `<section aria-labelledby>` — o nível 1 é etiquetado
pelo h1 da página (a pergunta é o nome da secção), os níveis 2 e 3 têm
h2 próprio («Explora», «Confirma»).

**Implementação partilhada (S1-06, congelada):** `Pagina` +
`PaginaDetalhe` (o `<details>` fechado por omissão do nível 3) e
`Cartao` — a anatomia Ledger fixa que todo o cartão-instrumento
partilha: cabeçalho (breadcrumb mono · meta · selo de estado), corpo
com UMA ideia, controlos opcionais, rodapé (fonte + «ver →» + «JSON»).
O `Leitura` nasce sobre `Cartao`; o orbe de estado (S1-08) monta-se no
selo sem mudar a API (`estado` + `estadoRotulo` — o estado existe
sempre em texto). Em dev, `Pagina` avisa na consola se o nível 1 tiver
mais de um instrumento ou a frase mais de ~25 palavras — nunca falha
o build.

### A história canónica do euro

Uma só história do salário, contada da mesma maneira em todo o site
(implementação única: `src/lib/canonico.ts` — quem mostra estes números
consome de lá, nunca recalcula):

1. **Começa no custo total para a empresa** — bruto + TSU patronal. É o
   facto revelador: a empresa paga mais do que o salário que o
   trabalhador vê no contrato.
2. **Desce pelos cortes** — TSU da entidade, IRS retido, Seg. Social do
   trabalhador.
3. **O «líquido» é o do recibo** — o valor mensal com a retenção na
   fonte real das tabelas em vigor. O ano canónico é esse recibo × 12.

O caso-base é solteiro(a), sem dependentes, continente, sem subsídio de
alimentação, bruto de referência 1 500 €/mês (`BRUTO_CANONICO`).

**A grelha canónica (S1-09).** O motor fiscal fica no servidor/build.
Para as réguas de salário no cliente, `npm run derive` gera
`data/derived/cenarios-salario.json`: o salário mínimo em vigor e
depois **múltiplos exactos de 50 € até 6 000 €** (103 pontos —
inclui sempre os redondos como 1 500 €). Cada linha traz bruto, custo
empresa, TSU entidade, SS, IRS retido, líquido, tabela de retenção,
a repartição em cêntimos por euro de custo (pontos inteiros, Σ=100) e
a simulação anual a 14 meses — tudo saído do motor, nunca inventado.
A régua (`Regua` com `pontos`) só pára nestes valores: **nunca se
interpola um número que o motor não calculou.** No perfil canónico o
cliente lê a linha da tabela; perfis fora do caso-base (casado,
dependentes, subs. alimentação, IRS Jovem — dimensões não tabeláveis,
como o bruto livre do cônjuge) pedem o motor por `import()` dinâmico —
fora do first-load, e enquanto carrega o recibo mostra o último valor
calculado (DECISOES 2026-09-23).

**Outras leituras não se misturam.** A média a 14 meses (duodécimos) e a
estimativa de IRS anual (liquidação) são representações diferentes —
cada uma vive na sua página, com uma frase a explicar a diferença
(`/salario` tem as duas). Nenhum cartão fora delas as usa como
«líquido».

### A navegação: quatro perguntas + Aprender

Substitui a lista de itens soltos (implementação: sessão S1-07 da V4;
hoje a nav é uma lista plana — o alvo é):

| Pergunta | Páginas |
|---|---|
| **O que ganhas** | Salário · IRS · Trabalho |
| **O que pagas** | Impostos · Preços · Inflação |
| **O banco** | Crédito · Casa · Poupança |
| **O país** | Dados |
| **Aprender** | glossário e micro-demonstrações |

## 5. O catálogo de codificações

Conjunto fechado: cada tipo de dado tem a sua forma, e cada gráfico é
diferente por razão — não por acaso. Componentes marcados *(a construir)*
são fundação partilhada da V4 (sessões S1-04/S1-05) e congelam depois
de construídos.

| Codificação | Quando se usa | Quando NÃO se usa | Componente |
|---|---|---|---|
| **Campo de cêntimos** (pontos) | partes de um todo em dinheiro (1 ponto = 1 cêntimo) | estrutura sem quantidade; séries temporais; totais que não se repartem | `CampoCentimos` + `src/lib/pontos` (S1-04 — congelado) |
| **Linha anotada** | série temporal com UM facto a assinalar (chamada + insight escrito) | partes de um todo; comparações instantâneas sem tempo | `Leitura`, `LineChart`, `Spark` |
| **Haltere** | antes ● — ○ agora, por categoria, sobre grelha pontilhada | mais de dois pontos no tempo; série contínua | `Haltere` (S1-05 — congelado) |
| **Barra de traços** | contagem, limite, duração — «1 traço = x» com a unidade escrita no cartão | dinheiro contínuo; proporções de um todo | `BarraTracos` (S1-05 — congelado) |
| **Recipientes** | escalões e bandas que enchem por ordem | série temporal; parte-todo fora de escalões | `EscaloesEnchem` (`/irs`) |
| **Papel** | documentos oficiais: recibo, talão, escritura, caderneta, nota de liquidação | chrome do instrumento; decoração; qualquer peça que troque de cor com o tema | `PecaPapel`, `Papel` |
| **Isométrico de traço** | **estrutura** — o que compõe algo, em camadas com linha de chamada | **nunca quantidade** — nenhuma prop de valor dimensiona camadas | `Isometrico` + `EuroExplodido`/`CustoExplodido` (S1-05 — congelado) |
| **Anel de pontos** | ciclos (ex.: os 12 meses), número ao centro | progressão linear; parte-todo | `AnelPontos` (S1-05 — congelado) |
| **Régua** | todo o input numérico (traços de unidade, marcador «agora», presets) | como saída/leitura — é controlo, não visualização | `Regua` |

O **orbe de estado** (`OrbeEstado`, *a construir, S1-08*) é o selo de
frescura tornado objecto: pequeno desenho de pontos cuja **forma** diz o
estado (em dia = calmo e cheio; a recolher = em rotação; atrasado =
esburacado). O estado existe sempre também em texto.

## 6. Sistema visual

Lido do código (`src/app/globals.css`, `src/app/estilo`) — não de planos.

### Elevação — quatro níveis, um instrumento

| Token | Nível | Uso |
|---|---|---|
| `floor` | 0 | fundo da página — o único nível com textura |
| `panel` | 1 | bloco de conteúdo — a chapa onde as coisas se montam |
| `raised` | 2 | resultado — o que o instrumento devolve (`shadow-raised`) |
| `overlay` | 3 | menu, tooltip — acima de tudo (`shadow-overlay`) |

No claro a elevação é sombra subtil (a superfície recua). No escuro é
luz: luminância crescente na rampa + um fio de 1 px na aresta superior —
sombra não se vê no escuro. `--recess` marca cavidades (`.field`).

Regras: textura só no `floor`; `panel`/`raised`/`overlay` nunca têm
textura; `overlay` não leva texto `muted` — só `ink`/`ink2`; o grão é
global (o vidro do instrumento); `.blueprint` (pontos) não é um nível —
é textura de zona de medição, atrás de diagramas.

### Cor — semântica, não decoração

| Token | Papel |
|---|---|
| `accent` / `accent-ink` | vermelhão-sinal — **só** o dinheiro que sai |
| `keep` | verde — **só** o que fica contigo (líquido, positivo) |
| `mark` | ocre/torrado — marcador funcional: fonte, citação, anel de foco |
| `up` / `down` | variação — sempre com ▲/▼, nunca só cor; `Delta` tem estado neutro |
| `warn` | aviso |
| `ink` / `ink2` / `muted` | tinta — `muted` passa AA nos dois temas |
| `line` / `line2` | hairline / regra, borda de campo |

Regra V4: **bruto e custo total são neutros** — nem `accent` nem `keep`.
Nunca três cores semânticas no mesmo cartão (regra V3-2). Nos montes de
pontos: sai = `accent`, fica = `keep`, neutro = cinzento.

### Marca — o logótipo em contornos (decisão do dono, 22.09.2026)

O logótipo são os **contornos reais da Archivo** (instância wdth 125 ·
wght 800, a fonte que o site já serve): `<Logo>` e `<LogoMark>` em
`src/components/Logo.tsx` são SVG de dois e três `<path>` — vetor puro,
sem fonte, sem `clipPath`, certo antes do CSS de texto e sem JavaScript.
O C de CÊNTIMO é o sinal de cêntimo cortado por uma **haste contínua**
(opção A aprovada; a interrompida e a variante moeda ficaram de fora).

Regras de uso:

- **Cor.** A tinta é `currentColor` (≡ `--ink` no contexto); a haste é
  **sempre `--keep`** — nunca `--accent`, nunca a cor da tinta. O símbolo
  é fixo nos dois temas: azulejo `#1B1811`, C `#F2ECDD`, haste `#63D6A4`
  a sangrar de ponta a ponta, raio 22 %.
- **Medida.** A altura CSS é a do SVG (do topo ao fim da haste); a
  capitular é **63,95 %** dela. Cabeçalho: 20,6 px de capitular no
  telemóvel, 24,8 px no computador.
- **Mestres.** `normal` ≥ 20 px de capitular (a fenda do C tem 1 px
  exato); `pequeno` entre 12 e 20 px (sem fenda, haste mais grossa,
  espaçamento aberto); abaixo de 12 px ou em espaço quadrado, **símbolo**.
- **Área de proteção.** Espaço livre à volta da palavra igual à altura
  das capitulares (x): nada entra aí — nem texto, nem arestas de painel.
- **Proibições.** Haste noutra cor; haste sem recorte (barra pousada por
  cima do C); esticar ou redesenhar as letras — os paths vêm da fonte e
  não se editam à mão (regeneram-se do gerador, mínimo 2 casas decimais).

Ícones: `icon.svg` = grelha de 32; `icon1.png`/`icon2.png` = 16/32 px
rasterizados dos desenhos próprios de cada grelha; `apple-icon.png` e
`favicon.ico` (16+32) saem do azulejo e das grelhas de favicon. A imagem
OG usa a palavra em contornos — nunca texto com a fonte.

### O ¢ como símbolo da casa — onde pode e não pode aparecer

O ¢ desenhado (o C com haste) é **marca**, não ícone nem carácter de
texto. Regra fixa (1B-01):

- **PODE** aparecer como `LogoMark`/azulejo onde a casa assina:
  favicons e `icon.svg`, `apple-icon`, manifest, imagem OG e cartões de
  partilha, o cabeçalho/rodapé onde já vive o logótipo, a página
  `/estilo` e o `/sobre` (contextos de marca).
- **PODE** aparecer como **marcador do selo «1 ponto = 1 cêntimo»** —
  o azulejo pequeno ao lado da legenda dos campos de pontos
  (`CampoCentimos` e famílias de pontos), porque ali a unidade *é* o
  cêntimo. É a única posição funcional permitida fora da marca.
- **NUNCA** como ícone de menu/acção — esses são os traços do conjunto
  fechado (`Icone`), e o ¢ não entra nele.
- **NUNCA** junto de um número nem como unidade — escreve-se
  «cêntimos» ou «c» («63,2 c»), nunca «63,2 ¢».
- **NUNCA** como marcador de lista, ornamento de fundo, marca de água,
  nem recolorido — a haste é sempre `--keep` (ver §6 «Marca») e o
  azulejo tem a sua paleta fixa.

### Ícones — conjunto fechado de traço próprio (1B-01)

Um sistema de símbolos, não uma biblioteca: **25 desenhos à mão** na
grelha **20×20**, traço **1,5 px**, terminações e juntas redondas, sem
preenchimentos, em `currentColor`. Iconografia stock é proibida e o
conjunto é fechado — `<Icone nome>` falha num nome fora da lista.

| Família | Nomes |
|---|---|
| páginas (um por pergunta) | `salario` `irs` `trabalho` `impostos` `precos` `inflacao` `credito` `casa` `poupanca` `dados` `aprender` |
| acções | `ver` `json` `copiar-ligacao` `repor` `abrir` (chevron, roda 180° no estado aberto) `menu` `pesquisa` `sol` `lua` |
| estado (a família do `OrbeEstado`, em pontos de traço) | `em-dia` `a-recolher` `atrasado` `aviso` `informacao` |

Regras:

- **Acessibilidade.** `aria-hidden` por omissão — o significado mora no
  texto ao lado. Ícones de acção vivem **sempre** dentro de
  `<button>`/`<a>` com nome acessível próprio (`aria-label` ou texto
  visível); a prop `rotulo` existe só para o caso raro de um ícone
  sozinho com significado próprio (`role="img"`).
- **Movimento (tipo 2).** Ao passar/focar o controlo que o envolve, o
  traço desenha-se **uma vez** (`stroke-dashoffset` sobre
  `pathLength=1`, `--dur-micro`, passo de ~22 ms por traço) — CSS puro,
  sem JS; em `prefers-reduced-motion` nasce já desenhado.
- **`<IconeEmblema>`** é o ícone dentro do **quadrado de contorno
  tracejado** da referência (raio pormenor), para o cabeçalho dos
  cartões `Cartao` — monta-se com a prop `icone` e desenha-se com a
  inversão para papel no foco/à passagem.
- Um nome novo entra só por tarefa de fundação — nunca ad hoc numa
  página; a folha completa com as regras vive em `/estilo` §Ícones.

### Raio com significado (V4 — substitui o «radius 0 em todo o lado»)

| Token | Valor | Significado |
|---|---|---|
| `--raio-papel` | 0 | papel — é cortado, não arredondado (talões, recibos, `.field`) |
| `--raio-pormenor` | 2 px (= instrumento ÷ 7) | aresta mínima de peça maquinada — carimbo, trilho, gauge |
| `--raio-instrumento` | 14 px | o objecto completo — cartão Leitura, resultado, overlay |
| `--raio-controlo` | 999 px (pílula) | o que se carrega — presets, toggles, `.btn`, marcadores |

O raio diz a matéria da peça. Geometria de desenho (`rx`/`ry` de svg,
círculos) não é raio de objecto — fica fora da escala por natureza. Os
utilitários Tailwind `rounded-papel/pormenor/instrumento/controlo`
apontam para estes tokens; nenhum `border-radius` literal existe fora
deles.

### Tipografia — escala fechada (S1-03)

Sete papéis e nada mais: **kicker, rótulo, corpo, insight, número de
leitura, número herói, título**. Cada degrau é um token `--text-*` em
`@theme` (gera o utilitário `text-*`); a escala por omissão do Tailwind
está fechada (`--text-*: initial`). Nada escreve um `font-size` fora
destes tokens — os únicos `font-size` relativos que restam são razões
`em` dentro do mesmo registo (`.num-unit`, `.num-sign`, `.regua-un`).

| Papel | Token(s) | Registo |
|---|---|---|
| kicker | `--text-micro` (9.6) · `--text-mini` (10) · `--text-kicker-sm` (10.4) · `--text-kicker` (11) | mono, caixa-alta, muted por defeito |
| rótulo | `--text-rotulo` (12) · `--text-nota` (13) | rótulos/readouts; `.footnote` |
| corpo | `--text-corpo-sm` (14) · `--text-corpo` (15.2) | Space Grotesk — `.body-copy`, `.field`, tabelas |
| insight | `--text-grande` (18) · `--text-insight` (19) | Source Serif — `.lede`, `.leitura-insight` |
| número de leitura | `--text-numero` (22) | `.num-read`, Space Mono tabular |
| número herói | `--text-valor` · `--text-valor-amplo` · `--text-hero-sm` · `--text-hero` (clamps fluidos) | `.leitura-valor`, `.num-hero` — Archivo `tnum` |
| título | ver abaixo — só dois estilos | Archivo `wdth` |

Escada partilhada de display — `text-display-xs → 3xl` (20 · 24 · 30 ·
36 · 48 · 60 · 72 px): h2 de secção/capítulo, stats e números grandes
usam-na com `.font-display` ou `.num`; não é um terceiro estilo de
título, são degraus.

**Títulos — só dois.** O eixo `wdth` do Archivo é o instrumento
expressivo que os separa:

| Estilo | Archivo | Uso |
|---|---|---|
| `.titulo-pagina` | expandido, `wdth` 125, caixa-alta | um por página — a manchete institucional |
| `.titulo-hero` | condensado, `wdth` 75 | só o herói da home — o monumento |

Sub-escalas fora do cromado mas dentro do sistema: `--text-svg-*`
(texto dentro de viewBox — unidades do desenho, escalam com o svg) e
`--text-talao-*` (o talão é um documento de impressora térmica —
typesetting próprio). Impressão usa `--text-impressao` (pt de papel,
não rem). As imagens OG são raster — a sua escala (`OG_TIPO` em
`src/lib/og.tsx`) é tipografia de imagem 1200×630, não da página.

### Motion — gramática (M-02)

O site tem movimento porque o movimento **explica transformações** —
não porque fica bonito. Três tipos, e só dois existem:

1. **QUE EXPLICA** — a transformação dos dados acontece à vista: a fita
   rasga, a barra parte-se, a série desenha-se, os pontos voam para o seu
   monte, o número desliza do valor anterior para o novo.
2. **QUE RESPONDE** — hover, foco, o gráfico a reagir ao cursor.
3. **QUE DECORA** — lista negra. Não existe.

**Quatro durações. Só estas** — uma duração é um significado:

| Token | Valor | Significado |
|---|---|---|
| `--dur-micro` | 120ms | resposta ao toque (tipo 2) |
| `--dur-curta` | 320ms | mudança de estado — tema, painel, barra que reparte |
| `--dur-media` | 600ms | transformação explicada (tipo 1) |
| `--dur-longa` | 1200ms | sequência orquestrada — irmãos escalonados |

**Três curvas + linear:**

| Token | Uso |
|---|---|
| `--ease-entra` | o que chega — default |
| `--ease-sai` | o que parte |
| `--ease-rasgo` | o acto físico — elástica contida; só o rasgo |
| `--ease-lin` | só movimento contínuo (ticker); proibida em transições |

**Um escalonamento:** `--stagger` (90ms) entre irmãos — sempre o mesmo,
em cascatas, barras, sparks e odómetro.

**Orquestra de estado (M-09)** — quando um input muda, o que muda no
ecrã transita como uma coisa só: o número (`TweenNum`), a barra e a
cascata partilham o mesmo tempo — `--dur-curta` (320ms). O que é
revelação ou explicação (`--dur-media`, `--dur-longa`) não entra na
resposta ao input.

**Regra da dobra (precisa):** nada ENTRA com animação acima da dobra ao
carregar; o valor final está no HTML do servidor. Animação ambiente só
no herói da home: pausa fora do ecrã e com o separador escondido, e
desliga-se em `prefers-reduced-motion`. Abaixo da dobra, a entrada é
armada por JS (`useArmado`/`Kinetic`/`Spark`/`LineChart` seguem esta
regra). Nenhum estado de carregamento decorativo — não existem spinners
nem esqueletos; o SSR traz sempre o valor final.

**`prefers-reduced-motion` = estado final imediato**, nunca animação
atenuada — corta todas as transições e animações (`!important`,
universal — uma animação nova nasce coberta). O tipo 2 mantém-se:
hover/focus não são motion. O contrato tem teste e2e que percorre todas
as rotas e falha se algum elemento animar.

O número nunca espera pela animação — o valor final está no DOM desde o
primeiro paint, e nunca fica ilegível durante a transição.

**Verificação:** nenhuma animação se aprova por screenshot — cada peça
animada grava vídeo com `scripts/_video.mjs` e revêem-se os fotogramas
antes do commit (regra V3, permanente).

### Matéria — papel determinista (M-01)

As peças de papel nascem de `src/lib/materia.ts`: rasgo determinista
(irregular, nunca serrilhado), perfurações a sério (buracos que mostram
o fundo), sombra própria por peça. `PecaPapel` e `Papel` são as
primitivas.

### Motor de valores (M-03)

`useValorAnimado` é o único motor: interpola do valor anterior, nunca de
zero. `TweenNum` (texto) e `Odometer` (dígitos que rodam) são os dois
apresentadores; o contrato é SSR com valor final + `aria-live` num
só readout.

### Rampas sequenciais (M-04)

Séries ordinais usam `--seq-1…4` (azul-aço). Em SVG inline referem-se
sempre como `var(--seq-N)` directo — os aliases `--color-*` de
`@theme inline` só existem quando há utilidade Tailwind correspondente.
A rampa candidata `seqb` (âmbar escurecido) está desenhada em `/estilo`
à espera da decisão do dono (ver DECISOES.md — pergunta em aberto).

## 7. Intocável

- **O ¢** — o C do wordmark é o sinal de cêntimo desenhado (arco à
  cap-height + haste verde-keep); `LogoMark` é o ¢ sozinho. Fora do
  logótipo só onde a casa assina e no selo «1 ponto = 1 cêntimo» —
  regras completas em §6 «O ¢ como símbolo da casa».
- **O papel** — os documentos fiscais são peças físicas (recibo, talão,
  escritura, declaração, caderneta, nota de liquidação); o talão de
  `/salario` tem escala tipográfica própria (`talao-*`) porque é um
  documento, não chrome.
- **A semântica das cores** — verde = fica contigo, vermelhão = sai,
  ocre = fonte/foco, bruto e custo total neutros. Nunca decoração.
- **O raio com significado** — papel 0, instrumento 14 px, controlos
  pílula (§6).
- **A unidade** — 1 ponto = 1 cêntimo; isométrico = estrutura, pontos =
  quantidade.

## 8. Regras de produto — não mudaram

1. **Regra nº1: nunca inventar dados.** Fonte falha → mostra a falha
   (`—`, `EmptyState`, badge de série atrasada) — nunca um número
   plausível.
2. **Cada número tem fonte + data visíveis** (`Source` sob cada figura;
   `data/meta/sources.json` alimenta o selo de frescura).
3. **PT-PT europeu.** Proibido: usuário, tela, você, portfólio
   (portefólio), «descobre/potencia». Segunda pessoa do singular.
4. **Regras fiscais em `data/fiscal/*.json` por ano** com fonte e
   vigência — nunca hardcoded, entram por PR manual com fonte legislativa.
5. **Motores em `src/lib/engines/`** são funções puras testadas, sem UI;
   o motor fiscal não entra no bundle do cliente — os cenários chegam
   pré-calculados por props.
6. **Sem aconselhamento financeiro** — disclaimer permanente.
7. **Copy é do dono.** Agentes propõem estrutura; não publicam texto sem
   revisão.

## 9. Lista negra

Gradientes de herói · roxo/violeta · glassmorphism · emoji como ícone ·
ilustração stock · sombra difusa grossa em tudo · paleta categórica em
séries ordinais · grelhas de cartões idênticos · scroll-jacking / secções
presas longas · fade-up genérico · mostradores de agulha · qualquer
animação que atrase a leitura de um número.

## 10. Stack, dados e rotas

Next.js App Router + TypeScript strict, Tailwind 4, `output:"export"`
(estático — serve-se `out/`, `next start` não funciona). Sem base de
dados: «dados como código» — `scripts/ingest` (Actions cron) →
`data/sources` + `data/derived`, validação zod, watchdog de frescura.
Gráficos SVG/Canvas à medida. Deploy: GitHub Pages, domínio
`aocentimo.pt`.

Gates antes de merge: `lint && typecheck && test:unit && validate:data &&
build && test:e2e`.

### Rotas (as que existem em `src/app/`)

`/` (home) · `/salario` `/irs` `/impostos` `/poupanca` `/credito`
`/casa` (dinheiro) · `/inflacao` `/precos` (preços) · `/trabalho`
`/dados` (país) · `/aprender` + `/aprender/[slug]` · `/metodologia`
`/estilo` `/sobre`.

### Instrumentos → uso → contrato a11y

| Componente | Uso | Contrato |
|---|---|---|
| `LineChart`/`Spark`/`Kinetic` | séries temporais | svg `aria-hidden` + equivalente (tabela sr-only); animam só abaixo da dobra ou em interacção |
| `Cartao` | anatomia Ledger de qualquer cartão | cabeçalho/corpo/controlos/rodapé; selo de estado sempre com texto; inversão para papel |
| `OrbeEstado` | selo de frescura — a forma diz o estado | disco cheio/anel oco/esburacado/anel em rotação; SVG aria-hidden + texto ao lado; rotação pára fora do ecrã |
| `Icone`/`IconeEmblema` | símbolos — páginas, acções, estado | conjunto fechado 20×20, traço 1,5; `aria-hidden` por omissão; acções sempre em controlo nomeado; desenham-se uma vez ao foco/passo |
| `Pagina`/`PaginaDetalhe` | template de três níveis das rotas de conteúdo | níveis = `section aria-labelledby`; confirma em `<details>` fechado |
| `Leitura` | cartão Ledger de leitura | insight escrito, anotação com chamada, fonte+estado no rodapé |
| `EuroBar`/`Cascata`/`JuroCapital`/`EuroExplodido`/`CustoExplodido` | comparações e decomposições | equivalente textual único; SSR no estado final |
| `PecaPapel`/`Papel` | documentos | paleta fixa de papel; rasgo determinista |
| `Regua` | input numérico | traços de unidade + marcador + presets; valor sempre legível |
| `Odometer`/`TweenNum`/`NumHero` | números | valor final no SSR; `aria-live` num só readout |
| `Delta` | variações | ▲/▼ + cor semântica; estado neutro existe |

Regra transversal: um equivalente por figura, `fmtPeriodo` para todos
os períodos (`2026-Q1`→«1.º trim. 2026»), fonte+data sempre visíveis,
container queries nos cartões (o cartão adapta-se ao seu espaço, não ao
ecrã — nunca dois rótulos sobrepostos).

### Séries e SLAs

Eurostat (mensal, watchdog em `scripts/derive/freshness.ts`):
IHPC CP00 + 12 divisões ECOICOP + agregados, desemprego
PT/UE27/jovem, HPI, LCI, PIB homólogo, confiança, electricidade.
BPstat (mensal): Euribor 1/3/6/12M + 8 TAEG. DGEG (diário):
PMD gasóleo/gasolina/GPL + electricidade doméstica. Derivados
(sem SLA próprio — herdam o pior estado dos inputs): `ca-base`,
`casa-em-salarios`, `desemprego-gap`, `hicp-resumo`, `painel`.
Estados: `em-dia` / `atrasada` / `sem-sla` — a falha mostra-se.

### Arquitectura de motion

Nada importa `gsap` estaticamente. `carregarGsap()` é um dynamic
import memoizado chamado só quando `motionActiva()` (não
reduced-motion) E há movimento legítimo (abaixo da dobra via
`useArmado`/IntersectionObserver, ou interacção). Durações/curvas
lidas dos tokens CSS (`dur()`, `ease()`). Em reduced-motion o chunk
do GSAP **não é descarregado** — tem teste e2e que percorre todas as
rotas e intercepta os pedidos.

### Orçamento de performance (medido, `_js-por-rota` + `_sweep`)

- JS inicial: piso ~460 KB — o chunk partilhado (459 KB na rota mais
  leve) é ~100 % framework (react-dom 196 KB + flight/router/
  segment-cache); código nosso no shared ≈ 4 KB (SiteNav). Rotas:
  **459–569 KB**. O alvo 450 KB é impossível neste stack — o que
  controlámos (`pt.json`, `data/*.json`, instrumentos) já saiu.
  O `CampoCentimos` e o motor de pontos têm tecto próprio de ~15 KB
  gzip por rota (orçamento V4, medido com `_js-por-rota`).
- LCP medido no sweep local: ~0,5–1,6 s; CLS ≤ 0,09; AA 0 falhas nos
  dois temas.
- OG images ≤ 53 KB; fontes latin+swap, só as 4 famílias usadas.

## 11. Referência viva

`/estilo` — tokens, tipografia, botões, selo de evidência e padrões de
acessibilidade de gráficos, ao vivo nos dois temas; cada codificação do
catálogo (§5) entra lá com exemplo vivo e a regra «quando usar / quando
não usar». Quando o sistema mudar, `/estilo` e este documento mudam
juntos.
