# Protótipos V5 — «O Bairro»

Referência visual e de comportamento para a V5. **Não são código de produção**: são maquetes a mexer,
aprovadas pelo dono, que as sessões de implementação reproduzem em Next.js/React seguindo as regras da casa
(`AGENTS.md`, `docs/PRODUTO.md`, skill `literacia-pt`).

Abre cada `.html` diretamente no browser (funcionam sem servidor; usam GSAP e Google Fonts por CDN).

| Pasta | O que é | Estado |
|---|---|---|
| `mapa/` | **A home V5**: o bairro português visto de cima (isométrico 2:1), vivo, com números reais nas placas, a cena do salário a correr pelas ruas, a mercearia e as personagens. | Direção aprovada (28.09.2026). Vai ter uma passagem de qualidade no *kit* antes da implementação. |
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

## Regras que não mudam

Regra nº1 (nunca inventar dados) · fonte e data em cada número · acessibilidade (equivalente textual,
teclado, AA) · `prefers-reduced-motion` = estado final sem animação · PT-PT · independente e gratuito,
sem aconselhamento financeiro.
