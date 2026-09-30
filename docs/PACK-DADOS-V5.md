# PACK DADOS V5 — o que falta para os balcões do bairro

> Plano de execução. Decisões do dono (2026-09-30): a V5 organiza os temas
> por edifícios do bairro do Porto, com balcões de senha; cada tema vive
> onde o dinheiro se paga ou se recebe. Este pack vai buscar os dados que
> ainda faltam a esses balcões. Referência visual e de conteúdos:
> «Onde mora cada tema» (página publicada pelo dono) e
> `referencias/V5/prototipo-mapa.html` (local, não versionado).

**Regra nº1, antes de tudo:** nunca inventar dados. Nenhum número deste
documento é para copiar — os valores vêm sempre da fonte oficial, lida na
sessão, com a data em que foi lida. Se a fonte não existir ou não for clara,
a sessão termina com um relatório «indisponível» e **não** grava nada.

## 0. Contrato comum a todas as sessões

Cola isto no início de cada sessão, antes do bloco específico.

```
Estás no repo AO CÊNTIMO (C:\Users\...\Literacia_Financeira ou o clone
desta máquina). Lê AGENTS.md, docs/PRODUTO.md e data/fiscal/README.md
antes de tocar em qualquer ficheiro. Carrega a skill literacia-pt.

Git:
- Parte de main actualizado: git fetch && git switch -c <ramo> origin/main
- Trabalha só no teu ramo. Nunca faças push para main. Sem force-push,
  sem -i, sem mexer em git config.
- No fim: gates verdes, push do teu ramo, PR para main com o relatório
  da sessão na descrição. Não faças merge — o dono revê.

Gates (todos verdes antes do PR):
npm run lint && npm run typecheck && npm run test:unit
&& npm run validate:data && npm run build

Regras de dados:
- Nunca inventar. Cada número tem fonte (URL oficial), data da série e
  data de recolha. Se a fonte falhar ou for ambígua: não gravar, reportar.
- Séries automáticas (APIs): zod no payload, falha ruidosa se a resposta
  tiver mais de uma categoria onde se espera uma, registo em
  data/meta/sources.json com SLA de frescura.
- Regras fiscais: JSON em data/fiscal/ com vigencia, fonte e fonteUrl,
  entrada só por PR manual (nunca scraping automático), um ficheiro por
  ano fiscal quando os valores mudam por ano.
- Nada de comparar bancos ou produtos concretos: o site não é um
  comparador comercial. Só valores agregados/oficiais.
- Português europeu em tudo o que o utilizador lê.

Relatório da sessão (na descrição do PR):
1. O que ficou gravado, ficheiro a ficheiro, com a fonte exacta.
2. O que ficou por fazer e porquê.
3. Dúvidas para o dono, numeradas.
```

## 1. Sessões

Cada sessão é independente. Podem correr em paralelo em máquinas
diferentes; nenhuma toca nos ficheiros de outra.

### D-01 · Juro dos depósitos a prazo (Banco · balcão D)

Ramo: `v5/dados-d01-depositos`

```
Objectivo: série mensal da taxa de juro média dos NOVOS depósitos a
prazo de particulares, publicada pelo Banco de Portugal no BPstat.

1. Encontra no BPstat (https://bpstat.bportugal.pt) a série das
   estatísticas de taxas de juro bancárias: novos depósitos a prazo de
   particulares, prazo até 1 ano (e, se existir com o mesmo recorte,
   o total de prazos). Anota o ID de cada série, o título exacto e a
   unidade tal como o BPstat os mostra. Não adivinhes IDs: confirma
   cada um chamando /api/observations/?series_ids=ID&lang=PT e lendo
   o título devolvido.
2. Acrescenta as séries a scripts/ingest/bpstat.ts seguindo o padrão de
   SERIES_TAEG (constante com os IDs, mesmo schema zod, mesma escrita
   em data/sources/bpstat/). Nomes: deposito-prazo-ate1a-mensal.json
   (e deposito-prazo-total-mensal.json se aplicável).
3. Regista em data/meta/sources.json com SLA mensal igual ao das TAEG.
4. Derivado honesto em scripts/derive: juro real = taxa nominal menos a
   inflação homóloga do mesmo mês (hicp-pt-cp00). Só subtracção entre
   séries oficiais, com a nota «aproximação: não conta com impostos».
   Ficheiro data/derived/deposito-real.json.
5. Testes: schema, parser e o derivado com um caso conhecido.

Aceitação: a ingestão diária/mensal corre localmente
(npm run ingest:monthly) e grava a série completa; validate:data verde.
```

### D-02 · IMI (Finanças · balcão B)

Ramo: `v5/dados-d02-imi`

```
Objectivo: data/fiscal/imi-2026.json com o necessário para explicar o
IMI de uma casa: o intervalo legal das taxas, a taxa de cada município
em 2026 e o IMI familiar.

1. Lê o Código do IMI em vigor (art. 112.º — taxas; art. 112.º-A — IMI
   familiar) no Diário da República. Grava o intervalo legal da taxa
   para prédios urbanos e as deduções do IMI familiar por número de
   dependentes, exactamente como estão no artigo em vigor em 2026.
2. Taxas por município para o IMI de 2026 (liquidado em 2027) ou, se
   essas ainda não estiverem publicadas, as do IMI de 2025 (liquidado
   em 2026) — diz qual no campo "anoImposto". Fonte: a tabela oficial
   de taxas por município do Portal das Finanças. Grava todos os
   municípios com o código, o nome, a taxa e se aplica IMI familiar.
   Se a tabela não puder ser lida de forma fiável, grava só o intervalo
   legal e o Porto (com a fonte da deliberação municipal) e reporta.
3. Motor puro src/lib/engines/imi.ts: imi(vpt, taxa, dependentes,
   regras) → { coleta, deducaoFamiliar, aPagar, prestacoes }. As regras
   de pagamento em prestações também vêm do Código do IMI (art. 120.º),
   gravadas no JSON. Testes golden com exemplos calculados à mão e
   conferidos no simulador da AT, se existir.
4. Acrescenta a linha do IMI ao README de data/fiscal.

Não fazer: não inventar valores patrimoniais (VPT) médios. Os exemplos
da UI usarão VPT escolhidos pelo utilizador ou exemplos rotulados como
exemplo.
```

### D-03 · ISV e IUC (Finanças · balcão C, Bomba · balcão B)

Ramo: `v5/dados-d03-carro`

```
Objectivo: data/fiscal/isv-2026.json e data/fiscal/iuc-2026.json com as
tabelas em vigor em 2026, e dois motores puros.

1. ISV: Código do ISV (Lei 22-A/2007) com as alterações da Lei do
   Orçamento do Estado para 2026. Tabela A (componente cilindrada e
   componente ambiental por CO2, WLTP, gasolina e gasóleo), agravamento
   do gasóleo por partículas se aplicável, reduções para híbridos e
   híbridos plug-in, isenção dos elétricos. Grava só a categoria de
   ligeiros de passageiros (tabela A); o resto fica fora.
2. IUC: Código do IUC, categoria B (ligeiros de passageiros matriculados
   desde julho de 2007): tabela por cilindrada, tabela por CO2 (WLTP e
   NEDC, se ambas estiverem em vigor), taxa adicional do gasóleo, e o
   coeficiente por ano de matrícula. Valores de 2026.
3. Motores src/lib/engines/isv.ts e iuc.ts (funções puras, sem UI),
   testes golden com exemplos conferidos nos simuladores do Portal das
   Finanças, se existirem, e indicados no teste.
4. IVA sobre o ISV: o ISV entra na base do IVA na compra de carro novo.
   Confirma na lei e, se for o caso, reflecte-o no motor com teste.

Não fazer: preços de carros concretos, marcas ou modelos.
```

### D-04 · Conta à ordem e serviços mínimos bancários (Banco · balcão E)

Ramo: `v5/dados-d04-conta`

```
Objectivo: saber quanto custa, em média, manter uma conta à ordem em
Portugal, e o que é a conta de serviços mínimos bancários.

1. Serviços mínimos bancários: lê o regime em vigor (DL 27-C/2000 e
   alterações) e grava em data/fiscal/servicos-minimos.json: quem tem
   direito, o que inclui e o limite máximo da comissão anual tal como a
   lei o define (se for em função do IAS, grava a regra e o IAS de 2026
   com fonte).
2. Comissão de manutenção média: procura um valor AGREGADO publicado pelo
   Banco de Portugal (relatórios de acompanhamento dos mercados
   bancários de retalho, Portal do Cliente Bancário, estatísticas). Se
   existir, grava em data/fiscal/comissoes-bancarias.json com o ano, a
   definição exacta usada pelo BdP e a fonte.
3. Se só existirem preçários banco a banco: NÃO gravar valores por
   banco. Reporta ao dono as fontes encontradas e pára aqui.

Não fazer: listas de bancos, rankings, «o banco mais barato».
```

### D-05 · Cartões de crédito (Banco · balcão C)

Ramo: `v5/dados-d05-cartoes`

```
Objectivo: completar o balcão dos cartões. A TAEG do crédito renovável
e os tetos de usura já existem (bpstat taeg-renovavel, usura-2026.json).

1. Anuidade média dos cartões de crédito: só valor agregado oficial do
   Banco de Portugal, com ano e definição. Mesmo critério que a D-04.
2. Regras do pagamento mínimo: lê o que a lei e o BdP dizem sobre a
   prestação mínima dos cartões e sobre a amortização (Aviso/Instrução
   do BdP aplicável). Grava em data/fiscal/cartoes.json só o que for
   regra legal, com a fonte.
3. Motor src/lib/engines/cartao.ts: dado um saldo, uma TAEG e uma
   prestação mínima (percentagem do saldo), quantos meses e quanto de
   juros até pagar tudo. Testes golden.

Se a anuidade agregada não existir: grava só as regras e o motor, e
reporta.
```

### D-06 · Preços em euros dos essenciais (Mercearia · balcão C) — só investigação

Ramo: `v5/dados-d06-precos-investigacao`

```
Objectivo: descobrir se existe uma fonte OFICIAL e regular de preços
médios em euros (por kg, litro ou unidade) de produtos essenciais em
Portugal: pão, arroz, massa, carne, peixe, leite, ovos, azeite, óleo,
fruta, legumes, açúcar.

Procura, pelo menos: INE (preços médios no consumidor, se ainda
publicados), GPP / SIMA (preços agrícolas e ao consumidor),
DGAE / observatórios de preços, Eurostat (preços médios, não índices).
Para cada fonte candidata: URL, o que mede exactamente (produtor,
grossista ou consumidor), produtos, frequência, período disponível,
se tem API ou só PDF, e licença de reutilização.

Entrega: docs/INVESTIGACAO-PRECOS-EUROS.md com a tabela de fontes e uma
recomendação. NÃO ingerir nada nesta sessão. O dono decide depois.
(Os índices por produto, ECOICOP 01.1.1 a 01.1.8, já existem e
chegam para «o que custava 10 € em 2020 custa hoje X».)
```

### D-07 · Certificados do Tesouro (Correios · balcão B)

Ramo: `v5/dados-d07-ct`

```
Objectivo: data/fiscal/ct.json com as condições da série de
Certificados do Tesouro em comercialização em 2026, ao lado do ca.json
que já existe.

1. Fonte: IGCP (ficha técnica da série em vigor e portaria de emissão).
   Grava a taxa de cada ano de vida, o prémio (se existir e a regra de
   cálculo), prazo, montantes mínimo e máximo, e a tributação dos juros
   (retenção liberatória, com remissão para capitais.json).
2. Motor: acrescenta à família de poupanca.ts uma função ct(...) com
   testes golden a partir de exemplos da ficha técnica, se os tiver.

Se o IGCP tiver só PDF, lê-o e cita a página. Nunca completar anos em
falta por extrapolação.
```

## 2. Depois das sessões

Cada PR aprovado desbloqueia um balcão do bairro. As cenas visuais
(o desenho de cada balcão) não fazem parte deste pack — são desenhadas
primeiro como protótipo e só depois implementadas.

| Sessão | Desbloqueia |
|---|---|
| D-01 | Banco · depósitos a prazo; percurso da Dona Arminda |
| D-02 | Finanças · casa; percurso do Rui e da Marta |
| D-03 | Finanças · carro; Bomba · quanto custa ter carro; percurso do Pedro |
| D-04 | Banco · conta à ordem; percurso do Gonçalo |
| D-05 | Banco · cartões de crédito |
| D-06 | Decisão sobre a Mercearia · preço em euros |
| D-07 | Correios · Certificados do Tesouro |
