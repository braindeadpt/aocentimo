"use client";

/* O global-error substitui o layout inteiro — incluindo o <html> e o CSS
   que ele importa. Por isso é autónomo de propósito: estilos inline com
   os tokens da casa (papel #F6F2EA, tinta #1B1811) e texto escrito aqui,
   como o not-found — o chunk que falhou pode ser o das strings. */

const PAPEL = "#F6F2EA";
const TINTA = "#1B1811";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="pt-PT">
      <body
        style={{
          margin: 0,
          background: PAPEL,
          color: TINTA,
          fontFamily: "Archivo, system-ui, sans-serif",
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Falhou
          </p>
          <h1
            style={{
              fontSize: "2.5rem",
              lineHeight: 1.05,
              margin: "0.5rem 0 1rem",
            }}
          >
            A página tropeçou a meio.
          </h1>
          <p style={{ lineHeight: 1.6 }}>
            É provável que um pedaço da página não tenha chegado inteiro. Não
            se perdeu nada — os números continuam todos no sítio.
          </p>
          <p style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                font: "inherit",
                padding: "0.6rem 1.2rem",
                border: `2px solid ${TINTA}`,
                borderRadius: "999px",
                background: TINTA,
                color: PAPEL,
                cursor: "pointer",
              }}
            >
              Tentar outra vez
            </button>
            {/* <a> de propósito: num erro global o router pode ser a peça
                que falhou — a navegação inteira recarrega e cura. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: "0.6rem 1.2rem",
                border: `2px solid ${TINTA}`,
                borderRadius: "999px",
                color: TINTA,
                textDecoration: "none",
              }}
            >
              Ir para o início
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
