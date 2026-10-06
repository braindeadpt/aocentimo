# MEDIÇÃO-V5 — desempenho do build e dos payloads

Fotografia estática do custo de servir o site. Todos os números abaixo foram
medidos nesta máquina a **2026-10-02**, commit `c754128` (= `origin/main`
nessa altura), Node `v22.23.1`, npm `10.9.8`, `npm run build` (EXIT 0).
Nada aqui é estimado: ou saiu de um comando corrido, ou está marcado como
tal. Não há "antes/depois" — isto é a linha de base, não uma comparação.

**O ficheiro tem quatro secções, com quatro fontes diferentes.** A primeira
(abaixo, sem título) é o **build local**, medido a 2026-10-02 no commit
`c754128`. A segunda, «Medição no site publicado», é o **site no ar** medido
a 2026-10-03 contra o deploy de `8b0d1c7`. A terceira, «Medição no site
publicado — 2026-10-04», é o **site no ar** medido a 2026-10-04 contra dois
deploys (`6ac1aed1-8e066` e `6ac253c2-8e537`). A quarta, «Volta final —
2026-10-06», é a **volta de fecho** no **site no ar**, medida a 2026-10-06
contra o deploy `6ac4d5ea-8e44a`, com o método da terceira. Só a primeira se
compara com o método descrito no seu próprio «Como reproduzir»; a segunda, a
terceira e a quarta usam o mesmo método e por isso são as três comparáveis
entre si.

## Como reproduzir

```bash
npm ci
time npm run build          # tempo real + tabela de rotas no fim
du -sh out                  # total do export estático
find out/_next/static -name '*.js' -exec cat {} + | gzip -c | wc -c
for f in public/cenas/*.json; do gzip -c "$f" | wc -c; done
```

## Build

| Métrica | Valor |
|---|---|
| `npm run build` | EXIT 0, **43,2 s** reais |
| Geração estática | 61/61 páginas em 4,2 s |
| Rotas | 15 páginas ○ (estáticas) + `/aprender/[slug]` ● SSG (23 paths) + imagens/xml/txt |
| Pós-build | `scripts/_postbuild-prefetch.mjs`: 0 segmentos espelhados |
| Total de `out/` | **19 MB** |

O Next desta versão não imprime colunas de Size/First Load JS na tabela
de rotas; os tamanhos por rota abaixo são os HTML exportados (documento
completo) e os bundles `_next/static`, medidos à parte.

## HTML por rota (documento completo, em disco)

| Rota | raw | gzip |
|---|---|---|
| `/` | 576 KB | 72,0 KB |
| `/estilo` | 500 KB | 84,0 KB |
| `/precos` | 384 KB | — |
| `/dados` | 368 KB | 67,9 KB |
| `/metodologia` | 256 KB | — |
| `/salario` | 212 KB | 37,8 KB |
| `/inflacao` | 192 KB | — |
| `/irs` | 192 KB | — |
| `/poupanca` | 184 KB | — |
| `/impostos` | 160 KB | — |
| `/trabalho` | 160 KB | — |
| `/casa` | 148 KB | — |
| `/credito` | 140 KB | — |
| `/aprender` | 128 KB | — |
| `/sobre` | 68 KB | — |

gzip medido só nas 4 rotas acima (`gzip -c`); as restantes ficam para a
próxima volta. Leitura honesta: o HTML da `/` é o maior pagador (576 KB
raw), mas comprime ~8× e vai uma vez por visita.

## JavaScript e CSS (`out/_next/static`)

| Ativo | raw | gzip |
|---|---|---|
| JS (54 ficheiros) | 1 881 855 B (~1,79 MB) | 617 656 B (~603 KB) |
| CSS | 135 290 B (~132 KB) | 25 676 B (~25 KB) |

Maiores chunks JS (raw): 223,8 KB, 156,9 KB, 110,0 KB, 96,3 KB, 69,0 KB,
60,0 KB, 56,3 KB, 53,6 KB, 42,4 KB, 42,2 KB. O top-1 (223,8 KB) é o
primeiro candidato se um dia o JS total pesar.

## Payloads de dados (lazy, não entram na primeira carga)

`public/cenas/*.json` — 11 cenas, carregadas só ao entrar na cena (P4):

| Cena | raw | gzip |
|---|---|---|
| bomba | 8,2 KB | 3,2 KB |
| mercearia | 7,0 KB | 3,0 KB |
| casa | 4,2 KB | 1,2 KB |
| escola | 2,2 KB | 1,2 KB |
| pastelaria | 1,5 KB | 0,8 KB |
| quiosque | 1,5 KB | 0,6 KB |
| banco | 0,8 KB | 0,5 KB |
| fabrica | 0,8 KB | 0,4 KB |
| correios | 0,6 KB | 0,4 KB |
| financas | 0,5 KB | 0,3 KB |
| segsocial | 0,5 KB | 0,4 KB |
| **Total** | **27,9 KB** | **12,0 KB** |

`public/api/*.json` (séries para gráficos/dados): 1 493 524 B raw
(~1,43 MB) → **154 947 B gzip (~151 KB)**. Comprime ~10×; é o número a
vigiar se estes ficheiros crescerem.

## O que isto diz (e o que não diz)

- **Diz:** o site exporta 61 páginas em ~43 s; a primeira carga de cada
  rota é dominada pelo seu HTML (todos estáticos, bem comprimíveis); o
  JS total anda nos ~603 KB gzip partilhados; os dados das cenas e da API
  viajam fora da primeira carga e comprimem muito bem.
- **Não diz:** tempo de carregamento real (sem Lighthouse/rede
  estrangulada aqui), nem evolução — a próxima medição compara com esta
  tabela, na mesma máquina e no mesmo commit-base.
- Contexto, não re-medido: o PR #38 (P4) reportou RSC das cenas
  17,2 → 9,1 KB gzip. Fica o registo; quem quiser confirma com o método
  acima.

---

# Medição no site publicado

Tudo o que se segue foi medido em **https://aocentimo.pt**, não no build
local — o build local responde depressa demais para dizer seja o que for
sobre a rede. Medido a **2026-10-03**, de madrugada (00:09–00:33 WEST),
contra o deploy com `last-modified: Fri, 02 Oct 2026 20:28:21 GMT`
(= `main` em `8b0d1c7`, o merge do #49; o #52 ainda não estava lá).
Node `v22.23.1`, macOS, viewport 390×844.

## Como foi medido, e as duas limitações que importam

**1. Não foi o Chrome do Mac — foi o Chromium arm64 da mesma máquina.**
O Chrome instalado é o build x64 a correr sob Rosetta, e o Lighthouse
dá timeout com ele (`waiting for dynamic debugging port`, e depois
`the page stopped responding` — o próprio Chrome avisa que essa combinação
não é testada). Usei o *Chrome for Testing* arm64 que o Playwright traz,
mesma máquina, mesmo motor. Os números de CPU são arm64 a sério, o que é
melhor do que a alternativa, mas **não são o Chrome de um Mac de um
utilizador** — para isso é preciso um CI Linux.

**2. A máquina estava partilhada e carregada** (load average entre 9 e 32
durante as corridas, com outras threads a correr). O Lighthouse simula a
rede, mas os **tempos observados** vêm do CPU real. Os números abaixo são
medianas de 3 corridas precisamente por causa disto; as três de cada
rota estão na tabela, e a dispersão é visível.

O que **não** foi medido, e porquê: **INP** é uma métrica de campo (precisa
de utilizadores reais, via RUM ou CrUX) — o laboratório só dá TBT, que é
o seu proxy. E os "3 momentos do dia" do peso do HTML caíram todos na
mesma noite; ver a secção (4) para o que isso deixa por medir.

## (1) Lighthouse móvel — 4G lenta, CPU 4×, 3 corridas, mediana

Chrome for Testing arm64, `--throttling-method=simulate` (perfis padrão
móvel: 1,6 Mbps / 150 ms / CPU 4×), 3 corridas por rota, mediana.

| Rota | LCP | CLS | TBT | peso | JS | pedidos |
|---|---|---|---|---|---|---|
| `/` | 3,64 s | 0 | **1 077 ms** | 582 KB | 247 KB | 31 |
| `/salario` | 3,21 s | 0,0001 | 181 ms | 508 KB | 209 KB | 30 |
| `/irs` | 3,33 s | 0 | 36 ms | 492 KB | 207 KB | 31 |
| `/credito` | 3,26 s | 0 | 394 ms | 491 KB | 203 KB | 27 |
| `/poupanca` | 3,54 s | 0 | 170 ms | 530 KB | 235 KB | 34 |
| `/inflacao` | 3,23 s | 0 | 65 ms | 512 KB | 215 KB | 28 |
| `/precos` | 3,50 s | 0 | 346 ms | 564 KB | 211 KB | 28 |
| `/trabalho` | 3,78 s | 0 | 30 ms | 524 KB | 232 KB | 33 |
| `/dados` | 3,68 s | 0 | 25 ms | 552 KB | 222 KB | 29 |
| `/aprender` | 3,54 s | 0 | 36 ms | 474 KB | 190 KB | 27 |

Dispersão das 3 corridas (LCP / TBT, em ms), para se ver o que a mediana
esconde:

| Rota | LCP | TBT |
|---|---|---|
| `/` | 4301 / 3636 / 3240 | 596 / **1221** / 1077 |
| `/salario` | 3334 / 3213 / 3161 | 237 / 181 / 58 |
| `/irs` | 3327 / 3316 / 3417 | 20 / 36 / 140 |
| `/credito` | 3259 / 3283 / 3217 | **849** / 132 / 394 |
| `/poupanca` | 3542 / 3466 / 3535 | **504** / 44 / 170 |
| `/inflacao` | 3238 / 3230 / 3181 | 41 / 65 / 100 |
| `/precos` | 3466 / 3496 / 3915 | 346 / **804** / 305 |
| `/trabalho` | 3469 / 3827 / 3780 | 18 / 94 / 30 |
| `/dados` | 3682 / 3380 / 3678 | 18 / 25 / 41 |
| `/aprender` | 3555 / 3536 / 3226 | 36 / 39 / 16 |

Leitura: **CLS não é problema em lado nenhum** (a única excepção é
`/salario`, com 0,0001 — um elemento a assentar). **LCP está em 3,2–3,8 s
em todas as rotas, sem excepção** — e isso é a assinatura de uma causa
sistemática, não de uma página mais lenta que outra. **TBT só incomoda na
home** (mediana 1 077 ms) e, com menos força, em `/credito` e `/precos`.

### O LCP simulado é ~2× pior que o real — não se persiga o número

O elemento LCP é sempre texto: o `h1` do cabeçalho nas rotas da pele V5
(`div.rt5 > div.pagina > section.pg-nivel > h1`) e o parágrafo de
introdução na home. A decomposição do Lighthouse dá TTFB 107–410 ms e
**0 ms de carregamento de recurso** — é texto, não imagem — com o atraso
todo em `element render delay` (0,8–2,2 s). Ou seja: não há nenhum
ficheiro a atrasar o LCP, é o modelo de CPU 4× a multiplicar o tempo de
pintura.

Medi o mesmo cenário no navegador real (mesma rede estrangulada, mesmo
CPU 4×, sem simulação):

| Rota | FCP real | LCP real | LCP simulado (mediana) |
|---|---|---|---|
| `/` | 2 352 ms | 2 352 ms | 3 636 ms |
| `/dados` | 1 388 ms | 1 388 ms | 3 678 ms |
| `/precos` | 1 420 ms | 1 420 ms | 3 496 ms |

**FCP = LCP em todas**: o conteúdo aparece de uma vez e fica quieto. A
tabela do Lighthouse é útil para comparar versões, não para dizer
«demora 3,6 s a um utilizador real».

### Onde estão os bytes (mediana, por tipo)

| Rota | total | HTML | CSS | JS | **fontes** | imagens |
|---|---|---|---|---|---|---|
| `/` | 582 KB | 75 | 27 | 247 | **222** | 0 |
| `/salario` | 508 KB | 39 | 27 | 209 | **222** | 0 |
| `/irs` | 492 KB | 26 | 27 | 207 | **222** | 0 |
| `/credito` | 491 KB | 28 | 27 | 203 | **222** | 0 |
| `/poupanca` | 530 KB | 34 | 27 | 235 | **222** | 0 |
| `/inflacao` | 512 KB | 36 | 27 | 215 | **222** | 0 |
| `/precos` | 564 KB | 92 | 27 | 211 | **222** | 0 |
| `/trabalho` | 524 KB | 32 | 27 | 232 | **222** | 0 |
| `/dados` | 552 KB | 70 | 27 | 222 | **222** | 0 |
| `/aprender` | 474 KB | 24 | 27 | 190 | **222** | 0 |

**222 KB de fontes em todas as rotas, sem uma única variação** — são os
mesmos 6 ficheiros `woff2` (88 + 73 + 22 + 20 + 10 + 9 KB), todos
precarregados no `<head>`. É 38% do peso da home e 47% da rota mais leve
(`/aprender`). Nenhuma imagem em lado nenhum (0 KB), o que é notável e
está bem.

As fontes usam `font-display: optional`, portanto **não bloqueiam o texto**:
o custo delas é banda, não render. Numa ligação a 1,6 Mbps, 222 KB são
~1,1 s de transferência que disputam o mesmo canal que o JS.

## (2) As 11 cenas por âncora — tempo até o desenho aparecer

Playwright, 390×844, rede estrangulada a 1,6 Mbps / 150 ms e CPU 4×,
navegando a `https://aocentimo.pt/#<cena>` e a medir o instante em que
`div.b-cena` tem o seu próprio conteúdo visível. 3 corridas por cena,
mediana.

| Cena | até ao desenho | FCP | JSON da cena |
|---|---|---|---|
| `banco` | 3 191 ms | 1 384 | 863 B |
| `bomba` | 3 207 ms | 1 388 | 8 367 B |
| `casa` | 3 196 ms | 1 380 | 4 294 B |
| `correios` | 3 218 ms | 1 480 | 640 B |
| `escola` | 3 201 ms | 1 384 | 2 218 B |
| `fabrica` | 3 217 ms | 1 444 | 868 B |
| `financas` | 3 780 ms | 1 368 | 555 B |
| `mercearia` | 3 773 ms | 1 764 | 7 175 B |
| `pastelaria` | 3 616 ms | 1 508 | 1 509 B |
| `quiosque` | 3 641 ms | 1 672 | 1 572 B |
| `segsocial` | 3 581 ms | 1 640 | 479 B |

**O tempo até à cena não depende do tamanho da cena.** `segsocial` (479 B)
demora 3 581 ms; `bomba` (8 367 B, 17× mais dados) demora 3 207 ms. O
que está a custar não é a.fetch dos dados.

A linha do tempo diz porquê (`#bomba`, CPU 4×):

```
1424 ms  first-contentful-paint
1864 ms  DOMContentLoaded
2942 ms  load
3235 ms  .b-cena com o esqueleto (42 carateres)
3273 ms  É FEITO O PEDIDO de /cenas/bomba.json
3466 ms  resposta do JSON
3986 ms  .b-cena com o conteúdo completo (718 carateres)
```

O pedido dos dados da cena sai **1,3 s depois de o texto já estar na
ecrã** e ~330 ms depois do `load`. Sem CPU estrangulada (mesma rede) a
ordem é a mesma: `load` aos 2 871 ms, pedido aos 2 941 ms, resposta aos
3 127 ms. Não é o CPU: é o momento em que o pedido é feito. O JSON são
8 KB — lidos em ~200 ms nesta ligação, ou seja **~1,3 s de espera que não
têm nada a ver com o tamanho do que é lido**.

## (4) O HTML da home na rede

`curl -H 'Accept-Encoding: gzip' https://aocentimo.pt/`, três momentos:

| Momento | bytes | TTFB (3 leituras) |
|---|---|---|
| 00:09 | 76 215 | 1,194 / 0,499 / 0,196 s |
| 00:32 | 76 215 | 0,279 / 0,096 / 0,115 s |
| 00:33 | 76 215 | 0,131 / 0,100 / 0,116 s |

**76 215 bytes (74,4 KB) em gzip, sempre igual** — 579 714 B sem
compressão, `content-encoding: gzip`, `vary: Accept-Encoding`,
`content-length: 76215`, `cache-control: max-age=600`,
`etag: W/"6ac013e5-8d882"`, `x-proxy-cache: MISS`, `age: 455`, servido
por GitHub Pages com edge em `fra`.

O tamanho não variou em nenhuma das 9 leituras, o que é o resultado
esperado num export estático com `content-length` fixo: **esta métrica
só muda se o deploy mudar**. O que varia é o TTFB
(0,10–1,19 s), e isso é do edge, não do site.

**O que fica por medir, e porquê:** os três momentos caíram todos na mesma
hora. Não há medições de tráfego nem variância diurna que se tirem disto —
para a medição a sério é preciso correr o mesmo comando às 08h, 14h e 21h, em
dias de semana, e comparar. Até lá, o número honesto é: **74,4 KB gzip,
estável, servido por um edge europeu**.

## (5) axe na home, numa cena aberta e nas rotas migradas

axe-core 4.13, WCAG 2.0/2.1 A+AA, no site publicado, 390×844.

| Onde | Violações |
|---|---|
| **12 rotas migradas** (`/salario`, `/irs`, `/impostos`, `/poupanca`, `/credito`, `/casa`, `/inflacao`, `/precos`, `/trabalho`, `/dados`, `/aprender`, `/metodologia`) | **nenhuma** |
| `/` (home) | 5 |
| `/#bomba` (cena aberta) | 4 (as da home, sem a do `aria-hidden-focus`) |

As da home, com o alvo exato:

| Regra | Impacto | Onde |
|---|---|---|
| `aria-hidden-focus` | sério | `#b-cFundo` e `#b-cFrente` são `aria-hidden="true"` mas contêm elementos focáveis |
| `nested-interactive` | sério | `.b-mundo` tem `role="img"` e contém controlos interativos |
| `landmark-no-duplicate-main` | moderado | a página tem **dois** `<main>`: `#conteudo` (layout) e `#conteudo-bairro` (a página do bairro) |
| `landmark-unique` | moderado | o mesmo par, sem nome acessível |
| `landmark-main-is-top-level` | moderado | `#conteudo-bairro` está dentro de outro landmark |

Isto é bom news com uma ressalva: **as 12 rotas com a pele V5 estão
limpas**, incluindo as do #52. Tudo o que sobra é da home e do mapa SVG
do bairro — a única coisa que este trabalho ainda não tocou.

## Prioridade: o que corrigir antes de lançar

Ordenado por (bytes ou segundos ganhos) ÷ (risco de partir). Nenhum item
deste plano foi executado — esta secção é a lista, não o resultado.

### Antes de tudo (barato, sem risco, ganho em todo o site)

1. **Substituir as 6 fontes por subconjuntos com os glifos realmente
   usados.** 222 KB → ~40–60 KB, em todas as rotas, sem tocar em
   código de aplicação: é config da fonte. A 1,6 Mbps, ~150 KB a menos é
   ~0,8 s de canal libertado para o JS. *Risco: baixo. Ganho: o maior
   de todos, e o único que é uniforme nas 11 rotas.*

2. **Deixar de fazer o pedido da cena depois do `load`.** A linha do tempo
   da secção (2) mostra 1,3 s de espera por 8 KB que se lêem em 200 ms.
   Pedir o JSON no fim da hidratação, ou quando se vê a âncora, põe a cena
   no ecrã ~1,3–1,8 s antes em qualquer ligação. *Risco: médio — toca em
   código de cenas. Ganho: o maior em tempo percebido, e é o que uma
   ligação directa a uma cena mais sente.*

### Depois (ganho claro, risco mais alto)

3. **A home: tirar o TBT de 1 077 ms.** O hilo principal passa 10,1 s:
   4,3 s de "other", 2,1 s de `paintCompositeRender`, 2,1 s de
   `styleLayout`, 1,4 s de `scriptEvaluation`, com 9 tarefas longas e um
   `26z5y3xewknxi.js` que sozinho ocupa 4,5 s de bootup. O mapa SVG do
   bairro (viewBox 3600×2500, dezenas de gradientes) é o suspeito da
   pintura e do layout. *Risco: médio-alto — é o coração visual do
   projecto. Ganho: só na home, mas é a única com TBT mau.*

4. **Os dois `<main>` da home.** `landmark-no-duplicate-main` +
   `landmark-unique` + `landmark-main-is-top-level`: uma mudança
   estrutural de um elemento (`#conteudo-bairro` deixa de ser `<main>` ou
   passa a ter nome). *Risco: baixo. Ganho: 3 das 5 violações, e é
   a correcção que um revisor de acessibilidade pede primeiro.*

5. **`.b-mundo` com `role="img"` a conter controlos**, e os SVGs
   `aria-hidden` com conteúdo focável. *Risco: médio — mexer no
   `aria-hidden` pode tirar focusability ao mapa todo, que é de
   propósito. Ganho: as 2 violações sérias restantes.*

### Se sobrar tempo

6. **JS: 190–247 KB por rota.** 29 KB do maior chunk (71 KB) não são
   usados na home. Os quatro maiores são 71 + 44 + 31 + 27 KB. *Risco:
   alto (code-splitting já feito pelo Next, o que resta é trabalho de
   arquitectura). Ganho: médio.*

7. **HTML de `/precos` (92 KB) e `/dados` (70 KB)**, contra 24–39 KB das
   rotas mais leves. O `/precos` é o maior documento do site e ninguém
   o viu numa lista de prioridades até agora.

### E o que **não** é para corrigir

- **O LCP de 3,2–3,8 s.** É o modelo. No navegador real, com a mesma rede
  e o mesmo CPU, FCP = LCP = 1,4–2,4 s. Perseguir o número do Lighthouse
  aqui seria optimize um simulador.
- **O CLS.** Está a 0 em todas as rotas.
- **As imagens.** 0 KB em todas as 11 rotas. Não há nada a fazer.

## Como reproduzir

```bash
# Lighthouse: 3 corridas por rota, em https://aocentimo.pt
export CHROME_PATH=$(ls ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/Contents/MacOS/* | head -1)
for rota in / /salario /irs /credito /poupanca /inflacao /precos /trabalho /dados /aprender; do
  for n in 1 2 3; do
    node node_modules/lighthouse/cli/index.js "https://aocentimo.pt$rota" \
      --output=json --output-path="lh${rota//\//_}-$n.json" \
      --throttling-method=simulate --chrome-flags="--headless=new" --quiet
  done
done

# Peso do HTML na rede, 3 vezes
curl -s -H 'Accept-Encoding: gzip' -o /dev/null -w '%{size_download} %{time_starttransfer}\n' https://aocentimo.pt/

# Cenas por âncora e axe: Playwright com CDP (Network.emulateNetworkConditions
# a 1,6 Mbps/150 ms + Emulation.setCPUThrottlingRate 4), a medir div.b-cena
# e a correr axe-core sobre o document.
```

---

# Medição no site publicado — 2026-10-04

Segunda volta, feita **no site publicado** (`https://aocentimo.pt`) e não no
build local, com o mesmo método da volta de 2026-10-03 (secção anterior) para
que os dois momentos se comparem. Medido a **2026-10-04**, 13:47–15:35 WEST.
macOS 26.6.2 (8 núcleos), Node `v22.23.1`, Chrome for Testing **153.0.8010.12**
arm64 (o `chromium-1243` do Playwright), Lighthouse **13.5.0**, axe-core
**4.13.0**, viewport 390×844. Instrumento: `scripts/_medir-publicado.mjs`.

## As três coisas que há de saber antes de ler os números

**1. O deploy mudou a meio da sessão.** Foram medidas duas
construções, e cada tabela diz qual:

| | deploy A | deploy B |
|---|---|---|
| `last-modified` | Sun, 04 Oct 2026 01:41:37 GMT | Sun, 04 Oct 2026 13:25:22 GMT |
| `etag` | `"6ac1aed1-8e066"` | `"6ac253c2-8e537"` |
| HTML raw | 581 734 B | 582 967 B |
| onde foi medido | as 10 rotas do Lighthouse, as 11 cenas, o axe | reconfirmação da home (3 corridas) e as leituras (2) e (3) do peso do HTML |

O deploy B entrou às 14:25 WEST, a meio das medições. Para não deixar a
home fora de data, **a home foi repetida no deploy B** — é o número de
(1b). As outras nove rotas e as cenas são do deploy A.

**2. A máquina esteve carregada, e muito.** `vm.loadavg` ao longo da sessão:

| Bloco | momento | carga (1/5/15 min) |
|---|---|---|
| Lighthouse, 10 rotas × 3 | 13:52–14:18 | 7,8 / 9,4 / 7,8 |
| Cenas, 11 × 3 | 14:35–15:20 | 20 / 25 / 26 → pico de **55** |
| axe, 14 alvos | 15:22–15:26 | 20 / 26 / 27 |
| Home no deploy B + HTML | 15:27–15:35 | 9,9 / 16 / 22 |

São 8 núcleos e havia outras threads a correr (Freebuff, Firefox). O
Lighthouse simula a rede, mas os **tempos observados** vêm do CPU real, e o
`--throttling-method=simulate` do Lighthouse constrói a sua linha do tempo a
partir dessas observações. Os números abaixo são medianas de 3 corridas
precisamente por causa disto, e a dispersão está publicada para se ver o que
a mediana esconde.

**3. Continua a não ser o Chrome do Mac.** O Chrome instalado é o build x64
a correr sob Rosetta e o Lighthouse dá timeout com ele. Foi o Chrome for
Testing arm64 da mesma máquina, mesmo motor. Para «o que vê um Mac de um
utilizador» é preciso um CI Linux — e, melhor ainda, um **CrUX** (dados de
campo), que é a única fonte que resolve a pergunta sem minta.

## (1a) Lighthouse móvel — 10 rotas, deploy A

`--throttling-method=simulate` (perfis padrão móvel: 1,6 Mbps / 150 ms /
CPU 4×), 3 corridas por rota, mediana.

| Rota | LCP | CLS | TBT | peso | JS | pedidos |
|---|---|---|---|---|---|---|
| `/` | 2 943 ms | 0 | **578 ms** | 522 KB | 249 KB | 27 |
| `/salario` | 2 197 ms | 0,0002 | 90 ms | 448 KB | 211 KB | 26 |
| `/irs` | 2 251 ms | 0 | 263 ms | 432 KB | 208 KB | 27 |
| `/credito` | **1 732 ms** | 0 | 160 ms | 430 KB | 204 KB | 23 |
| `/poupanca` | 2 383 ms | 0 | 159 ms | 469 KB | 237 KB | 30 |
| `/inflacao` | 2 344 ms | 0 | 145 ms | 451 KB | 216 KB | 24 |
| `/precos` | 2 500 ms | 0 | **804 ms** | 503 KB | 212 KB | 24 |
| `/trabalho` | 2 585 ms | 0,0002 | 388 ms | 464 KB | 233 KB | 29 |
| `/dados` | 2 748 ms | 0 | **605 ms** | 491 KB | 224 KB | 25 |
| `/aprender` | **1 664 ms** | 0 | 187 ms | 413 KB | 191 KB | 23 |

Dispersão das 3 corridas (LCP ms / TBT ms), para se ver o que a mediana
esconde:

| Rota | LCP | TBT |
|---|---|---|
| `/` | 4447 / 2455 / **2943** | 670 / 578 / 503 |
| `/salario` | 2216 / **2197** / 1823 | 152 / **90** / 37 |
| `/irs` | 1263 / 2774 / 2251 | 322 / **263** / 142 |
| `/credito` | **1732** / 1862 / 1714 | 130 / **160** / 186 |
| `/poupanca` | 2371 / 2779 / **2383** | 159 / **168** / 93 |
| `/inflacao` | 2367 / **2344** / 2273 | 316 / 138 / **145** |
| `/precos` | 2693 / **2500** / 2409 | **804** / 860 / 793 |
| `/trabalho` | 2292 / **2585** / 9589 | 221 / 388 / 594 |
| `/dados` | 2814 / **2748** / 2430 | 623 / 605 / **535** |
| `/aprender` | 2464 / 1429 / **1664** | 175 / **187** / 213 |

Duas leituras que se impõem:

- **A dispersão é maior do que a diferença entre rotas.** `/trabalho` teve
  uma corrida de 9 589 ms e duas de 2 292/2 585 ms; `/aprender` foi de 1 429
  a 2 464 ms. Com 3 corridas e uma máquina a este load, uma diferença de
  300 ms entre duas rotas **não é um facto**. O que é facto é a ordem de
  grandeza: tudo entre 1,7 e 2,9 s.
- **O TBT é o sinal mais limpo da tabela**, porque não depende da rede
  simulada. `/` (578 ms), `/precos` (804 ms) e `/dados` (605 ms) são as três
  rotas acima de 200 ms; as outras sete estão entre 37 e 388 ms. `/precos`
  tem a mediana mais alta de todas e três das três corridas acima de
  790 ms.

## (1b) A home no deploy B — as metas do pack

3 corridas, deploy `"6ac253c2-8e537"` (14:25 WEST):

| Corrida | LCP | FCP | CLS | TBT | peso | JS | pedidos |
|---|---|---|---|---|---|---|---|
| 1 | 2 955 ms | 2 812 ms | 0 | 904 ms | 528 KB | 249 KB | 29 |
| 2 | 2 998 ms | 2 636 ms | 0 | 810 ms | 528 KB | 249 KB | 29 |
| 3 | 2 966 ms | 2 834 ms | 0 | 807 ms | 528 KB | 249 KB | 29 |
| **mediana** | **2 966 ms** | 2 812 ms | **0** | **810 ms** | 528 KB | 249 KB | 29 |

Contra as metas do `docs/PACK-V5-PRODUCAO.md` §4:

| Meta | Valor medido | Resultado |
|---|---|---|
| LCP ≤ 2,5 s (home) | **2 966 ms** (mediana; 2 455–4 447 ms no deploy A) | **não cumpre** — 466 ms acima, e a dispersão é maior que a margem |
| CLS ≤ 0,05 (home) | **0** | cumpre, com folga |
| JS ≤ 350 KB gzip (home) | **249 KB** | cumpre — 71% do tecto |

O TBT da home subiu face ao deploy A (578 → 810 ms) e face à volta de
2026-10-03 (1 077 ms). **É a única métrica que piorou desde October e a
única que é claramente pior**, porque é a que menos depende da rede
simulada. A outra porção boa: **as fontes**.

### As fontes: 222 KB → 161 KB, e de 6 ficheiros para 2

O `largest-contentful-font` caiu de 222 KB para **161 KB** e de **6 ficheiros
para 2**, em todas as rotas, sem uma linha de aplicação — é o efeito do P3c
(a saída das fontes V4), que chegou ao `main` às 02:32 WEST de hoje, antes
de qualquer medição desta sessão. Ainda são 31% do peso da home.

### Onde estão os bytes (mediana, KB, deploy A)

| Rota | total | HTML | CSS | JS | **fontes** | imagens | pedidos |
|---|---|---|---|---|---|---|---|
| `/` | 522 | 75 | 26 | 249 | **161** | 0 | 27 |
| `/salario` | 448 | 38 | 26 | 211 | **161** | 0 | 26 |
| `/irs` | 432 | 25 | 26 | 208 | **161** | 0 | 27 |
| `/credito` | 430 | 28 | 26 | 204 | **161** | 0 | 23 |
| `/poupanca` | 469 | 34 | 26 | 237 | **161** | 0 | 30 |
| `/inflacao` | 451 | 36 | 26 | 216 | **162** | 0 | 24 |
| `/precos` | 503 | **92** | 26 | 212 | **162** | 0 | 24 |
| `/trabalho` | 464 | 32 | 26 | 233 | **162** | 0 | 29 |
| `/dados` | 491 | **69** | 26 | 224 | **161** | 0 | 25 |
| `/aprender` | 413 | 24 | 26 | 191 | **161** | 0 | 23 |

**161 KB idênticos nas 10 rotas.** É o maior bloco isolado do site e é o
único que não pode encolher sem mudar a configuração da fonte: as mesmas
duas, qualquer que seja a página. Continuam em `font-display:
optional`, portanto não bloqueiam o texto — o custo é banda, não render.

`/precos` (92 KB de HTML) e `/dados` (69 KB) continuam a ser, de longe, os
dois documentos mais pesados do site: o `/precos` é quase quatro vezes o
`/aprender`.

### O LCP é sempre texto, e o atraso está na pintura

O elemento LCP é o parágrafo de introdução na home e o `h1` nas rotas da
pele V5 — em todas as 10, sempre texto, nunca imagem. A decomposição
(`lcp-breakdown-insight`, run mediana):

| Rota | TTFB | element render delay | elemento |
|---|---|---|---|
| `/` | 2 055 ms | 3 282 ms | parágrafo de introdução |
| `/salario` | 1 746 ms | 2 063 ms | o `h1` |
| `/irs` | 404 ms | 2 782 ms | o `h1` |
| `/credito` | 876 ms | 2 160 ms | o `h1` |
| `/poupanca` | 787 ms | 2 596 ms | o `h1` |
| `/inflacao` | 829 ms | 2 235 ms | o `h1` |
| `/precos` | 2 134 ms | 3 259 ms | o `h1` |
| `/trabalho` | 894 ms | 1 519 ms | o `h1` |
| `/dados` | 1 421 ms | 3 349 ms | o `h1` |
| `/aprender` | 2 764 ms | 2 101 ms | o parágrafo de entrada |

O `load resource` das fases do LCP é **0 ms em todas**: não há nenhum
ficheiro a atrasar o LCP. Em `/irs` o TTFB é 404 ms e o LCP é 2 251 ms —
ou seja, **1 847 ms são pintura**, com o HTML já cá. O gargalo do LCP não é
um recurso lento; é o CPU a pintar.

### O navegador real não concorda com o simulador — e hoje não sei qual é o certo

A volta de 2026-10-03 mediu o mesmo cenário no navegador real (mesma rede
estrangulada, sem CPU estrangulada) e encontrou FCP = LCP = 1,4–2,4 s, contra
3,2–3,8 s do simulador, e daí a conclusão «o LCP do Lighthouse é ~2× pior
que o real». **Hoje isso não se reproduz.** Mesma rede estrangulada, sem
CPU estrangulada, 3 corridas, deploy B:

| Rota | FCP (3 corridas) | mediana | FCP simulado (mediana) |
|---|---|---|---|
| `/` | 8560 / 4484 / 4752 | 4 752 ms | 2 812 ms |
| `/dados` | 2660 / 6116 / 3176 | 3 176 ms | 2 720 ms |
| `/precos` | 4540 / 6584 / 7216 | 6 584 ms | 2 478 ms |

O navegador real deu **pior** do que o simulador em todas as três — o
oposto da volta anterior. A leitura honesta é que **os dois instrumentos
divergem mais do que qualquer um deles diverge da meta de 2,5 s**, e que a
diferença entre eles é a carga da máquina (medida com o load a 10–16). O
número a levar para o lançamento não é nenhum dos dois: é o **LCP de campo**
(CrUX), que ainda não temos. O que os dois concordam é: o LCP é texto, o
atraso é de pintura, e o CLS é 0.

## (2) As 11 cenas por âncora — deploy A

Playwright com CDP: `Network.emulateNetworkConditions` a 1,6 Mbps / 150 ms
(`cellular4g`) e `Emulation.setCPUThrottlingRate 4`, 390×844, **contexto
novo em cada corrida** (sem cache herdada), a navegar a `/#<cena>` e a
medir o instante em que o painel da cena passa de 80 caracteres de texto.
3 corridas por cena, mediana.

| Cena | até ao desenho | as 3 corridas | FCP | CLS | JSON pedido | JSON resposta | JSON (B) | chunk da cena | chunks JS |
|---|---|---|---|---|---|---|---|---|---|
| `financas` | **14 633 ms** | 14633 / 12907 / 22410 | 3 592 | 0 | 12 176 | 13 614 | 326 | 14 256 | 16 |
| `casa` | **16 019 ms** | 17728 / 15687 / 16019 | 3 484 | 0,00013 | 12 780 | 14 832 | 1 248 | 15 768 | 16 |
| `banco` | **16 246 ms** | 19484 / 16246 / 15460 | 6 048 | 0,00013 | 15 595 | 15 902 | 502 | 15 934 | 16 |
| `bomba` | **16 864 ms** | 15672 / 16864 / 22862 | 4 768 | 0,00013 | 15 068 | 15 199 | 3 504 | 16 797 | 16 |
| `correios` | **17 668 ms** | 17668 / 14545 / 24309 | 5 024 | 0,00013 | 14 437 | 16 230 | 438 | 17 481 | 16 |
| `mercearia` | **18 314 ms** | 20389 / 17446 / 18314 | 5 352 | 0,00013 | 15 906 | 17 297 | 3 034 | 17 892 | 16 |
| `quiosque` | **19 855 ms** | 23010 / 19855 / 18985 | 3 732 | 0,00013 | 15 055 | 18 589 | 627 | 19 333 | 16 |
| `segsocial` | **21 217 ms** | 20685 / 21217 / 25990 | 4 012 | 0,00013 | 16 941 | 19 946 | 344 | 20 815 | 16 |
| `pastelaria` | **23 647 ms** | 23647 / 16094 / 30903 | 5 388 | 0,00013 | 21 031 | 22 452 | 790 | 23 400 | 16 |
| `escola` | **25 043 ms** | 20974 / 25043 / 34757 | 10 184 | 0,00013 | 18 513 | 23 995 | 1 205 | 24 744 | 16 |
| `fabrica` | **25 381 ms** | 20942 / 31018 / 25381 | 6 124 | 0,00013 | 18 494 | 23 821 | 378 | 24 875 | 16 |

Todas as 11 abrem, todas com conteúdo, **zero erros de consola e zero
pedidos falhados**. O CLS por cena é 0,00013 (uma única) ou 0.

Leituras:

- **O tempo até à cena não depende do tamanho dos dados.** `segsocial`
  (344 B) demora 21,2 s; `bomba` (3 504 B, 10× mais) demora 16,9 s. A
  diferença entre a mais rápida e a mais lenta (10,7 s) não acompanha o
  tamanho do JSON. O custo não é ler o ficheiro.
- **Os bytes do JSON são irrelevantes para a velocidade percebida.** A resposta
  do JSON chega 0,3–5,5 s depois do pedido; 3,5 KB e 326 B levam o mesmo.
- **O pedido do JSON sai muito depois do texto estar no ecrã.** O FCP
  mediano é 3,5–10,2 s e o pedido sai às 12,2–21,0 s — **4 a 11 s depois do
  primeiro texto**, e depois da última das 16 peças de JS da página. O
  `.b-cena` chega ao ecrã 0,6–1,5 s depois de a resposta do JSON.
- **16 chunks de JS por cena**, sempre, e o chunk da cena é sempre o
  **último** a chegar (14,3–24,9 s), sempre depois do JSON. O
  `next/dynamic` faz o que promete: a cena não está no bundle inicial — mas
  a cena é a última coisa a chegar, e chega por cima de 16 chunks que já
  estavam a caminho.

### Uma nota de método que vale mais do que os números

A primeira tentativa mediu `div.b-cena` e **a `fabrica` devolveu 0
caracteres nas três corridas** — o que parecia um cenário partido em
produção. Não era: a `CenaFabrica` desenha o painel dela em `.b-painel`, e
as outras dez cenas usam a moldura `.b-cena` do `CenaDePerto`. O `.b-painel`
tem 201 caracteres e abre em 25,4 s, como as outras. Um instrumento que
procura um único selector produz um falso positivo que custa uma
investigação; o script mede agora os dois e regista qual respondeu.

## (3) O HTML da home na rede — três momentos

`curl -H 'Accept-Encoding: gzip' https://aocentimo.pt/`, três leituras por
momento, `size_download` e `time_starttransfer`.

| Momento (WEST) | deploy | bytes | TTFB (3 leituras) |
|---|---|---|---|
| 13:57 | A | 76 461 | 0,358 / 0,797 / 0,955 s |
| 15:27 | **B** | **76 673** | 1,215 / 0,830 / 1,588 s |
| 15:33 | B | 76 673 | 0,479 / 0,370 / 0,366 s |

**76 673 B = 74,9 KB gzip**, `content-encoding: gzip`,
`vary: Accept-Encoding`, `cache-control: max-age=600`,
`x-github-edge-region: fra`, servido por GitHub Pages. Sem compressão são
**582 967 B**. As 9 leituras deram sempre o mesmo número, como se espera de
um export estático com `content-length` fixo.

O que mudou face a 2026-10-03: **76 215 → 76 673 B (+458 B)**, e o raw
581 734 → 582 967 B. O número só muda quando o deploy muda, e foi isso que
aconteceu às 14:25 WEST.

### Contra o gate

O `scripts/_gate-html.mjs` mede o **build local** (`out/index.html`),
não a rede. Corri-o em `origin/main` (`d7a2152`), `npm run build` EXIT 0:

```
home: 72.1 KB gzip (limite 80 KB)   ← o gate ANTIGO (nível 6, folga falsa); ver actualização abaixo
ok: mapa no DOM, flight limpo, dentro do orçamento.
```

| Origem | HTML da home | Contra o tecto de 80 KB |
|---|---|---|
| gate, build local `d7a2152` | 581 725 B raw → **72 759 B gzip** (72,1 KB) | −7,9 KB |
| **rede, deploy B** | 582 967 B raw → **76 673 B gzip** (74,9 KB) | **−5,1 KB** |
| rede, deploy A (10-03 era) | 579 714 B raw → 76 215 B gzip (74,4 KB) | −5,6 KB |

**Os dois cumprem o tecto, com 5,1 KB de folga no que está no ar.** Mas
reparar na diferença: o gate vê 72,1 KB e a rede serve 74,9 KB — **2,8 KB
que o gate não vê**, porque o gate mede o `main` actual e a rede serve um
deploy de ~40 minutos antes. Não é uma falha do gate (é um gate de
regressão, e para isso serve), mas significa que **o gate não é uma
medição do que os utilizadores recebem**. As duas perguntas são distintas e
convém não trocar uma pela outra.

**Actualização (2026-10-06) — a causa era o compressor, não o desfasamento.**
Os 72,1 KB do gate não vinham só de medir um deploy mais recente: vinham
sobretudo do compressor. O CDN serve gzip **nível 5** — um `gzip -5` da home
publicada dá **exactamente** o `content-length` que o CDN envia (76 734 B a
2026-10-06) — enquanto o gate usava o default do `gzipSync` (nível 6) e o
zlib 1.3.1 do Node, que comprime ~0,6 % melhor que o zlib 1.2.x do CDN. O
`_gate-html.mjs` passou a medir no nível do CDN e a corrigir essa diferença,
pelo que o **número local e o publicado passam a coincidir** (74,9 KB nos
dois, sobre o mesmo par build/rede de hoje).

**E a medida passou a ser uma só, para todos os medidores de peso
(2026-10-06).** A regra ficou num módulo partilhado,
`scripts/_medida-cdn.mjs` (nível 5 + correção de zlib, arredondado **para
cima**), e o `_gate-html.mjs`, o `_dieta-html.mjs`, o `_js-por-rota.mjs` e o
`_sweep.mjs` passaram a usá-lo. Os dois últimos mediam o `transferSize` do
browser contra o servidor estático local — que não comprime — e imprimiam
**raw** ao lado de um tecto em gzip: a home dava ~608 KB de JS no arranque
onde o CDN serve 189,6 KB. Agora recolhem os caminhos dos ficheiros pedidos e
medem cada um com a mesma função do gate; verificação de que a correção nunca
é optimista: num chunk `.js` publicado de 16 802 B o CDN serve 6 283 B e a
função devolve 6 332 B (e na home, 76 733 B contra 76 734 B — arredondamento
para cima incluído).

**E os orçamentos passaram a ser um só, também (2026-10-06).** Os tectos de
**80 KB** (HTML da home) e **350 KB** (JS inicial por rota) vivem agora em
`scripts/_orcamentos.mjs` (`ORCAMENTOS`), com a fonte do pack ao lado (`FONTE`)
e quem os aplica (`APLICADO_POR`). O `_gate-html.mjs`, o `_dieta-html.mjs`, o
`_js-por-rota.mjs` (que passou a ser **gate**: sai com código ≠ 0 na rota que
exceda) e o `_sweep.mjs` leem daí, e a CI imprime a tabela antes de correr o
gate. `scripts/_orcamentos.test.ts` fixa os valores e recusa cópias literais
nos medidores.

## (4) axe na home, numa cena aberta e nas rotas migradas

axe-core 4.13.0, WCAG 2.0/2.1 A+AA (`wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`), no site publicado, 390×844, deploy A.

| Onde | Violações |
|---|---|
| **12 rotas migradas** (`/salario`, `/irs`, `/impostos`, `/poupanca`, `/credito`, `/casa`, `/inflacao`, `/precos`, `/trabalho`, `/dados`, `/aprender`, `/metodologia`) | **nenhuma** |
| `/` (home) | **2** |
| `/#bomba` (cena aberta) | **1** |

Comparado com 2026-10-03 (5 na home, 4 na cena aberta), **três violações
desapareceram** — e eram as três de landmark
(`landmark-no-duplicate-main`, `landmark-unique`,
`landmark-main-is-top-level`). A página já tem um só `<main>` nomeado. As
duas que ficam, com o alvo exato:

| Regra | Impacto | Onde | Onde aparece |
|---|---|---|---|
| `aria-hidden-focus` | **sério** | `#b-cFundo` e `#b-cFrente` (×2 nós) são `aria-hidden="true"` mas contêm elementos focáveis | só na home |
| `nested-interactive` | **sério** | `.b-mundo` tem `role="img"` e contém controlos interativos | home **e** cena aberta |

As 12 rotas com a pele V5 continuam limpas, incluindo `/casa` e
`/metodologia`. `passes` entre 24 e 31 por página. Incompletos: 1 por página
(o mesmo item em todas, o que a verificação manual tem de confirmar), 0 na
`/metodologia`.

Ambas as violações restantes são **do mapa SVG do bairro** — a única coisa
que este trabalho ainda não tocou — e nenhuma delas está nas cenas nem nas
rotas de conteúdo.

## Prioridade: o que corrigir antes de lançar

Ordenado por (bytes ou segundos ganhos) ÷ (risco de partir). **Nada desta
lista foi executado** — é a lista, não o resultado. O esforço é o meu
palpite honesto; o ficheiro é onde o número aparece.

### Lançar sem isto é defensável

| # | quê | esforço | ficheiro provável | evidência |
|---|---|---|---|---|
| 1 | **As duas `<main>` da home já não são um problema** — 3 violações resolvidas sem custo | — | `src/app/_bairro/Bairro.tsx` | (4): home de 5 → 2 |
| 2 | **Os 161 KB de fontes** são o maior bloco isolado e é igual em todas as rotas. Subconjuntos com os glifos usados: ~160 → ~40 KB | **médio** | config da fonte (`src/app/layout.tsx`, `<link>` das `woff2`) — não é CSS de aplicação | (1b): 31% do peso, 2 ficheiros, 10/10 rotas |
| 3 | **`/precos` tem 92 KB de HTML** e `/dados` 69 KB, contra 24–38 KB das rotas leves. É o maior documento do site | **médio** | `src/app/precos/`, `src/app/dados/` | (1b): tabela de bytes |
| 4 | **O CLS está a 0 em todo o lado** (10 rotas, 11 cenas) | — | — | (1a), (2) |

### Antes de lançar, se houver tempo

| # | quê | esforço | ficheiro provável | evidência |
|---|---|---|---|---|
| 5 | **O TBT da home (810 ms no deploy B)** e de `/precos` (804 ms) e `/dados` (605 ms). O mapa SVG do bairro é o suspeito da pintura — é o mesmo que produz o `element render delay` de 3,3 s do LCP | **médio–grande** | `src/app/_bairro/` (`Bairro.tsx`, `mapa`), `src/lib/bairro/` | (1b), (1a) fases do LCP |
| 6 | **`.b-mundo` com `role="img"` a conter controlos** e os dois SVGs `aria-hidden` com conteúdo focável. As 2 violações sérias que restam | **médio** | `src/app/_bairro/Bairro.tsx` (`role`, `aria-hidden`) | (4) |
| 7 | **A cena é sempre a última coisa a chegar**: o JSON sai 4–11 s depois do FCP, e o chunk da cena é o 16.º e último. Pedir o JSON no fim da hidratação, ou ao ver a âncora, e pré-carregar o chunk | **médio** | `src/app/_bairro/Bairro.tsx` (`CenaViva`, o `fetch`), `src/app/_bairro/cenas/registry.ts` | (2): colunas FCP / JSON pedido / chunk |
| 8 | **O LCP da home está 466 ms acima da meta** e o sinal é ambíguo (simulador 2 966 ms, navegador real 4 752 ms, ambos sob carga) | — | ver abaixo | (1b), e o bloco «não concorda» |

### O que **não** é para corrigir agora

- **As 11 cenas, todas as 12 rotas migradas, o CLS e as imagens.** 0 KB de
  imagem em 10 rotas, 0 de violações axe em 12 rotas, 0 de CLS em 11 cenas.
  Não há nada a fazer.
- **Os 249 KB de JS da home** contra o tecto de 350 KB. Passa com 71% do
  orçamento e o redutor óbvio (fontes) já foi feito.
- **Perseguir o LCP do Lighthouse sem o CrUX.** Os dois instrumentos
  disponíveis divergem mais entre si do que da meta; optimize-se o
  simulador e pode-se estar a optimize-se o simulador.

### E o que esta medição não diz

- **INP**: métrica de campo. O laboratório só dá TBT, que é o seu proxy.
  Sem RUM ou CrUX, não há INP.
- **O que um Mac de um utilizador vê.** Foi o Chromium arm64 desta máquina,
  sob carga de 8 a 55. Um CI Linux com carga controlada, ou o CrUX, são as
  duas saídas.
- **Variância diurna do TTFB.** As três leituras do HTML caíram entre as
  13:57 e as 15:35 — o pico do dia da semana já passou, e o número do
  HTML não muda com o tráfego (é export estático). Para TTFB com
  significado são precisas leituras às 08h, 14h e 21h em dias de semana,
  durante uma semana.

## Como reproduzir

```bash
# O instrumento (não precisa de nada instalado no projecto: o lighthouse e
# o axe-core são ferramentas, resolve-as por --lighthouse e --axe)
export CHROME_PATH=$(ls ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/Contents/MacOS/* | head -1)
node scripts/_medir-publicado.mjs lh        --rotas /,/salario  --corridas 3 --saida /tmp/lh-a.json
node scripts/_medir-publicado.mjs cenas     --cenas banco,bomba --corridas 3 --saida /tmp/cenas.json
node scripts/_medir-publicado.mjs html      --vezes 3 --saida /tmp/html.json
node scripts/_medir-publicado.mjs axe       --saida /tmp/axe.json
node scripts/_medir-publicado.mjs lh-cenas  --cenas banco       --corridas 3 --saida /tmp/lhc.json
```

Cada bloco escreve um JSON com todas as corridas — não só a mediana — para
que a dispersão seja auditável. Para o gate, em paralelo:

```bash
npm run build && node scripts/_gate-html.mjs
```

___

# Volta final — 2026-10-06

A **volta de fecho**: mede o **site publicado** (`https://aocentimo.pt`,
nunca um build local) e responde a uma pergunta só — **o site cumpre as metas
de lançamento do `docs/PACK-V5-PRODUCAO.md` §4?** As metas não mudaram:
LCP ≤ 2,5 s e CLS ≤ 0,05 **na home**; JS ≤ 350 KB gzip **por rota**. Medido a
**2026-10-06**, 12:09–14:05 WEST — macOS 26.6.2 (8 núcleos), Node `v22.23.1`,
Lighthouse **13.5.0**, axe-core **4.13.0**, Chrome for Testing
**153.0.8010.12** arm64 (o `chromium-1243` do Playwright, o mesmo da volta de
2026-10-04) no Lighthouse, e o Chrome instalado **154.0.8037.98** (universal,
arm64 nativo) no bloco de browser real. Instrumento:
`scripts/_medir-publicado.mjs`.

## O que mudou, e três correcções no instrumento

Desde 2026-10-04 entraram o **#72** (acessibilidade da home), o **#73** (as
cenas pedem o JSON em intenção), o **#74** (fontes) e o **#76**. O método é o
da volta anterior, para as duas se compararem, com três mudanças no
instrumento, todas visíveis nas tabelas:

- **As cenas passam a medir o DESENHO**, não o texto: `div.b-cena-arte > svg`
  (as dez cenas da `CenaDePerto`) ou `.b-painel` (a Fábrica). Enquanto o JSON
  não chega, a moldura abre com `semDesenho` e **não tem `<svg>`** — logo o
  `<svg>` é o sinal limpo de «a cena abriu». O critério antigo (o painel passa
  de 80 caracteres) continua a ser lido em paralelo, na coluna «texto>80»,
  para a comparação com 04-10 não perder o chão — e os dois coincidem em todas
  as 55 corridas.
- **O `axe` passa a varrer 390 px e 1440 px** e **as 14 rotas** (as 12 de
  2026-10-04 mais `/estilo` e `/sobre`), além da home e de `/#bomba`.
- **A carga da máquina é registada antes e depois de cada bloco**, e o
  `LoadAvg` viaja no mesmo JSON dos números.

Uma nota de leitura que vale mais do que parece: **o CLS que o Playwright
mede é a soma de todos os `layout-shift`, sem a janela de sessão** do
algoritmo canónico. É por isso um **tecto** — o valor oficial do browser é
≤ ao que está nas tabelas. O do Lighthouse é o CLS canónico.

## Condições da máquina e do deploy

A volta de 2026-10-04 ficou marcada por uma carga de até **55** (≈ 7 por
núcleo) — foi por isso que o LCP divergiu entre os dois instrumentos. Esta foi
feita com a máquina parada: às 12:14, antes de começar, ainda havia o
**Firefox** (dois `plugin-container` a 82–89 % de CPU) e o próprio **Freebuff**
a competir; fechado o que não era necessário, a carga durante a medição ficou
entre **1,6 e 4,2**.

| Bloco | início (1/5/15 min) | fim (1/5/15 min) |
|---|---|---|
| Lighthouse `/` | 2,51 / 2,88 / 3,69 | 3,03 / 3,14 / 3,68 |
| Lighthouse `/salario` + `/irs` | 2,62 / 3,02 / 3,60 | 2,45 / 2,69 / 3,32 |
| Lighthouse `/credito` + `/poupanca` + `/inflacao` | 2,00 / 2,53 / 3,22 | 2,70 / 2,67 / 3,04 |
| Lighthouse `/precos` + `/trabalho` | 2,83 / 2,70 / 3,05 | 2,63 / 2,84 / 3,03 |
| Lighthouse `/dados` + `/aprender` | 3,28 / 2,98 / 3,08 | 2,35 / 2,83 / 2,99 |
| Home no Chrome real ×5 | 1,94 / 2,69 / 2,94 | 2,08 / 2,56 / 2,86 |
| Cenas — `banco` · `bomba` · `casa` | 2,24 / 2,46 / 2,78 | 1,69 / 2,19 / 2,58 |
| Cenas — `correios` · `escola` · `fabrica` | 1,59 / 2,10 / 2,53 | 2,03 / 2,06 / 2,41 |
| Cenas — `financas` · `mercearia` · `pastelaria` | 1,79 / 2,01 / 2,39 | 2,23 / 2,00 / 2,28 |
| Cenas — `quiosque` · `segsocial` | 2,20 / 2,00 / 2,28 | 2,72 / 2,22 / 2,31 |
| axe 390 + 1440 px, 16 alvos | 2,58 / 2,22 / 2,31 | 2,57 / 2,34 / 2,34 |
| Diagnóstico do CLS (home, com e sem âncora) | 3,22 / 2,84 / 2,55 | 4,15 / 3,41 / 2,82 |

**Nenhuma corrida passou de 1,5 por núcleo** (o tecto eram 12 no total dos 8
núcleos): o máximo observado foi **4,15 → 0,52 por núcleo**, no fim do
diagnóstico de CLS. Nada foi rejeitado nem repetido por carga. Havia três
Chromium do Lighthouse **órfãos de sessões antigas** (PPID 1, 0 % de CPU, há
3,5 dias) — não foram tocados, e não pesam.

O **deploy não mudou** do princípio ao fim da sessão (mesmo `etag` no primeiro
e no último bloco), portanto **todos os números são da mesma construção**:

| | valor |
|---|---|
| `etag` | `"6ac4d5ea-8e44a"` |
| `last-modified` | Tue, 06 Oct 2026 11:05:14 GMT |
| HTML da home, cru | 582 730 B |
| HTML da home, gzip na rede | **76 728 B (74,9 KB)** |

## (1) Lighthouse móvel — 10 rotas × 5 corridas

`--throttling-method=simulate` (perfil móvel padrão: 1,6 Mbps / 150 ms /
CPU 4×), **5 corridas por rota**, mediana e intervalo. Peso, JS e fontes em
KB gzip, como o Lighthouse os conta.

| Rota | LCP (mediana; min–max) | CLS | TBT | peso | JS | fontes | `woff2` | pedidos |
|---|---|---|---|---|---|---|---|---|
| `/` | **2 684** (2 538–3 273) | 0,0059 (0–0,0059) | 104 (61–140) | 494 | 250 | **126** | 4 | 30 |
| `/salario` | 1 989 (1 748–2 367) | 0,0079 | 43 (20–53) | 346 | 212 | 53 | 2 | 27 |
| `/irs` | 2 131 (1 564–2 488) | 0,0116 (0,0083–0,0160) | 25 (12–28) | 330 | 209 | 53 | 2 | 28 |
| `/credito` | 1 786 (1 670–2 142) | 0,0095 | 31 (19–38) | 329 | 206 | 53 | 2 | 24 |
| `/poupanca` | 2 249 (1 728–2 724) | **0,0576** (0,0482–0,0576) | 30 (23–46) | 368 | 238 | 53 | 2 | 31 |
| `/inflacao` | 2 194 (1 689–2 395) | 0,0077 (0,0066–0,0077) | 27 (16–33) | 349 | 218 | 53 | 2 | 25 |
| `/precos` | 2 134 (1 978–2 673) | 0,0171 (0–0,0171) | 174 (139–190) | 401 | 214 | 53 | 2 | 25 |
| `/trabalho` | 2 489 (1 928–2 650) | 0,0118 | 41 (26–56) | 362 | 235 | 53 | 2 | 30 |
| `/dados` | 2 104 (1 372–2 255) | 0,0042 (0–0,0042) | 38 (28–136) | 390 | 225 | 53 | 2 | 26 |
| `/aprender` | 2 159 (1 551–2 699) | 0,0031 (0–0,0051) | 19 (15–42) | 312 | 192 | 53 | 2 | 24 |

Contra as metas de `docs/PACK-V5-PRODUCAO.md` §4:

| Meta | Medido | Resultado |
|---|---|---|
| LCP ≤ 2 500 ms (home) | **2 684 ms** (2 538–3 273) | **não cumpre** — 184 ms acima, e **as cinco corridas** ficaram acima |
| CLS ≤ 0,05 (home) | **0,0059** (0–0,0059) | **cumpre** |
| JS ≤ 350 KB gzip (por rota) | **250 KB** na home; máximo **250 KB** | **cumpre** — 71 % do tecto |
| LCP ≤ 2 500 ms (as 9 rotas) | medianas entre 1 786 e 2 489 ms | cumpre nas nove |

**O TBT deixou de ser um problema.** A home caiu de **810 ms** (04-10) para
**104 ms**; `/precos` de 804 para 174 ms, `/dados` de 605 para 38 ms. É a
métrica que menos depende da rede simulada — e a que mais melhorou.

### Onde estão os bytes (mediana, KB)

| Rota | total | HTML | CSS | JS | **fontes** | imagens | pedidos |
|---|---|---|---|---|---|---|---|
| `/` | 494 | 75 | 25 | 250 | **126** | 0 | 30 |
| `/salario` | 346 | 38 | 25 | 212 | **53** | 0 | 27 |
| `/irs` | 330 | 25 | 26 | 209 | **53** | 0 | 28 |
| `/credito` | 329 | 28 | 26 | 206 | **53** | 0 | 24 |
| `/poupanca` | 368 | 34 | 26 | 238 | **53** | 0 | 31 |
| `/inflacao` | 349 | 36 | 26 | 218 | **53** | 0 | 25 |
| `/precos` | 401 | **92** | 25 | 214 | **53** | 0 | 25 |
| `/trabalho` | 362 | 32 | 26 | 235 | **53** | 0 | 30 |
| `/dados` | 390 | **70** | 26 | 225 | **53** | 0 | 26 |
| `/aprender` | 312 | 24 | 26 | 192 | **53** | 0 | 24 |

`/precos` (92 KB de HTML) e `/dados` (70 KB) continuam a ser os documentos
mais pesados — quase quatro vezes o `/aprender`. **0 KB de imagem em todas as
dez rotas.**

### O LCP da home é texto, e o que o atrasa é a pintura

O elemento do LCP é **texto em todas as corridas**: o `<h1>` «O dinheiro
explicado ao cêntimo.» em quatro das cinco, e o parágrafo de introdução na
outra. Nas nove rotas é sempre o `<h1>`. O `lcp-breakdown-insight` da home (a
corrida mediana) só tem duas fases — `timeToFirstByte` **689 ms** e
`elementRenderDelay` **4 236 ms** —, **sem `load delay` nem `load time`**: não
há nenhum ficheiro a atrasar o LCP. Não são as fontes (o LCP não pede recurso
nenhum; as duas das rotas estão em `font-display: optional` e não trocam texto
depois de pintado) nem uma imagem: é o **CPU a pintar** — 250 KB de JS e um
mapa SVG grande já dentro do HTML — com o TTFB a somar por baixo. Em `/irs` o
TTFB é 1 574 ms e o LCP 2 131 ms: **mais pintura do que rede**, como em 04-10.

### Comparação directa com 2026-10-04 (mediana)

| Rota | LCP 04-10 → agora | TBT 04-10 → agora | JS 04-10 → agora | fontes 04-10 → agora |
|---|---|---|---|---|
| `/` | 2 943 → **2 684** | 578 → **104** | 249 → 250 | 161 → **126** |
| `/salario` | 2 197 → 1 989 | 90 → 43 | 211 → 212 | 161 → **53** |
| `/irs` | 2 251 → 2 131 | 263 → 25 | 208 → 209 | 161 → **53** |
| `/credito` | 1 732 → 1 786 | 160 → 31 | 204 → 206 | 161 → **53** |
| `/poupanca` | 2 383 → 2 249 | 159 → 30 | 237 → 238 | 161 → **53** |
| `/inflacao` | 2 344 → 2 194 | 145 → 27 | 216 → 218 | 162 → **53** |
| `/precos` | 2 500 → 2 134 | 804 → 174 | 212 → 214 | 162 → **53** |
| `/trabalho` | 2 585 → 2 489 | 388 → 41 | 233 → 235 | 162 → **53** |
| `/dados` | 2 748 → 2 104 | 605 → 38 | 224 → 225 | 161 → **53** |
| `/aprender` | 1 664 → 2 159 | 187 → 19 | 191 → 192 | 161 → **53** |

O LCP melhorou em oito das dez e piorou em duas (`/credito` +54 ms,
`/aprender` +495 ms) — mas a dispersão de 04-10 era maior do que isso
(`/aprender` tinha ido de 1 429 a 2 464 ms naquela volta), por isso **`/aprender`
não é uma regressão que se possa afirmar**: é uma mediana que se mexeu dentro
do ruído do instrumento.

## (2) A home no Chrome real — LCP e FCP reais

Playwright a conduzir o **Chrome instalado** (`channel: chrome`,
154.0.8037.98), 390×844, rede a **1,6 Mbps / 150 ms** e **sem** estrangular o
CPU — o oposto do Lighthouse, que simula a rede e estrangula o CPU a 4×. LCP e
FCP lidos por `PerformanceObserver` na própria página, 5 corridas.

| Corrida | LCP | FCP | TTFB | render delay | `load` | elemento |
|---|---|---|---|---|---|---|
| 1 | 7 356 | 6 964 | 3 276 | 4 080 | 16 919 | `h1` |
| 2 | 5 508 | 4 920 | 1 109 | 4 399 | 14 915 | `h1` |
| 3 | 5 164 | 4 532 | 1 195 | 3 969 | 13 552 | `h1` |
| 4 | 5 528 | 4 900 | 1 535 | 3 993 | 12 879 | `h1` |
| 5 | 14 524 | 14 232 | 6 268 | 8 256 | 24 450 | parágrafo |
| **mediana** | **5 528** | **4 920** | 1 535 | 3 993 | 14 915 | — |

**O browser real dá pior do que o simulador: LCP 5 528 ms contra 2 684 ms.** A
leitura é a mesma de 04-10 — os dois instrumentos divergem mais entre si do que
cada um deles diverge da meta — mas agora com um culpado claro: o **TTFB real**.
O simulador modela um TTFB de 689 ms; a rede real devolveu 1 109–6 268 ms
(mediana 1 535 ms) e, por cima, o render delay foi de ~4 s. A corrida 5 é um
caso extremo (TTFB 6 268 ms) que sozinha estica o intervalo até aos 14,5 s; a
mediana é o número com significado. **O número a levar para o lançamento
continua a ser o LCP de campo (CrUX), que ainda não temos.**

## (3) As 11 cenas por âncora — tempo até ao desenho

Playwright com CDP (`Network.emulateNetworkConditions` a 1,6 Mbps / 150 ms e
`Emulation.setCPUThrottlingRate` 4), 390×844, **contexto novo em cada corrida**
(sem cache herdada), a navegar a `/#<cena>`. **5 corridas por cena**, mediana e
intervalo. «Desenho» = o instante em que aparece `div.b-cena-arte > svg` (dez
cenas) ou `.b-painel` (a Fábrica).

| Cena | desenho (mediana; min–max) | texto>80 | FCP | CLS | 04-10 | Δ | pedidos | onde |
|---|---|---|---|---|---|---|---|---|
| `escola` | 11 593 (10 645–15 569) | 11 593 | 3 392 | 0,0438 | 25 043 | **−54 %** | 17 | `div.b-cena-arte > svg` |
| `banco` | 11 907 (11 799–21 721) | 11 907 | 3 860 | 0,0438 | 16 246 | −27 % | 17 | idem |
| `segsocial` | 12 646 (11 571–13 797) | 12 646 | 4 104 | 0,0438 | 21 217 | −40 % | 17 | idem |
| `financas` | 12 621 (11 478–13 296) | 12 621 | 4 504 | 0,0438 | 14 633 | −14 % | 17 | idem |
| `fabrica` | 12 946 (10 592–15 097) | 12 946 | 4 432 | 0,0438 | 25 381 | **−49 %** | 17 | `.b-painel` |
| `mercearia` | 13 266 (12 988–13 710) | 13 266 | 3 904 | 0,0438 | 18 314 | −28 % | 17 | idem |
| `correios` | 13 321 (12 479–15 765) | 13 321 | 3 780 | 0,0438 | 17 668 | −25 % | 17 | idem |
| `quiosque` | 14 076 (13 402–15 831) | 14 076 | 4 348 | 0,0438 | 19 855 | −29 % | 17 | idem |
| `pastelaria` | 14 237 (12 631–17 190) | 14 237 | 3 764 | 0,0438 | 23 647 | −40 % | 17 | idem |
| `casa` | 14 450 (13 704–15 305) | 14 450 | 4 424 | 0,0438 | 16 019 | −10 % | 17 | idem |
| `bomba` | 15 164 (13 620–15 495) | 15 164 | 5 692 | 0,0438 | 16 864 | −10 % | 17 | idem |

Todas as 11 abrem, todas com conteúdo, **zero pedidos falhados**, e o desenho e
o texto chegam **no mesmo instante** (as duas colunas coincidem nas 55
corridas). O `#73` fez o que prometia: **todas as 11 cenas ficaram mais
rápidas**, entre 10 % e 54 %, e as medianas encolheram de 14,6–25,4 s (04-10)
para **11,6–15,2 s**.

**Mas o CLS subiu de 0,00013 para 0,0438** — nas 55 corridas, o valor é exacto
0,0438 em **46**, e 0 / 0,00523 / 0,03854 nas outras 9. Não é ruído de uma
corrida: é o mesmo número repetido em cenas diferentes, logo vem de um
elemento **comum** a todas — a moldura `.b-cena` ou algo que a antecede. Um
controlo feito à parte resolve a dúvida.

### Onde está o CLS de 0,044 (e onde não está)

Medida a **home sem abrir cena nenhuma** (`/`, sem âncora), pelo mesmo método —
mesmo throttle, mesmo CPU 4×, mesmo observador:

| Alvo | 3 corridas | mediana |
|---|---|---|
| `/` (home, sem âncora) | 0 / 0,04378 / 0,04378 | 0,04378 |
| `/#banco` (com a cena aberta) | 0,04378 / 0,03854 / 0,04378 | 0,04378 |

**O CLS não vem da cena.** A home sozinha, sob 1,6 Mbps e CPU 4×, já dá
0,0438 — logo o que se mexe é a própria página. Os candidatos são a chegada
tardia do CSS/fontes sob rede lenta a reformatar o texto, ou o `ResizeObserver`
da câmara do mapa a reenquadrar o SVG. **Não confirmado** — o que está
confirmado é que (a) não é a cena, e (b) o Lighthouse canónico mede **0,0059**
na home, ou seja, **o simulador não vê 7/8 do que o browser real vê.**

## (4) axe a 390 px e a 1440 px

axe-core **4.13.0** (a mesma versão de 2026-10-04), WCAG 2.0/2.1 A+AA
(`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`), no site publicado. As 14 rotas
são `/salario`, `/irs`, `/impostos`, `/poupanca`, `/credito`, `/casa`,
`/inflacao`, `/precos`, `/trabalho`, `/dados`, `/aprender`, `/metodologia`,
`/estilo`, `/sobre`.

| Alvo | 390×844 | 1440×900 | 2026-10-04 (390 px) |
|---|---|---|---|
| `/` (home) | **0** | **0** | 2 |
| `/#bomba` (cena aberta) | **0** | **0** | 1 |
| as 14 rotas | **0** | **0** | 0 (nas 12 migradas) |

**Zero violações em 32 verificações** (16 alvos × 2 larguras). As **duas
violações sérias que sobravam na home** — `aria-hidden-focus` (nos dois SVGs
`#b-cFundo` e `#b-cFrente`, com conteúdo focável) e `nested-interactive`
(`.b-mundo` com `role="img"` a conter controlos) — **desapareceram** com o
**#72**, e a cena aberta passou de 1 a 0. As 14 rotas continuam limpas, agora
também `/estilo` e `/sobre`, e agora **também a 1440 px**. **A meta «0 na
home» cumpre-se.**

## (5) O HTML da home na rede — três momentos

`curl -H 'Accept-Encoding: gzip'`, três leituras por momento.

| Momento (WEST) | bytes gzip | TTFB (3 leituras) |
|---|---|---|
| 13:09 | **76 728** | 1,414 / 1,790 / 1,260 s |
| 13:29 | **76 728** | 0,595 / 0,475 / 0,288 s |
| 13:29 | **76 728** | 0,615 / 0,383 / 1,339 s |

**76 728 B = 74,9 KB**, `content-encoding: gzip`, servido por GitHub Pages
(`x-github-edge-region: fra`, `cache-control: max-age=600`). Sem compressão
são **582 730 B** — o gzip divide por 7,6. As nove leituras deram sempre o
mesmo número, como se espera de um export estático com `content-length` fixo.

### Contra o gate

O `scripts/_gate-html.mjs` é um gate de **regressão sobre o build local**
(`out/index.html`), não uma medida do que os utilizadores recebem; o que estes
três momentos medem é a segunda coisa.

| Origem | HTML da home gzip | Contra o tecto de 80 KB |
|---|---|---|
| **rede, deploy `6ac4d5ea-8e44a` (esta volta)** | **76 728 B (74,9 KB)** | **−5 192 B (folga de 5,1 KB)** |
| rede, 2026-10-04 (deploy B) | 76 673 B (74,9 KB) | −5 247 B |

**Cumpre**, com 5,1 KB de folga em relação ao tecto.

## (6) Fontes e CLS por rota

| Onde | ficheiros `woff2` | peso | 2026-10-04 | CLS (mediana) |
|---|---|---|---|---|
| `/` | **4** | **126 KB** | 161 KB / 2 ficheiros | 0,0059 |
| as 9 rotas | **2** | **53 KB** | 161 KB / 2 ficheiros | 0,0031–0,0576 |

A home pede `Archivo_base`, `Archivo_larga`, `/fonts/Archivo-intro.woff2` e
`Caveat_700`; as rotas pedem só as duas primeiras. O **#74** fez o que prometia
nas rotas — **161 → 53 KB (−67 %)**, sem mudar o número de ficheiros — e na
home menos, porque lá entram dois ficheiros que as rotas não pedem
(**161 → 126 KB, −22 %**). Nas rotas as fontes deixaram de ser o maior bloco
isolado; **na home continuam a ser 26 % do peso**.

O **CLS por rota** (coluna do ponto 1) vai de 0,0031 a 0,0118 nas nove,
**excepto `/poupanca`, que é 0,0576** — o único valor do site acima do limiar
de 0,05.

## O que NÃO cumpre

Só isto, com a causa provável e o esforço. **Nada foi corrigido nesta volta —
esta volta mede.**

| # | O quê | Medido | Meta | Causa provável | Esforço |
|---|---|---|---|---|---|
| 1 | **LCP da home** | **2 684 ms** (2 538–3 273; as 5 corridas acima) | ≤ 2 500 ms | pintura, não recurso: o elemento é o `<h1>`, texto; o `lcp-breakdown` **não tem `load delay` nem `load time`**. É CPU a pintar (250 KB de JS + o mapa SVG já no HTML) com um TTFB real de ~1,5 s por baixo | **médio** |
| 2 | **CLS da home no browser real** | **0,0438** (tecto: soma de todos os shifts) contra 0,0059 do simulador | ≤ 0,05 | cumpre — **mas com 12 % de folga**, e subiu de ~0 para ~0,04 desde 04-10. A medição sem cena dá o mesmo 0,0438, logo não é a cena: suspeitos são a chegada tardia do CSS/fontes sob 1,6 Mbps ou o `ResizeObserver` da câmara do mapa | **pequeno–médio** |
| 3 | **CLS de `/poupanca`** | **0,0576** (0,0482–0,0576), CLS canónico do Lighthouse | ≤ 0,05 (a meta é só da home) | um shift na rota; é o único valor do site acima do limiar | **pequeno** |
| 4 | **Fontes da home** | **126 KB / 4 ficheiros** (26 % do peso) | — (sem meta) | a home paga `Archivo-intro` + `Caveat_700` além das duas das rotas; **não é uma meta violada**, é o maior bloco isolado da home | **pequeno** |

**Cumpre:** CLS da home (0,0059 ≤ 0,05) · JS ≤ 350 KB em todas as 10 rotas
(máximo 250 KB, 71 % do tecto) · LCP ≤ 2,5 s nas 9 rotas de conteúdo · **axe 0
em 16 alvos × 2 larguras** (a meta «0 na home» incluída) · HTML 74,9 KB ≤ 80 KB ·
TBT da home 104 ms (era 810) · as 11 cenas abrem, todas mais rápidas, sem
pedidos falhados.

**Não disse:** o **INP** — é métrica de campo, e o Lighthouse 13 traz um
`inp-breakdown-insight` que devolve `notApplicable` (o laboratório só tem o
TBT como proxy). E não disse **o que um Mac de um utilizador vê** com rigor:
foi o Chrome desta máquina, com a carga publicada acima. O **CrUX** continua a
ser a única fonte que resolve as duas perguntas.

## Como reproduzir

```bash
export CHROME_PATH=$(ls ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/Contents/MacOS/* | head -1)
LH=$(find ~/.npm/_npx -path '*lighthouse/cli/index.js' | head -1)   # npx lighthouse@13.5.0

node scripts/_medir-publicado.mjs lh    --rotas / --corridas 5 --lighthouse "$LH" --saida /tmp/lh-home.json
node scripts/_medir-publicado.mjs real  --corridas 5 --saida /tmp/real-home.json
node scripts/_medir-publicado.mjs cenas --cenas banco,bomba,casa --corridas 5 --saida /tmp/cenas.json
node scripts/_medir-publicado.mjs axe   --larguras 390,1440 --saida /tmp/axe.json
node scripts/_medir-publicado.mjs html  --vezes 3 --saida /tmp/html.json
```

Cada bloco escreve um JSON com **todas** as corridas (não só a mediana) e com a
carga da máquina antes e depois — é assim que a dispersão fica auditável e que
uma corrida acima de 1,5 por núcleo se rejeita.