# Auditoria do mapa da home — 2026-10-06

De `fc86f74` (main). Ramo: `fix/mapa-audit-2026-10`. Pedido do dono: o mapa
e as animações iguais à maqueta (`design/prototipos/mapa/`), sem erros, e
documentado. Sintomas reportados:

1. **iPhone (Safari e Chrome):** ao chegar ao mapa a página crasha e recarrega.
2. **Desktop:** o mapa não abre centrado na janela.
3. **Desktop:** escolher o modo escuro «crasha».
4. Animações diferentes da maqueta.

Tudo o que está abaixo foi **reproduzido antes e verificado depois** — os
números são medidos, não estimados. Instrumentos no fim.

---

## 1. O crash no iPhone — CORRIGIDO

### Causa

No iPhone, Safari **e** Chrome são WebKit (a Apple obriga). O crash não é um
erro de JavaScript: é o processo da página a ser morto por **memória**, e o
iOS recarrega-a («Ocorreu um problema repetidamente»).

O mapa são oito SVG de 3600×2500 empilhados (`.b-camada`). Entre a camada
`b-cB` e a `b-cRio` estavam **dois metros e dois rabelos como `<svg>` HTML
soltos, em `position: absolute`, com `translate` animado por CSS**. Um
elemento HTML com transformação animada ganha camada própria no compositor —
e, pela regra de sobreposição, **todas as camadas pintadas por cima dele que
se sobrepõem são promovidas também**: `b-cRio`, `b-cPonte`, `b-cCeu`,
`b-cTopo` e o véu `#b-noite` — superfícies de 3600×2500 rasterizadas à escala
do ecrã Retina (DPR 3). O processo esgota a memória.

### Prova (WebKit do Playwright, viewport 390×664)

| variante | DPR 1 | DPR 2 | DPR 3 |
|---|---|---|---|
| `main` | ok | **crash** | **crash** (1–3 s) |
| `main` sem JavaScript | — | **crash** | **crash** |

Bissecção a DPR 3, sem JavaScript, injectando uma regra de cada vez:

| regra injectada | resultado |
|---|---|
| nenhuma | crash |
| `.b-mundo{display:none}` | ok |
| `*{animation:none}` | ok |
| `.b-solto{display:none}` | ok |
| só as nuvens soltas escondidas | crash |
| só **metro e rabelos** escondidos | **ok** |
| `#b-noite{display:none}` | crash |
| `will-change` no mundo ou nas camadas | crash (pior) |

O culpado é a combinação **SVG solto animado + camadas gigantes por cima**.

### Correcção

- `mundo.ts`: as peças que viajam (nuvens, metro, rabelos) passam a ser
  `<g class="b-viagem">` **dentro** das camadas — `viajante()`. Um filho de
  SVG nunca ganha camada própria; a animação passa a repintar só o rectângulo
  da peça. O desenho já vinha em coordenadas do mundo, por isso a passagem é
  exacta: os rabelos e o metro pintam-se no início de `b-cRio` (a mesma ordem
  de antes), as nuvens no início de `b-cFundo`.
- `bairro.css`: a `.b-janela` passa a ser **uma** superfície do tamanho do
  ecrã, recortada (`overflow: hidden; contain: strict; will-change:
  transform`). Medido a DPR 3 com noite + 4 cliques de «+»: **pico de
  1 412 MB → 652 MB** no WebKit. A superfície custa ~7 MB num iPhone.

### Depois

| variante | DPR 2 | DPR 3 |
|---|---|---|
| com e sem JS | ok | ok |
| noite + zoom ×4 | ok | ok (pico 652 MB) |

Testes novos: `mundo.test.ts` («nenhuma peça animada é HTML solto entre as
camadas») e `bairro-css.test.ts` (sem `.b-solto`, deriva das nuvens ligada).

---

## 2. O mapa descentrado no desktop — CORRIGIDO

### Causa

`vistaInicial()` → `encaixaCaixas()` só **deslocava o mínimo** para os
marcadores caberem. Quando cabiam sem alargar, a vista ficava onde o ponto
de partida do protótipo a punha — encostada.

Medido a 1440×900 (janela do mapa 1240×666): margem dos marcadores **255 px
à esquerda, 124 px à direita**.

### Correcção

`camara.ts`: quando o conteúdo cabe, **centra-se nele**; quando não cabe e
não pode alargar, mantém-se o deslocamento mínimo. O enquadramento sem JS do
`bairro.css` foi regenerado da mesma função (`-28.2088cqw` → `-33.3983cqw`),
e o `mundo.test.ts` continua a conferir os dois.

Depois: **191 px / 188 px**. O telemóvel não muda (já alargava até caber).

---

## 3. O modo escuro «crasha» no desktop — CORRIGIDO

### Causa

O toggle põe `html[data-theme-anim]` durante 400 ms, e o `globals.css`
aplicava `transition: background-color, color, border-color !important` a
**`body *`** — incluindo os ~4 800 nós do SVG do mapa. Mudar o tema
recalculava e transitava o mapa inteiro, que nem muda de cor (a home é
«papel em qualquer tema»).

Medido no Chromium, tarefas longas depois do clique:

| | maior tarefa | soma |
|---|---|---|
| `main` | **1 054–1 771 ms** | **~2 000–2 700 ms** |
| corrigido | 133 ms | ~430 ms |

Num portátil mais lento, ~2 s de página congelada lê-se como crash.

### Correcção

- `layout.tsx`: na home (`.b5`) o toggle troca o tema **sem** transição.
- `globals.css`: a regra de transição deixa de apanhar SVG
  (`body *:not(svg, svg *)`), para qualquer rota com gráficos.

---

## 4. Animações face à maqueta — CORRIGIDO

| o quê | maqueta | `main` | agora |
|---|---|---|---|
| nuvens a derivar (`nuvemAnda`) | sim | **perdida** (as `--dx`/`--dur` estavam no HTML, a regra não) | reposta (`b-nuvem-anda`) |
| gente a pestanejar | sim (`pisca`) | **perdida** | reposta, sorteio com semente fixa |
| gente a respirar (tronco) | sim | **perdida** | reposta (não em quem anda — o passo já mexe o tronco) |
| esbatimento do eléctrico | 1,4 ladrilhos em cada ponta | 5 % da viagem | 1,4/16,8, como na maqueta |
| hora do dia | hora local | **a hora do build** (export estático, relógio UTC do CI) | hora local: script em linha antes da pintura + `useSyncExternalStore` |

A hora merece nota: `HomeBairro` dizia que «o primeiro efeito do `<Bairro>`
passa a hora a que for quando a página carrega» — **esse efeito não
existia**. A página era gerada às tantas no CI e todos viam esse céu até
carregarem num botão. Agora `hora.ts` tem a regra uma vez, o script em
linha acerta a classe do palco antes de pintar, e o React alcança-o sem
mismatch de hidratação (`hora.test.ts` confere o script contra a regra às
24 horas).

---

## 5. O que fica em aberto (decisão do dono)

- **Telemóvel: marcadores cortados nas pontas.** Por desenho (`vistaInicial`,
  «os outros marcadores ficam a um arrasto»), no ecrã estreito só os quatro
  essenciais têm de caber; «Cabaz desde 2020» e «Cert. de Aforro» nascem
  meio fora. Alternativas: esconder os não essenciais no arranque, ou
  aceitar a fonte mais pequena e mostrá-los todos.
- **Arrastar repinta o mapa.** A maqueta punha `will-change` nas oito
  camadas (arrasto só no compositor, ~35 fps) à custa da memória que matava
  o iPhone. A produção escolheu a memória; a classe `b-repinta` da câmara
  ficou sem regra CSS (código morto inofensivo). O caminho para ganhar os
  fps de volta sem o custo é o Item 3 do `MAPA-HOME.md` (menos nós).
- **`#b-noite` usa `mix-blend-mode: multiply`** sobre o mundo inteiro. Não
  é causa de crash (bissecção acima), mas é a pintura mais cara da noite.

---

## 6. Instrumentos

- `scripts/_sonda-mapa.mjs [movel|desktop] [dia|noite]` — enquadramento
  medido (margens dos edifícios e dos marcadores dentro da janela), erros de
  consola e, em desktop, as tarefas longas do toggle de tema. Precisa do
  `out/` servido em `:3100`; `CHROME=` aponta para o binário.
- Reprodução WebKit (Playwright `webkit`, `device_scale_factor=3`,
  `has_touch=True`, `java_script_enabled` on/off) e pico de RSS do
  `WebKitWebProcess` amostrado a 200 ms. Variantes por `<style>` injectado
  numa cópia do `out/index.html`.

Verde antes do PR: `lint`, `typecheck`, `test:unit`, `build`,
`_gate-html`.
