import { ImageResponse } from "next/og";
import { OG_TIPO } from "@/lib/og";
import { MESTRES, MARCA } from "@/components/Logo";

export const dynamic = "force-static";
export const alt = "AO CÊNTIMO — literacia financeira para Portugal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* A palavra são os contornos da Archivo (mestre normal), não texto:
   tinta #1B1811 e haste #1F6B4D — as cores do mestre claro, sobre o
   papel claro do cartão OG. O azulejo é o símbolo (cores fixas). */
const PALAVRA = MESTRES.normal;
// aspecto do mestre normal: 8479.3 / 1075.15 — 110 px de SVG ≈ 70 px de
// capitular, a mesma escala que o texto «hero» tinha antes
const PALAVRA_H = 110;
const PALAVRA_W = Math.round((PALAVRA_H * 8479.3) / 1075.15); // ≈ 868

export default function OpengraphImage() {
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <svg width="150" height="150" viewBox="0 0 1000 1000">
            <path d={MARCA.fundo} fill="#1B1811" />
            <path d={MARCA.c} fill="#F2ECDD" />
            <path d={MARCA.haste} fill="#63D6A4" />
          </svg>
          <svg
            width={PALAVRA_W}
            height={PALAVRA_H}
            viewBox={PALAVRA.vb}
          >
            <path d={PALAVRA.tinta} fill="#1B1811" />
            <path d={PALAVRA.haste} fill="#1F6B4D" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            color: "#6B6455",
            fontSize: OG_TIPO.rotulo,
          }}
        >
          <span>Literacia financeira para Portugal</span>
          <span style={{ color: "#7E2B1E", fontWeight: 800 }}>cada número com fonte e data</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
