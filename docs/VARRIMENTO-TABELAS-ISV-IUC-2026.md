# Varrimento das tabelas do ISV e do IUC — número a número contra o DR

> Item **A** da 2.ª auditoria ([`AUDITORIA-2-RESULTADOS-DADOS-V5.md`](AUDITORIA-2-RESULTADOS-DADOS-V5.md),
> §4: «a retranscrição integral das tabelas (item A) espera um varrimento com
> script»). Feito a **2026-10-01** sobre `main` = `fae9ce8`. Método: script
> ([`scripts/varrimento-tabelas.ts`](../scripts/varrimento-tabelas.ts)) que
> compara cada linha dos JSON fiscais com o texto **literal** do Diário da
> República consolidado e da AT, número a número, com relatório de diferenças.
>
> **Resumo: 16 tabelas, 74 linhas verificadas, 74/74 batem, 1 achado real
> (Tabela C do ISV, corrigido).** As tabelas que o motor usa (ISV A e B,
> IUC A e B) batem 100 % com o DR; o único número errado do pack estava numa
> tabela que o motor não usa (Tabela C — motociclos), e mesmo assim foi
> corrigido.

---

## 1. Âmbito

| Diploma | Artigos varridos | Tabelas |
|---|---|---|
| CISV (ISV) | art. 7.º (tabelas A e B, agravamento, mínimo, Wankel), art. 10.º (Tabela C), art. 11.º (Tabela D), art. 53.º (isenção táxi), art. 54.º (isenção deficiente) | 11 grupos |
| CIUC (IUC) | art. 9.º (tabela A), art. 10.º (tabela B — cilindrada, CO2 NEDC/WLTP, adicional CO2) + coeficientes | 5 grupos |

As tabelas usadas pelos motores (`carro.ts` etc.) são o cerne: ISV A
(cilindrada + 4 componentes ambientais), ISV B, agravamento + mínimo, IUC A,
IUC B (3 tabelas). A Tabela C (motociclos) e a D (usados UE) não alimentam o
motor de ligeiros hoje, mas estão no pack como referência — por isso também
foram varridas.

## 2. Método

1. **Fixtures literais** em [`scripts/varrimento/fixtures/`](../scripts/varrimento/fixtures/),
   extraídas a 2026-09-30/10-01:
   - **DR consolidado** (`diariodarepublica.pt/dr/legislacao-consolidada/...`),
     por browser + `document.body.innerText` (o DR só monta a tabela com JS;
     fetch http direto falhou por mixed content https→http): `isv-art7-full.txt`,
     `isv-art10.txt`, `isv-art11.txt`, `isv-art53-54.txt`, `iuc-art9-10.txt`
     (com separador `@@@ART10@@@` entre artigos);
   - **AT** (Portal das Finanças, `iuc10.aspx`) por curl: `at-coeficientes.txt`
     — os coeficientes de desvalorização do IUC B **não renderizam no DOM do
     DR** (já anotado no §4 da auditoria; é a fonte que o `iuc-2026.json`
     declara em `fonteTabelaCoeficientes`).
2. **Achatar** o texto numa sequência de números (`numerosDeTexto`): remove
   ordinais que o DR intercala («artigo 10.º», «n.º 2», «(índice 2)») e linhas
   «Alterado pelo…»/«Ver alterações» (que injectariam números falsos — sem este
   filtro, datas de leis de alteração entravam nas sequências); trata milhares
   «1 234»/«1.234» (incl. nbsp/fino do DR) e decimais com vírgula, incl. 3 casas
   (`0,001` g/km do agravamento).
3. **Matching contíguo com ponteiro**: cada linha esperada do JSON é procurada
   como subsequência contígua a partir da posição da anterior (sem reuso) — as
   tabelas vêm por ordem no DR. Tolerância 0,005 (EPS) para arredondamentos.
4. **Modelar as convenções do DR** (descobertas no próprio varrimento, §3):
   o que o JSON guarda para o motor (`de` = teto anterior + 1) nem sempre é o
   que o DR escreve.

**Provas de travagem no CI:** [`scripts/varrimento-tabelas.test.ts`](../scripts/varrimento-tabelas.test.ts)
(exige 16 tabelas, 74 linhas, 0 diferenças — corre no `test:unit` de todos os
PRs) e o próprio script com `exit 1` se houver diferenças.

## 3. Convenções do DR que a modelação teve de absorver

Explicam porque a 1.ª modelação esperava **79** linhas e a final **74**: alguns
«números de linha» eram duplicações que o DR não escreve.

| Convenção | Exemplo | Efeito na modelação |
|---|---|---|
| **Limites partilhados entre linhas** | IUC B: «Mais de 1 250 …» escreve o teto da linha anterior (1250), não o «1251» que o JSON guarda | Intermédia do ISV/IUC = `[de, ate, taxa]`; última = `[teto anterior, taxa]` (o `de` do JSON, teto+1, **não** está no DR) |
| **Estilo do escalão intermédio difere por código** | ISV: «De 100 a 115» (o `de` do JSON); IUC: «Mais de 120 até 180» (o teto anterior) | Duas funções (`seqsIsvA`/`seqsIucB`) |
| **IUC A: gasolina e «outros produtos» intercalados** + coluna elétrica «Até 100» nas 2 primeiras linhas | gasóleo, gasolina, outros, gasóleo, gasolina, outros… | Sequências intercaladas na ordem exata do DR; `null` para o que não consta |
| **IUC B CO2: NEDC e WLTP lado a lado** | «Mais de 120 até 180» (NEDC) · «Mais de 110 até 140» (WLTP) · taxa | `[prev.ateNedc, ateNedc, prev.ateWltp, ateWltp, taxa]` |
| **IUC B adicional CO2: 1.ª linha com limite inferior por inteiro** | «Mais de **180** até 250» — e não «Mais de 179» | 1.ª linha = `[deNedc−1, ateNedc, deWltp−1, ateWltp, taxa]`; únicas linhas do varrimento onde o `de` do JSON aparece (−1) |
| **Lixo numérico do DR** | «Alterado pelo DL 123/2025…», «Ver alterações», ordinais | Filtros obrigatórios; sem eles injectam datas de leis como se fossem taxas |

## 4. Resultados

```
OK  ISV A · cilindrada: 3/3                  OK  ISV · isenção táxi (art. 53.º n.º 1): 1/1
OK  ISV A · ambiental gasolina NEDC: 6/6     OK  ISV · isenção deficiente (art. 54.º n.º 2): 1/1
OK  ISV A · ambiental gasoleo NEDC: 6/6      OK  IUC A · gasolina + outros produtos: 6/6
OK  ISV A · ambiental gasolina WLTP: 9/9     OK  IUC B · cilindrada: 4/4
OK  ISV A · ambiental gasoleo WLTP: 8/8      OK  IUC B · CO2 (NEDC/WLTP lado a lado): 4/4
OK  ISV B · cilindrada: 2/2                  OK  IUC B · adicional CO2 (art. 10.º n.º 2): 2/2
OK  ISV · agravamento + mínimo: 2/2          OK  IUC B · coeficientes (AT): 4/4
OK  ISV C · motociclos: 5/5
OK  ISV D · usados UE: 11/11

Resumo: 74/74 linhas batem; 0 diferença(s)
```

Correr a mão: `npx tsx scripts/varrimento-tabelas.ts` (exit 1 se houver diferenças).

### 4-A. Achado real — Tabela C do ISV (`data/fiscal/isv-2026.json`)

O JSON tinha **6 escalões** com a estrutura antiga da tabela; o DR consolidado
(Lei n.º 82/2023, art. 256.º) e uma transcrição independente
(impostosobreveiculos.info) têm **5**, com o primeiro escalão «De 120 até 250»:

| | JSON antes (errado) | DR consolidado (certo) |
|---|---|---|
| 1 | Até 120 → **73,78 €** | De 120 até 250 → **73,78 €** |
| 2 | De 121 a 250 → 91,63 € | De 251 a 350 → 91,63 € |
| 3 | De 251 a 350 → 122,57 € | De 351 a 500 → 122,57 € |
| 4 | De 351 a 500 → 184,45 € | De 501 a 750 → 184,45 € |
| 5 | De 501 a 750 → 245,14 € | Mais de 750 → 245,14 € |
| 6 | Mais de 750 → (linha extra sem par no DR) | — |

Ou seja: os **valores** estavam corretos e na ordem certa; a **moldura de
escalões** estava desalinhada um passo (sobrava a linha «Até 120» e todos os
pares de limites seguintes ficavam deslocados). Corrigido no JSON com nota da
correcção (2026-10-01). **Impacto: nulo para os utilizadores** — a Tabela C não
é usada pelo motor de ligeiros; a Tabela A/B e o IUC, que alimentam as cenas,
bateram 100 % à primeira. Ainda assim: um varrimento a menos daqui para a
frente, e o CI trava regressões.

### 4-B. Notas do varrimento (sem correção necessária)

- **Art. 54.º n.º 4 do CISV** (isenção de deficientes com adaptação): o DR tem
  uma variante com limites de emissão **180/207 g CO2/km** (caixas automáticas)
  que o pack não regista — o `isv-2026.json` modela a isenção pelo n.º 2
  (valor único), que é o que a cena usa. Registado aqui para referência.
- **Tabela D do ISV** bate com a redação atual única (Lei 45-A/2024): as
  percentagens por antiguidade (11 escalões) estão todas certas.
- **Art. 7.º do CIUC** já vem consolidado no DR com nota «em vigor a partir de
  2027-01-01» (DL 161/2026) — consistente com o calendário corrigido no #17.
- **Art. 53.º do CISV** («até quatro anos»): verificado por regex no texto
  literal da fixture — o número aparece por extenso, não por dígito, e por isso
  não entra no varrimento numérico.

## 5. Conclusão

O item A da auditoria fecha: **74/74 linhas das 16 tabelas do ISV/IUC batem
com o DR consolidado** (coeficientes IUC pela AT, que é a fonte oficial quando
o DR não renderiza). Um achado real (Tabela C, sem impacto no motor) corrigido
com nota. O varrimento é agora **regressão automática**: o teste
`scripts/varrimento-tabelas.test.ts` falha o CI se qualquer número destas
tabelas mudar sem passar pelas fixtures.
