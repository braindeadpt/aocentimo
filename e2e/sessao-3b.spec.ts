import { test, expect } from "@playwright/test";

// 3B — «O que pagas»: /impostos, /precos, /inflacao no template
// <Pagina> de três níveis. Contratos verificados aqui:
//  · três níveis como landmarks; os detalhes do nível 3 nascem fechados
//  · a resposta está no HTML sem JS (frase com o número + o valor do
//    instrumento: pontos do campo, dígitos do odómetro, herói)
//  · zero pageerror em cada rota
//  · a «pergunta seguinte» liga à rota certa

const ROTAS: {
  path: string;
  pergunta: RegExp;
  seguinte: { href: string; rotulo: RegExp };
}[] = [
  {
    path: "/impostos",
    pergunta: /quanto do que compras é imposto/i,
    seguinte: { href: "/precos", rotulo: /encher o depósito/i },
  },
  {
    path: "/precos",
    pergunta: /quanto custa encher o depósito/i,
    seguinte: { href: "/inflacao", rotulo: /quanto mais caro/i },
  },
  {
    path: "/inflacao",
    pergunta: /quanto mais caro está o que compras/i,
    seguinte: { href: "/credito", rotulo: /dinheiro emprestado/i },
  },
];

for (const r of ROTAS) {
  test(`${r.path}: três níveis, detalhes fechados, pergunta seguinte`, async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    await page.goto(r.path);

    // h1 único = a pergunta; a frase da resposta tem um número
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toContainText(r.pergunta);
    await expect(page.locator(".pg-frase")).toContainText(/\d/);

    // três landmarks de nível; o nível 3 é todo <details> fechado
    await expect(page.locator(".pg-nivel")).toHaveCount(3);
    const detalhes = page.locator(".pg-detalhe");
    expect(await detalhes.count()).toBeGreaterThan(0);
    await expect(page.locator(".pg-detalhe[open]")).toHaveCount(0);

    // a pergunta seguinte — o link do voo
    const seg = page.locator(".pg-seguinte-lnk");
    await expect(seg).toHaveAttribute("href", r.seguinte.href);
    await expect(seg).toContainText(r.seguinte.rotulo);

    expect(erros, `${r.path} disparou pageerror`).toEqual([]);
  });
}

test("sem JS: a resposta de cada rota está no HTML servido", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();

  // /impostos — os 100 pontos do euro do cabaz + o equivalente textual
  await page.goto("/impostos");
  const campo = page.locator(".cc").first();
  await expect(campo.locator("[data-cc-equivalente]")).toHaveCount(1);
  await expect(campo.locator("[data-cc-equivalente]")).toContainText(
    /cabaz de exemplo/i
  );
  expect(await campo.locator("svg.cc-svg circle").count()).toBe(100);
  // o isométrico do litro: a lista-equivalente com IVA sobre ISP
  await expect(page.locator(".iso-lista li").first()).toBeVisible();
  await expect(page.locator(".iso-lista")).toContainText(/IVA/);
  // o talão editável declara o resumo de IVA por taxa
  // (há dois talões na página — o das compras é o que tem o resumo)
  await expect(
    page.locator(".talao", { hasText: /resumo iva/i })
  ).toBeVisible();

  // /precos — o odómetro da bomba serve o valor final
  await page.goto("/precos");
  await expect(page.locator(".num-hero")).toContainText(/€/);
  await expect(page.locator(".pg-frase")).toContainText(/50 litros/i);

  // /inflacao — o herói da máquina do tempo serve o valor final
  await page.goto("/inflacao");
  await expect(page.locator(".num-hero")).toContainText(/€/);
  await expect(page.locator(".pg-frase")).toContainText(/%/);
  // o haltere das 12 divisões está no HTML
  await expect(page.locator(".hal-linha")).toHaveCount(12);

  await ctx.close();
});

test("/inflacao: régua de anos da máquina do tempo funciona", async ({
  page,
}) => {
  await page.goto("/inflacao");
  const regua = page.getByRole("slider", { name: /ano de partida/i });
  await expect(regua).toBeVisible();
  const max = await regua.getAttribute("max");
  await regua.focus();
  await page.keyboard.press("End");
  // a máquina responde: a frase passa a ler o ano do extremo da grelha
  await expect(page.locator(".pg-instrumento")).toContainText(
    new RegExp(`janeiro de ${max}`)
  );
});
