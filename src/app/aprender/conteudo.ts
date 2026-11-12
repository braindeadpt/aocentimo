/**
 * Conteúdo editorial da rota /aprender (sessão 3D) — vive dentro da
 * pasta da rota porque só /aprender o usa: a organização pelas quatro
 * perguntas, a frase simples de nível 1, o exemplo com números e a
 * ficha de legislação/fonte de cada termo.
 *
 * Regra nº 1: nada aqui inventa dados. Os exemplos são ilustrações do
 * conceito (o mesmo estatuto dos valores em `src/content/demos.ts`) e
 * os que se apoiam em valores oficiais citam a fonte na ficha. As
 * fichas apontam para os `data/fiscal/*.json` reais — nunca para leis
 * escritas de memória.
 *
 * NOTA para o dono: `FRASE`, `EXEMPLO` e as descrições de grupo são
 * copy novo a rever — registado em docs/historico/NOTAS-V4-sessao-3d.md. Se fizerem
 * sentido como campos do `Termo`, mudam-se para `src/content/glossario.ts`
 * sem custo (a página consome-os pelas funções abaixo).
 */

import { GLOSSARIO, termoPorSlug, type Termo } from "@/content/glossario";

export type GrupoId = "ganhas" | "pagas" | "banco" | "pais";

/** A pergunta de cada grupo — o glossário organiza-se pela mesma
 *  arquitetura da navegação (rótulos vêm de m.nav.grupo*). */
export const ORDEM_GRUPOS: GrupoId[] = ["ganhas", "pagas", "banco", "pais"];

/** slug → pergunta — atribuição editorial, explícita (não derivada:
 *  o sítio onde um termo mora é uma decisão de leitura, não um dado). */
export const GRUPO_DE: Record<string, GrupoId> = {
  // O que ganhas — salário, IRS, trabalho
  "escalao-irs": "ganhas",
  "taxa-efetiva-marginal": "ganhas",
  "deducao-especifica": "ganhas",
  "minimo-existencia": "ganhas",
  "retencao-fonte": "ganhas",
  tsu: "ganhas",
  "deducao-coleta": "ganhas",
  "limite-deducoes": "ganhas",
  "rendimento-relevante": "ganhas",
  englobamento: "ganhas",
  "salario-real": "ganhas",
  ias: "ganhas",
  "rendimento-coletavel": "ganhas",
  "irs-jovem": "ganhas",
  duodecimos: "ganhas",
  "subsidio-alimentacao": "ganhas",
  adse: "ganhas",
  // O que pagas — impostos, preços, inflação
  iva: "pagas",
  isp: "pagas",
  imt: "pagas",
  "imposto-selo": "pagas",
  imi: "pagas",
  "isv-iuc": "pagas",
  // O banco — crédito, casa, poupança
  euribor: "banco",
  spread: "banco",
  tan: "banco",
  taeg: "banco",
  mtic: "banco",
  "certificados-aforro": "banco",
  "taxa-real": "banco",
  "retencao-capitais": "banco",
  ppr: "banco",
  "taxa-mista": "banco",
  "taxa-esforco": "banco",
  "mais-valias": "banco",
  "servicos-minimos-bancarios": "banco",
  "fundo-garantia-depositos": "banco",
  // O país — os números oficiais (a estatística em si, não o preço)
  "ipc-ihpc": "pais",
  homologo: "pais",
  pib: "pais",
  "populacao-ativa": "pais",
  "indice-precos-habitacao": "pais",
};

/** A frase de nível 1 — uma definição que se lê sem saber nenhum outro
 *  termo, ≤ ~25 palavras, tom de quem explica a alguém de 12 anos. */
export const FRASE: Record<string, string> = {
  euribor:
    "A taxa a que os bancos se emprestam dinheiro entre si — no teu crédito de taxa variável é a parte que não se negoceia.",
  spread:
    "A margem que o banco soma à taxa de referência do teu crédito — é a parte que podes negociar.",
  tan: "A taxa que faz nascer os juros do empréstimo — a taxa de referência mais a margem do banco.",
  taeg: "O custo real do crédito por ano, já com juros, seguros e comissões — é o número para comparar bancos.",
  mtic: "A soma de tudo o que pagas até ao fim do empréstimo — quanto o crédito custa de verdade.",
  "ipc-ihpc":
    "Os dois termómetros oficiais dos preços: um calculado pelo INE em Portugal, outro pelo Eurostat para comparar países.",
  "escalao-irs":
    "O IRS cobra por fatias: cada fatia do rendimento paga a sua taxa, e subir de escalão nunca te faz ganhar menos.",
  "taxa-efetiva-marginal":
    "A marginal é a taxa do último degrau de rendimento; a efetiva é o imposto total a dividir pelo que ganhas — mais baixa.",
  "deducao-especifica":
    "Uma fatia do salário que fica de fora antes de o IRS contar — em 2026 são cerca de 4 587 € por ano.",
  "minimo-existencia":
    "A lei protege o rendimento essencial para viver: em 2026 ninguém paga IRS sobre até 12 880 € por ano.",
  "retencao-fonte":
    "O IRS que o empregador desconta todos os meses e entrega ao Estado por ti — um adiantamento que se acerta na declaração.",
  tsu: "A contribuição para a Segurança Social: saem 11 % do teu recibo e a empresa paga mais 23,75 % que nunca vês.",
  isp: "O imposto fixo em cêntimos por litro de combustível — e por cima dele ainda se cobra IVA.",
  iva: "O imposto já incluído nos preços: 6 % nos bens essenciais, 13 % nos restaurantes, 23 % na maioria.",
  "certificados-aforro":
    "Emprestas dinheiro ao Estado e recebes juros de três em três meses, com capital garantido.",
  "taxa-real":
    "A taxa que o banco anuncia menos a inflação e os impostos — o que o teu dinheiro rende de verdade.",
  "retencao-capitais":
    "Dos juros que o banco te deve, o fisco fica logo com 28 % — à tua conta só chega o resto.",
  "deducao-coleta":
    "Despesas de saúde, educação e rendas cortam o IRS a pagar euro a euro, depois de o imposto estar calculado.",
  "limite-deducoes":
    "Há um teto para a soma das deduções ao IRS — quanto mais ganhas, mais baixo é o teto.",
  ppr: "Uma poupança para a reforma com benefício no IRS, mas o dinheiro fica preso até às condições legais de resgate.",
  "rendimento-relevante":
    "Para um trabalhador independente, a Segurança Social conta só 70 % do que faturas e cobra sobre essa parte.",
  englobamento:
    "Escolher entre pagar uma taxa fixa sozinha ou somar o rendimento ao resto e pagar a tua taxa de IRS.",
  "salario-real":
    "O salário medido pelo que ele compra: se os preços sobem mais do que o teu aumento, ficas a ganhar menos.",
  /* PROPOSTA (revisão do dono) — frases de nível 1 dos 19 novos termos */
  homologo:
    "A variação homóloga compara com o mesmo mês do ano passado; a em cadeia compara com o mês anterior.",
  pib: "O valor de tudo o que o país produz num ano — mede a riqueza criada e o crescimento da economia.",
  "populacao-ativa":
    "Conta quem trabalha e quem procura emprego: quem estuda ou não procura fica fora da taxa de desemprego.",
  "indice-precos-habitacao":
    "O termómetro oficial dos preços das casas: mede quanto custa comprar habitação face a um ano de referência.",
  ias: "A bitola oficial do Estado para calcular apoios sociais, subsídios de desemprego e limites fiscais.",
  "rendimento-coletavel":
    "A parte do salário que o fisco realmente tributa, depois de descontar a dedução específica ao bruto.",
  "irs-jovem":
    "Dez anos de desconto no IRS até aos 35 anos: 100\u202f% no primeiro ano, a descer até 25\u202f% no décimo.",
  duodecimos:
    "Receber os subsídios de férias e Natal às fatias mês a mês em vez de duas vezes por ano.",
  "subsidio-alimentacao":
    "O subsídio diário para comer: em cartão tem isenção fiscal até 10,455\u202f€ por dia, em dinheiro só até 6,15\u202f€.",
  adse: "O subsistema de saúde público: desconta 3,5\u202f% do vencimento base ao longo dos 14 meses do ano.",
  imt: "O imposto que pagas quando compras casa — jovens até 35 anos têm isenção na primeira habitação até 330\u202f539\u202f€.",
  "imposto-selo":
    "Uma taxa que recai sobre contratos e compras: na casa leva 0,8\u202f% do preço e 0,6\u202f% do crédito.",
  imi: "O imposto anual de ser dono de uma casa: a câmara aplica uma taxa entre 0,3\u202f% e 0,45\u202f% sobre o valor fiscal.",
  "isv-iuc":
    "Os impostos dos automóveis: o ISV paga-se uma vez ao matricular; o IUC paga-se todos os anos pela matrícula.",
  "taxa-mista":
    "A taxa variável mexe com a Euribor; a fixa nunca muda; a mista fica congelada no início e varia depois.",
  "taxa-esforco":
    "A fatia do teu ordenado líquido que vai para pagar créditos ao banco — o limite recomendado é 50\u202f%.",
  "mais-valias":
    "O lucro que tens quando vendes um bem mais caro do que compraste — o Estado tributa essa diferença.",
  "servicos-minimos-bancarios":
    "Uma conta bancária essencial com cartão e transferências, com custo máximo fixado por lei em 5,37\u202f€ por ano.",
  "fundo-garantia-depositos":
    "O cofre que protege as tuas poupanças no banco até 100\u202f000\u202f€ caso a instituição vá à falência.",
};

/** Exemplo com números para os termos que ainda não têm `exemplo` no
 *  glossário — ilustração do conceito, nunca dados apresentados como
 *  oficiais. Onde a conta se apoia em valores em vigor (IAS, SMN,
 *  taxas legais), os números saem dos `data/fiscal/` reais. */
export const EXEMPLO: Record<string, string> = {
  tan: "Taxa de referência de 2,0 % + margem de 1,0 % = TAN de 3,0 %.",
  taeg: "TAN de 3,0 % + seguros + comissões ≈ TAEG de 4,2 % — por isso se compara pela TAEG.",
  "ipc-ihpc":
    "Para o mesmo mês, o INE pode dizer 2,4 % e o Eurostat 2,1 % — a mesma inflação, duas réguas.",
  "taxa-efetiva-marginal":
    "Com marginal de 35 %, a efetiva pode ficar perto de 17 % — a média é cerca de metade do último degrau.",
  "deducao-especifica": "Em 2026: 8,54 × IAS de 537,13 € ≈ 4 587 € do ano que não pagam IRS.",
  "minimo-existencia":
    "Em 2026 o mínimo protege 920 € × 14 = 12 880 € — quem ganha o salário mínimo não paga IRS.",
  "retencao-fonte":
    "Se reténs 200 € por mês e o IRS anual devido é 2 200 €, recebes a diferença como reembolso.",
  tsu: "Num salário de 1 000 €: saem 110 € teus e a empresa paga mais 237,50 € — custo real de 1 237,50 €.",
  isp: "Do preço de cada litro, uma parte fixa em cêntimos é ISP — e o IVA de 23 % ainda incide sobre esse imposto.",
  iva: "Um livro de 10 € leva 6 %, um jantar de 20 € leva 13 %, uma televisão de 300 € leva 23 %.",
  "certificados-aforro":
    "1 000 € em Certificados de Aforro: juros a cada três meses e um prémio que cresce quanto mais tempo ficam.",
  "taxa-real":
    "Depósito a 1,5 % com inflação de 3 %: a taxa real é −1,5 % — perdes poder de compra sem o saldo descer.",
  "retencao-capitais":
    "Num depósito anunciado a 2,5 %, o fisco retém 28 % dos juros e à tua conta chegam 1,8 %.",
  "deducao-coleta":
    "250 € de despesas de saúde devolvem 15 % — 37,50 € a menos de IRS a pagar.",
  "limite-deducoes":
    "No 1.º escalão não há teto; no último, a soma das deduções pára nos 1 000 €.",
  ppr: "1 000 € entregues no ano voltam 200 € pelo IRS — mas um resgate fora das regras obriga a devolver o benefício.",
  "rendimento-relevante":
    "Faturas 10 000 € em serviços: a Segurança Social conta 7 000 € e cobra 21,4 % — cerca de 1 498 €.",
  englobamento:
    "1 000 € de mais-valias: à taxa autónoma pagas 280 €; englobadas a uma marginal de 21 %, 210 €.",
  /* PROPOSTA (revisão do dono) — exemplos com números dos 19 novos termos */
  homologo:
    "Se a inflação homóloga for 2,5\u202f% e a em cadeia \u22120,2\u202f%, os preços subiram no ano mas desceram no mês.",
  pib: "Crescimento homólogo de 1,8\u202f% no PIB significa mais 1,8\u202f% de riqueza real gerada face ao mesmo trimestre do ano anterior.",
  "populacao-ativa":
    "Numa população ativa de 5\u202f300\u202f000 pessoas com 350\u202f000 desempregados, a taxa de desemprego é 6,6\u202f%.",
  "indice-precos-habitacao":
    "Com a base 2015 = 100, um índice de 205 indica que as casas custam mais do dobro do que em 2015.",
  ias: "Em 2026 o IAS vale 537,13\u202f€; o teto máximo do subsídio de desemprego é 2,5 × IAS = 1\u202f342,83\u202f€/mês.",
  "rendimento-coletavel":
    "Num salário anual de 21\u202f000\u202f€, tira-se a dedução específica de 4\u202f587,09\u202f€ — o rendimento coletável é 16\u202f412,91\u202f€.",
  "irs-jovem":
    "No 1.º ano a trabalhar, até 29\u202f542,15\u202f€ de rendimento (55 × IAS de 537,13\u202f€) fica 100\u202f% isento de IRS.",
  duodecimos:
    "Num salário de 1\u202f200\u202f€, 50\u202f% em duodécimos soma 100\u202f€ brutos ao mês e metade dos subsídios na época.",
  "subsidio-alimentacao":
    "A 9,00\u202f€/dia em cartão ficas 100\u202f% isento; em dinheiro pagarias IRS e Segurança Social sobre 2,85\u202f€ por dia.",
  adse: "Num vencimento de 1\u202f500\u202f€, o desconto de 3,5\u202f% para a ADSE retira 52,50\u202f€ por mês (735,00\u202f€ por ano a 14 meses).",
  imt: "Uma casa de 200\u202f000\u202f€ para habitação própria paga cerca de 3\u202f509\u202f€ de IMT normal, mas 0\u202f€ com IMT Jovem.",
  "imposto-selo":
    "Casa de 200\u202f000\u202f€ com empréstimo de 180\u202f000\u202f€: 1\u202f600\u202f€ de selo da compra + 1\u202f080\u202f€ de selo do crédito = 2\u202f680\u202f€.",
  imi: "Um imóvel com VPT de 120\u202f000\u202f€ e taxa de 0,324\u202f% paga 388,80\u202f€ de IMI por ano, em 2 prestações.",
  "isv-iuc":
    "Um ligeiro a gasolina paga ISV no registo da matrícula e depois IUC todos os anos no mês da matrícula.",
  "taxa-mista":
    "Taxa mista a 5 anos com 2,8\u202f% e depois Euribor 12M + 0,75\u202f%: prestação fixa 5 anos e variável depois.",
  "taxa-esforco":
    "Prestações de crédito de 700\u202f€ com rendimento líquido de 2\u202f000\u202f€ dão 35\u202f% de esforço (abaixo dos 50\u202f% do BdP).",
  "mais-valias":
    "Venda de ações com lucro de 500\u202f€: paga 28\u202f% de taxa autónoma (140\u202f€ de imposto sobre capitais).",
  "servicos-minimos-bancarios":
    "Conta de serviços mínimos tem cartão e transferências por no máximo 5,37\u202f€ por ano (1\u202f% do IAS).",
  "fundo-garantia-depositos":
    "Se um banco falir, o FGD devolve o teu dinheiro até ao limite de 100\u202f000\u202f€ por titular.",
};

/** Ficha de nível 3 — a legislação e a fonte oficial de cada termo.
 *  `fonte`/`url` alimentam o <Source>; `letra` é a nota de leitura.
 *  Termos que são conceitos (não leis) dizem-no — a honestidade vale
 *  para a bibliografia como para os números. */
export interface FichaTermo {
  fonte: string;
  url?: string;
  legislacao?: string;
  /** quando o termo não tem lei própria — o que se mostra em vez */
  conceito?: string;
}

const AT = "https://info.portaldasfinancas.gov.pt";
const BPSTAT = "https://bpstat.bportugal.pt";
const CLIENTE_BANCARIO =
  "https://clientebancario.bportugal.pt/pt-pt/taxas-de-juro-credito-aos-consumidores";

export const FICHA: Record<string, FichaTermo> = {
  euribor: {
    fonte: "Banco de Portugal — BPstat (médias mensais)",
    url: BPSTAT,
    legislacao:
      "Calculada diariamente pelo EMMI para a Zona Euro; o Banco de Portugal publica as médias mensais que os bancos aplicam às prestações.",
  },
  spread: {
    fonte: "Banco de Portugal — Portal do Cliente Bancário",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "Não há tabela oficial: o spread é fixado em cada contrato, dentro das regras de transparência do crédito (DL 133/2009 e DL 74-A/2017).",
  },
  tan: {
    fonte: "Banco de Portugal — taxas máximas do crédito aos consumidores (DL 133/2009, art. 28.º)",
    url: CLIENTE_BANCARIO,
    legislacao:
      "A TAN é a soma do indexante com o spread. O Banco de Portugal publica os tetos trimestrais de usura por tipo de crédito.",
  },
  taeg: {
    fonte: "Banco de Portugal — taxas máximas do crédito aos consumidores (DL 133/2009, art. 28.º)",
    url: CLIENTE_BANCARIO,
    legislacao:
      "A TAEG agrega juros, seguros obrigatórios e comissões. Os tetos legais de usura aplicam-se sobre a TAEG, revistos por trimestre.",
  },
  mtic: {
    fonte: "Banco de Portugal — Portal do Cliente Bancário",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "O MTIC é de divulgação obrigatória na FINE e no contrato — soma capital, juros, comissões, impostos e seguros.",
  },
  "ipc-ihpc": {
    fonte: "Eurostat (IHPC) e INE (IPC)",
    url: "https://ec.europa.eu/eurostat",
    legislacao:
      "O IHPC segue o regulamento europeu de índices harmonizados; o IPC segue a metodologia nacional do INE — os dois medem cabazes diferentes.",
  },
  "escalao-irs": {
    fonte: "Art. 68.º CIRS, redação da Lei n.º 73-A/2025 (OE2026)",
    url: AT,
    legislacao:
      "Os escalões e as taxas marginais são os do art. 68.º do CIRS em vigor — versionados por ano em data/fiscal/irs-2026.json.",
  },
  "taxa-efetiva-marginal": {
    fonte: "Art. 68.º CIRS (escalões) — OE2026",
    url: AT,
    legislacao:
      "A marginal é a taxa do escalão mais alto que o rendimento atinge; a efetiva é a coleta a dividir pelo rendimento coletável.",
  },
  "deducao-especifica": {
    fonte: "Art. 25.º CIRS — OE2026",
    url: AT,
    legislacao:
      "Em 2026 a dedução específica do trabalho dependente é 8,54 × IAS; se as contribuições para a Segurança Social forem maiores, valem elas.",
  },
  "minimo-existencia": {
    fonte: "Art. 70.º CIRS — OE2026",
    url: AT,
    legislacao:
      "Em 2026 o mínimo de existência é 14 × SMN = 12 880 €, com abatimento progressivo até ao limite da fórmula do art. 70.º.",
  },
  "retencao-fonte": {
    fonte: "Despacho n.º 233-A/2026, de 6 de janeiro (DR, 2.ª série, n.º 3)",
    url: "https://files.diariodarepublica.pt/2s/2026/01/003000001/0000200010.pdf",
    legislacao:
      "As tabelas de retenção mensal do continente — aplicam-se aos rendimentos pagos a partir de 1 de janeiro de 2026.",
  },
  tsu: {
    fonte: "Código dos Regimes Contributivos; Lei n.º 110/2009",
    url: "https://www.seg-social.pt",
    legislacao:
      "Trabalhador por conta de outrem: 11 % a cargo do trabalhador e 23,75 % a cargo da entidade empregadora.",
  },
  isp: {
    fonte: "Portaria n.º 372-A/2026/1, de 21 de agosto (taxas efetivas com desconto extraordinário)",
    url: "https://diariodarepublica.pt",
    legislacao:
      "As taxas de ISP mudam por portaria, por vezes semanalmente — cada valor mostrado no site tem data de vigência explícita.",
  },
  iva: {
    fonte: "Código do IVA — Listas I e II anexas; art. 18.º",
    url: AT,
    legislacao:
      "Três taxas no continente: 6 % (bens essenciais, Lista I), 13 % (Lista II — ex.: restauração) e 23 % (taxa normal).",
  },
  "certificados-aforro": {
    fonte: "IGCP — Ficha Técnica Certificados de Aforro Série F (Portaria 149-A/2023 e alterações)",
    url: "https://www.igcp.pt/pt/aforristas/produtos-de-aforro/certificados-de-aforro",
    legislacao:
      "Série F: taxa base = Euribor 3M (média de 10 dias úteis, limitada a 2,50 %) + prémios de permanência crescentes.",
  },
  "taxa-real": {
    fonte: "Eurostat/INE (inflação) — conceito, não lei",
    url: "https://ec.europa.eu/eurostat",
    conceito:
      "Não há legislação própria: a taxa real é a nominal menos a inflação medida pelo IHPC/IPC — e ainda menos o imposto sobre os juros.",
  },
  "retencao-capitais": {
    fonte: "CIRS art. 71.º-72.º — retenção liberatória sobre rendimentos de capitais (cat. E)",
    url: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/",
    legislacao:
      "Juros de depósitos e certificados: retenção liberatória de 28 % — o imposto fica resolvido no momento do pagamento.",
  },
  "deducao-coleta": {
    fonte: "Arts. 78.º a 84.º CIRS (redação OE2026, Lei 73-A/2025)",
    url: "https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Cidadaos/Rendimentos/Declaracao/Deducoes_a_coleta/Paginas/default.aspx",
    legislacao:
      "Saúde 15 % (até 1 000 €), educação 30 % (até 800 €), rendas, PPR 20 % e o IVA das faturas pedidas com NIF.",
  },
  "limite-deducoes": {
    fonte: "Art. 78.º CIRS — limite global das deduções à coleta",
    url: AT,
    legislacao:
      "Sem limite no 1.º escalão, 1 000 € no último e um valor intermédio nos restantes — majorado 5 % por dependente a partir do terceiro.",
  },
  ppr: {
    fonte: "Art. 21.º EBF — benefício fiscal das entregas; taxa efetiva de 8 % no reembolso dentro das condições legais",
    url: AT,
    legislacao:
      "Deduz 20 % das entregas do ano (até 400 € abaixo dos 35 anos); resgatar fora das condições legais devolve o benefício com penalização.",
  },
  "rendimento-relevante": {
    fonte: "Código dos Regimes Contributivos — trabalhadores independentes",
    url: "https://www.seg-social.pt",
    legislacao:
      "Prestação de serviços: o rendimento relevante é 70 % da faturação; sobre ele aplica-se a taxa de 21,4 %, apurada trimestralmente.",
  },
  englobamento: {
    fonte: "CIRS arts. 10.º, 22.º, 43.º e 72.º — regras das mais-valias",
    url: AT,
    legislacao:
      "A taxa autónoma fecha a conta (ex.: 28 % nas mais-valias); o englobamento soma ao resto do rendimento e paga a marginal — em imóveis é obrigatório.",
  },
  "salario-real": {
    fonte: "Eurostat/INE (inflação) — conceito, não lei",
    url: "https://ec.europa.eu/eurostat",
    conceito:
      "Não há legislação própria: o salário real é o nominal corrigido pela inflação oficial — é a medida do poder de compra.",
  },
  /* PROPOSTA (revisão do dono) — fichas de legislação/fonte dos 19 novos termos */
  homologo: {
    fonte: "Eurostat e INE (metodologia de índices)",
    url: "https://ec.europa.eu/eurostat",
    conceito:
      "A variação homóloga compara com o mesmo período do ano anterior para eliminar a sazonalidade; a variação em cadeia compara com o mês imediatamente anterior.",
  },
  pib: {
    fonte: "INE e Eurostat — Contas Nacionais",
    url: "https://www.ine.pt",
    conceito:
      "O Produto Interno Bruto mede a produção total da economia a preços de mercado num trimestre ou ano.",
  },
  "populacao-ativa": {
    fonte: "INE — Inquérito ao Emprego e Eurostat (série une_rt_m)",
    url: "https://www.ine.pt",
    legislacao:
      "Metodologia da OIT: a taxa de desemprego calcula-se sobre a população ativa (pessoas empregadas e desempregadas à procura ativa de trabalho).",
  },
  "indice-precos-habitacao": {
    fonte: "INE e Eurostat — Índice de Preços da Habitação (HPI)",
    url: "https://ec.europa.eu/eurostat",
    legislacao:
      "Regulamento (UE) 2016/792 do Parlamento Europeu e do Conselho relativo aos índices de preços da habitação.",
  },
  ias: {
    fonte: "Portaria n.º 480-A/2025/1 e Lei n.º 53-B/2006",
    url: "https://diariodarepublica.pt",
    legislacao:
      "O IAS fixa-se em 537,13\u202f€ em 2026, servindo de bitola para cálculo de apoios sociais, limites e deduções no IRS.",
  },
  "rendimento-coletavel": {
    fonte: "Arts. 15.º, 22.º e 25.º CIRS (OE2026, Lei n.º 73-A/2025)",
    url: AT,
    legislacao:
      "No trabalho dependente (cat. A), o rendimento coletável resulta do rendimento bruto deduzido de 8,54 × IAS (4\u202f587,09\u202f€ em 2026) ou contribuições obrigatórias.",
  },
  "irs-jovem": {
    fonte: "Art. 12.º-B CIRS (redação Lei n.º 45-A/2024 e Lei n.º 73-A/2025)",
    url: AT,
    legislacao:
      "Isenção parcial para jovens até aos 35 anos durante 10 anos: 100\u202f% no 1.º ano, 75\u202f% nos 2.º a 4.º, 50\u202f% nos 5.º a 7.º e 25\u202f% nos 8.º a 10.º, com teto de 55 × IAS.",
  },
  duodecimos: {
    fonte: "Art. 264.º do Código do Trabalho e art. 99.º-C do CIRS",
    url: AT,
    legislacao:
      "Permite fracionar o pagamento dos subsídios de férias e de Natal pelos 12 meses do ano (a 50\u202f% ou 100\u202f%), com retenção autónoma de IRS sobre cada duodécimo.",
  },
  "subsidio-alimentacao": {
    fonte: "Portaria n.º 51-B/2026/1 e art. 2.º n.º 3 al. b) do CIRS",
    url: "https://diariodarepublica.pt",
    legislacao:
      "Limites diários de isenção de IRS e TSU em 2026: 6,15\u202f€ em dinheiro (valor AP) ou 10,455\u202f€ em vale ou cartão de refeição.",
  },
  adse: {
    fonte: "Decreto-Lei n.º 118/83 (arts. 46.º e 47.º) e Lei n.º 53-D/2006",
    url: "https://www2.adse.pt",
    legislacao:
      "Desconto de 3,50\u202f% sobre o vencimento base e pensões ao longo de 14 meses. Nas pensões vigora o limiar de salvaguarda de 635,00\u202f€.",
  },
  imt: {
    fonte: "Art. 17.º do CIMT (Ofício Circulado 40129/2026) e Decreto-Lei n.º 48-A/2024 (IMT Jovem)",
    url: AT,
    legislacao:
      "IMT progressivo por escalões. Jovens até aos 35 anos têm isenção na aquisição de primeira habitação própria permanente até 330\u202f539\u202f€ em 2026.",
  },
  "imposto-selo": {
    fonte: "Código do Imposto do Selo — Tabela Geral verbas 1.1 (aquisição) e 17.1 (crédito)",
    url: AT,
    legislacao:
      "Taxa de 0,8\u202f% sobre o valor de aquisição do imóvel e 0,6\u202f% sobre o montante de crédito habitação concedido por prazo superior a 5 anos.",
  },
  imi: {
    fonte: "Código do IMI (CIMI), arts. 112.º, 112.º-A e 120.º (Decreto-Lei n.º 287/2003)",
    url: AT,
    legislacao:
      "Taxa para prédios urbanos fixada entre 0,30\u202f% e 0,45\u202f% pela assembleia municipal sobre o VPT. O IMI familiar prevê reduções fixas por dependente.",
  },
  "isv-iuc": {
    fonte: "Código do ISV e Código do IUC (Lei n.º 22-A/2007) — tabelas em vigor",
    url: "https://diariodarepublica.pt",
    legislacao:
      "O ISV é liquidado uma única vez na matrícula do veículo; o IUC é devido anualmente pela titularidade da viatura consoante a cilindrada e emissões.",
  },
  "taxa-mista": {
    fonte: "Banco de Portugal — DL n.º 74-A/2017 e Portal do Cliente Bancário",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "Taxa fixa nos anos iniciais acordados (comissão máxima de reembolso antecipado de 2,0\u202f%) e variável no período restante (comissão máxima de 0,5\u202f%).",
  },
  "taxa-esforco": {
    fonte: "Banco de Portugal — Recomendação Macroprudencial (DSTI) e Instrução n.º 16/2023",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "Limite geral de 50\u202f% no rácio entre os encargos mensais de crédito e o rendimento líquido do agregado familiar.",
  },
  "mais-valias": {
    fonte: "Arts. 10.º, 22.º, 43.º e 72.º CIRS — tributação de ganhos de capital",
    url: AT,
    legislacao:
      "Ganhos mobiliários tributam a taxa autónoma de 28\u202f% (salvo englobamento). Ganhos imobiliários englobam em 50\u202f%, com isenção no reinvestimento em habitação própria.",
  },
  "servicos-minimos-bancarios": {
    fonte: "Decreto-Lei n.º 27-C/2000 (redação da Lei n.º 24/2023) e Banco de Portugal",
    url: "https://clientebancario.bportugal.pt",
    legislacao:
      "Conta essencial com comissão anual máxima travada em 1\u202f% do IAS (5,37\u202f€ em 2026), incluindo cartão de débito e transferências gratuitas.",
  },
  "fundo-garantia-depositos": {
    fonte: "Regime Geral das Instituições de Crédite e Sociedades Financeiras (art. 154.º e ss.)",
    url: "https://www.fgd.pt",
    legislacao:
      "Garante o reembolso de depósitos constituídos em instituições participantes até ao limite de 100\u202f000\u202f€ por depositante e por banco.",
  },
};

/* ————— funções ————— */

export function grupoDe(slug: string): GrupoId {
  return GRUPO_DE[slug] ?? "ganhas";
}

/** A frase de nível 1 — a do mapa editorial, ou a primeira frase da
 *  definição como queda honesta para termos novos (nunca vazio). */
export function fraseDe(t: Termo): string {
  const f = FRASE[t.slug];
  if (f) return f;
  const primeira = t.definicao.split(/(?<=[.!?])\s/)[0];
  return primeira ?? t.definicao;
}

/** O exemplo com números — o do glossário se existir, senão o daqui. */
export function exemploDe(t: Termo): string | undefined {
  return t.exemplo ?? EXEMPLO[t.slug];
}

export interface GrupoGlossario {
  id: GrupoId;
  termos: Termo[];
}

/** Os termos ordenados pelas quatro perguntas, na ordem do glossário.
 *  Um termo novo sem grupo cai no fim de «O que ganhas» (grupoDe) —
 *  nunca desaparece da lista. */
export function gruposDoGlossario(): GrupoGlossario[] {
  const mapa = new Map<GrupoId, Termo[]>(ORDEM_GRUPOS.map((g) => [g, []]));
  for (const t of GLOSSARIO) mapa.get(grupoDe(t.slug))!.push(t);
  return ORDEM_GRUPOS.map((id) => ({ id, termos: mapa.get(id)! }));
}

/** O termo seguinte na ordem das quatro perguntas — a «pergunta
 *  seguinte» de cada /aprender/[slug] percorre o glossário. No último
 *  devolve undefined — a página cai então na saída para /metodologia. */
export function proximoTermo(slug: string): Termo | undefined {
  const ordenado = gruposDoGlossario().flatMap((g) => g.termos);
  const i = ordenado.findIndex((t) => t.slug === slug);
  return i >= 0 ? ordenado[i + 1] : undefined;
}

export { termoPorSlug };
