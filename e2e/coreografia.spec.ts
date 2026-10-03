import { test, expect, type Page } from "@playwright/test";

// 1B-04 — coreografia. Dois contratos medidos em runtime:
//
//  A · a transição-assinatura: o link «a pergunta seguinte» do <Pagina>
//      morfa no h1 da página de destino. O nome pg-voo-<rota> só se
//      activa quando a navegação traz o tipo pg-voo — um next/link
//      normal para a MESMA rota não o pode disparar.
//  B · a pausa ambiente: o marquee do ticker, a rotação do orbe e o
//      canvas do CampoCentimos param fora do ecrã (IntersectionObserver)
//      e com o separador escondido (document.hidden + visibilitychange)
//      — nenhum fotograma fora da vista.

type Janela = Window & {
  __vt?: Set<string>;
  __vtParar?: () => void;
  __vtAmostras?: number;
};

/** Os três nomes que provam que a pergunta voou (o grupo partilhado,
    a imagem velha e a nova). */
const VOO = [
  "::view-transition-group(pg-voo)",
  "::view-transition-old(pg-voo)",
  "::view-transition-new(pg-voo)",
];

/** Espera a guarda de pausa do <OrbeEstado> ESTAR ARMADA.
 *
 *  A guarda nasce no `useEffect` do componente: o `IntersectionObserver`
 *  só é criado quando o React hidrata, e o primeiro relato do
 *  observador é assíncrono. Até essa altura o `animation-play-state`
 *  é «running» por OMISSÃO — o mesmo valor que teria se a pausa
 *  estivesse estragada. O teste que afirmava o estado antes desse
 *  momento media o atraso da hidratação, não o contrato: foi o que
 *  travou o deploy com «esperava "paused", recebeu "running"».
 *
 *  Por isso a espera é pela GUARDA (a classe que só o observador
 *  põe), não por um estado com relógio. O orçamento generoso cobre a
 *  hidratação de uma página de 21 000 px num runner carregado; se a
 *  guarda nunca armar, isto falha com uma mensagem que diz isso — e
 *  não com «a animação não pára», que seria mentira. */
async function guardaArmada(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document
              .querySelector("svg.orbe-a-recolher")
              ?.classList.contains("orbe-pausado") ?? false
        ),
      {
        timeout: 15_000,
        message: "a guarda de pausa do orbe não armou (hidratação ou IO)",
      }
    )
    .toBe(true);
}

/** Orçamento das medições de estado, já com a guarda armada. Não é
 *  um afrouxamento da asserção — os valores exigidos são os mesmos;
 *  é a paciência de quem não quer que o relógio do CI decida. */
const ORCAMENTO = { timeout: 10_000 } as const;

/** Instala um colector de pseudo-elementos de view-transition.
    Vive até ser parado à mão (`window.__vtParar()`), não 3,2 s: sob
    carga a navegação pode demorar 6 s e o colector expirava ANTES da
    transição começar — o teste lia um array vazio e acusava a animação
    de estar partida, quando o defeito era o relógio do teste. A tampa
    de segurança de 60 s evita um colector eterno. */
const COLETOR_VT = `(() => {
  window.__vt = new Set();
  window.__vtAmostras = 0;
  const fim = performance.now() + 60000;
  let vivo = true;
  window.__vtParar = () => { vivo = false; };
  const colhe = () => {
    window.__vtAmostras++;
    for (const a of document.getAnimations({ subtree: true })) {
      const pe = a.effect && a.effect.pseudoElement;
      if (pe) window.__vt.add(pe);
    }
  };
  // detecção DETERMINÍSTICA: no instante em que o browser cria as
  // fotografias da transição (o updateCallbackDone), os pseudo-
  // elementos do fotograma NOVO existem com certeza. A amostragem por
  // frame é a rede de segurança, não o mecanismo principal — sob carga
  // pode falhar uma janela e perder o voo inteiro.
  const dv = document;
  const orig = dv.startViewTransition;
  dv.startViewTransition = function (cb) {
    const t = orig.call(document, cb);
    t.updateCallbackDone.then(colhe, colhe);
    return t;
  };
  const loop = () => {
    if (!vivo) return;
    colhe();
    if (performance.now() < fim) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const t = setInterval(() => {
    if (!vivo || performance.now() >= fim) { vivo = false; clearInterval(t); }
    else colhe();
  }, 20);
})()`;

/** Lê o que o colector viu. */
const vistosVt = (page: Page) =>
  page.evaluate(() => [...((window as Janela).__vt ?? [])] as string[]);

/** Para o colector (para a página não ficar a amostrar até ao fim). */
async function pararColetor(page: Page) {
  await page.evaluate(() => (window as Janela).__vtParar?.());
}

/** Quantos dos três nomes do voo já apareceram. */
async function vistosDoVoo(page: Page) {
  const v = await vistosVt(page);
  return VOO.filter((n) => v.includes(n)).length;
}

/** Quantas rondas o colector já fez — prova que esteve VIVO durante a
    janela observada (numa asserção negativa, «não vi nada» só quer dizer
    algo se o olhar esteve aberto). */
async function amostrasDoColetor(page: Page) {
  return page.evaluate(() => (window as Janela).__vtAmostras ?? 0);
}

test("a pergunta seguinte morfa no h1 da página de destino", async ({
  page,
}) => {
  await page.goto("/estilo", { waitUntil: "networkidle" });
  const lnk = page.locator(".pg-seguinte-lnk").first();
  await lnk.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  await page.evaluate(COLETOR_VT);
  await lnk.click();
  await page.waitForURL("**/salario**");

  // a pergunta voou: o grupo partilhado existiu com velho e novo
  // (1D-02: o old corre pg-voo-fica — viaja opaco até ao h1)
  // espera-se pelo ESTADO (os três nomes vistos), não por 1,8 s de
  // relógio: sob carga a navegação passou dos 3,2 s do colector e o
  // voo acontecia depois de o teste já ter lido
  await expect
    .poll(() => vistosDoVoo(page), {
      timeout: 20_000,
      message:
        "a pergunta não voou: nenhum dos pseudo-elementos pg-voo apareceu",
    })
    .toBe(3);
  await pararColetor(page);
  const vistos = await vistosVt(page);
  expect(vistos).toContain("::view-transition-group(pg-voo)");
  expect(vistos).toContain("::view-transition-old(pg-voo)");
  expect(vistos).toContain("::view-transition-new(pg-voo)");
  // e o h1 chegou com o texto da pergunta de destino
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /quanto vais receber/i
  );
});

test("outros links para a mesma rota não disparam o voo", async ({
  page,
}) => {
  await page.goto("/estilo", { waitUntil: "networkidle" });
  // a nav é um next/link normal para /salario — sem o tipo pg-voo
  await page.locator("nav button").first().hover();
  await page.waitForTimeout(350);
  await page.evaluate(COLETOR_VT);
  await page.locator('nav a[href="/salario"]').first().click();
  await page.waitForURL("**/salario**");

  // asserção NEGATIVA: espera-se que o colector tenha observado a janela
  // toda antes de se concluir que não houve voo — um «não vi nada» lido
  // por um colector já expirado não prova nada. Conta-se as rondas de
  // observação (não milissegundos): sob carga a página observa menos e a
  // espera alonga-se sozinha.
  const antes = await amostrasDoColetor(page);
  await expect
    .poll(
      async () => (await amostrasDoColetor(page)) - antes,
      {
        timeout: 20_000,
        message: "o colector não observou a navegação — a negativa não prova nada",
      }
    )
    .toBeGreaterThanOrEqual(120);
  await pararColetor(page);

  const vistos = await vistosVt(page);
  expect(
    vistos.filter((p) => p.includes("pg-voo")),
    "navegação normal activou o nome do voo"
  ).toEqual([]);
});

test("o marquee do ticker pára fora do ecrã e retoma ao voltar", async ({
  page,
}) => {
  await page.goto("/dados", { waitUntil: "domcontentloaded" });
  const playState = () =>
    page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".ticker-track")!)
          .animationPlayState
    );

  await expect.poll(playState).toBe("running");

  // roda para o fim — a faixa sai do ecrã, o PausaAmbiente congela-a
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await expect.poll(playState, { timeout: 4000 }).toBe("paused");

  // volta — retoma
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" })
  );
  await expect.poll(playState, { timeout: 4000 }).toBe("running");
});

test("o orbe «a-recolher» pára fora do ecrã e com o separador escondido", async ({
  page,
}) => {
  await page.goto("/estilo", { waitUntil: "domcontentloaded" });
  const orbe = page.locator("svg.orbe-a-recolher").first();
  await expect(orbe).toBeAttached();
  const playState = () =>
    page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("svg.orbe-a-recolher .orbe-roda")!
        ).animationPlayState
    );

  // a guarda tem de estar armada antes de medir seja o que for: o
  // orbe NASCE fora do ecrã (esta página tem 21 000 px de altura), e
  // o primeiro relato do observador — «não intersecta» — é o que põe
  // a classe. Enquanto isso não acontece, «running» não distingue
  // «ainda não hidratou» de «a pausa está estragada».
  await guardaArmada(page);
  await expect.poll(playState, ORCAMENTO).toBe("paused");

  await orbe.scrollIntoViewIfNeeded();
  await expect.poll(playState, ORCAMENTO).toBe("running");

  // fora do ecrã → pausado pelo IntersectionObserver
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" })
  );
  await expect.poll(playState, ORCAMENTO).toBe("paused");

  // de volta à vista mas com o separador «escondido» → continua parado
  await orbe.scrollIntoViewIfNeeded();
  await expect.poll(playState, ORCAMENTO).toBe("running");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(playState, ORCAMENTO).toBe("paused");

  // separador de volta → retoma
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(playState, ORCAMENTO).toBe("running");
});

test("o canvas do CampoCentimos pára fora do ecrã e com o separador escondido", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/estilo", { waitUntil: "domcontentloaded" });
  const canvas = page.locator("#campo-centimos canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);

  // amostra de pixels por getImageData — locator.screenshot() faria
  // scroll para o elemento e estragava o teste «fora do ecrã».
  // Hash denso: cada 4.º pixel, os 4 canais — a moeda cobre centenas
  // de amostras, qualquer oscilação muda o hash.
  const amostra = () =>
    page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>(
        "#campo-centimos canvas"
      );
      if (!c) return -1;
      const d = c
        .getContext("2d")!
        .getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 16)
        h = (h * 31 + d[i] + (d[i + 1] << 8) + (d[i + 2] << 16)) >>> 0;
      return h;
    });
  // espera N frames de rAF contados, não milissegundos — o rAF da
  // página continua a disparar mesmo com o canvas em pausa ou com o
  // document.hidden forjado, por isso a espera resolve sempre
  const mudou = async (frames = 45) => {
    const a = await amostra();
    await page.evaluate(
      (n) =>
        new Promise<void>((res) => {
          let i = 0;
          const tick = () =>
            ++i >= n ? res() : requestAnimationFrame(tick);
          requestAnimationFrame(tick);
        }),
      frames
    );
    return (await amostra()) !== a;
  };

  // em repouso a moeda oscila — a tela muda de conteúdo
  expect(await mudou(), "o campo não está a animar à vista").toBe(true);

  // fora do ecrã — o IntersectionObserver corta o rAF
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.waitForTimeout(300);
  expect(await mudou(), "o canvas continuou a pintar fora do ecrã").toBe(
    false
  );

  // de volta à vista — retoma
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await mudou(), "o canvas não retomou ao voltar à vista").toBe(true);

  // separador escondido — visibilitychange corta o rAF mesmo à vista
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(300);
  expect(
    await mudou(),
    "o canvas continuou a pintar com o separador escondido"
  ).toBe(false);

  // e o marquee ambiente também parou (PausaAmbiente, mesmo gatilho)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(200);
  const ticker = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector(".ticker-track")!)
        .animationPlayState
  );
  expect(ticker).toBe("paused");

  // restaura — tudo retoma
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            getComputedStyle(document.querySelector(".ticker-track")!)
              .animationPlayState
        ),
      { timeout: 4000 }
    )
    .toBe("running");
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await mudou(), "o canvas não retomou depois do separador").toBe(
    true
  );
});

test("acima da dobra o valor nasce final — nenhuma roda roda ao carregar (1D-03)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // o <Painel> passou a viver em /dados quando a home virou o mapa do
  // bairro (P1-1); a regra é a mesma, noutro sítio
  await page.goto("/dados", { waitUntil: "domcontentloaded" });
  // o primeiro cartão do painel está acima da dobra; a amostra corre a
  // ~350 ms — um roll de entrada duraria ~1,4 s e ainda estaria a correr
  const primeiro = page.locator("[data-painel] .leitura-valor").first();
  await expect(primeiro).toBeVisible();
  await page.waitForTimeout(350);
  const aRodar = await primeiro.evaluate((el) =>
    Array.from(el.querySelectorAll(".od-strip")).some((s) =>
      s.getAnimations().some((a) => a.playState === "running")
    )
  );
  expect(aRodar, "o valor do cartão acima da dobra rolou ao carregar").toBe(
    false
  );
  // e nasce no valor final — cada roda assenta em translateY(−d·1em);
  // um roll iniciado (ou rodas paradas a 0) falhava aqui
  const posicoes = await primeiro.locator(".od-strip").evaluateAll((ss) =>
    ss.map((s) => ({
      d: Number((s as HTMLElement).style.getPropertyValue("--d")),
      y: new DOMMatrix(getComputedStyle(s).transform).f,
    }))
  );
  const em = await primeiro
    .locator(".od-digit")
    .first()
    .evaluate((el) => el.getBoundingClientRect().height);
  for (const { d, y } of posicoes)
    expect(
      Math.abs(y - -d * em),
      `roda no dígito ${d} devia assentar a −${d}em`
    ).toBeLessThan(1.5);
});
