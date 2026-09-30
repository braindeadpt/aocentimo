# Investigação — preços em euros dos essenciais (Mercearia · balcão C)

> **Sessão D-06 do [PACK DADOS V5](PACK-DADOS-V5.md). Só investigação: nada foi
> ingerido.** A pergunta é se existe uma fonte oficial, regular e reutilizável de
> preços médios em euros para os produtos que as pessoas compram na mercearia.
> A decisão de ingerir ou não é do dono.
>
> Pesquisa feita a **2026-09-30**. Todos os números citados foram lidos das
> fontes nesse dia; onde a fonte não é clara, diz-se isso em vez de preencher.

## Resposta curta

**Existe uma fonte oficial de preços médios ao consumidor: o Observatório de
Preços Agroalimentar.** Cobre 20 produtos em 9 fileiras, em euros por kg e por
litro, comactualização regular. Não é o que o pack supunha: não é o INE, e não
é o SIMA.

Três coisas que condicionam a decisão, e que valem mais do que a existência da
fonte:

1. **Publica só o período corrente.** Não há série histórica para download. Uma
   leitura única não serve para o «o que custava 10 € em 2020 custa hoje X» — a
   série tem de ser construída por nós, ingerindo periodicamente.
2. **Não encontrei licença de reutilização.** O acesso é livre, mas os preços ao
   consumidor vêm de um painel comercial da Kantar. Citar com fonte e data é
   defensável; republicar em massa não é obviously legal.
3. **Faltam quatro dos doze essenciais que o pack lista**: pão, massa, óleo e
   açúcar não estão no cabaz.

## 1. As fontes candidatas

### 1.1 Observatório de Preços Agroalimentar — **é a que serve**

| | |
|---|---|
| **URL** | `https://observatorioagroalimentar.gov.pt/` |
| **Quem publica** | GPP (Gabinete de Planeamento, Políticas e Administração Geral), com a DGAE. Base legal: **Despacho 12209/2022, de 6 de outubro**, das áreas governativas da Agricultura e Alimentação e da Economia e do Mar |
| **O que mede** | **Preços ao consumidor** — preço médio **líquido, isto é depois de descontos**, para o **conjunto total dos canais de distribuição**. E, na mesma página, preços de **produção** e de outras fases da cadeia, que vêm do SIMA |
| **Produtos** | 20 sectores em 9 fileiras: azeite · carne de aves · carne de suíno · cereals · frutas · hortícolas · laticínios · ovos · pescado |
| **Sectores** | alface, arroz, azeite, banana, batata, carne de frango, carne de porco, cebola, cenoura, couve, curgete, laranja, laticínios de vaca, maca, ovos de galinha, peixes, pera, pêssego, tomate, trigo |
| **Frequência** | **Períodos de 4 semanas** (não mensais — a tabela chama-lhes «Período (4 semanas)»). Lido a 2026-09-30, o corrente era o **Período 9, de 2026-08-10 a 2026-09-06** |
| **Unidades** | €/kg e €/l, por produto e por fileira |
| **API?** | **Não há API.** Os números estão em **tabelas HTML renderizadas no servidor**, uma por sector, em `/setor/<produto>/`. Extracção por parsing de HTML, não por endpoint |
| **PDF** | Só a metodologia (dois PDFs). Não há PDF com os números |
| **Histórico** | **Não disponível.** A tabela mostra o período corrente, o homólogo e o anterior — três pontos, não uma série |
| **Licença** | **Nenhuma licença de reutilização encontrada.** A política de privacidade do GPP diz que «o acesso e a utilização dos serviços e sítio […] são de acesso livre», mas não afirma licença de reutilização, e remete o utilizador para a legislação de propriedade intelectual. O `robots.txt` só proíbe `/wp-admin/` |
| **De onde vem o dado** | Os preços ao consumidor resultam de um **painel de dados de uma plataforma externa** — a metodologia publicada no site é a da **Kantar**. As outras fases vêm do SIMA; o pescado vem de leilão em lota, recolhido pela Docapesca, de peixe capturado selvagem |

Exemplo do que a tabela devolve, lido hoje em `/setor/carne-de-frango/`:

```
Frango perna - Consumo (€/kg)  | 3,76€ | 3,62€ | 3,75€ | +0,15€ | +4,08%
Frango peito - Consumo (€/kg) | 6,47€ | 6,52€ | 6,52€ | -0,06€ | -0,86%
Carne de Frango - Consumo (€/kg)| 4,82€ | 4,68€ | 4,83€ | +0,14€ | +2,93%
```

**Uma armadilha da fonte, anotada para quem for ingerir:** a primeira linha da
tabela traz uns cabeçalhos de anoerrados — «Ano | 2023 | 2022 | 2023» — que
continuam de quando o Observatório abriu, em 2023. **Estão errados.** O período
real está na linha seguinte, «Período (4 semanas)», e a 2026-09-30 era o
Período 9 de 2026. Um parser que leia a linha dos anos vai gravar 2023 num
número de 2026. Convém correr o watchdog de frescura logo à entrada para apanhar
isto.

**Cobertura contra o que o pack pedia.** De doze essenciais, oito estão
cobertos — arroz, carne, peixe, leite, ovos, azeite, fruta, legumes. **Faltam
pão, massa, óleo e açúcar.** Não é um buraco da fonte: é o cabaz que a tutela
escolheu, definido no Despacho.

### 1.2 SIMA — boa fonte, mas **não** é preço ao consumidor

| | |
|---|---|
| **URL** | `https://agricultura.gov.pt/portal/en/sima` · portal de registo em `regsima.gpp.pt` |
| **Quem publica** | GPP, Ministério da Agricultura e Pescas |
| **O que mede** | **Cotações de mercados de produção e de mercados abastecedores**, e ainda produtos biológicos e lacticínios. Por definição, **preço de produtor ou grossista — nunca o preço na prateleira** |
| **Granularidade** | Para cada produto, cotações **mínima, máxima e mais frequente** — não uma média única |
| **Frequência** | Semanal, com newsletter de análise |
| **API?** | Não. Consulta numa plataforma web, com **exportação em Excel** do que se seleccionado. O registo de dados (`regsima`) exige autenticação |
| **Licença** | Não encontrada |

Serve para a **outra ponta** da cadeia — quanto o produtor recebe —, que é
interessante, mas não responde à pergunta da mercearia.

### 1.3 INE — **não** publica preços médios em euros

O INE publica o **IPC** (e o HICP harmonizado) como **índice**, não como nível
de preço. A pergunta «e o pão, quanto?» não tem resposta oficial do INE na
base de dados. Confirmado também no lado Eurostat (ver 1.4): o conjunto de
unidades do HICP mensal é só `I15`, `I05` e `I96` — três bases de índice, e
**nenhum euro**.

Vale notar que o INE publicava o «In Prices» (preços médios ao consumidor) nos
anos 2000, mas **não encontrei nada publicado sob essa designação** quando fui
verificar. Não afirmo que a série tenha sido extinta — afirmo que hoje não há
nada publicado por baixo desse nome, que é o que interessa.

### 1.4 Eurostat — índices e preços de produtor, **nunca** preços ao consumidor em euros

Verificado por chamada à API de dissemination:

- `prc_hicp_midx` (HICP mensal, PT): as unidades disponíveis são
  `{"I15": "Index, 2015=100", "I05": "Index, 2005=100", "I96": "Index, 1996=100"}`.
  **Não existe unidade em euro.** O que o repo já ingere
  (`prc_hicp_minr`, `unit=I25`) é um índice — exactamente por isso a D-01 teve de
  calcular a inflação homóloga a partir do índice.- `apri_ap_outa` (preços agrícolas): são **preços de produtor** — o valor que o
  produtor recebe pela venda —, que é o mesmo nível do SIMA, não o da prateleira.

O pack desconfiava do Eurostat neste ponto. A desconfiança está confirmada.

### 1.5 DGAE e DGEG — não confundir

- **DGAE** (Direção-Geral de Alimentação e Economia, na pasta da Agricultura) é
  quem arranca o Observatório com o GPP. É a fonte que interessa.
- **DGEG** (Energia e Geologia) publica os preços dos combustíveis, e é a que o
  repo já ingere para `/precos` (`pmd-gasoleo-diario`, `pmd-gasolina95-diario`,
  `pmd-gpl-diario`). Não publica comida. Serve de precedente, não de resposta.

## 2. Recomendação

**Ingerir o Observatório, mas como série nossa, e com o owner decidido
primeiro sobre a licença.**

O que eu faria, se o dono disser que sim:

1. **Nova ingestão** `scripts/ingest/observatorio.ts`, a fazer parsing das 20
   páginas `/setor/`, com zod a validar cada linha — tal como o resto do repo.
   Padrão `SERIES_OBSERVATORIO` com os 20 sectores, cada um a escrever
   `data/sources/observatorio/<sector>-consumo.json`.
2. **Guardar o período com o dado.** Cada ponto leva a data de início e fim das
   4 semanas, porque o valor é disso que depende. A série fica com periods de 4
   semanas, não mensais.
3. **Nunca ler a linha dos anos.** O cabeçalho «Ano 2023 / 2022 / 2023» da fonte
   está errado; o período vem da linha «Período (4 semanas)».
4. **Correr semanalmente**, não mensalmente: é a frequência da fonte. Como o
   repo faz ingestões automáticas, é um `runSima` novo ao lado dos outros.
5. **Só as linhas «Consumo».** As de produção servem para outro exercício
   (a diferença entre o que o produtor recebe e o que o consumidor paga é uma
   história de balcão, mas é outra sessão).

Antes disso, duas perguntas que são do dono, não minhas:

- **A licença.** Os preços ao consumidor vêm de um painel comercial da Kantar.
  O Observatório não diz que se pode reutilizar. Posso ver três posições:
  *(a)* citar o valor na interface com a fonte e a data, como se faz com o resto
  do repo, e não publicar a série em `public/api/`; *(b)* pedir autorização ao
  GPP por escrito; *(c)* não usar. Sem o dono decidir, *(a)* é a posição
  defensável.
- **A lacuna dos quatro.** Pão, massa, óleo e açúcar não existem na fonte. Se o
  balcão da Mercearia precisa deles, ou se fica com oito produtos, ou se se
  pesquisa outra fonte para esses quatro. Não há fonte oficial encontrada que os
  cubra.

## 3. O que não foi feito, porquê

- **Nada foi ingerido.** É o que o pack pede: esta sessão investiga, o dono
  decide.
- **Não foi aberto contacto com o GPP ou a Kantar.** É uma carta, não uma
  investigação, e é o dono que decide quando a envia.
- **Não foi verificada a estabilidade do HTML** ao longo do tempo. A extração
  depende de a Kantar/GPP manterem a tabela com a mesma forma; uma leitura de
  um dia não prova isso. Vale a pena rever após três meses de leituras.

## Fontes

- Observatório de Preços Agroalimentar — `https://observatorioagroalimentar.gov.pt/observatorio/` e páginas `/setor/<produto>/`, lidas a 2026-09-30
- SIMA — `https://agricultura.gov.pt/portal/en/sima`, lido a 2026-09-30
- Eurostat, API de dissemination — `prc_hicp_midx` e `apri_ap_outa`, consultadas a 2026-09-30
- Despacho 12209/2022, de 6 de outubro — base legal do Observatório, como citado pelo próprio
