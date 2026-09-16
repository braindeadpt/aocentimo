export interface Termo {
  slug: string;
  termo: string;
  definicao: string;
  exemplo?: string;
}

export const GLOSSARIO: Termo[] = [
  {
    slug: "euribor",
    termo: "Euribor",
    definicao:
      "Taxa de juro a que os bancos da Zona Euro se emprestam dinheiro entre si, calculada diariamente para vários prazos (1 semana a 12 meses). Nos créditos de taxa variável, é a componente que não se negoceia: o contrato diz apenas qual o prazo de referência.",
    exemplo: "Euribor 6M a 2,0 % + spread de 1,0 % = TAN de 3,0 %.",
  },
  {
    slug: "spread",
    termo: "Spread",
    definicao:
      "A margem do banco sobre a Euribor no crédito habitação, em pontos percentuais, fixada no contrato. É a parte negociável da taxa — reflete o risco que o banco te atribui e o quanto queres negociar.",
    exemplo: "Reduzir o spread de 1,5 % para 1,0 % num empréstimo de 200 000 € a 30 anos poupa dezenas de euros por mês.",
  },
  {
    slug: "tan",
    termo: "TAN",
    definicao:
      "Taxa Anual Nominal: Euribor + spread. É a taxa que gera os juros do empréstimo, mas não inclui seguros nem comissões — para comparar bancos usa-se a TAEG.",
  },
  {
    slug: "taeg",
    termo: "TAEG",
    definicao:
      "Taxa Anual de Encargos Efetiva Global: o custo real anual do crédito, incluindo juros, seguros obrigatórios, comissões e custos de manutenção. É o único número honesto para comparar propostas de bancos diferentes.",
  },
  {
    slug: "mtic",
    termo: "MTIC",
    definicao:
      "Montante Total Imputado ao Consumidor: a soma de tudo o que pagas até ao fim do empréstimo — capital, juros, seguros, comissões. Revela quanto a casa custa de facto.",
    exemplo: "Um empréstimo de 200 000 € pode ter um MTIC acima de 300 000 €.",
  },
  {
    slug: "ipc-ihpc",
    termo: "IPC e IHPC",
    definicao:
      "Índices de preços no consumidor. O IPC é calculado pelo INE com regras nacionais; o IHPC pelo Eurostat com metodologia harmonizada europeia — por isso os números que lês nas notícias às vezes divergem. O IHPC não inclui custos de habitação própria.",
  },
  {
    slug: "escalao-irs",
    termo: "Escalão de IRS",
    definicao:
      "Degrau de rendimento coletável com uma taxa marginal. O IRS é progressivo por fatias: só a parte do rendimento dentro de cada degrau paga a taxa desse degrau. Subir de escalão nunca te faz ganhar menos.",
    exemplo: "Num rendimento de 15 000 €, os primeiros 8 342 € pagam 12,5 %; só o que excede cada limite paga a taxa seguinte.",
  },
  {
    slug: "taxa-efetiva-marginal",
    termo: "Taxa efetiva vs marginal",
    definicao:
      "A taxa marginal é a do teu último escalão; a efetiva é o imposto total dividido pelo rendimento — sempre menor. Quando alguém diz 'pago 35 % de IRS', normalmente é a marginal; a efetiva pode ser metade disso.",
  },
  {
    slug: "deducao-especifica",
    termo: "Dedução específica",
    definicao:
      "Parcela do rendimento de trabalho dependente (cat. A) que não paga IRS — em 2026, 8,54 × IAS. Se as tuas contribuições à Segurança Social forem maiores, vale esse valor.",
  },
  {
    slug: "minimo-existencia",
    termo: "Mínimo de existência",
    definicao:
      "Mecanismo do art. 70.º do CIRS que garante que ninguém paga IRS sobre o rendimento estritamente necessário ao custo de vida — em 2026 protege rendimentos até 14 × o salário mínimo (12 880 €), com abatimento progressivo acima disso.",
  },
  {
    slug: "retencao-fonte",
    termo: "Retenção na fonte",
    definicao:
      "O IRS que a entidade patronal desconta todos os meses e entrega ao Estado em teu nome. É um adiantamento — o acerto faz-se na declaração anual. Retenção a mais = reembolso; a menos = imposto a pagar.",
  },
  {
    slug: "tsu",
    termo: "TSU",
    definicao:
      "Taxa Social Única: a contribuição para a Segurança Social. O trabalhador paga 11 % (visível no recibo); a empresa paga 23,75 % (invisível). O custo real do teu salário é o bruto mais 23,75 %.",
  },
  {
    slug: "isp",
    termo: "ISP",
    definicao:
      "Imposto sobre os Produtos Petrolíferos e Energéticos: valor fixo em cêntimos por litro de combustível, definido por portaria e revisto com frequência. Por cima ainda se cobra IVA — imposto sobre imposto.",
  },
  {
    slug: "iva",
    termo: "IVA",
    definicao:
      "Imposto sobre o Valor Acrescentado: incluído em quase todos os preços, em três taxas no continente — 6 % (bens essenciais), 13 % (restauração, por exemplo) e 23 % (taxa normal).",
  },
  {
    slug: "certificados-aforro",
    termo: "Certificados de Aforro",
    definicao:
      "Dívida pública para poupança das famílias, emitida pelo Estado via IGCP. Capital garantido, taxa variável ligada à Euribor 3M (Série F, limitada a 2,5 %), juros trimestrais e prémios que crescem com o tempo de permanência.",
  },
  {
    slug: "taxa-real",
    termo: "Taxa real vs nominal",
    definicao:
      "A taxa nominal é a que o banco anuncia; a real desconta impostos e inflação. Um depósito a 1,5 % com inflação a 3 % tem taxa real negativa — perdes poder de compra sem o saldo descer.",
  },
  {
    slug: "retencao-capitais",
    termo: "Imposto sobre capitais (28 %)",
    definicao:
      "Os juros de depósitos e certificados pagam uma retenção liberatória de 28 % — descontada automaticamente antes de receberes. Quando a taxa anunciada é 2,5 %, a que chega à conta é 1,8 %.",
  },
];
