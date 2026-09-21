import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "fs";

// o domínio declarado em public/CNAME é a fonte de verdade do deploy —
// se divergir do canonical gerado, o SEO aponta para um domínio que
// não serve o site (defeito real que já aconteceu)
const HOST = readFileSync("public/CNAME", "utf8").trim().toLowerCase();

/**
 * Lista de rotas derivada, nunca escrita à mão: o sitemap é gerado do
 * conteúdo (expande rotas dinâmicas como /aprender/[slug]) e os .html
 * exportados cobrem as páginas fora do sitemap (ex.: /estilo). Qualquer
 * rota nova nasce coberta por todos os testes abaixo.
 */
function rotasDoSite(): string[] {
  const deSitemap = [
    ...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((m) => new URL(m[1]).pathname);
  const deHtml = readdirSync("out", { recursive: true })
    .filter((f): f is string => typeof f === "string" && f.endsWith(".html"))
    .map((f) => f.replace(/\\/g, "/").replace(/\.html$/, ""))
    .filter((f) => !f.startsWith("_") && f !== "404")
    .map((p) => (p === "index" ? "/" : `/${p}`));
  return [...new Set([...deSitemap, ...deHtml])].sort();
}

test("home renderiza com os números-chave", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/para onde vai o teu dinheiro/i);
  await expect(page.locator("#painel-titulo")).toContainText(
    /leituras oficiais/i
  );

  // C-01: o painel é a primeira dobra — o equivalente sr-only traz
  // todas as leituras com valor e período já no HTML SSR
  const linhas = page.locator(
    'section[aria-labelledby="painel-titulo"] table tbody tr'
  );
  expect(await linhas.count()).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < (await linhas.count()); i++) {
    const celulas = linhas.nth(i).locator("td");
    await expect(celulas.nth(0)).toContainText(/\d/); // valor
    await expect(celulas.nth(2)).toContainText(/\d{4}/); // período
  }

  // C-03: a lista «o teu euro» é o equivalente sempre visível —
  // 5 passos com valor em cêntimos já no HTML SSR
  const passos = page.locator("[data-euro-lista] > li");
  await expect(passos).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await expect(passos.nth(i)).toContainText(/\d+,\d\s*c/);
  }
});

test("a leitura da inflação chega no HTML sem JS", async ({ request }) => {
  // C-03: o «herói» da home é o Mostrador de inflação do painel —
  // o valor tem de nascer no SSR, nunca à espera de hidratação
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/INFLA[CÇ][AÃ]O[\s\S]{0,500}?\d+,\d+\s*%/i);
});

test("o storytelling em reduced-motion é uma lista com 5 passos e valores", async ({
  page,
}) => {
  // C-03: reduced-motion salta a cena pinned — fica a lista estática
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const lista = page.locator("[data-euro-lista]");
  await expect(lista).toBeVisible();
  const passos = lista.locator("> li");
  await expect(passos).toHaveCount(5);
  await expect(passos.first()).toContainText(/Segurança Social/);
  await expect(passos.last()).toContainText(/\d+,\d\s*c/);
  // a cena svg está aria-hidden e não fica pinned/visível em reduced-motion
  await expect(page.locator(".euro-moeda")).toBeHidden();
});

test("expandir um instrumento mostra a Linha com equivalente e fecha com Escape", async ({
  page,
}) => {
  await page.goto("/");
  // C-02: o rótulo é um botão aria-expanded; o expandido traz a Linha
  // completa (svg aria-hidden + a sua tabela equivalente), o selector
  // de período e o link «página →»
  await page.getByRole("button", { name: /Euribor 12M/ }).click();
  const exp = page.locator("#exp-euribor-12m-mensal");
  await expect(exp).toBeVisible();
  await expect(exp.locator("svg[data-viz]")).toBeVisible();
  await expect(exp.locator("table")).toBeAttached();
  await expect(exp.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(exp.getByText("página →")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#exp-euribor-12m-mensal")).toHaveCount(0);
});

test("calculadora de salário produz resultado", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").fill("1500");
  await expect(page.getByText("Líquido anual")).toBeVisible();
  await expect(page.getByText("Taxa marginal")).toBeVisible();
});

test("o talão do salário carimba o domínio canónico", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").fill("1500");
  const texto = (await page.locator("body").innerText()).toLowerCase();
  expect(texto).toContain(HOST);
});

test("a lista de rotas deriva do conteúdo", () => {
  const rotas = rotasDoSite();
  expect(rotas).toContain("/estilo");
  expect(rotas).toContain("/");
  expect(
    rotas.some((r) => r.startsWith("/aprender/") && r !== "/aprender"),
    "o sitemap expande /aprender/[slug]"
  ).toBe(true);
});

test("todas as rotas respondem", async ({ page }) => {
  for (const path of rotasDoSite()) {
    const res = await page.goto(path);
    expect(res?.status(), `${path} deve responder 200`).toBe(200);
  }
});

test("simuladores novos produzem resultado", async ({ page }) => {
  await page.goto("/casa");
  await expect(page.getByText("Custa mesmo")).toBeVisible();

  await page.goto("/irs");
  await expect(page.getByText("Poupança por ano")).toBeVisible();

  await page.goto("/trabalho");
  await page.getByLabel("A tua idade").fill("35");
  await expect(page.getByText("Declaração de desemprego")).toBeVisible();
});

test("nenhuma rota transborda na horizontal a 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of [...rotasDoSite(), "/rota-que-nao-existe"]) {
    await page.goto(path);
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(excesso, `${path} tem overflow horizontal`).toBeLessThanOrEqual(1);
  }
});

test("nenhuma página mostra undefined, NaN ou Invalid Date", async ({ page }) => {
  const proibidas = ["undefined", "NaN", "Invalid Date"];
  for (const path of rotasDoSite()) {
    await page.goto(path);
    const texto = await page.locator("body").innerText();
    for (const s of proibidas) {
      expect(texto, `${path} mostra "${s}" no texto visível`).not.toContain(s);
    }
  }
});

test("canonical de cada página bate certo com o CNAME", async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of rotasDoSite()) {
    // o canonical está no HTML inicial — domcontentloaded chega e torna
    // o ciclo de ~38 rotas rápido o suficiente para o timeout
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const canon = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canon?.toLowerCase(), `${path}`).toBe(
      `https://${HOST}${path === "/" ? "" : path}`
    );
  }
});

/** Avaliador AA partilhado: mede contraste real de todo o texto.
 *  O fundo de texto SVG resolve-se por geometria (isPointInFill no
 *  espaço do SVG via getScreenCTM) — o papel é um <path> com
 *  pointer-events:none, invisível a elementsFromPoint. Fills
 *  transparentes (zona de hover) e formas em defs/mask/clipPath não
 *  contam. */
const AA_EVAL = `(() => {
  const srgb = (v) => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const lum = (rgb) => 0.2126*srgb(rgb[0]) + 0.7152*srgb(rgb[1]) + 0.0722*srgb(rgb[2]);
  const parse = (s) => {
    s = s.trim();
    if (s.startsWith("#")) { const h = s.slice(1); return [0,2,4].map(i => parseInt(h.substr(i,2), 16)); }
    const m = (s.match(/[\\d.]+/g) ?? []).slice(0,3).map(Number);
    return s.startsWith("color(") ? m.map(v=>v*255) : m;
  };
  const fundoDe = (el) => {
    if (el.namespaceURI?.includes("svg")) {
      const r = el.getBoundingClientRect();
      const svg = el.ownerSVGElement;
      const ctm = svg?.getScreenCTM();
      if (svg && ctm) {
        const pt = new DOMPoint(r.x + r.width/2, r.y + r.height/2).matrixTransform(ctm.inverse());
        for (const s of svg.querySelectorAll("path,rect,circle,polygon")) {
          if (s.closest("defs,mask,clipPath")) continue;
          const f = getComputedStyle(s).fill;
          if (!f || f === "none" || f.startsWith("url(")) continue;
          const am = f.match(/[\\d.]+/g);
          if (am && am.length >= 4 && Number(am[3]) < 0.5) continue;
          try { if (s.isPointInFill(pt)) return parse(f); } catch {}
        }
      }
    }
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n).backgroundColor;
      const m = cs.match(/[\\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) === 1)) return parse(cs);
    }
    return parse(getComputedStyle(document.body).backgroundColor);
  };
  const falhas = [];
  for (const el of document.body.querySelectorAll("*")) {
    const temTexto = [...el.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? "").trim());
    if (!temTexto) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const frente = parse(el.namespaceURI?.includes("svg") ? cs.fill : cs.color);
    const fundo = fundoDe(el);
    const L1 = lum(frente), L2 = lum(fundo);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
    const min = grande ? 3 : 4.5;
    if (ratio < min) falhas.push(el.tagName.toLowerCase()+"."+String(el.className?.baseVal ?? el.className ?? "").slice(0,30)+" \\""+(el.textContent??"").trim().slice(0,36)+"\\" → "+ratio.toFixed(2)+":1");
  }
  return falhas.slice(0, 8);
})()`;

test("todas as rotas cumprem contraste AA nos dois temas", async ({
  page,
}) => {
  test.setTimeout(240_000);
  // reduced-motion desliga a transição de cor do body — sem ela a medição
  // apanhava valores intermédios da animação de troca de tema
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of rotasDoSite()) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    for (const tema of ["light", "dark"]) {
      await page.evaluate(
        (t) => (document.documentElement.dataset.theme = t),
        tema
      );
      const falhas = await page.evaluate(AA_EVAL);
      expect(falhas, `${path} [${tema}]`).toEqual([]);
    }
  }
});

test("com reduced-motion nenhuma rota tem animação nem transição activa", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // contrato M-02: estado final imediato — animation-name:none e
  // transition-duration:0 em TODO o elemento, em todas as rotas
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of rotasDoSite()) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const violadores = await page.evaluate(() => {
      const vistos: string[] = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const cs = getComputedStyle(el);
        const anima = cs.animationName !== "none";
        const transita = cs.transitionDuration
          .split(",")
          .some((d) => parseFloat(d) > 0);
        if (anima || transita) {
          vistos.push(
            `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") ?? "").slice(0, 40)} ` +
              `animation=${cs.animationName} transition=${cs.transitionDuration}`
          );
        }
      }
      return vistos.slice(0, 8);
    });
    expect(violadores, `${path} anima com reduced-motion`).toEqual([]);
  }
});

test("com reduced-motion o número-herói mostra o valor final sem interpolação", async ({
  page,
}) => {
  // contrato M-03: mudar o input com reduce → o herói mostra já o valor
  // final — nunca um intermédio nem um zero
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/salario");
  // o número-herói de /salario é o líquido impresso no talão
  const hero = page.locator(".talao-cut dd").first();
  await page.locator("#bruto").fill("2000");
  // imediatamente depois do input: o texto é já o valor final — e fica
  // estável; com interpolação, uma segunda leitura passados 700ms
  // (> --dur-media) mostraria outro número
  const texto = await hero.innerText();
  expect(texto).toMatch(/\d/);
  expect(texto).not.toContain("0,00");
  await page.waitForTimeout(700);
  expect(await hero.innerText()).toBe(texto);
});

test("nada acima da dobra entra com animação ao carregar", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // contrato M-09: animações de ENTRADA (iterações finitas) não podem
  // correr em elementos visíveis no primeiro viewport ao carregar.
  // Loops contínuos (ticker) têm iterações infinitas e não são entrada.
  for (const path of rotasDoSite()) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    // duas amostras: apanha entradas curtas e longas a meio do voo
    for (const espera of [120, 420]) {
      await page.waitForTimeout(espera);
      const violadores = await page.evaluate(() => {
        const vh = window.innerHeight;
        const vistos: string[] = [];
        for (const el of Array.from(document.querySelectorAll("*"))) {
          const r = el.getBoundingClientRect();
          if (r.top >= vh || r.bottom <= 0) continue;
          const finita = el
            .getAnimations()
            .some(
              (a) =>
                a.playState === "running" &&
                Number(a.effect?.getComputedTiming().iterations ?? 1) === 1
            );
          if (finita) {
            vistos.push(
              `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") ?? "").slice(0, 50)}`
            );
          }
        }
        return vistos.slice(0, 8);
      });
      expect(violadores, `${path} anima acima da dobra ao carregar`).toEqual(
        []
      );
    }
  }
});

test("o primeiro Tab foca o skip-link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focado = page.locator(":focus");
  await expect(focado).toHaveClass(/skip-link/);
  await expect(focado).toHaveAttribute("href", "#conteudo");
});

test("a fita do salário interroga-se por teclado e tem equivalente textual", async ({
  page,
}) => {
  // M-05/M-10: reduced-motion → a fita nasce já no estado final, sem
  // destaques — leitura determinística
  // C-03: a fita saiu da home — vive agora em /salario (variante compacta)
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/salario");
  const zona = page.locator(".fita-compacta").first();

  // o desenho é decorativo; a viagem do euro existe em texto
  await expect(zona.locator("svg").first()).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  const tabela = zona.locator("table");
  await expect(tabela.locator("caption")).toContainText("A fita do salário");
  await expect(tabela).toContainText("Total para o Estado");

  // leitura por omissão: o resumo empresa → tu
  const readout = zona.locator(".chart-readout");
  const titulo = readout.locator(".chart-readout-t");
  const valor = readout.locator(".chart-readout-v");
  await expect(titulo).toContainText("A empresa paga");
  await expect(valor).toContainText("Tu");

  // a régua percorre as 7 paradas: End → Estado, Home → empresa,
  // setas andam parada a parada
  const scrub = zona.locator(".chart-scrub");
  await scrub.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(titulo).toContainText("Tu");
  await expect(valor).toContainText("do custo");
  await page.keyboard.press("ArrowLeft");
  await expect(titulo).toContainText("Seg. Social");
  await page.keyboard.press("Home");
  await expect(titulo).toContainText("A empresa paga");
  await expect(valor).toContainText("do custo");
  await page.keyboard.press("End");
  await expect(titulo).toContainText("Estado leva");
  await page.keyboard.press("Escape");
  await expect(valor).toContainText("Tu");

  // os links de capítulo do antigo Fluxo continuam cá
  await expect(zona.getByRole("link", { name: /o que o Estado leva/ })).toHaveAttribute(
    "href",
    "/impostos"
  );
  await expect(zona.getByRole("link", { name: /o teu recibo/ })).toHaveAttribute(
    "href",
    "/salario"
  );
});

test("cada gráfico tem exactamente um equivalente textual alcançável", async ({
  page,
}) => {
  test.setTimeout(180_000);
  // contrato M-05/M-20(h): svg de dados é aria-hidden com irmão textual
  // (.sr-only/tabela/dl/readout) OU role="img" com aria-label — nunca os
  // dois (anúncio duplo), nunca nenhum (gráfico mudo)
  for (const path of rotasDoSite()) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const problemas = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll("svg").forEach((s) => {
        const nome = s.getAttribute("class")?.toString().slice(0, 30) ?? "svg";
        const hidden =
          s.getAttribute("aria-hidden") === "true" ||
          !!s.closest("[aria-hidden='true']");
        const rotulo = s.getAttribute("aria-label");
        const eImg = s.getAttribute("role") === "img";
        if (eImg) {
          if (!rotulo?.trim()) bad.push(`${nome}: role=img sem aria-label`);
          if (hidden) bad.push(`${nome}: nomeado mas escondido — dupla`);
          return;
        }
        if (!hidden) {
          // logo e ícones pequenos podem ser decorativos inline — mas têm
          // de estar dentro de um contexto aria-hidden ou ter nome
          const dentroDeNomeado = s.closest("a[aria-label], button[aria-label], [role='img']");
          if (!dentroDeNomeado && !rotulo)
            bad.push(`${nome}: svg exposto sem nome nem contexto`);
          return;
        }
        // svg escondido E grande = provável gráfico → um ancestral tem
        // de trazer o equivalente textual (.sr-only/tabela/dl/readout
        // ou prosa — os demos do /estilo descrevem-se em texto)
        const largo = s.getBoundingClientRect().width > 100;
        if (!largo) return;
        let tem = false;
        for (let n = s.parentElement; n && n !== document.body; n = n.parentElement) {
          if (n.querySelector(".sr-only, table, dl, .chart-readout")) { tem = true; break; }
          if (n instanceof HTMLElement && n.innerText.trim().length > 20) { tem = true; break; }
        }
        if (!tem) bad.push(`${nome}: gráfico escondido sem equivalente`);
      });
      return bad.slice(0, 6);
    });
    expect(problemas, `${path}`).toEqual([]);
  }
});

test("o número herói de cada simulador chega no HTML sem JS", async ({
  request,
}) => {
  // contrato M-03/M-20(i): o herói nasce no SSR com o valor final —
  // nunca "0,00" nem vazio à espera de hidratação
  for (const path of [
    "/salario",
    "/impostos",
    "/casa",
    "/credito",
    "/poupanca",
    "/irs",
    "/trabalho",
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    const html = await res.text();
    const hero = html.match(/num-hero[^"]*"[^>]*>(.{0,400})/s)?.[1] ?? "";
    const texto = hero.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(texto, `${path}: herói vazio no HTML`).toMatch(/\d/);
    expect(texto, `${path}: herói em zero à espera de JS`).not.toMatch(
      /^[\s0,.\-—€%]+$/
    );
  }
});

test("painéis de dados, API e feed servem", async ({ page }) => {
  await page.goto("/dados");
  await expect(page.getByText("Euribor — médias mensais")).toBeVisible();
  await expect(page.getByText("Calendário fiscal 2026")).toBeVisible();

  await page.goto("/precos");
  await expect(page.getByText("Preço médio nacional, por litro")).toBeVisible();
  await expect(page.getByText("Gasóleo simples").first()).toBeVisible();

  const api = await page.goto("/api/index.json");
  expect(api?.status()).toBe(200);
  const feed = await page.goto("/feed.xml");
  expect(feed?.status()).toBe(200);
});

/** D — cada página nova tem a sua figura presente e UM equivalente
 *  textual (tabela/dl em .sr-only, ou role=img+aria-label nos
 *  instrumentos de número único). */
const equivUnico = ".sr-only:has(table), .sr-only:has(dl), table.sr-only, dl.sr-only";

test("D-01 · /inflacao mostra as 12 divisões ECOICOP com equivalente único", async ({
  page,
}) => {
  await page.goto("/inflacao");
  const fig = page.locator("figure", {
    hasText: "As 12 divisões do cabaz",
  });
  await expect(fig.locator("svg[data-viz]").first()).toBeAttached();
  await expect(fig.locator(equivUnico)).toHaveCount(1);
  // 12 múltiplos com rótulo próprio (o nome repete-se no dl sr-only)
  await expect(fig.getByText("Transportes").first()).toBeVisible();
});

test("D-02 · /credito mostra o mostrador Euribor 12M e a Linha das quatro", async ({
  page,
}) => {
  await page.goto("/credito");
  // Mostrador: número único — o próprio svg é o nomeado (sem equivalente extra)
  await expect(
    page.locator('svg[role="img"][aria-label*="Euribor 12M"]')
  ).toBeAttached();
  const fig = page.locator("figure", {
    hasText: "As quatro Euribor desde 1994",
  });
  await expect(fig.locator("svg[data-viz]")).toBeAttached();
  await expect(fig.locator(equivUnico)).toHaveCount(1);
  await expect(fig.getByText("Euribor 12M").first()).toBeVisible();
});

test("D-02 · /casa mostra a frase-conclusão e aponta para /habitacao", async ({
  page,
}) => {
  await page.goto("/casa");
  // D-04: o declive vive em /habitacao; /casa fica com a conclusão
  await expect(
    page.getByText(/a casa subiu \d+,\d× mais/)
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /ver a evolução completa em Habitação/ })
  ).toHaveAttribute("href", "/habitacao");
});

test("D-04 · /emprego mostra a linha PT vs UE27 com equivalente único", async ({
  page,
}) => {
  await page.goto("/emprego");
  const fig = page.locator("figure", {
    hasText: "Desemprego — Portugal e a UE27",
  });
  await expect(fig.locator("svg[data-viz]")).toBeAttached();
  await expect(fig.locator(equivUnico)).toHaveCount(1);
  await expect(
    page.locator('svg[role="img"][aria-label*="Desemprego jovem"]')
  ).toBeAttached();
});

test("D-04 · /habitacao mostra o declive casa-vs-salário com equivalente único", async ({
  page,
}) => {
  await page.goto("/habitacao");
  const fig = page.locator("figure", {
    hasText: "A casa contra o salário",
  });
  await expect(fig.locator("svg[data-viz]")).toBeAttached();
  await expect(fig.locator(equivUnico)).toHaveCount(1);
  await expect(
    fig.getByText(/a casa subiu \d+,\d× mais/)
  ).toBeVisible();
});

test("D-04 · /economia mostra as barras do PIB e os quatro múltiplos", async ({
  page,
}) => {
  await page.goto("/economia");
  const pib = page.locator("figure", {
    hasText: "PIB — variação homóloga trimestral",
  });
  await expect(pib.locator("svg[data-viz]")).toBeAttached();
  await expect(pib.locator(equivUnico)).toHaveCount(1);
  const multi = page.locator("figure", {
    hasText: "O país em quatro linhas",
  });
  await expect(multi.locator("svg[data-viz]")).toHaveCount(4);
  await expect(multi.locator(equivUnico)).toHaveCount(1);
});

test("D-03 · /precos mostra os calendários com equivalente mensal único", async ({
  page,
}) => {
  await page.goto("/precos");
  for (const titulo of ["Gasóleo, dia a dia", "Gasolina 95, dia a dia"]) {
    const fig = page.locator("figure", { hasText: titulo });
    await expect(fig.locator("svg[data-viz]").first()).toBeAttached();
    await expect(fig.locator(equivUnico)).toHaveCount(1);
    // nota ISP datada por baixo do mapa
    await expect(
      fig.getByText(/Desconto extraordinário do ISP/)
    ).toBeVisible();
    // o equivalente é mensal e diz que é média
    await expect(fig.locator(".sr-only table")).toContainText(/média/);
  }
});
