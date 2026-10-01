const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

(async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfPath = path.join(__dirname, '..', 'imi-familiar-porto-2026.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  console.error(`páginas: ${doc.numPages}`);

  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('por', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text')
        process.stderr.write(`\r  ocr: ${Math.round(m.progress * 100)}%   `);
    },
  });

  let full = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 3 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pngPath = path.join(__dirname, `pagina-${p}.png`);
    fs.writeFileSync(pngPath, await canvas.encode('png'));

    const { data: { text } } = await worker.recognize(pngPath);
    full += `\n===== PÁGINA ${p} =====\n` + text;
    console.error(`\npágina ${p}: ${text.trim().length} caracteres`);
  }
  await worker.terminate();

  fs.writeFileSync(path.join(__dirname, 'ocr-resultado.txt'), full);
  console.log(full);
})().catch((e) => {
  console.error('ERRO:', e && e.message ? e.message : e);
  process.exit(1);
});
