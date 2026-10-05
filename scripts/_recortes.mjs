// Recorta a zona do título (onde a diferença se vê) e monta antes/
// depois lado a lado, para se poder comparar com os olhos.
//   node scripts/_recortes.mjs <dir-das-capturas> <saida>
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const dir = process.argv[2];
const saida = process.argv[3] || dir;
await mkdir(saida, { recursive: true });

const etiquetas = ["1440", "390"];
const paginas = ["home", "estilo"];

for (const pagina of paginas) {
  for (const et of etiquetas) {
    const antes = join(dir, `${pagina}-${et}-antes.png`);
    const depois = join(dir, `${pagina}-${et}-depois.png`);
    const larg = et === "1440" ? 2880 : 780;
    // a faixa do topo: cabeçalho + título + primeiro bloco
    const altura = et === "1440" ? 1800 : 2400;

    const a = await sharp(antes).extract({ left: 0, top: 0, width: larg, height: altura }).toBuffer();
    const b = await sharp(depois).extract({ left: 0, top: 0, width: larg, height: altura }).toBuffer();
    const ma = await sharp(a).metadata();
    const mb = await sharp(b).metadata();

    // fundo claro e uma linha de etiqueta entre as duas
    const rotulo = 90;
    const total = Math.max(ma.height, mb.height) * 2 + rotulo + 40;
    await sharp({
      create: {
        width: larg,
        height: total,
        channels: 4,
        background: { r: 245, g: 245, b: 242, alpha: 1 },
      },
    })
      .composite([
        { input: Buffer.from(
            `<svg width="${larg}" height="${rotulo}" xmlns="http://www.w3.org/2000/svg">
               <rect width="${larg}" height="${rotulo}" fill="#22201d"/>
               <text x="24" y="58" font-family="monospace" font-size="40" fill="#f0ece3">ANTES  (main, next/font/google)</text>
             </svg>`
          ), top: 0, left: 0 },
        { input: a, top: rotulo, left: 0 },
        { input: Buffer.from(
            `<svg width="${larg}" height="${rotulo}" xmlns="http://www.w3.org/2000/svg">
               <rect width="${larg}" height="${rotulo}" fill="#22201d"/>
               <text x="24" y="58" font-family="monospace" font-size="40" fill="#f0ece3">DEPOIS  (subconjunto local)</text>
             </svg>`
          ), top: rotulo + ma.height + 20, left: 0 },
        { input: b, top: rotulo + ma.height + rotulo + 40, left: 0 },
      ])
      .png()
      .toFile(join(saida, `${pagina}-${et}-comparacao.png`));
    console.log(join(saida, `${pagina}-${et}-comparacao.png`));
  }
}