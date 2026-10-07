import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GlobalError from "./global-error";

/* O fallback global é autónomo: sem imports da casa, sem CSS do layout.
   O que o teste fixa é o contrato que interessa — html/lang, a voz da
   marca, e as duas saídas (tentar outra vez · início). */

const html = renderToStaticMarkup(<GlobalError reset={() => {}} />);

describe("GlobalError — o último fallback", () => {
  it("devolve um documento completo em pt-PT", () => {
    expect(html).toContain('<html lang="pt-PT">');
  });

  it("tem a voz da marca, não um fallback branco", () => {
    expect(html).toContain("A página tropeçou a meio.");
  });

  it("oferece as duas saídas: tentar outra vez e início", () => {
    expect(html).toContain("Tentar outra vez");
    expect(html).toContain('href="/"');
  });

  it("não depende de CSS do layout — estilos inline", () => {
    expect(html).toContain("background:#F6F2EA");
    expect(html).not.toContain('class="');
  });
});
