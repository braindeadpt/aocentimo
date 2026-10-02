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
