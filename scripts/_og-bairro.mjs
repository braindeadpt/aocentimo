/**
 * _og-bairro.mjs — o CARTÃO DE PARTILHA (`og:image`) do site.
 *
 * Sai do mapa da home, não de um desenho à parte: é a mesma imagem que
 * quem abre a casa vê primeiro, em «Dia», com os treze marcadores à
 * vista. Por isso é um ficheiro em `public/` — o site é 100 % estático
 * (`output: "export"`), e um `opengraph-image.tsx` só emitia uma rota
 * sem extensão (`/opengraph-image?hash`), que o GitHub Pages serve como
 * `application/octet-stream`: nenhum crawler de partilha a abria. Um
 * PNG com nome é servido como `image/png` e é lido em qualquer lado.
 *
 * O ficheiro é um ASSET deliberado — fica no repo, versionado, e só se
 * regenera quando o mapa muda. Este script é a sua proveniência.
 *
 * Uso (precisa de `out/` construído e do servidor estático a correr):
 *   PORTA=3119 node scripts/_serve-static.mjs &
 *   PORTA=3119 node scripts/_og-bairro.mjs
 *   node scripts/_og-bairro.mjs --ver    # só mede o PNG já no repo
 *
 * Sai com 1 (e a diferença) se o PNG não for 1200×630, passar de 250 KB,
 * ou deixar uma faixa de papel numa borda. O orçamento é do dono: o
 * `git push` recusa ficheiros grandes, e um cartão pesado é um cartão
 * que nem chega a abrir.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const SAIDA = "public/og-bairro.png";
const LIMITE = 250 * 1024;
const L = 1200;
const A = 630;
/** A janela de captura tem a medida exacta do cartão. Uma janela mais
 *  alta parecia a resposta para a folga de papel (a câmara enquadra a
 *  partir da altura), mas empurrava a vista para cima e deixava aparecer
 *  o fundo escuro da janela por cima do mapa — pior que a folga. A
 *  folga resolve-se no PNG, em `centrar`. */
const A_VENTANA = 630;
/** Supersampling: a captura sai a 2× e é reduzida com lanczos3. O
 *  papel do bairro tem uma grelha finíssima de 1 px que, à escala 1:1,
 *  é puro ruído para o PNG (250 KB só de grelha); a 2× a redução
 *  dava 271 KB em vez de 250: a redução com lanczos3 deixa um rizado
 *  subtil em cada aresta que a paleta de 64 cores paga caro. Captura
 *  direta, então; o rizado era mais caro do que a grelha. */
const ESCALA = 1;
/** A paleta é escolhida por ordem decrescente até o PNG caber no tecto. */
const PALETA = [64, 32, 16];
const DITHER = 0.3;
/** A cor do papel do palco — o fundo que sobra quando a vista é mais
 *  larga do que o bairro. Mede-se a faixa, não se confia no olho. */
const PAPEL = [244, 243, 236];
const TOLERANCIA = 4; // quanto se aceita longe da cor exacta
const MARGEM_MAX = 16; // px de papel numa borda — acima disso é defeito
const porta = process.env.PORTA ?? "3100";
const base = `http://localhost:${porta}`;

if (process.argv.includes("--ver")) medir();
else {
  await gerar();
  medir();
}

/** KB com uma casa — o que se lê num `ls -la` */
function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}

/** Quantos píxeis de papel se vêem à esquerda e à direita, a meio da
 *  altura — a linha onde o mapa é sólido e a folga, se existe, só pode
 *  ser o fundo do palco. */
async function margensDePapel(buffer) {
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const ePapel = (p) => p.every((c, i) => Math.abs(c - PAPEL[i]) <= TOLERANCIA);
  const y = info.height >> 1;
  let esq = 0;
  while (esq < info.width && ePapel(px(esq, y))) esq++;
  let dir = 0;
  while (dir < info.width && ePapel(px(info.width - 1 - dir, y))) dir++;
  return { esq, dir };
}

async function medir() {
  if (!existsSync(SAIDA)) {
    console.error(`FALHA: ${SAIDA} não existe — corre o gerador primeiro.`);
    process.exit(1);
  }
  const bytes = statSync(SAIDA).size;
  // a assinatura do PNG: 89 50 4E 47 0D 0A 1A 0A
  const assinatura = readFileSync(SAIDA).subarray(0, 8);
  if (assinatura.toString("hex") !== "89504e470d0a1a0a") {
    console.error(
      `FALHA: ${SAIDA} não é um PNG (assinatura ${assinatura.toString("hex")}).`
    );
    process.exit(1);
  }
  const meta = await sharp(SAIDA).metadata();
  const { esq, dir } = await margensDePapel(readFileSync(SAIDA));
  const erros = [];
  if (meta.width !== L || meta.height !== A)
    erros.push(`mede ${meta.width}×${meta.height} e devia medir ${L}×${A}`);
  if (bytes > LIMITE)
    erros.push(`pesa ${kb(bytes)} — ${kb(bytes - LIMITE)} acima do tecto`);
  const pior = Math.max(esq, dir);
  if (pior > MARGEM_MAX)
    erros.push(
      `fica ${pior} px de papel numa borda (esq ${esq}, dir ${dir}) — o mapa está descentrado no cartão`
    );
  if (erros.length) {
    console.error(`FALHA: o cartão não está pronto — ${erros.join("; ")}.`);
    process.exit(1);
  }
  console.log(
    `cartão: ${kb(bytes)} ${meta.width}×${meta.height}, margens ${esq}/${dir} px`
  );
  console.log("ok: PNG válido, dentro do orçamento.");
}

/** As linhas do topo que são a BORDA do palco, não o mapa.
 *
 * A `.b-palco` tem `border-block` de tinta e a janela do mapa é
 * transparente: numa janela 1200×630 a vista não chega a cobrir os
 * primeiros ~8 px e a borda escura aparece por cima do desenho. O cartão
 * não quer essa aresta preta — corta-se em cima e em baixo, a mesma
 * medida dos dois lados, para a altura fechar em 630 sem inventar
 * píxeis nem esticar o mapa. */
async function bandaEscuraTopo(buffer) {
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  // a meio da largura: a borda do palco não chega às pontas (o palco
  // tem margin-inline negativa e a janela está fixa no canto)
  const x = info.width >> 1;
  let n = 0;
  for (let y = 0; y < info.height; y++) {
    const i = (y * info.width + x) * info.channels;
    if (data[i] > 60 || data[i + 1] > 60 || data[i + 2] > 60) break;
    n++;
  }
  return n;
}

/** Tirar a folga e devolvê-la metade a cada lado.
 *
 * A câmara enquadra o bairro pelo conteúdo dos treze marcadores, e esse
 * enquadramento tem uma largura própria: numa janela 1200×630 a vista
 * fica uns 23 px mais larga do que o desenho, e a diferença é o fundo
 * do palco — a cor do papel. Não dá para a câmara narrower a vista
 * (encaixar mais perto parte o marcador de cima) nem para a panhar até
 * lá (o fundo anda com o mapa), por isso a folga sai do PNG e volta
 * partida: uma moldura de ~12 px de cada lado lê-se como margem do
 * cartão; 23 px só de um lado lê-se como corte. */
async function centrar(buffer, largura, altura) {
  let saida = buffer;
  const topo = await bandaEscuraTopo(saida);
  if (topo > 0) {
    /* Corta-se a borda por cima e repon-se a mesma medida por baixo, com
       a cor da última linha do mapa: a base é o Douro, uma faixa lisa,
       e alargar 8 px da mesma cor é o mesmo que se a janela fosse mais
       alta. Cortar dos dois lados fechava o cartão em 614 px. */
    const { data, info } = await sharp(saida)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = info.width >> 1;
    const i = (info.height - topo - 1) * info.width * info.channels + x * info.channels;
    const fundo = { r: data[i], g: data[i + 1], b: data[i + 2] };
    saida = await sharp(saida)
      .extract({ left: 0, top: topo, width: largura, height: altura - topo })
      .extend({ top: 0, bottom: topo, left: 0, right: 0, background: fundo })
      .png()
      .toBuffer();
    console.log(`borda do palco: ${topo} px fora de cima, ${topo} px de base repostas`);
  }
  const { esq, dir } = await margensDePapel(saida);
  const corte = esq + dir;
  if (corte === 0) return saida;
  const cortaDaEsq = esq >= dir;
  const corpo = await sharp(saida)
    .extract({
      left: cortaDaEsq ? corte : 0,
      top: 0,
      width: largura - corte,
      height: altura,
    })
    .toBuffer();
  const meio = Math.round(corte / 2);
  const sobra = corte - meio;
  const devolvido = await sharp(corpo)
    .extend({
      left: cortaDaEsq ? sobra : meio,
      right: cortaDaEsq ? meio : sobra,
      top: 0,
      bottom: 0,
      background: { r: PAPEL[0], g: PAPEL[1], b: PAPEL[2] },
    })
    .png()
    .toBuffer();
  console.log(`folga de ${corte} px repartida: ${meio}/${sobra} px de moldura`);
  return devolvido;
}

async function gerar() {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({
    viewport: { width: L, height: A_VENTANA },
    deviceScaleFactor: ESCALA,
    // sem movimento ambiente: a câmara vai para o enquadramento final
    // num instante e o céu não está a meio de uma transição na captura
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "pt-PT",
  });
  const pagina = await ctx.newPage();

  // tema claro (o «Dia» do tema) antes do HTML — o themeInit do layout
  // decide pelo localStorage, e não pelo colorScheme
  await pagina.addInitScript(() => {
    try {
      localStorage.setItem("aocentimo-theme", "light");
    } catch {
      /* sem storage: o themeInit cai em light na mesma */
    }
  });

  await pagina.goto(`${base}/`, { waitUntil: "load" });
  // data-vivo="1" é o sinal do `<Bairro>` de que a câmara já está ligada.
  // `attached`, não `visible`: o .b-mundo é a camada grande que a câmara
  // desloca e escala — o browser diz que está escondida até ter caixa, e
  // o que interessa aqui é o atributo, não a visibilidade.
  await pagina.waitForSelector(".b-mundo[data-vivo='1']", {
    state: "attached",
    timeout: 30_000,
  });

  /* O cartão é a JANELA do mapa em 1200×630. Forçar a caixa exacta
     garante a proporção sem redimensionar a imagem depois (um PNG
     reduzido à pressa borra o texto dos marcadores, que é metade do
     que o cartão mostra). A câmara tem ResizeObserver: em vez de
     partir, recalcula o enquadramento com a caixa nova — por isso o
     CSS entra antes de se mexer nos controlos, senão a câmara media a
     janela antiga e o mapa saía cortado. */
  await pagina.addStyleTag({
    content: `
      /* o que não é o mapa não entra no cartão: cabeçalho, marquee dos
         números e elenco de baixo. O marquee vai por «:amb:has(...)»
         porque a «.amb» do PausaAmbiente também envolve o MAPA — apagá-la
         às cegas apagava o próprio cartão */
      .b-cab, .b-intro, .b-controlos, .b-zoom, .b-dica, .b-cartao,
      header, footer, .ticker, .amb:has(.ticker), .b-fala, .b-elenco,
      .b-notas, .skip-link { display: none !important; }
      .b-palco { padding: 0 !important; margin: 0 !important; }
      .b-janela { width: ${L}px !important; height: ${A_VENTANA}px !important;
                  border: 0 !important; box-sizing: border-box !important;
                  aspect-ratio: auto !important;
                  /* fixa no canto: o clip do screenshot é aparado pelo
                     viewport, e uma janela deslocada dava um cartão
                     de 1180×593 em vez de 1200×630 */
                  position: fixed !important; left: 0 !important; top: 0 !important;
                  z-index: 9999 !important; }
      html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
    `,
  });
  await pagina.waitForTimeout(600);

  /* A hora do dia: «Dia» é o primeiro dos três botões. Vai por
     `evaluate` e não por `click` — o CSS acima escondeu os controlos, e
     um botão escondido não é clicável; `.click()` no DOM dispara o mesmo
     evento e o React ouve-o igual.

     E NÃO se carrega no «⤢»: esse botão enquadra a caixa do MUNDO, que a
     1200×630 dá mais larga do que a caixa do bairro e corta o marcador
     de cima. O enquadramento inicial é o que a câmara calcula a partir
     das caixas dos treze marcadores (`vistaInicial` → `encaixaCaixas`,
     com folga em cima e dos lados) — é o mesmo que quem abre a casa vê,
     e é o único em que «os marcadores à vista» é verdade. */
  await pagina.evaluate(() => {
    document.querySelectorAll(".b-controlos .b-ctl")[0]?.click();
  });
  await pagina.waitForTimeout(800); // a câmara assenta

  let buf = await capturar(pagina);
  await navegador.close();

  /* a captura vem em ESCALA×: as medidas do corte são as do buffer, não
     as do cartão — a 2× a folga são 46 px, não 23 */
  buf = await centrar(buf, L * ESCALA, A * ESCALA);

  /* A captura crua sai a ~750 KB: o mapa tem telhados, azulejo, relva e
     treze marcadores com texto — para o PNG isso são milhares de cores
     quase iguais, que o TrueColor guarda uma a uma. A quantização para
     uma paleta de 96 cores corta isso: o desenho é de cores chapadas e
     não perde nada a ver, e o cartão fica com um terço do peso. */
  /* removeAlpha antes da paleta: o `extend` da moldura acrescenta um
     canal alfa, e um PNG com alfa não aceita paleta — sem isto o
     `palette: true` era ignorado em silêncio. */
  const reduzido = await sharp(buf)
    .resize(L, A, { kernel: "lanczos3" })
    .removeAlpha();

  /* Quantizar por degraus até caber no tecto. O desenho é de cores
     chapadas, por isso perder cores não lhe estraga nada — e há um
     degrau no codificador: a partir de 20 cores o libpng empacota a 8
     bits por píxel, e abaixo disso a 4 bits. Daí o salto de 251 KB
     (64 cores, um KB acima do tecto) para 80 KB (16 cores) sem que a
     imagem mude de aspeto. */
  let quantizado = null;
  for (const cores of PALETA) {
    const tentativa = await reduzido
      .png({
        palette: true,
        colours: cores,
        dither: DITHER,
        effort: 10,
        compressionLevel: 9,
      })
      .toBuffer();
    console.log(`paleta de ${cores} cores: ${kb(tentativa.length)}`);
    quantizado = tentativa;
    if (tentativa.length <= LIMITE) break;
  }

  // o nome tem de ser o do ficheiro: o screenshot devolve bytes PNG sem
  // extensão, e é a extensão que diz ao servidor o content-type
  writeFileSync(SAIDA, quantizado);
  console.log(
    `escrito: ${SAIDA} (${L}×${A}) — ${kb(buf.length)} cru → ${kb(quantizado.length)}`
  );
}

/** A captura exactamente com a medida do cartão. */
async function capturar(pagina) {
  const janela = pagina.locator(".b-janela");
  const caixa = await janela.boundingBox();
  if (!caixa || caixa.x !== 0 || caixa.y !== 0)
    throw new Error(
      `a janela do mapa não está no canto: ${caixa?.x},${caixa?.y}`
    );
  if (Math.round(caixa.width) !== L || Math.round(caixa.height) !== A_VENTANA)
    throw new Error(
      `a janela do mapa mede ${caixa.width}×${caixa.height} e devia medir ${L}×${A_VENTANA}`
    );
  /* `clip` e não a captura do elemento: o screenshot de um elemento leva
     as borders e arredonda a caixa ao meio pixel (dava 1200×631), e o
     contrato são 1200×630 exactos — um `og:image` com a medida errada é
     uma imagem que cada crawler recorta por conta própria. */
  return pagina.screenshot({
    type: "png",
    animations: "disabled",
    clip: { x: 0, y: 0, width: L, height: A },
  });
}