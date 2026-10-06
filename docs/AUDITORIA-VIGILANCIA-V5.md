# Auditoria à vigilância — falso diagnóstico por 202/timeout e política de retry

> Feita a **2026-10-06**, a seguir à investigação da issue [#75](https://github.com/braindeadpt/aocentimo/issues/75)
> (vigilância CC2). Âmbito: **os três monitores** que consultam a rede por
> agenda — CC2 ([`VIGILANCIA-CCD2225-2026.md`](VIGILANCIA-CCD2225-2026.md)),
> IMI Familiar do Porto ([`VIGILANCIA-IMI-PORTO-2027.md`](VIGILANCIA-IMI-PORTO-2027.md))
> e ISP (ISP-watch) — mais as fontes de ingestão que partilham o cliente HTTP.
> Regra que orienta esta auditoria: **uma resposta que não se consegue ler nunca
> pode ser apresentada como se fosse resposta** — nem como «nada de novo», nem
> como «a estrutura mudou», nem como «0 medidas».

## O que se procurou

1. Um **status que passa como sucesso** mas não é a página pedida (o 202 do AWS
   WAF, corpo vazio, corpo de desafio, página de bloqueio do CDN).
2. **Erros HTTP/timeout que não são retentados** enquanto o retry só cobre
   «2xx com corpo errado» — a assimetria que fez a vigilância CC2 morrer à 1.ª
   tentativa com `HTTP 503` (issue #75).
3. **Diagnósticos que atribuem a causa errada** à falha (documento em fila,
   estrutura mudou, feed sem novidades).
4. **Políticas de retry divergentes**, monitor a monitor, sem uma regra escrita.

## Veredicto por monitor

| Monitor | Fonte | Resposta ilegível era… | Retry antes | Estado |
|---|---|---|---|---|
| **CC2** (`ccd2225`) | **Cellar (SPARQL)** — era o NIM do EUR-Lex | **202 do AWS WAF lido como «fila»**; e o laço de 4× só cobria corpos sem o bloco de Portugal — o 503 abortava à 1.ª | `tentativas: 1` + 4×20 s só para conteúdo | **corrigido, e fonte substituída** (issue #75) |
| **IMI Porto 2027** (`imi-porto-2027`) | 3 páginas de deliberações do cm-porto.pt | **página curta de bloqueio/erro diagnosticada como «a estrutura mudou»**; falha instantânea por fonte, sem 2.ª leitura | 3× backoff 1/2 s (rede) por `fetchTexto`; 1 leitura por fonte | **corrigido** nesta auditoria |
| **ISP** (`isp`) | feed RSS do Google restrito ao DR | nada — `parseRssPortarias` já lança em feed vazio ou sem itens do DR (falha honesta) | 3× backoff 1/2 s; 1 leitura | **alinhado** (retry de conteúdo agora explícito) |
| **Fontes de ingestão** (`bpstat`, `dgeg`, `eurostat`) | APIs/CSV | nada — `fetchJson` + `JSON.parse` fazem a resposta de bloqueio falhar alto | 3× backoff 1/2 s | **cobertas** pelo cliente partilhado |

O padrão existe em **duas** formas no projeto, não numa: (a) o status que passa
como sucesso e é depois mal diagnosticado (CC2); (b) a resposta ilegível que é
diagnosticada como mudança de estrutura (IMI Porto 2027). O ISP era o único já
correto na leitura; faltava-lhe a regra escrita.

## A decisão: uma política comum, em `scripts/ingest/_http.ts`

O laço de retry deixa de ser código privado de cada monitor e passa a ser uma
função partilhada, `lerComRetentativas(url, validar, opts)`:

- **cobre os dois tipos de falha** — erro de rede/HTTP (timeout, 5xx, desafio do
  WAF, que o `fetchTexto` já rejeita) **e** corpo que `validar` recusa;
- **`validar` devolve o motivo** da recusa (texto), em vez de um booleano —
  é esse motivo que aparece no log e no erro final do monitor;
- esgotadas as leituras, lança **`ErroVigilancia`** com `.motivo` e `.leituras`,
  para cada monitor citar no seu próprio erro (o exit 1 e o corpo da issue).

Números por monitor — iguais na estrutura, diferentes onde a fonte obriga:

| Monitor | Leituras | Intervalo | Porquê |
|---|---|---|---|
| CC2 | 4 | 20 s | É um bloqueio do WAF que vai e vem; vale insistir na mesma leitura. |
| IMI Porto 2027 | 3 | 10 s | Há três fontes independentes; uma em baixo não cega o sinal. |
| ISP | 3 | 2 s | O feed é do Google, que responde **429** a bots insistentes; a 2.ª protecção (alarme de idade) cobre o resto. |

Também em `_http.ts`, o `fetchTexto` rejeita **explicitamente** o desafio do AWS
WAF — pelo cabeçalho `x-amzn-waf-action` e, quando o corpo chega, pelas marcas
do desafio JS (`awswaf.com`, `challenge-container`, `AwsWafIntegration`). Como a
rejeição é um `throw` dentro do `try`, o desafio passa a ser retentável como
qualquer outra falha — para os três monitores e para as fontes de ingestão.

## Cura do caso #75: a fonte da CC2 passou a ser o Cellar por SPARQL

Corrigir o diagnóstico não bastava: o sinal continuava a depender de uma página
atrás de um WAF. A fonte foi substituída (2026-10-06) pela **consulta SPARQL ao
Cellar** — o repositório do Serviço das Publicações da UE onde vivem as medidas
nacionais de transposição (works `cdm:measure_national_implementing`, a mesma
fonte que alimenta a tabela «National transposition» do EUR-Lex).

Como a consulta funciona (medido a 2026-10-06):

1. o URI do work resolve-se **a partir do CELEX**, sem fixar o UUID no código —
   `resource/celex/32023L2225` responde 303 e o `Location` traz
   `cellar/<uuid>/rdf/object/full` (o `fetch` do Node, com `redirect: manual`,
   expõe o cabeçalho);
2. a consulta vai com `GRAPH ?g` (no Cellar cada work vive no seu grafo; o
   grafo por omissão não tem estes triplos), filtrando
   `measure_national_implementing_implements_resource_legal <work>` e
   `measure_national_implementing_implemented_by_country <…/country/PRT>`;
   `format=application/sparql-results+json` é obrigatório — sem ele o Virtuoso
   devolve a página HTML do editor.

Cruzamentos:

- Portugal = **0 medidas**, como a página NIM do EUR-Lex mostrava para Portugal
  (0 medidas) — as duas fontes concordam;
- a Eslovénia aparece com **1** medida, e a fixture da página NIM (2026-09-30)
  também tinha 1 para a Eslovénia;
- tempo de resposta: 0,75–3,2 s; todas as sondagens 200, sem desafio.

Semântica nova, explícita no `validarSparql`: **uma resposta válida com zero
resultados é resposta** (é assim que se lê «Portugal sem medidas»); o que é
falha retentável é um corpo que não seja SPARQL JSON — uma página de bloqueio,
por exemplo. Era exatamente esta distinção que faltava no caso #75.

O estado versionado mantém-se o mesmo ficheiro e o mesmo esquema
(`data/meta/ccd2225-vigilia.json`); mudam só os valores: `fonteUrl` passa a ser
o endpoint SPARQL, `nota` regista o work resolvido, `prazos` passa a ser as
datas das medidas de Portugal (notificação / jornal oficial) e `ligacoes`
passa a trazer rótulo + o link EUR-Lex do CELEX nacional de cada medida.

## O que mudou no IMI Porto 2027 (o caso novo)

A página real da CM Porto tem **265–335 KB** (medido a 2026-10-06 por `curl`:
334 557 B nas minutas, 264 994 B nas propostas, 273 612 B nas recomendações).
Uma resposta de **bloqueio ou erro do CDN** é curta; uma **mudança de estrutura**
vem numa página do tamanho normal. O detetor passa a distinguir as duas:

- resposta curta (abaixo de 20 KB) → «página bloqueada ou em erro, não a
  listagem»;
- página grande sem documentos reconhecíveis → «a estrutura mudou».

São causas diferentes e mandam fazer coisas diferentes: a primeira pede nova  nova tentativa mais tarde; a segunda pede ler o HTML e atualizar o parser.

## Cobertura

`npx vitest run scripts/ingest/` → **77 testes** em 5 ficheiros, incluindo os
novos: o laço do `lerComRetentativas` (corpo válido à 1.ª, 503 retentado, corpo
recusado retentado, esgotamento com motivo e contagem, `leituras: 1`, e o
caminho por omissão a rejeitar o 202 do WAF), o `validarListagem` (curto vs.
estrutura), o `validarFeed` (página de bloqueio, feed sem DR) e, na CC2, o
`validarSparql`/`parseSparqlPortugal` (zero resultados é resposta, página de
bloqueio é falha), a resolução do work pelo `Location` do CELEX e o laço de
retry por cima das duas leituras.
`npx tsc --noEmit` e `npx eslint scripts/ingest/` limpos.

## Riscos residuais (a não esquecer)

- **Nenhum monitor conta falhas consecutivas.** Uma fonte bloqueada durante três
  semanas seguidas parece uma falha isolada de cada semana: o estado guarda
  `nota`/`falhaFeed`, não um contador. Um `falhasConsecutivas` no JSON daria o
  sinal de persistência sem depender de alguém reler as issues.
- **Só o WAF da AWS é reconhecido pelo nome.** Outros CDNs (Cloudflare,
  Akamai) devolvem as suas próprias páginas de desafio — nessas, a defesa é a
  validação de conteúdo (`validar`), que já recusa «corpo sem documentos»; o
  diagnóstico é que fica genérico.
- **O `202` de outra proveniência continua a ser aceite** por `fetchJson` (o
  `res.ok` é 200–299) e só falha no `JSON.parse` — é honesto, mas sem
  diagnóstico próprio. Fica registado, não corrigido: é uma falha de parse de
  uma fonte de dados, não de um monitor de vigilância.
- **A CC2 depende agora de um endpoint (Cellar) que pode ficar lento ou
  fechado.** O SPARQL não tem SLA público e a consulta faz um varrimento de
  grafos (`GRAPH ?g`), que é a parte mais cara. Mitigação: a política de 4
  leituras com 20 s, o `format` explícito e a mensagem de falha honesta que
  nunca infere «não transposto». Sem medição de latência ao longo do tempo, não
  se sabe se esse custo é estável — fica por medir.
