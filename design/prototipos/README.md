# Protótipos V5 — «O Bairro»

Referência visual e de comportamento para a V5. **Não são código de produção**: são maquetes a mexer,
aprovadas pelo dono, que as sessões de implementação reproduzem em Next.js/React seguindo as regras da casa
(`AGENTS.md`, `docs/PRODUTO.md`, skill `literacia-pt`).

Abre cada `.html` diretamente no browser (funcionam sem servidor; usam GSAP e Google Fonts por CDN).

| Pasta | O que é | Estado |
|---|---|---|
| `mapa/` | **A home V5**: o bairro do **Porto** visto de cima (isométrico 2:1) em dois níveis — a avenida e a Torre dos Clérigos lá em cima, escadinhas, as casas da Ribeira, o cais, o Douro com rabelos, a Ponte D. Luís I com o metro, Gaia com as caves. Números reais nas placas, a cena do salário a correr pelas ruas, a mercearia e as personagens. | Visual aprovado (30.09.2026), depois da passagem de qualidade. |
| `conteudos/` | **Onde mora cada tema**: em que edifício e balcão (senha) vive cada assunto, o estado dos dados e os percursos entre edifícios. | Aprovado (30.09.2026). Dados em falta: `docs/PACK-DADOS-V5.md`. |
| `bairro-lateral/` | O mesmo bairro em vista lateral — referência para as **cenas de perto** (quando se entra num edifício). | Referência. |
| `home/` | Primeiro protótipo V5: o desafio «quanto custa hoje o que custava 10 €», o gráfico que ensina a ler-se e a corrida dos preços. | Referência para as cenas da mercearia e para os gráficos que ensinam. |

## Como está construído (e como se deve implementar)

- **`mapa/iso.js` — o motor e o kit.** Projeção isométrica 2:1 (ladrilho 128 × 64). As fachadas desenham-se
  **de frente, em 2D**, e são projetadas nas paredes por uma matriz (`matrix(.8944 ±.4472 0 1 …)`). Isto permite
  usar as mesmas peças (janelas, portas, placas, azulejos) no mapa e nas cenas de perto. Na implementação, cada
  peça passa a um componente.
- **`mapa/mapa.js` — a planta.** Edifícios só do lado de cima de cada rua, com a fachada virada para quem olha;
  a profundidade resolve-se por camadas (fila de cima → quem anda na avenida → fila de baixo → quem anda na rua de baixo).
- **`mapa/personagens.js` — as personagens.** Um só esqueleto (pernas, braços, cabeça, olhos, boca), vestido de
  maneiras diferentes. Cada personagem é também um **perfil económico** (conta de outrem, função pública,
  independente, empresário, reformada, estudante, casal com crédito).
- **Números reais.** Todos os valores vêm das séries do repositório (`data/`), com fonte e data — Regra nº1.
  Na implementação chegam por props do servidor; nada é escrito à mão.
- **Terreno com cotas.** `definirTerreno()` em `mapa.js` dá a altura de cada ponto (avenida a 110, Ribeira a 0,
  rio a −22); `P(i, j)` já a aplica. Edifícios, personagens e moedas assentam sozinhos na cota certa.

## Desempenho (obrigatório na implementação)

O mapa tem milhares de nós SVG. Estas regras levaram-no de 12 para ~35 fotogramas por segundo e não se negociam:

- **A câmara nunca mexe no `viewBox`.** O mundo é desenhado uma vez em várias camadas SVG grandes, e a câmara
  só as desloca e escala com `transform` CSS (compositor). Quando a escala muda e a câmara pára, pede-se uma
  pintura nova à escala certa.
- **O que anda sempre (nuvens, barcos, metro) é SVG solto animado por CSS**, fora das camadas do cenário.
- **Nada de animar padrões grandes** (a água é estática; os brilhos são traços pequenos).
- **Reflexos são cópias paradas**, pintadas uma vez.
- **A câmara enquadra-se quando o contentor tem tamanho** (`ResizeObserver`), nunca só no arranque — a página
  pode nascer escondida e sem largura.
- **Animações relativas**: em GSAP, deslocações de balanço usam `"+=n"`, nunca valores absolutos sobre um
  `transform` que já posiciona o elemento.

## Regras que não mudam

Regra nº1 (nunca inventar dados) · fonte e data em cada número · acessibilidade (equivalente textual,
teclado, AA) · `prefers-reduced-motion` = estado final sem animação · PT-PT · independente e gratuito,
sem aconselhamento financeiro.
