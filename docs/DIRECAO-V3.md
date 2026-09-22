# Direcção V3 — «Ledger»: o observatório como instrumento de secretária

> Referências do dono (2026-09-21): vídeos e capturas de uma app financeira
> escura (estilo «Ledger») — cartões com breadcrumb, uma cor de sinal,
> anotações com linhas de chamada tracejadas, controlos físicos (régua,
> slider com «now», presets), explosão isométrica com rótulos, inversão
> claro/escuro do cartão focado. `docs/brand/referencias/` guarda os ficheiros.

## A linguagem (regras, não sugestões)

1. **Cartão = objecto completo.** Cabeçalho: breadcrumb mono `KICKER / contexto · n`. Corpo: UMA ideia (um gráfico, um número, um insight escrito em prosa curta). Rodapé: estado + fonte + acção («ver →», «JSON»). Raio 12–16 px, sombra suave única, borda 1 px `--line`, fundo `--panel`. Nunca células coladas de grelha.
2. **Uma cor de sinal.** `--accent` (laranja torrado actual) para o que é «dinheiro que sai»/destaque activo; `--keep` para o que fica; todo o resto em cinzentos quentes (`--ink`, `--ink2`, `--muted`, `--line`). Nunca três cores semânticas no mesmo cartão.
3. **Gráfico = uma frase.** Sem eixo Y salvo necessidade; valores nos extremos; UMA anotação («pico 2013 · 17,5 %») com linha de chamada tracejada 1 px; a série de comparação em cinzento por baixo; a área entre duas séries hachurada. O insight escreve-se em texto («2,3 p.p. acima da mediana»), não se deduz da escala.
4. **Foco = impressão.** O cartão focado/hover inverte para papel (`--talao-paper`/`--talao-ink`) e a sua anotação desenha-se (stroke-dashoffset). É a síntese papel↔instrumento: o observatório imprime a leitura quando lhe pegas. Transição `--dur-media`; em reduced-motion a inversão é instantânea e a anotação já vem desenhada.
5. **Controlos físicos.** Inputs de valor são réguas: traços de unidade, marcador «agora», presets em chips («−5 %», «mediana», «ATH»), valor grande em mono a acompanhar o arrasto. Toggles como os da referência (pill com nó). Nada de `<input type=range>` com cara de browser.
6. **Explosão isométrica** para composições (o euro, o preço do litro, o recibo): camadas em traço fino afastadas na vertical, cada uma com linha de chamada tracejada + rótulo; a camada em foco ganha fill `--accent` fraco. Substitui a moeda a rolar — a metáfora certa é «o euro desmontado em peças», como o vault da referência.
7. **Números contam, nunca nascem.** Odometer do valor anterior; acima da dobra, SSR final. Abaixo da dobra, entrada = anotação a desenhar-se + contagem; nunca fade de página inteira.
8. **Scroll**: sem secções pinned de 400 vh. Os cartões entram com `IntersectionObserver` + `--stagger`; a narrativa vive DENTRO dos cartões (a anotação, a inversão), não em teatro de scroll.
9. **Copy curto e afirmativo.** Uma frase por insight, como a referência («nvda carries half of it»). Metodologia vai para footnote de 1 linha ou para /metodologia.
10. **Três níveis tipográficos apenas**: kicker mono caixa-alta; display Archivo para o valor/título; serifada para a frase-insight. Sem mais escalas.

## Anti-padrões novos (além dos existentes)
- Velocímetros/mostradores de agulha (instrumento de carro, não de observatório).
- Grelhas de cartões idênticos 3×n.
- Moedas/ícones a rolar com scroll.
- Anotações sem linha de chamada; mais de uma anotação por gráfico.
- Qualquer animação cuja ausência não se note.

## Fontes de referência (canónicas, escolhidas pelo dono 2026-09-21)
- `docs/brand/referencias/` — os 2 mp4 Ledger + 4 capturas (a base desta direcção).
- `designeer.xyz` → sobretudo **60fps.design** (movimento real gravado),
  **details.so** (micro-interacções) e **Sombra** (dark-mode).
- `inspora.design` — mecânicas concretas (cards interactivos, timelines, pickers).
- `rewampui.com` — só mecânica/estrutura de componentes; nunca pele.
Processo: o dono aponta 3–5 itens concretos → extraímos a mecânica para
aqui → aplicamos à peça seguinte. Não se desenha «de cabeça».

## Decisões extraídas das referências (2026-09-22, revistas com vídeo)
- **Euro = explosão isométrica.** «O teu euro» desmonta-se em camadas
  verticais de traço fino (como o vault da referência 1): cada peça é um
  elipse/placa wireframe separada, afastada na vertical; linha de chamada
  tracejada liga cada peça ao rótulo mono (SS, IRS, IVA do gasóleo, «fica»);
  a peça em foco recebe fill `--accent` a ~12 %; a última peça («fica»)
  recebe `--keep`. Montagem por scroll: as peças convergem de cima para o
  stack (translateY → 0, stagger 80 ms, `--ease-entra`), as chamadas
  desenham-se depois; reduced-motion = stack montado e legendado.
  **Nunca mais moeda a rolar.**
- **Controlos = réguas físicas** (referência 2 e inspora «pick your plan»):
  traços de unidade a cada passo, polegar = rectângulo cheio com valor,
  marcador «agora» fixo, presets em pills. Aplica-se a /salario e /credito.
- **Inversão de foco confirmada** — manter como assinatura (já no R-01).

## Verificação de movimento (regra nova, permanente)
Nenhuma animação é «aprovada» por screenshot. Cada peça animada entrega
`scripts/_video.mjs` (Playwright `recordVideo` + ffmpeg → folha de contacto
4×4 + mp4 em `.videos/`) e o relatório inclui o mp4 para o dono ver.
O commit de uma peça animada exige: frames extraídos revistos + reduced-motion
verificado + SSR final verificado.
