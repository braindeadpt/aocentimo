# Capturas — P4 · SEO (ramo `v5/p4-seo`)

Imagens do cartão de partilha para o relatório do PR. **Não entram no
ramo do código** — são prova, não produto: o que fica no repo é o
`public/og-bairro.png` (74,2 KB, dentro do tecto de 250 KB), que é a
mesma imagem daqui em PNG e melhor.

| ficheiro | o que é |
| --- | --- |
| `cartao-og.jpg` | o cartão inteiro, 1200×630 tal como o crawler o recebe |
| `marcadores.jpg` | um enlargamento da zona dos marcadores, à escala de ecrã |

## Como foram tiradas

`scripts/_og-bairro.mjs`, que corre no ramo `v5/p4-seo`: Playwright sobre
o `out/` construído, tema claro, hora «Dia», os treze marcadores à
vista. O gerador tem `--ver` para medir o PNG já no repo sem tocar nele —
é o gate que apanha um cartão que cresce acima do tecto ou que deixa de
ser 1200×630.

O JPEG aqui é só para o GitHub: convertidas com `sips` a 1100 px e
qualidade 78, porque um PNG de tema escuro ficava acima de 1 MB e o
`git push` recusa ficheiros grandes.