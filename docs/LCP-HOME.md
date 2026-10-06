# LCP da home — de onde vem o atraso, e o que atacar primeiro

2026-10-06. Ramo `v5/lcp-home`, a partir de `add1cfc` (main). Instrumento:
[`scripts/_perfil-lcp.mjs`](../scripts/_perfil-lcp.mjs).

A meta é LCP ≤ 2 500 ms na home ([PACK-V5-PRODUCAO §4](./PACK-V5-PRODUCAO.md)).
A volta final de 2026-10-06 mediu **2 684 ms** (Lighthouse móvel, mediana de
5 corridas) — 184 ms acima. Este documento separa o que é rede/infraestrutura
do que é CPU/pintura, e ordena as correcções por ganho/risco.

## O que já se sabia

- O elemento do LCP **é texto**, não um recurso: o `<h1>`/intro em `.b-intro`
  (`lcpLoadTime: 0`, sem `lcpUrl`). O atraso está na pintura, não no download.
- Lighthouse móvel (CPU 4× simulado): LCP 2 684, FCP ≈ 2 500, TBT 104 ms,
  250 KB de JS, 126 KB de fontes.
- Chrome real (sem estrangular o CPU, rede 1,6 Mbps): LCP **5 528**
  (5 164–14 524), FCP 4 920, **TTFB 1 535** (1 109–6 268).

## A separação: TTFB (infra) vs CPU (código)

| Componente | Simulado (CPU 4×) | Real (rede 1,6 Mbps) | Quem manda |
|---|---|---|---|
| TTFB | 689 ms | 1 109–6 268 ms (mediana ≈ 1 535) | **CDN/GitHub Pages — infra** |
| FCP − TTFB | ≈ 1 800 ms | ≈ 3 400 ms | **código** |
| LCP − FCP | ≈ 150 ms | ≈ 600 ms | código |

O TTFB do CDN é **muito instável** (638 a 14 082 ms em 6 amostras nesta
sessão). Não se corrige em código — corrige-se em infraestrutura. O que
está na nossa mão é o **atraso de pintura**.

## O que pesa no atraso de pintura

O HTML da home tem **582 730 B**, e um único bloco é **84,1 %** disso: o mapa
(`<div class="amb">` → `#conteudo-bairro`), 489 179 B com **5 612 elementos**,
2 436 `<path>` e 8 camadas `<svg class="b-camada">`. O `<h1>` está ao byte
30 155 e o mapa começa a 118 px do topo — **o mapa está no primeiro ecrã**.

Para atribuir o custo, [`_perfil-lcp.mjs`](../scripts/_perfil-lcp.mjs) serve o
`out/` **local** (TTFB ~0, rede sem limite, CPU a 1×) e desliga um suspeito de
cada vez. Só muda o custo de CPU/parse/layout — o TTFB sai da equação.

Mediana de 3 corridas (ms):

| variante | FCP | LCP | dcl | load | longTasks | elemento LCP |
|---|---|---|---|---|---|---|
| original | 1 356 | ⌛ 4 616 | 8 823 | 9 238 | 7 074 | P (intro) |
| intro sem a fonte da casa | 1 452 | **3 112** | 8 964 | 9 285 | 7 187 | P |
| mapa oculto (`content-visibility: hidden`) | 1 580 | 3 632 | 6 577 | 6 634 | 7 738 | P.b-lead |
| mapa fora do HTML | 1 604 | **2 832** | 6 261 | 6 315 | 23 983 | P.b-lead |
| JavaScript desligado | 944 | — | 1 325 | 2 059 | 0 | — |

O que isto diz:

1. **O mapa não atrasa o FCP.** O FCP é 1 356–1 604 ms em todas as variantes
   com o mapa; só cai para 944 ms sem JS. Logo a primeira pintura é dominada
   pelo parse do documento e pelas folhas de estilo, e o JS acrescenta
   ~0,4–0,7 s.
2. **O mapa atrasa o LCP da intro.** Ocultá-lo desce o LCP de 4 616 para
   3 632 (−984 ms); tirá-lo do HTML desce a 2 832 (−1 784 ms). O trabalho de
   layout/pintura das 8 camadas disputa a thread principal com a pintura da
   intro.
3. **O swap da fonte da intro custa ~1,5 s.** Com a intro em Arial, o LCP cai
   de 4 616 para 3 112. A intro pinta primeiro com a fonte de recurso (o FCP)
   e volta a pintar quando o Archivo entra — e é essa segunda pintura que fica
   registada como LCP.
4. **O JavaScript é o maior custo único.** Vale ~7,5 s de *long tasks* e leva
   o `dcl`/`load` de ~1,3/2,1 s (sem JS) para ~8,8/9,2 s. É o que hidrata o
   `<Bairro>` inteiro (câmara, ambiente, GSAP, prefetch) e as `<Cartas>`.

> A CPU fica a 1× de propósito: `Emulation.setCPUThrottlingRate` a 4 estanca o
> parser neste Chromium headless (a página fica «pendurada»). Por isso os
> números acima lêem-se como **atribuição relativa**, não como valores
> absolutos — a escala absoluta é a do Lighthouse, na tabela anterior.

## Proposta, por ganho/risco

1. **Tirar o mapa do caminho crítico da primeira pintura** — o maior ganho
   medido (LCP −1,0 a −1,8 s). O `content-visibility` não serve: o mapa está
   no primeiro ecrã, e o browser não o pode adiar. A via é manter os edifícios
   e os números inline (o contrato «sem JavaScript vê-se o bairro» fica de pé)
   e rebaixar as **camadas decorativas** — céu, rio, ponte, topo e as peças
   soltas — para um SVG externo desenhado depois da primeira pintura.
   *Risco: médio* (contrato visual e o `semDesenho` das cenas). **Colide com a
   sessão que está a mexer em `planta.ts`/`mundo.ts`/`Bairro.tsx` agora** — a
   fazer depois de essa terra assentar.

2. **Cortar o JS de hidratação da home** — o maior custo único (~7,5 s de long
   tasks, e também segura a pintura da intro). O caminho barato é escalonar a
   hidratação do que não é o mapa (ambiente, GSAP, prefetch, cartas) para
   depois do primeiro ocioso, mantendo a câmara imediata. *Risco: médio.*

3. **Eliminar a penalização do swap da fonte da intro** — ✅ **feito**.
   O `ArchivoMeio Fallback` passa de `size-adjust: 117,42%` para **134,25%**
   (`globals.css`), o valor que faz o fallback medir o mesmo avanço que o
   ficheiro: o `<h1>` deixa de voltar a quebrar de 2 para 3 linhas no swap.
   Medido no `out/` local, **LCP 3 984 → 2 752 ms** e **CLS 0,04378 →
   0,00848** — as duas contas na mesma mudança ([`CLS-HOME.md`](./CLS-HOME.md)).
   Mantém-se `font-display: swap`, sem `optional`. *Risco: baixo.*

4. **Enxugar a `globals.css`** — 132 KB que bloqueiam a renderização em todas
   as rotas, e a razão do piso de FCP (~0,9 s sem JS). Ainda assim é um
   *blur* amplo, sem ganho medido só na home. *Risco: médio–alto.*

**Recomendação:** atacar **1 + 2** num PR (o mapa fora do caminho crítico e o
JS escalonado), que é onde está o ganho; decidir **3** com o dono, à parte.

## Como reproduzir

```bash
npm run build                      # out/
PORTA=3123 node scripts/_serve-static.mjs &
node scripts/_perfil-lcp.mjs --url http://localhost:3123/ --corridas 3

# o TTFB real, à parte:
node scripts/_medir-publicado.mjs real --corridas 5
```
