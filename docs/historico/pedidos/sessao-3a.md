# Pedidos — sessão 3A (O que ganhas)

Componentes partilhados e `globals.css` estão congelados; ficam aqui os
pedidos para a Sessão 4 (integração), sem urgência.

## 1 · Limpeza de peças que a 3A aposentou

- `src/components/Cascata.tsx` — era a «cascata de barras» do
  bruto→líquido em /salario e do «faturação→bolso» em /trabalho. A 3A-01
  retirou-a por decisão do ficheiro de sessão («a mesma história que o
  talão e os pontos contam melhor») e a 3A-03 substituiu a segunda
  ocorrência por `CampoCentimos` em montes. Já não tem nenhum import
  real — só menções em comentários (`/estilo`, globals.css). Proposta:
  remover o componente e o CSS `.casc-*` associado.
- `src/components/CustoExplodido.tsx` — era a explosão isométrica do
  custo em /salario, substituída por `CampoCentimos` montes (3A-01).
  Sem imports. Proposta: remover junto com o CSS `.iso-*`/`data-custo-*`
  que só ela usava — verificar primeiro que `EuroExplodido`/`Isometrico`
  (home e /estilo) não partilham as mesmas classes.

## 2 · CSS órfão do antigo /trabalho

- `.decl-tempo`, `.decl-mes`, `.decl-mes-cut`, `.decl-mes-anim` e o
  `@keyframes decl-mes-sobe` em `globals.css` — era a linha do tempo de
  meses dentro da «Declaração de desemprego». A contagem dos meses
  mudou para `BarraTracos` (3A-03: 1 traço = 1 mês, degrau de −10 % na
  cor) e o bloco saiu da declaração por redundância. Proposta: remover
  as classes na limpeza da Sessão 4.

## 3 · Observação (não é pedido de mudança)

- `SimuladorAcerto` (/irs, nível 2) continua com inputs `.field` de
  número — o ficheiro de sessão só pedia «controlos físicos» para os
  inputs de /salario. Se o dono quiser o mesmo verniz no acerto (réguas/
  contadores), é trabalho novo — registo, não implementei.

---

## Decisão da Sessão 4 (2026-09-23)

- **`Cascata.tsx` e `CustoExplodido.tsx`** — já tinham saído na limpeza
  de órfãos da integração 3A–3D (`114895e`); confirmado sem imports e
  sem CSS residual (`.casc-*`, `.decl-*` ausentes de `globals.css`).
- **`SimuladorAcerto` com inputs `.field`** — fica como está; verniz de
  controlos físicos no acerto é trabalho novo, não fecho.
