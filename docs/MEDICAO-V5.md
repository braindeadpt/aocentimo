# MEDIÇÃO-V5 — desempenho do build e dos payloads

Fotografia estática do custo de servir o site. Todos os números abaixo foram
medidos nesta máquina a **2026-10-02**, commit `c754128` (= `origin/main`
nessa altura), Node `v22.23.1`, npm `10.9.8`, `npm run build` (EXIT 0).
Nada aqui é estimado: ou saiu de um comando corrido, ou está marcado como
tal. Não há "antes/depois" — isto é a linha de base, não uma comparação.

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
