import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { rotasDoSite } from "./rotas";

// o domínio declarado em public/CNAME é a fonte de verdade do deploy —
// se divergir do canonical gerado, o SEO aponta para um domínio que
// não serve o site (defeito real que já aconteceu)
const HOST = readFileSync("public/CNAME", "utf8").trim().toLowerCase();

test("home renderiza com os números-chave", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/para onde vai o teu dinheiro/i);
  await expect(
    page.getByRole("heading", { name: /leituras oficiais/i })
  ).toBeVisible();
  await expect(page.locator(".leitura").first()).toBeVisible();
});

test("calculadora de salário produz resultado", async ({ page }) => {
  await page.goto("/salario");
  // o bruto é régua (input range) — move-se por teclado, não por fill
  await page.getByLabel("Salário bruto mensal").focus();
  await page.keyboard.press("ArrowRight");
  // o talão prova o recibo no nível 2…
  await expect(page.getByText("Recibo de vencimento")).toBeVisible();
  // …e o ano inteiro e as taxas vivem no nível 3 — abrem-se os detalhes
  const ano = page.locator("details", { hasText: "O ano inteiro" });
  await ano.locator("summary").click();
  await expect(ano.getByText("Líquido anual")).toBeVisible();
  const taxas = page.locator("details", {
    hasText: "Taxa efetiva e taxa marginal",
  });
  await taxas.locator("summary").click();
  await expect(taxas.getByText(/a taxa do próximo euro/)).toBeVisible();
});

test("o talão do salário carimba o domínio canónico", async ({ page }) => {
  await page.goto("/salario");
  await page.getByLabel("Salário bruto mensal").focus();
  await page.keyboard.press("ArrowRight");
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
  test.setTimeout(120_000);
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
  // a idade é um contador físico (botões −/+), não um input de número
  await page.getByRole("button", { name: "A tua idade — mais" }).click();
  await expect(page.getByText("Declaração de desemprego")).toBeVisible();
});

test("nenhuma rota transborda na horizontal a 375 px", async ({ page }) => {
  test.setTimeout(120_000);
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
  // varredura de todas as rotas — mesmo tecto dos irmãos de varredura
  test.setTimeout(120_000);
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
  await page.locator("#bruto").focus();
  await page.keyboard.press("ArrowRight");
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

test("a explosão do euro interroga-se por teclado e tem equivalente textual", async ({
  page,
}) => {
  // R-06: a fita de papel saiu da home — a decomposição do euro é a
  // explosão isométrica. O svg é decorativo; o equivalente sempre
  // visível é a lista, que interroga as peças por foco de teclado.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cartao = page.locator(".iso-card").first();
  await expect(cartao).toBeVisible();

  // o desenho é decorativo; a viagem do euro existe em texto
  await expect(cartao.locator("svg").first()).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  const lista = cartao.locator("[data-euro-lista]");
  const passos = lista.locator("li");
  expect(await passos.count()).toBeGreaterThanOrEqual(4);
  await expect(lista).toContainText("Segurança Social");
  await expect(lista).toContainText("Fica-te");

  // R-07: os valores são euros reais do mês (salário de 1 500 €), já
  // não cêntimos por euro — cada passo mostra «N €» e nenhum «c»
  const textoLista = await lista.innerText();
  expect(textoLista).not.toMatch(/\d+,\d\s*c\b/);
  for (const li of await passos.all()) {
    await expect(li).toContainText(/\d[\d\s]*€/);
  }
  // plausíveis do cenário 1 500 €/mês (motores 2026): SS = 11 % ≈ 165 €,
  // líquido ≈ 1 167 € — intervalos, não números escritos à mão
  await expect(passos.nth(0)).toContainText(/1[5-7]\d\s*€/);
  await expect(lista).toContainText(/1\s?1[0-9]{2}\s*€/);

  // foco de teclado num passo realça a peça correspondente (e a sua
  // chamada — g.iso-camada.iso-camada-on / .iso-rotg.iso-camada-on); Tab anda
  // passo a passo
  await passos.nth(1).focus();
  await expect(passos.nth(1)).toHaveClass(/iso-li-on/);
  await expect(cartao.locator("g.iso-camada.iso-camada-on")).toHaveCount(1);
  await expect(cartao.locator("g.iso-rotg.iso-camada-on")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(passos.nth(2)).toHaveClass(/iso-li-on/);
  await expect(cartao.locator("g.iso-camada.iso-camada-on")).toHaveCount(1);

  // a ordem narrativa é pergunta → resposta: painel → adivinha →
  // explosão → capítulos — medido na posição real do documento
  const ordem = await page.evaluate(() => {
    const pos = (el: Element | null | undefined) =>
      el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
    const capitulos = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent?.includes("PERCURSO")
    );
    return {
      painel: pos(document.getElementById("painel-leituras")),
      adivinha: pos(document.getElementById("instrumento")),
      euro: pos(document.getElementById("euro-titulo")),
      capitulos: pos(capitulos),
    };
  });
  expect(ordem.painel).toBeLessThan(ordem.adivinha);
  expect(ordem.adivinha).toBeLessThan(ordem.euro);
  expect(ordem.euro).toBeLessThan(ordem.capitulos);
});

test("o custo em /salario é um campo de cêntimos e reage à régua", async ({
  page,
}) => {
  // 3A-01: a explosão isométrica saiu (não era proporcional) — o custo
  // total desenha-se no catálogo V4 como CampoCentimos «montes» (1
  // ponto = 1 cêntimo de cada euro que a empresa gasta): rótulos HTML
  // por parte + um equivalente textual único, sempre presente
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/salario");
  const campo = page.locator(".cc").first();
  await expect(campo).toBeVisible();
  await expect(campo.locator(".cc-rot-l")).toHaveCount(4);
  await expect(campo).toContainText("TSU");
  await expect(campo).toContainText("Chega à tua conta");

  const eq = campo.locator("[data-cc-equivalente]");
  await expect(eq).toContainText("De cada euro que a empresa gasta contigo");

  // a régua do bruto muda a repartição — o equivalente acompanha
  const antes = await eq.innerText();
  await page.locator("#bruto").focus();
  await page.keyboard.press("End"); // 6 000 € — repartição diferente
  await expect(eq).not.toHaveText(antes);
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
  // R-04a: cada combustível é um cartão Leitura (breadcrumb DGEG) —
  // o bloco «Preço médio nacional, por litro» virou 3 instrumentos
  await expect(page.locator(".leitura")).toHaveCount(3);
  await expect(page.getByText("Gasóleo simples").first()).toBeVisible();

  const api = await page.goto("/api/index.json");
  expect(api?.status()).toBe(200);
  const feed = await page.goto("/feed.xml");
  expect(feed?.status()).toBe(200);
});

test("o motor fiscal de /salario chega lazy — nunca no first-load", async ({
  page,
}) => {
  // DECISOES 2026-09-23: o first-load não inclui o motor; o primeiro
  // controlo fora do perfil canónico pede-o por import() dinâmico e o
  // recibo nunca fica em branco — mostra o último valor calculado
  const pedidos: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".js")) pedidos.push(r.url());
  });
  await page.goto("/salario", { waitUntil: "networkidle" });
  const hero = page.locator(".num-hero").first();
  const antes = await hero.innerText();
  expect(antes).toMatch(/\d/); // o canónico já lá está sem motor
  const nInicial = pedidos.length;

  // sai do perfil canónico — o motor chega num chunk novo; os
  // controlos são físicos (segmentado + contador), não select/input
  await page.getByRole("radio", { name: "Casado(a) · 2" }).click();
  await page.getByRole("button", { name: "Dependentes — mais" }).click();
  // enquanto carrega nunca fica em branco; depois recalcula de verdade
  await expect(hero).not.toHaveText(antes, { timeout: 10_000 });
  expect(pedidos.length).toBeGreaterThan(nInicial);
});
