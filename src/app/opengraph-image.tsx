import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "BRUTO — literacia financeira para Portugal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const data = await readFile(
    join(process.cwd(), "src/app/fonts/Archivo-ExtraBold.ttf")
  );
  const fonts = [{ name: "Archivo", data, weight: 800 as const, style: "normal" as const }];

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
        <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
          <div
            style={{
              fontSize: 200,
              fontWeight: 800,
              color: "#221F19",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            BRUTO
          </div>
          {/* o nível — 62% do custo total do trabalho é teu */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              width: 46,
              height: 170,
              border: "14px solid #221F19",
              borderTop: "none",
              borderRadius: "0 0 28px 28px",
            }}
          >
            <div style={{ width: "100%", height: "62%", background: "#2F5D46" }} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            color: "#6B6455",
            fontSize: 34,
          }}
        >
          <span>Literacia financeira para Portugal</span>
          <span style={{ color: "#7E2B1E", fontWeight: 800 }}>cada número com fonte e data</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
