// servidor estático mínimo para o `out/` — o `npx serve` morre a meio
// do e2e nesta máquina; este não faz nada além de ler ficheiros
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const root = join(process.cwd(), "out");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(root, normalize(p));
    const tentativas = [file, join(file, "index.html"), file + ".html"];
    let ok = false;
    for (const t of tentativas) {
      try {
        const data = await readFile(t);
        /* content-length explícito → resposta sem chunked e conexão
           keep-alive reutilizável; sem ele o browser abre sockets novos
           e o carregamento de 42 rotas em paralelo afoga o servidor */
        res.writeHead(200, {
          "content-type": MIME[extname(t)] ?? "application/octet-stream",
          "content-length": data.length,
          "cache-control": "no-store",
        });
        res.end(data);
        ok = true;
        break;
      } catch {}
    }
    if (!ok) {
      const nf = await readFile(join(root, "404.html")).catch(() => "404");
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(nf);
    }
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(Number(process.env.PORTA ?? 3100), () =>
  console.log(`static :${process.env.PORTA ?? 3100}`),
);
