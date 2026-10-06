# CLS da home — de onde vem o 0,0438, com prova

2026-10-06. Ramo `v5/lcp-home`, a partir de `add1cfc` (main). Instrumento:
[`scripts/_perfil-cls.mjs`](../scripts/_perfil-cls.mjs). Irmão deste:
[`LCP-HOME.md`](./LCP-HOME.md).

## O sintoma

A volta de medição de 2026-10-06 mediu a home **no browser real sob 1,6 Mbps**
com CLS **0,0438** — 7,5× o que o Lighthouse móvel reporta (0,0059) e ~330× o
valor de 2026-10-04 (0,00013). Ficou sem causa atribuída, com dois suspeitos:
as folhas de estilo/fontes a chegar tarde, ou o `ResizeObserver` da câmara do
mapa a re-enquadrar depois do primeiro passo.

## Como se mediu

[`_perfil-cls.mjs`](../scripts/_perfil-cls.mjs) corre contra a **página
publicada** (uma página local não reproduz o CLS) com rede a 1,6 Mbps/150 ms e
CPU a 4× — a mesma configuração da volta. Guarda cada entrada `layout-shift`
com as suas **fontes** (`sources`: nó, rect antes/depois, instante), cronometra
a chegada das fontes (`document.fonts`) e segue as rects dos blocos ao longo
do tempo. Desliga um suspeito de cada vez.

## Resultado

| variante | CLS (n corridas) |
|---|---|
| original | **0,04378 · 0,04378 · 0,04378 · 0,04378** (determinístico, 4/4) |
| JavaScript desligado | 0 · 0 |
| todas as `woff2` bloqueadas | 0 · 0 |
| **só `/fonts/Archivo-intro.woff2` bloqueada** | **0 · 0,00523 · 0,00523** |
| só o `Archivo_base` bloqueado | 0 · 0 · 0,03854 |
| transições/animações desligadas | 0 · 0 |
| rede rápida (`SEM_REDE=1`), sem throttle | 0,03854 · 0 |

O deslocamento grande (0,03854, 88 % do total) e o pequeno (0,00523) somam os
0,04378. As fontes do grande:

```
t=5049  v=0,03854  SECTION.b-palco  [0,403,390,442] -> [0,431,390,413]
t=5049  v=0,03854  P                [20,306,350,81] -> [20,334,350,81]
t=5049  v=0,03854  ?                [20,250,350,32] -> [20,296,350,32]
t=5390  v=0,00523  SPAN             [20,15,227,22]  -> [20,15,225,17]
```

## A prova

A linha do tempo das rects, na mesma corrida:

```
.b-intro     [20,237,350,166]  ->  [20,237,350,195]     a intro cresce +29 px
.b-intro h1  [20,241,350, 57]  ->  [20,241,350, 86]     o h1 passa de 2 para 3 linhas
.b-janela    [  0,407,390,625] ->  [  0,435,390,625]    o MAPA não muda de tamanho
```

Três factos, e o que cada um prova:

1. **O `<h1>` passa de 57 para 86 px** — 2 linhas para 3, a ~28,5 px por linha
   (o `clamp(30px…)` × `line-height: 0.95`). É este o +29 px que empurra toda a
   página para baixo. O `<h1>` usa `--font-meio`, ou seja o `ArchivoMeio`
   (a instância a 116 %), com `font-display: swap`.
2. **Bloquear SÓ essa face** (`/fonts/Archivo-intro.woff2`) leva o CLS a 0 e
   deixa o h1 preso nas 57 px — não volta a quebrar linha. Bloquear só o
   `Archivo` base **não** o resolve (0,03854 reaparece). A causa é essa face,
   e só essa.
3. **O `.b-janela` mantém 625 px.** O contentor do mapa não muda de tamanho;
   desce apenas porque a intro acima cresceu. **A hipótese da câmara /
   `ResizeObserver` está refutada**: nenhuma entrada tem o `.b-mundo` nem um
   `transform` como fonte, e o único bloco que muda de tamanho é texto.

**Veredicto.** O CLS da home é **o swap tardio da face de 116 % do Archivo no
título**, que volta a quebrar o `<h1>` de 2 para 3 linhas depois da primeira
pintura e empurra a página ~29 px. Não é CSS tardio (as folhas são
render-blocking, não há deslocamento antes delas) nem a câmara do mapa.
O `document.fonts.ready` chega entre 0,6 e 8,7 s consoante a rede; sob CPU 4×
o *relayout* do swap cai depois do primeiro passo, e é isso que o CLS apanha.

O deslocamento pequeno (0,00523) é outra coisa, e menor: um `SPAN` do
cabeçalho do site (`layout.tsx`) a encolher de 22 para 17 px — o seu próprio
swap de fonte. Não vale a pena atacar antes do principal.

## O que isto tem a ver com o LCP

É **a mesma face**. Em [`LCP-HOME.md`](./LCP-HOME.md), o swap da fonte da intro
é a maior alavanca isolada do LCP (−1,5 s a 1× de CPU). Um só arranjo —
garantir que o `Archivo-intro.woff2` está no primeiro passo, ou travar a
métrica de recurso para o título não mudar de linha — fecha as duas contas ao
mesmo tempo. É por isso que esta face é a prioridade nº1 das duas listas.

## Como reproduzir

```bash
node scripts/_perfil-cls.mjs --url https://aocentimo.pt/ --corridas 4
node scripts/_perfil-cls.mjs --url https://aocentimo.pt/ --corridas 3 --so bloq-fonte-intro
```
