import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/* escala tipográfica do cartão OG — tipografia raster da imagem
   1200×630 (Satori), fora do CSS da página mas na mesma lógica
   fechada: rótulo · marca · manchete · herói */
export const OG_TIPO = {
  rotulo: 34,
  marca: 52,
  manchete: 96,
  hero: 128,
} as const;

/**
 * OG por rota — a mesma composição da imagem raiz (marca + promessa),
 * com o título da rota como manchete. Com output:"export" cada
 * opengraph-image.tsx gera no build.
 */
export async function ogImage(titulo: string) {
  const data = await readFile(
    join(process.cwd(), "src/app/fonts/Archivo-ExtraBold.ttf")
  );
  const fonts = [
    { name: "Archivo", data, weight: 800 as const, style: "normal" as const },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAF7EE",
          padding: "72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <svg width="84" height="84" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#221F19" />
            <path
              d="M44.2 20.6 A16 16 0 1 0 44.2 43.4"
              fill="none"
              stroke="#F0E9DA"
              strokeWidth="9"
            />
            <rect x="29" y="10" width="6" height="44" fill="#63D6A4" />
          </svg>
          <div
            style={{
              fontSize: OG_TIPO.marca,
              fontWeight: 800,
              color: "#221F19",
              letterSpacing: "0.02em",
            }}
          >
            AO CÊNTIMO
          </div>
        </div>
        <div
          style={{
            fontSize: OG_TIPO.manchete,
            fontWeight: 800,
            color: "#221F19",
            letterSpacing: "-0.01em",
            lineHeight: 1.02,
            textTransform: "uppercase",
          }}
        >
          {titulo}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            color: "#6B6455",
            fontSize: OG_TIPO.rotulo,
          }}
        >
          <span style={{ color: "#7E2B1E", fontWeight: 800 }}>
            cada número com fonte e data
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
