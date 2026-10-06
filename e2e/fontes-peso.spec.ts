import { test, expect, type Page } from "@playwright/test";

/**
 * P4 — as fontes são subconjuntos, e isso não se pode notar.
 *
 * O `next/font/google` servia o Archivo variable com o eixo `wdth`
 * inteiro (62%–125%) e o latin completo: 160,8 KB em todas as rotas,
 * pagos por 1000+ glifos e por larguras que o site nunca pedia. Agora
 * são três instâncias do Archivo — o mesmo desenho com o eixo fixado em
 * 100%, 125% e 116% — subconjuntadas para os caracteres que o browser
 * pinta, mais o Caveat nos pesos 600 e 700.
 *
 * Cada instância custou um defeito que só uma prova apanha, e é por isso
 * que este spec prova quatro coisas em vez de uma:
 *
 *   1. a REDE — cada rota pede as instâncias que usa, e nenhuma outra.
 *      Um subconjunto mal feito dá «texto com o mesmo aspecto»; o que
 *      esta redução veio apagar foi pedir ficheiros que a rota não usa.
 *   2. o GLIFO — cada carácter pintado é coberto pela webfont. É o
 *      teste que apanha um subconjunto em falta, e é o único que pode
 *      apanhar: o browser não avisa quando um glifo falta, desenha o
 *      fallback, e a página fica com duas letras misturadas sem ninguém
 *      dar por isso. `computedStyle.fontFamily` não serve para isto —
 *      diz a família pedida, não a usada — por isso a prova é o
 *      `document.fonts.check`, que responde por carácter. E a pergunta
 *      tem de ser feita com o peso e o estilo do nó: o browser escolhe
 *      a face por esses, e perguntar a 400 um texto que é a 700 dá
 *      «não cobre» para um glifo que a face tem.
 *   3. o DESLOCAMENTO — o CLS que o próprio browser mede tem de ser 0
 *      enquanto as fontes carregam. Trocar o eixo por instâncias fixas
 *      só é uma redução honesta se o texto não saltar; é isto que prova.
 *   4. a LARGURA — os títulos que dependem da largura medem o valor do
 *      contrato. São as medidas feitas no browser que geraram estas
 *      instâncias; se o ficheiro de fonte mudar, o número deixa de
 *      bater e o teste diz.
 */

/** As instâncias que o site consome, por nome de ficheiro. */
const BASE = /Archivo_base/;
const LARGA = /Archivo_larga/;
const INTRO = /Archivo-intro/;   // vive em public/, com o preload escrito à mao

/** Nenhum ficheiro de fonte fora destas cinco. */
const CONTRATO =
  /Archivo_base|Archivo_larga|Archivo-intro|Caveat_600|Caveat_700/;

/** A monoespaçada é do SISTEMA, por contrato (--font-mono). */
const DO_SISTEMA =
  /^(ui-monospace|SFMono|Menlo|Monaco|Consolas|Liberation Mono|Courier New|cursive|Comic Sans)/i;

/** As rotas que o spec abre: a home, o chrome, uma de dados, uma editorial. */
const ROTAS = ["/", "/estilo", "/salario", "/dados"] as const;

/**
 * O contrato de largura, medido no browser a 1440 e a 390 com a fonte
 * carregada, contra o build de antes (o do `next/font/google`). São
 * estas medidas que geraram as instâncias — o título da intro da home,
 * por exemplo, é o que obriga a instância de 116%, e não a de 125%:
 * a 125% a frase quebrava em duas linhas.
 *
 * A tolerância é de 2 %, com um mínimo de 2 px. Contra o `main` a
 * diferença medida é de 0,00 px (o título de página, exacto) a 0,12 px
 * (o título da intro) — mas o número não é portátil ao milésimo: no
 * runner da CI o mesmo título mede 715,02 px contra os 713,89 px medidos
 * aqui, e a diferença é do rasterizador, não do ficheiro. 2 % é largo
 * para o que é ruído e estreito para o que é um erro: com a instância
 * errada (125 % em vez de 116 %) o título da intro erra 7,7 %, e com a
 * base erraria 12 %.
 */
const LARGURAS = [
  { rota: "/", sel: ".b-intro h1", texto: "O dinheiro explicado", w1440: 713.89, w390: 176.91 },
  { rota: "/", sel: ".b-intro h1 span", texto: "ao cêntimo.", w1440: 413.27, w390: 206.64 },
  { rota: "/estilo", sel: "h1.titulo-pagina", texto: "Contrato visual", w1440: 759.3, w390: 224.61 },
] as const;

/** Os ficheiros de fonte que o browser descarregou nesta navegação. */
function pedidosDeFonte(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (r) => {
    if (/\.woff2?($|\?)/i.test(r.url()))
      urls.push(r.url().split("/").pop() || "");
  });
  return urls;
}

/** Espera que as fontes assentem antes de medir seja o quê. */
async function assentar(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

/** A largura do NÓ DE TEXTO que contém a frase, não a do elemento. */
async function larguraDoTexto(page: Page, sel: string, texto: string) {
  return page.evaluate(
    ([cSel, cTexto]) => {
      const el = document.querySelector(cSel as string);
      if (!el) return null;
      const andar = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let no: Node | null;
      while ((no = andar.nextNode())) {
        if (!(no.textContent || "").includes(cTexto as string)) continue;
        const r = document.createRange();
        r.selectNodeContents(no);
        const b = r.getBoundingClientRect();
        if (b.width > 0) return b.width;
      }
      return null;
    },
    [sel, texto] as [string, string],
  );
}

// 1 · a rede — cada rota pede o que usa, e nada mais
test("cada rota pede só as instâncias de fonte que usa", async ({ browser }) => {
  for (const rota of ROTAS) {
    // Um contexto por rota, e não uma página reaproveitada: o browser
    // guarda em memória o que já descarregou, e o evento de pedido
    // dispara também para o que serve do cache. Reaproveitando a
    // página, a segunda rota «pedia» a instância da intro — que já
    // tinha vindo da home — e a medição mentia.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const pedidos = pedidosDeFonte(page);
    await page.goto(rota, { waitUntil: "networkidle" });
    const nomes = [...new Set(pedidos)];

    expect(nomes.length, `${rota} não pediu fonte nenhuma`).toBeGreaterThan(0);
    for (const n of nomes) {
      expect(n, `${rota} pediu um ficheiro fora do contrato: ${n}`).toMatch(
        CONTRATO,
      );
    }

    // a base é o corpo do site: está em todas as rotas
    expect(
      nomes.some((n) => BASE.test(n)),
      `${rota} não pediu a instância base do Archivo`,
    ).toBe(true);

    // a larga é a dos títulos: está em todas as rotas
    expect(
      nomes.some((n) => LARGA.test(n)),
      `${rota} não pediu a instância larga do Archivo`,
    ).toBe(true);

    // a de 116% é só do título da intro; noutra rota seria banda gasta
    const temIntro = nomes.some((n) => INTRO.test(n));
    if (rota === "/") {
      expect(temIntro, "a home não pediu a instância do título da intro").toBe(
        true,
      );
    } else {
      expect(
        temIntro,
        `${rota} pediu a instância da intro, que só a home usa`,
      ).toBe(false);
    }

    await ctx.close();
  }
});

// 2 · o glifo — cada carácter pintado é coberto pela webfont
test("todo o texto da webfont é coberto pelo subconjunto", async ({ page }) => {
  for (const rota of ROTAS) {
    await page.goto(rota, { waitUntil: "networkidle" });
    await assentar(page);

    const faltas = await page.evaluate(() => {
      // A monoespaçada é do sistema, por contrato: --font-mono.
      const doSistema =
        /^(ui-monospace|SFMono|Menlo|Monaco|Consolas|Liberation Mono|Courier New|cursive|Comic Sans)/i;

      // carácter pintado -> a face que o CSS manda usar para ele. A
      // chave inclui o peso e o estilo porque é assim que o browser
      // escolhe a face: perguntar a peso 400 se o texto é a 700 daria
      // «não cobre» para um glifo que a face tem.
      const quer = new Map<string, string>();
      const andar = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      let no: Node | null;
      while ((no = andar.nextNode())) {
        const txt = no.textContent;
        if (!txt || !txt.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(no);
        if (!r.getBoundingClientRect().width) continue;
        const cs = getComputedStyle(no.parentElement!);
        const familia = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        const face = `${cs.fontStyle} ${cs.fontWeight} 100px "${familia}"`;
        for (const ch of txt) quer.set(ch, face);
      }

      const faltam: string[] = [];
      for (const [ch, face] of quer) {
        const familia = /`100px "([^"]+)"`/.exec(face)?.[1] || "";
        if (doSistema.test(familia) || !/^Archivo|^Caveat/.test(familia)) {
          continue;
        }
        // a pergunta é por carácter: esta face cobre este glifo?
        const codigo = (ch.codePointAt(0) ?? 0).toString(16).toUpperCase();
        if (!document.fonts.check(face, ch)) {
          faltam.push(`${face} não cobre U+${codigo} («${ch}»)`);
        }
      }
      return faltam;
    });

    expect(
      faltas.slice(0, 8),
      `${rota}: caracteres que caem no fallback (${faltas.length})`,
    ).toEqual([]);
  }
});

// 3 · o deslocamento — CLS zero enquanto as fontes carregam
test("o texto não desloca enquanto as fontes carregam (CLS = 0)", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) {
        const s = e as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (s.hadRecentInput) continue;
        w.__cls += s.value ?? 0;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  for (const rota of ROTAS) {
    await page.goto(rota, { waitUntil: "networkidle" });
    await assentar(page);

    const cls = await page.evaluate(
      () => (window as unknown as { __cls: number }).__cls,
    );
    expect(cls, `${rota}: houve deslocamento de layout (CLS ${cls})`).toBe(0);
  }
});

// 4 · a largura — os títulos medem o contrato, com a fonte carregada
test("os títulos medem a largura do contrato, com a fonte carregada", async ({
  page,
}) => {
  for (const vp of [
    { largura: 1440, chave: "w1440" as const },
    { largura: 390, chave: "w390" as const },
  ]) {
    await page.setViewportSize({ width: vp.largura, height: 900 });
    let rotaAtual = "";
    for (const caso of LARGURAS) {
      if (caso.rota !== rotaAtual) {
        await page.goto(caso.rota, { waitUntil: "networkidle" });
        await assentar(page);
        rotaAtual = caso.rota;
      }
      const medida = await larguraDoTexto(page, caso.sel, caso.texto);
      const esperado = caso[vp.chave];
      expect(
        medida,
        `${caso.rota} a ${vp.largura}: não encontrei «${caso.texto}»`,
      ).not.toBeNull();
      const tolerancia = Math.max(2, esperado * 0.02);
      expect(
        Math.abs((medida ?? 0) - esperado),
        `${caso.rota} a ${vp.largura}: «${caso.texto}» mede ${medida?.toFixed(2)} px, o contrato diz ${esperado} px (tolerância ${tolerancia.toFixed(2)} px)`,
      ).toBeLessThan(tolerancia);
    }
  }
});