# Capturas da P3c — `/estilo` antes e depois

**Este ramo não é código. Não deve ser fundido em `main`.**

São as 8 capturas do PR [#61](https://github.com/braindeadpt/aocentimo/pull/61)
(P3c — as fontes V4 saem, os tokens mortos caem, a `/estilo` escreve o
V5). Vivem aqui porque o GitHub já não tem API pública para anexar
imagens a um PR (`gh pr upload-asset` foi removido no `gh` 2.101 e o
`POST /issues/{n}/assets` devolve 404), e um gist não guarda binário
— guarda o base64 como texto e a imagem chega corrompida.

## O que é cada ficheiro

`/estilo` fotografada nos dois temas, a dois viewports.

| ficheiro | build | tema | viewport |
| --- | --- | --- | --- |
| `antes-claro-1440.jpg` | `origin/main` (V4) | claro | 1440 × 1000 |
| `antes-escuro-1440.jpg` | `origin/main` (V4) | escuro | 1440 × 1000 |
| `antes-claro-375.jpg` | `origin/main` (V4) | claro | 375 × 900 |
| `antes-escuro-375.jpg` | `origin/main` (V4) | escuro | 375 × 900 |
| `depois-claro-1440.jpg` | `v5/p3-pele-c` (V5) | claro | 1440 × 1000 |
| `depois-escuro-1440.jpg` | `v5/p3-pele-c` (V5) | escuro | 1440 × 1000 |
| `depois-claro-375.jpg` | `v5/p3-pele-c` (V5) | claro | 375 × 900 |
| `depois-escuro-375.jpg` | `v5/p3-pele-c` (V5) | escuro | 375 × 900 |

## Como foram tiradas

Playwright sobre `scripts/_serve-static.mjs`, já construido, com
`data-theme` forçado por atributo (o site alterna por atributo, não por
`prefers-color-scheme`), e a secção `data-contrato-v5` trazida para o
topo do ecrã antes do disparo.

Os ficheiros estão em **JPEG a 1100 px de largura, qualidade 78** (948 KB
no total). Não é arbitrio: o repositório recusa por *push* qualquer
ficheiro acima de ~1 MB (HTTP 400), e os PNG de tema escuro ficavam
entre 1,0 e 1,5 MB por causa dos degradados. Os originais eram de
2880 px (`deviceScaleFactor: 2`). O viewport foi sempre o indicado
na tabela.