// servidor estático partilhado pelo `serve:out` e pelos scripts de
// diagnóstico: só escuta em 127.0.0.1 e nunca serve nada fora da raiz
// (um pedido cru com `/../` ou `%2e%2e%2f` não pode sair do `out/`)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, sep } from "node:path";

export const HOST = "127.0.0.1";

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
  ".webmanifest": "application/manifest+json",
};

/** Caminho absoluto dentro de `raiz` para o URL pedido, ou null se sair dela. */
export function resolverNaRaiz(raiz, url) {
  let p;
  try {
    p = decodeURIComponent(new URL(url, "http://x").pathname);
  } catch {
    return null;
  }
  if (p.includes("\0")) return null;
  const base = resolve(raiz);
  const f = resolve(base, "." + p);
  return f === base || f.startsWith(base + sep) ? f : null;
}

export function criarServidorEstatico(raiz) {
  const base = resolve(raiz);
  return createServer(async (req, res) => {
    try {
      const f = resolverNaRaiz(base, req.url);
      if (f) {
        // `<raiz>.html` é irmão da raiz, não filho: só se tenta `.html` abaixo dela
        const tentativas = f === base ? [join(f, "index.html")] : [f, join(f, "index.html"), f + ".html"];
        for (const t of tentativas) {
          try {
            if (!(await stat(t)).isFile()) continue;
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
            return;
          } catch {
            /* segue para o próximo candidato */
          }
        }
      }
      const nf = await readFile(join(base, "404.html")).catch(() => "404");
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(nf);
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
}

/** Serve `raiz` em 127.0.0.1; porta 0 = aleatória. Resolve com o servidor já a escutar. */
export async function servirEstatico(raiz, porta = 0) {
  const srv = criarServidorEstatico(raiz);
  await new Promise((ok, falha) => {
    srv.once("error", falha);
    srv.listen(porta, HOST, () => {
      srv.off("error", falha);
      ok();
    });
  });
  return srv;
}

export const urlBase = (srv) => `http://${HOST}:${srv.address().port}`;
