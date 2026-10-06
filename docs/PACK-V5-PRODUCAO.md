# PACK V5 PRODUÇÃO — o bairro do Porto online

> Plano de execução. Decisão do dono (2026-09-30): passar o protótipo V5 «O Bairro»
> a produção e pô-lo online. Referência obrigatória, a abrir no browser:
> `design/prototipos/mapa/mapa.html` (reconstrói-se com `node design/prototipos/mapa/montar.cjs`).
> Onde mora cada tema: `design/prototipos/conteudos/onde-mora-cada-tema.html`.
> Os dados em falta são outro pack (`docs/PACK-DADOS-V5.md`, D-01 a D-07), noutra máquina.

**O protótipo é o contrato visual.** O que ele mostra (desenho, cores, ordem dos passos,
animações, textos) é o que vai para produção. Onde este documento e o protótipo divergirem,
ganha o protótipo, exceto nas regras da casa (Regra nº1, acessibilidade, PT-PT), que ganham sempre.

## 0. O que quer dizer «ir online»

O site publica-se sozinho quando algo entra no `main` (GitHub Pages). Por isso:

- Todo o trabalho V5 vai para o ramo de integração **`v5/producao`**, nunca para o `main`.
- Cada sessão trabalha num ramo seu e abre PR **para `v5/producao`**.
- Quando P4 fechar, abre-se um único PR `v5/producao → main`. **O merge desse PR é o
  lançamento** e só o dono o faz.
- Até lá, o site V4 continua online e as ingestões diárias continuam a entrar no `main`.
  Antes do lançamento, `v5/producao` recebe o `main` (merge) para trazer os dados do dia.

```
P0 fundação ──► P1 home = bairro ──┬─► P2a cenas: Fábrica, Finanças, Banco, Mercearia
                                   ├─► P2b cenas: Correios, Bomba, Segurança Social
                                   ├─► P2c cenas: Casa, Pastelaria, Quiosque, Escola
                                   └─► P3 o resto do site com a pele V5
                                                    └──► P4 qualidade e lançamento
```

P2a, P2b, P2c e P3 podem correr em paralelo em máquinas diferentes, depois de P1 entrar.

## 1. Contrato comum (colar no início de cada sessão)

```
Estás no repo AO CÊNTIMO. Lê AGENTS.md, docs/PRODUTO.md, docs/PACK-V5-PRODUCAO.md
(este pack, inteiro) e design/prototipos/README.md. Carrega as skills literacia-pt,
frontend-ui-engineering e vercel-react-best-practices.

Abre design/prototipos/mapa/mapa.html no browser e percorre a parte que te cabe
ANTES de escrever código. O protótipo é o contrato visual: reproduz o desenho, as
cores, os textos e a ordem dos passos. Se achares que algo deve mudar, não mudes:
anota em docs/NOTAS-V5.md com o porquê.

Git:
- git fetch && git switch -c <o teu ramo> origin/v5/producao
- Só o teu ramo. PR para v5/producao (nunca para main). Sem force-push, sem -i,
  sem git config. Não faças merge do teu PR: o dono revê.

Gates antes do PR (todos verdes):
npm run lint && npm run typecheck && npm run test:unit && npm run validate:data
&& npm run build && npm run test:e2e

Regras que não se negociam:
- Regra nº1: nenhum número inventado. Todos os valores saem de data/ no build,
  com fonte e data à vista. Valores de exemplo (montante do empréstimo, café a 2 €,
  10 000 € de poupança) dizem que são exemplo, como no protótipo.
- Strings em messages/pt.json (m.bairro.*). Todo o texto que vier do protótipo é
  PROPOSTA até o dono rever: lista-o em docs/NOTAS-V5.md.
- Client components não importam messages/pt.json nem data/*.json: dados e textos
  chegam por props do servidor.
- GSAP só por carregarGsap(); prefers-reduced-motion = estado final, sem download.
- Períodos e números sempre pelos formatadores de src/lib/format.ts (fmtPeriodo,
  fmtEUR, fmtPct, FINO, MENOS), nunca pelos do protótipo.
- Nada de rotas novas (ver AGENTS.md). As cenas abrem por âncora: /#financas.

Relatório da sessão (descrição do PR): o que fizeste, capturas a 1440 e a 375 px,
o que ficou por fazer, dúvidas numeradas para o dono.
```

## 2. Arquitetura (decidida)

### 2.1 O kit de desenho: TypeScript puro que devolve SVG

O protótipo desenha tudo com funções que devolvem SVG em texto (`iso.js`, `mapa.js`,
`personagens.js`, `cena-*.js`). **Mantém-se esse modelo**: é o que garante que o
desenho sai igual, e o mapa tem milhares de nós que não ganham nada em ser componentes React.

| Protótipo | Produção | Notas |
|---|---|---|
| `iso.js` | `src/lib/bairro/iso.ts` | projeção, `caixa`, janelas, varandas, casas da Ribeira, Clérigos, ponte, rabelo, metro… |
| `mapa.js` | `src/lib/bairro/planta.ts` | terreno com cotas, edifícios, Douro, Gaia; recebe os valores dos marcadores por argumento |
| `personagens.js` | `src/lib/bairro/personagens.ts` | um esqueleto, o elenco (`ELENCO`) e os passantes |
| desenhos de `cena-*.js` | `src/lib/bairro/cenas/*.ts` | só o SVG de cada interior |
| `montar.cjs` | `src/lib/bairro/dados.ts` | `dadosBairro()`: lê `data/` no build e devolve tudo o que o mapa e as cenas precisam |

- Funções puras, tipadas, sem DOM, testáveis em Vitest (geometria de `P()`, `caixa`,
  contagem de edifícios, cada edifício com `data-id`, valores dos marcadores iguais aos de `data/`).
- O SVG é gerado **no servidor** e entra na página com `dangerouslySetInnerHTML`.
  É seguro porque não há texto de utilizador: tudo vem do código e de `data/`. Documenta
  isto num comentário e num teste que falha se algum valor não for número ou texto nosso.
- Ids de padrões SVG (`azAzul`, `granito`…) com prefixo `b-` para não colidirem com o resto do site.

### 2.2 A home

- `src/app/page.tsx` (servidor) chama `dadosBairro()`, gera o SVG do mapa e passa-o a
  `<Bairro>` (cliente), com os dados das cenas serializados.
- **O mapa nasce pronto no HTML**: edifícios, marcadores com os números de hoje,
  personagens paradas. Sem JavaScript vê-se o bairro inteiro e os números.
- `<Bairro>` (cliente) liga, por esta ordem: a câmara (arrastar, roda, pinça, botões),
  o cartão ao passar num edifício, a hora do dia, os marcadores a tamanho constante e,
  por fim, a animação ambiente (elétrico, barcos, metro, gaivotas, miúdos, fumo),
  só com `motionActiva()` e parada fora do ecrã e com o separador escondido (`PausaAmbiente`).
- **As regras de desempenho de `design/prototipos/README.md` são obrigatórias**:
  câmara por `transform` CSS sobre camadas SVG já pintadas (nunca mexer no `viewBox`),
  nuvens, barcos e metro como SVG soltos animados por CSS, reflexos parados,
  enquadramento com `ResizeObserver`.
- Por baixo do mapa: a secção «Escolhe a tua personagem» (as sete cartas) e as notas das fontes, como no protótipo.
- A home V4 (`HeroMoeda`, `EscolhePergunta`, `Painel`) sai da home. Os componentes que
  mais nenhuma rota usar apagam-se em P4, não antes.

### 2.3 As cenas

- Cada cena é um client component em `src/app/_bairro/cenas/`, carregado com `next/dynamic`
  **só quando se entra no edifício** (o bundle inicial da home não traz nenhuma cena).
- Moldura comum `<CenaDePerto>` (o `cenaBase` do protótipo): desenho à esquerda, conversa
  à direita, fechar, Escape, a fonte no fundo. No telemóvel, desenho em cima e texto em baixo.
- Abrir uma cena: foco passa para o título da cena; fechar devolve o foco ao edifício.
  URL `/#<edificio>`: abrir o link abre a cena. Voltar atrás no browser fecha-a.
- Contas: **usar os motores de `src/lib/engines/`** (irs, prestacao, poupanca, impostos,
  seg-social, independente). Onde um motor importa JSON no topo e é preciso no cliente
  (réguas), separa as funções puras para um módulo sem imports de JSON (ex.: `irs-nucleo.ts`),
  reexportado pelo original; as regras chegam por props.
- Cada gráfico tem um equivalente textual (tabela ou `<dl>` escondida visualmente) e
  `aria-label`, como pede a casa.
- Cada cena acaba com a ligação ao sítio onde se aprofunda:

| Edifício | Cena | Ligação final |
|---|---|---|
| Fábrica | o salário da Inês (moedas pelas ruas) | `/salario` |
| Segurança Social | o recibo, a TSU, o Pedro a recibos verdes | `/salario` |
| Finanças | o IRS em gavetas | `/irs` |
| Banco | a prestação e a Euribor | `/credito` |
| Mercearia | os essenciais e o IVA no talão | `/inflacao` |
| Correios | a poupança e o poder de compra | `/poupanca` |
| Bomba | o litro por dentro | `/precos` |
| Casa da Inês | meses de trabalho por uma casa | `/casa` |
| Pastelaria | comer fora e o IVA do café | `/inflacao` |
| Quiosque | o país hoje | `/trabalho` e `/dados` |
| Escola | ler gráficos e o glossário | `/aprender` |

## 3. Contrato visual V5 (substitui a pele V4)

Direção: o bairro do Porto em cartoon, claro, traço preto grosso, cores chapadas, para
dos 11 aos 50 anos. Mantêm-se da V4: a Regra nº1, a cor com significado
(verde = o que fica contigo, vermelho = o que sai, azul = neutro/informação), ▲/▼ nas variações.

**Tokens (claro, por omissão)**

| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#ffffff` | fundo de cartões e cenas |
| `--chao` | `#f6f2ea` | fundo das páginas |
| `--tinta` | `#16130f` | texto e traço |
| `--tinta-2` | `#4a4540` | texto secundário |
| `--suave` | `#6e675e` | fontes, notas |
| `--linha` | `#e4e1da` | divisões |
| `--amarelo` / `--amarelo-2` | `#ffc62b` / `#fff1c2` | destaque, marcadores |
| `--azul` / `--azul-2` | `#2445d6` / `#dfe5ff` | informação, botões |
| `--verde` / `--verde-2` | `#0c8f5c` / `#d3f2e3` | o que fica |
| `--vermelho` / `--vermelho-2` | `#e2412a` / `#ffe1d9` | o que sai |

Tema escuro: é a noite do bairro. Proposta de partida (a sessão P3 verifica AA e ajusta):
fundo `#141a33`, papel `#1d2442`, tinta `#f4efe4`, azul `#8da2ff`, verde `#3fc48a`,
vermelho `#ff7a5c`, amarelo igual. O mapa, à noite, usa o véu e as janelas acesas do protótipo.

**Tipografia:** Archivo (com o eixo de largura) para tudo; Caveat só para anotações à
mão nos gráficos e no quadro da escola; o talão e o recibo em monoespaçada do sistema.
Source Serif, Space Grotesk e Space Mono saem do `layout.tsx` em P3.

**Forma:** traço de 2,5 a 3,5 px em `--tinta`; botões em pílula com sombra dura
`3px 4px 0 var(--tinta)`; cartões com raio 18–24 px e a mesma sombra; nada de gradientes
de fundo, vidro, roxo ou sombras difusas.

**Movimento:** a animação ambiente é permitida no bairro (é a home). Nas cenas, anima-se
o que ensina (moedas, gavetas, camadas do litro, quadro da Euribor). Tudo tem estado final
sem animação para `prefers-reduced-motion`, e o número certo está sempre no HTML.

## 4. Sessões

### P0 · Fundação

Ramo `v5/prod-p0-fundacao`.

```
1. Tokens V5 em src/app/globals.css (secção 3), num bloco novo, SEM apagar ainda os
   V4 (as outras rotas continuam a usá-los até P3). Caveat em layout.tsx por next/font
   (display optional, só latin), exposta como --font-mao.
2. src/lib/bairro/iso.ts, planta.ts e personagens.ts: porta do protótipo para TS
   (secção 2.1). Mesmo resultado visual: gera o SVG e compara com o do protótipo.
3. src/lib/bairro/dados.ts: dadosBairro(), a porta de montar.cjs, lendo por
   src/lib/data.ts e pelos JSON de data/fiscal. Se uma série faltar, o marcador diz
   a falha (EstadoVazio/ZeroInformativo), nunca inventa. Testes.
4. docs/PRODUTO.md: nova secção «V5 — O Bairro» com as secções 2 e 3 deste pack
   (a V4 fica como registo). AGENTS.md: regras de viz/motion atualizadas para a V5
   (animação ambiente no bairro, cenas por âncora, kit em src/lib/bairro).
5. docs/NOTAS-V5.md criado, com a lista de textos PROPOSTA.
Aceitação: testes do kit verdes; nenhuma rota muda de aspeto ainda.
```

### P1 · A home é o bairro

Ramo `v5/prod-p1-home`. Depende de P0.

```
1. page.tsx gera o mapa no servidor e passa-o a <Bairro> (secção 2.2), com as mesmas
   camadas e ordem do protótipo.
2. <Bairro>: câmara, cartão, hora do dia (dia/fim de tarde/noite, com o céu, o sol,
   as estrelas e as janelas acesas), marcadores a tamanho constante sem sobreposição,
   animação ambiente com PausaAmbiente.
3. <CenaDePerto>, a moldura comum, e a abertura por âncora (#edificio), com os
   edifícios ainda sem cena a mostrar o cartão «em breve».
4. «Escolhe a tua personagem»: as sete cartas; tocar numa leva a câmara à personagem.
5. Cabeçalho da home: logótipo, «Independente e gratuito. Aqui ninguém te quer
   vender nada.», o título e a introdução do protótipo.
6. e2e novos (e2e/bairro.spec.ts): o mapa tem 11 edifícios focáveis com nome; os
   marcadores mostram os valores de data/; sem JS o bairro e os números aparecem;
   reduced-motion não descarrega o GSAP; 0 erros de consola; sem transbordo a 375 px;
   a câmara mexe ao arrastar.
Aceitação: /scripts/_js-por-rota.mjs — a home não passa os 350 KB de JS inicial
(o medidor imprime gzip ao nível do CDN, a mesma unidade do tecto — desde
2026-10-06; antes somava bytes raw de um servidor local que não comprime).
```

### P2a · Cenas: Fábrica, Finanças, Banco, Mercearia

Ramo `v5/prod-p2a-cenas`. Depende de P1.

```
Porta de cenaSalario (mapa.tpl.html), cena-financas.js, cena-banco.js e
cena-mercearia.js para src/app/_bairro/cenas/, dentro de <CenaDePerto>.
- Fábrica: as moedas proporcionais (maior resto, 20 moedas) a correr pelas ruas, a
  Inês a descer as escadinhas; limpa tudo ao fechar.
- Finanças: gavetas por escalão; usa impostoPorEscaloes/repartePorEscaloes do motor;
  o total da Inês tem de bater com cenarios-salario.json (teste).
- Banco: Euribor 12M do BPstat; prestação pelo motor prestacao.ts; o quadro de letras
  que viram; exemplo ajustável e marcado como exemplo.
- Mercearia: índices ECOICOP 01.1.1–01.1.8; IVA de iva.json; nenhum preço em euros.
e2e: cada cena abre, percorre todos os passos só com teclado, fecha com Escape e
devolve o foco; reduced-motion mostra o estado final de cada passo.
```

### P2b · Cenas: Correios, Bomba, Segurança Social

Ramo `v5/prod-p2b-cenas`. Depende de P1.

```
Porta de cena-correios.js, cena-bomba.js e cenaSegSocial (cenas-bairro.js).
- Correios: trajetoriaCA/trajetoriaColchao do motor poupanca.ts; o futuro dito como
  hipótese; o passado medido pelo IHPC.
- Bomba: decomporCombustivel do motor impostos.ts; ISP e carbono de isp.json com a
  portaria e a data à vista; o gráfico desde 2017.
- Segurança Social: recibo com a TSU; recibos verdes pelo motor independente.ts.
Mesmos e2e de P2a.
```

### P2c · Cenas: Casa, Pastelaria, Quiosque, Escola

Ramo `v5/prod-p2c-cenas`. Depende de P1.

```
Porta de cenaCasa, cenaPastelaria, cenaQuiosque e cenaEscola (cenas-bairro.js) e do
desenhador graficoLinhas (cena-base.js) para um componente de gráfico de linhas
reutilizável (pode assentar em src/lib/viz).
- Casa: casa-em-salarios.json; a nota «não é o salário de ninguém» é obrigatória.
- Quiosque: o Jornal do Bairro com cada número e a sua data (fmtPeriodo).
- Escola: o glossário leva a cada cena por âncora; liga também a /aprender.
Mesmos e2e de P2a.
```

### P3 · O resto do site com a pele V5

Ramo `v5/prod-p3-pele`. Depende de P0 (pode correr ao lado de P2).

```
1. Cabeçalho, navegação e rodapé com a pele V5 (logótipo, pílulas, sombra dura).
2. As 13 rotas além da home passam aos tokens V5: cores, tipografia, botões, cartões,
   gráficos. O conteúdo e os simuladores não mudam. Cada página ganha, no topo, a
   ligação de volta ao edifício do bairro que lhe corresponde (secção 2.3).
3. Tema escuro = noite do bairro (secção 3), AA verificado com _mega-audit.
4. Retirar Source Serif, Space Grotesk e Space Mono do layout; apagar os tokens V4
   que ficarem sem uso.
5. /estilo passa a mostrar o contrato visual V5.
Aceitação: npm run audit verde; capturas antes/depois das 14 rotas no PR.
```

### P4 · Qualidade e lançamento

Ramo `v5/prod-p4-lancamento`. Depende de tudo o resto.

```
1. Merge do main em v5/producao (dados do dia); resolver conflitos só em data/.
2. npm run audit, _js-por-rota (≤ 350 KB por rota), Lighthouse móvel da home
   (LCP ≤ 2,5 s, CLS ≤ 0,05), e2e completos, pageerrors em todas as rotas.
3. Apagar componentes V4 que já ninguém usa (lista no PR).
4. docs/NOTAS-V5.md: a lista final de textos PROPOSTA, para o dono rever antes do
   lançamento. Não lançar sem essa revisão.
5. SEO: metadados, Open Graph com uma imagem do bairro, sitemap.
6. Opcional (decisão do dono): deploy-pages.yml também com workflow_run no fim das
   ingestões, para os dados do dia chegarem ao site sem esperar por um push humano.
7. Abrir o PR v5/producao → main com o resumo. O dono faz o merge: é o lançamento.
```

## 5. Revisão de design

Cada PR de P1, P2 e P3 passa por revisão de design antes do merge: o dono traz o link
do PR para a sessão de design e compara-se com o protótipo, a mexer, a 1440 e a 375 px.
Diferenças de desenho, cor, ritmo das animações ou texto voltam ao ramo da sessão.

## 6. Riscos

- **Desempenho do mapa no telemóvel:** as regras do README resolveram-no no protótipo
  (12 → 35 fps). Se, mesmo assim, não chegar, o passo seguinte é o PixiJS, não o Three.js.
- **Tamanho do HTML da home:** o SVG do mapa é grande (milhares de nós). Medir o HTML da
  home comprimido com gzip em P1; se passar de 80 KB, gerar as camadas de fundo como
  ficheiros SVG estáticos em `public/` e referenciá-los.
- **Copy sem revisão:** todo o texto das cenas é proposta até o dono o rever (P4).
- **Dados que envelhecem:** o ISP muda por portaria; `isp.json` tem de estar atualizado
  no dia do lançamento, ou a cena mostra a data da portaria em vigor (já o faz).
