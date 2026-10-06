# O mapa inline da home — onde estão os 471 KB e o que os remover custa

2026-10-06. De `f236412` (main). Instrumento:
[`scripts/_perfil-lcp.mjs`](../scripts/_perfil-lcp.mjs); irmãos deste:
[`LCP-HOME.md`](./LCP-HOME.md) e [`CLS-HOME.md`](./CLS-HOME.md).

O orçamento da home (`docs/PACK-V5-PRODUCAO.md` §4) pede **LCP ≤ 2,5 s** e
**CLS ≤ 0,05**. O CLS ficou fechado (`Archivo-intro`/`size-adjust`). O LCP
continua acima da meta em produção, e o **mapa** é o próximo item: o bloco de
`<div class="b-mundo">` até ao fim do `</section>` é **471 782 B** de um
documento de **583 964 B** — **80,8 %** — com **4 796 elementos**.

Este documento não propõe uma correcção: mede o que está lá e ordena as
correcções possíveis por **ganho** e por **risco**.

## 1. O que é sólido (reprodutível, independente de carga)

Medido no HTML publicado (`https://aocentimo.pt/`, `etag "6ac5384d-8e91c"`),
que é **byte a byte** o `out/index.html` local (`583 964 B` nos dois):

| | valor |
|---|---|
| HTML cru | 583 964 B |
| bloco do mapa | 471 782 B (**80,8 %**) |
| … em atributos | 408 173 B (**86,5 % do mapa**) |
| nós | 4 796 |
| `<path>` · `<g>` · `<rect>` · `<circle>` · `<svg>` | 2 261 · 547 · 970 · 389 · 17 |
| `d="…"` (só os valores) | 89 655 B (**19 %** do mapa) |
| HTML gzip na rede | ~76 KB, dos quais o mapa ~54 KB |

Os bytes do mapa **não** estão no desenho. Estão nos **atributos repetidos**:

| atributo | bytes | % do mapa |
|---|---|---|
| `d` | 98 699 | 20,9 % |
| `stroke-width` | 61 577 | 13,1 % |
| `stroke` | 54 953 | 11,6 % |
| `fill` | 37 231 | 7,9 % |
| `points` | 32 464 | 6,9 % |
| `transform` | 17 592 | 3,7 % |

E o que se repete é brutal — os dezasseis valores de atributo mais frequentes valem ~100 KB:
`stroke="#16130f"` aparece **2 140×**, `stroke-width="1.2"` **543×**,
`stroke-width="1.1"` **474×**, `stroke-linejoin="round"` **333×**,
`stroke-linecap="round"` **299×**.

### O gzip já come isso

A redundância acima comprime quase toda. Simulei no HTML real tirar **todos**
os atributos de apresentação (`stroke`, `stroke-width`, `stroke-linejoin`,
`stroke-linecap`, `fill`, `fill-rule`, `opacity`) — o **limite superior** de
"isto vai para CSS":

```
mapa cru   471 782 B  →  290 397 B   (−181 385 B, −38 % do mapa, −31 % do HTML)
mapa gzip   53 880 B  →   45 025 B   (−8 855 B, −16 % do mapa gzip)
```

**Trinta e oito por cento dos bytes crus valem 16 % na rede.** É a lição
central deste documento: o custo do mapa **quase não é download** — é
**parse, DOM, layout e pintura na linha principal**.

E o mapa **não atrasa o FCP**: em todas as variantes com mapa, o FCP fica em
1 828–2 000 ms (o JS vale ~0,68 s dele: `sem-js` dá 1 176 ms). O mapa atrasa
**a pintura do LCP**, não o arranque.

## 2. O que o instrumento diz (e os seus limites)

`_perfil-lcp.mjs`, CPU 1×, mediana de 3, no build actual (servido local, TTFB
~0). Carga da máquina **6,1 → 7,0** durante a corrida — alta, e é a ressalva
de leitura no fim.

| variante | FCP | LCP | longTasks | nós | elemento do LCP |
|---|---|---|---|---|---|
| `original` | 1 852 | **5 620** | 7 097 | 5 695 | `SPAN` / `P` (varia) |
| `intro-sem-fonte` | 1 928 | 3 984 | 7 389 | 5 695 | `P` |
| `bloq-fontes` | 2 000 | 4 000 | 7 675 | 5 695 | `H1` |
| `cv-hidden` (mapa no DOM, não pintado) | 1 828 | **4 352** | 7 284 | 5 695 | `P.b-lead` |
| `sem-mapa` (bloco fora do HTML) | 1 864 | **3 968** | 7 438 | **895** | `P.b-lead` |
| `sem-js` | 1 176 | — | 0 | 5 695 | — |

Leituras:

- **O tecto do mapa são ~1,3–1,8 s de LCP.** `cv-hidden` (mantém o DOM, tira
  a pintura) baixa 5 620 → 4 352; `sem-mapa` (tira o bloco) baixa para 3 968.
- **A metade maior é pintura, não parse**: entre `cv-hidden` e `sem-mapa` vão
  só ~0,4 s, e entre `original` e `cv-hidden` vão ~1,3 s. Logo o que se ganha
  a simplificar o **desenho** (menos tinta) é maior do que o que se ganha a
  reduzir bytes.
- **Os long tasks (7,1–7,7 s) NÃO são o mapa**: `sem-mapa` mantém 7 438 ms.
  Quem os faz é o resto da hidratação (`ambiente.ts`, GSAP, câmara).
- **Duas ressalvas honestas.** (a) Em `cv-hidden` e `sem-mapa` o elemento do
  LCP **muda** para o `P.b-lead`, mais abaixo — não é uma comparação
  como-por-como; os deltas são um tecto, não um valor. (b) A carga de 6–7
  por 8 núcleos alarga tudo; as medianas de `original` (5 620 aqui) são
  maiores que as da `LCP-HOME.md` (4 616), medida com a máquina mais quieta.

## 3. O plano, por ganho e risco

### Item 0 — Um instrumento que isole o mapa (pré-requisito) · risco baixo

O `sem-mapa` actual quebra a hidratação (o cliente volta a montar o mapa por
`mundoBairro`/`dangerouslySetInnerHTML`) e muda o elemento do LCP. Antes de
gastar trabalho em qualquer item, vale ter **uma variante limpa**: o mapa no
DOM mas com o bloco servido **depois** do conteúdo (o mesmo HTML, ordem
trocada) — mede o parse/pintura sem mexer no que é o LCP. Custo: uma variante
no instrumento; nenhum risco para o produto.

### Item 1 — Arredondar os decimais longos (higiene) · ganho pequeno, risco ~zero

Há **1 838 números com 13 a 17 casas decimais** no mapa, todos fora do `f1()`
do projecto (`iso.ts`: `f1 = n => +n.toFixed(1)`). São contas de grelha que
nunca passaram pelo arredondamento:

```
x="450.7913042639576"      (95 rects — planta.ts, a fonte do largo)
d="M482.7913042639576 -60 v6"   (523 paths)
height="44.800000000000004"
cy="-18.900000000000002"
```

Sítios concretos: `planta.ts` linhas 271–272 (`fonte`, `hera`), 291 (escadas),
320 (`portao`), 375; `mundo.ts` 92 e 104 (`viewBox`/`width`/`height`).

Passei o HTML real por "todos os números com ≥2 decimais → 1 decimal":

```
mapa cru  471 782 → 445 484  (−26 298 B, −5,6 % do mapa)
mapa gzip  53 880 →  52 355  (−1 525 B)
```

Ganho pequeno e sobretudo **cosmético** na rede; o valor é o do parse. **Risco
quase nulo** — é a convenção que o projecto já usa em todo o lado, o desvio é
< 0,1 px, e o `mundo.test.ts` e o `bairro-css.test.ts` guardam o resto.

### Item 2 — Apresentação para classes/grupos · ganho médio, risco médio

`stroke` + `stroke-width` + `fill` + `stroke-linejoin` + `stroke-linecap` =
**~167 KB** (35 % do mapa). Com `<g>` que herdam e uma classe por estilo,
a estimativa realista é **−80 a −100 KB crus** (−4 a −6 KB gzip), porque o
limite superior medido (−181 KB / −8,9 KB gzip) inclui os atributos únicos.

**Risco médio**: a herança pode vazar para dentro dos `<g>` que já existem, e
a **ordem das camadas é contrato** (cabeçalho de `mundo.ts`). Verificação:
captura de ecrã antes/depois (o desenho é o contrato visual do dono),
`bairro-css.test.ts`, `mundo.test.ts`, e o e2e do bairro.

### Item 3 — Menos nós · ganho alto na pintura, risco alto

**Este é o único item que ataca os ~1,3 s de pintura.** 4 796 nós; 2 261
`<path>` e 970 `<rect>`. Muita decoração repete-se (janelas, grades,
folhagem): um `<symbol>`/`<use>` desenha-a uma vez e referencia-a N vezes, e
vários irmãos com o mesmo estilo podem fundir-se num só `d`.

**Risco alto**: o CSS e o e2e agarram elementos por classe (`.vidro`, `.jorro`),
por `data-*` (`[data-pessoa]`, `.ed`) e pelo `b-camada`; fundir nós quebra
selectores e a animação ambiente. Fazer só nos grupos **estáticos e
decorativos**, com captura de ecrã a provar que o desenho não mudou.

### Item 4 — Tirar o gerador do bundle do cliente · ganho médio, risco alto

O `<Bairro>` é `"use client"` e calcula o mapa **nele** (`useMemo` com
`montarMapa` → `mundoBairro` → `reflexos`, `Bairro.tsx:183-185`), apesar do
cabeçalho do ficheiro dizer que o mapa chega por prop. Consequências medidas:

- `iso`+`planta`+`mundo` vão no bundle do cliente: o chunk
  `3up_l98jx39eh.js` (que contém `b-salpicos`, `b-azAzul`) é **110 055 B
  crus / 34 729 B gzip**, e é pedido pela home.
- Na hidratação o cliente **reconstrói os 471 KB** de string.

Ganho esperado: ~35 KB gzip de JS e o custo da reconstrução — ~0,7 s de FCP
é o **total** do JS (`sem-js` 1 176 vs `original` 1 852), e o mapa é ~14 %
desse JS, logo o ganho directo é modesto. O valor está em tirar trabalho da
linha principal na janela de hidratação.

**Risco alto, e um alçapão**: passar a string como *prop* para o componente de
cliente fá-la viajar **também no payload RSC** — duplicaria o mapa no
documento. O caminho seguro é o mapa viver **fora da fronteira de cliente**
(no servidor), e o `<Bairro>` encontrá-lo no DOM por selector em vez de o
renderizar. Isso mexe nos `ref` da câmara e na ordem dos efeitos.

### Item 5 — Tirar o mapa do caminho crítico · ganho máximo, risco máximo

O tecto medido são os ~1,3–1,8 s. A `.b-janela` tem altura fixa
(`clamp(460px, 74vh, 760px)`), logo adiar o mapa **não** produz CLS — é a
única coisa que torna isto viável. Mas o mapa está no **primeiro ecrã** (começa
a ~118 px do topo) e o PACK exige que «o mapa nasce pronto no HTML». Adiar dá
um buraco visível durante ~1 s, em troca do número. **Rejeitado como caminho
por omissão** — fica registado, e só o dono pode mexer no contrato.

## 4. Ordem recomendada

1. **Item 0** — a variante limpa, para os itens seguintes terem leitura fiável.
2. **Item 1** — a higiene dos decimais (zero risco, entra em qualquer PR).
3. **Item 2** — a apresentação para classes, se a captura de ecrã ficar limpa.
4. **Item 3 vs Item 4** — a decisão do dono: **menos tinta** (o maior dos dois)
   ou **menos trabalho do cliente** (o mais duradouro). Não fazer os dois ao
   mesmo tempo: ambos mexem na mesma fronteira.

## 5. O que não se faz

- **`content-visibility:auto` no mapa**: o mapa está no primeiro ecrã, por isso
  o browser pinta-o na mesma e a variante `cv-hidden` (que é o `hidden`, o
  tecto) mostrou que só o tirar da tinta muda o número — não há ganho sem
  esconder o que o utilizador tem de ver.
- **Tirar o `<style>` do componente**: as animações (eléctrico, barcos, metro)
  nascem com o mapa e têm coordenadas calculadas; o `<style>` é onde isso vive.
- **Mexer na ordem das camadas** (`mundo.ts`): é contrato do protótipo.

## 6. Reprodutibilidade

```bash
# bytes e nós (determinístico, sem browser)
curl -s https://aocentimo.pt/ -o /tmp/prod-home.html
node --input-type=module -e '…'   # ver §1

# o instrumento (CPU 1×, variantes)
{ PORTA=3123 node scripts/_serve-static.mjs & }
node scripts/_perfil-lcp.mjs --url http://localhost:3123/ --corridas 3
```

O `out/index.html` local é **byte a byte** igual ao publicado (`583 964 B`),
por isso o instrumento e o site medem a mesma construção.
