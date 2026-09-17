import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Delta } from "./Delta";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("Delta — quatro estados", () => {
  it("subida mostra ▲ e cor de direção", () => {
    const h = html(<Delta value={0.012} />);
    expect(h).toContain("▲");
    expect(h).toContain("1,2");
    expect(h).toContain("text-up"); // preços: subir é mau
  });

  it("descida mostra ▼", () => {
    const h = html(<Delta value={-0.012} />);
    expect(h).toContain("▼");
    expect(h).toContain("text-down");
  });

  it("goodWhenUp inverte a cor sem mudar o símbolo", () => {
    const h = html(<Delta value={0.02} goodWhenUp />);
    expect(h).toContain("▲");
    expect(h).toContain("text-down"); // poupança: subir é bom
  });

  it("valor que arredonda a zero é neutro — sem direção", () => {
    const h = html(<Delta value={0.0004} casas={1} />);
    expect(h).toContain("=");
    expect(h).toContain("0,0");
    expect(h).not.toContain("▲");
    expect(h).not.toContain("▼");
    expect(h).toContain("text-muted");
  });

  it("o limiar depende de casas: 0,04 % é neutro a 1 casa mas não a 2", () => {
    expect(html(<Delta value={0.0004} casas={1} />)).toContain("=");
    expect(html(<Delta value={0.0004} casas={2} />)).toContain("▲");
  });

  it("null mostra — sem símbolo de direção", () => {
    const h = html(<Delta value={null} />);
    expect(h).toContain("—");
    expect(h).not.toContain("▲");
    expect(h).toContain("text-muted");
  });
});
