# Pedidos da Sessão 2 (home) — para a Sessão 4 decidir

Registo do que ficou pendente na fronteira dos componentes
partilhados. Nada aqui foi alterado na sessão — os componentes
estão congelados; estes são pedidos, não mudanças.

## Componentes que ficaram sem uso na home (S2-04)

Saíram do `page.tsx` mas os ficheiros ficam — a Sessão 4 decide o
destino (apagar, mover para `/estilo`, manter):

- `src/components/Adivinha.tsx` — a adivinha antiga foi absorvida pelo
  herói (o palpite vive na régua `hm-palpite`). Continua a compilar
  (usa `m.guess` — as chaves ficam em `pt.json` enquanto o ficheiro
  existir).
- `src/components/Kinetic.tsx` — o h1 antigo com letras cinéticas
  saiu; o h1 novo é texto SSR puro (LCP).
- `src/components/EuroExplodido.tsx` — a explosão isométrica saiu da
  home (a moeda/montes do `CampoCentimos` conta a mesma história).
  Continua coberto por `Isometrico.test.tsx`; o `/estilo` usa o
  `Isometrico` base, não este molde.

## Pedido de API pública — `CampoCentimos`

- **Sinal «montes assentados»**: hoje o herói detecta o fim da
  coreografia por `MutationObserver` sobre `.cc-rot.on` (detalhe
  interno do componente — se a classe mudar de nome o herói cala o
  veredicto). Pedido: um sinal público — atributo `data-assentou` no
  `.cc-palco` ou callback `onAssentou`. (`data-pronto` já existe mas
  marca a entrega SSR→canvas no primeiro frame, não os montes.)
  Uso: `src/app/_home/HeroMoedaCliente.tsx`.

## Tokens CSS

- Nenhum token novo pedido — `hm-*` e `pq-*` usam só os tokens
  existentes (`--talao-*`, `--raio-*`, `--dur-*`, `--ease-*`,
  `--text-*`, `--tracking-*`, `--mark`, `--font-archivo`).

## Chaves de `pt.json` removidas (S2-04)

- `home.*` antigas (h1a/h1b/h1c, lede, cta, hoje, inflacaoHomologa,
  alimentacao, ihpcCP01, salarioMinimo, smnNota, ca, caNota,
  barraTitulo/barraNota/barraFoot, seg*, euroTitulo/euroNota/euroFoot,
  capitulos*, ferramentas*) — substituídas por `home.hero`,
  `home.portas` e a faixa (`manifesto*`, `metodologia`, `api`).
- `euroV3` — só alimentava o `EuroExplodido` na home antiga.
- `painel.isoGasoleo` — a decomposição isométrica do litro saiu do
  cartão de combustíveis da home (S2-02); o cartão é agora odómetro
  do dia + comparação a 30 dias.
