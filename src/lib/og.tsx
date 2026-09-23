import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { MESTRES, MARCA } from "@/components/Logo";

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

/* a palavra AO CÊNTIMO em contornos no cartão OG — altura do SVG tal que
   a capitular (63,95 %) ≈ a do texto «marca» que substitui (52 × 0,6875) */
const OG_MARCA = { h: 56, w: Math.round((56 * 8479.3) / 1075.15) } as const;

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
          <svg width="84" height="84" viewBox="0 0 1000 1000">
            <path d={MARCA.fundo} fill="#1B1811" />
            <path d={MARCA.c} fill="#F2ECDD" />
            <path d={MARCA.haste} fill="#63D6A4" />
          </svg>
          {/* a palavra em contornos (mestre normal): tinta e haste do tema
              claro — o cartão OG é papel claro */}
          <svg
            width={OG_MARCA.w}
            height={OG_MARCA.h}
            viewBox={MESTRES.normal.vb}
          >
            <path d={MESTRES.normal.tinta} fill="#1B1811" />
            <path d={MESTRES.normal.haste} fill="#1F6B4D" />
          </svg>
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
