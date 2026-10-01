import { test, expect } from "@playwright/test";

/**
 * Os candeeiros do bairro acendem à noite (P1-fidelidade).
 *
 * O desenho traz um halo `.luz` por candeeiro, nascido com `opacity="0"`;
 * o CSS `.b-noite .luz` acende-o. O defeito que este teste vigia era o
 * `#b-gLuzes` vazio — postes sem halo a qualquer hora.
 *
 * O momento do dia É ESCOLHIDO AQUI, não herdado: `horaDoServidor()` dá
 * noite a partir das 20h no relógio do servidor, e este teste abria na
 * hora que calhasse ao CI. Passava às 18h UTC e caía vermelho depois das
 * 20h, sem o mapa ter mudado — a mesma armadilha dos números datados à
 * mão: um teste que mede a hora em vez do que quer provar.
 */
test.describe("o bairro — as luzes dos candeeiros", () => {
  test("há um halo por candeeiro e ele acende na «Noite»", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".b-mundo .pin");

    const luzes = page.locator(".b-mundo .luz");
    const candeeiros = page.locator(".b-mundo .candeeiro");
    const n = await candeeiros.count();
    expect(n, "sem candeeiros no mapa").toBeGreaterThan(0);
    await expect(luzes).toHaveCount(n);

    // o momento é posto pelo teste: «Dia» antes de medir o apagado, para
    // a hora do servidor não decidir o resultado
    await page.getByRole("button", { name: "Dia", exact: true }).click();

    // de dia o halo está apagado (o atributo opacity=0 é o estado inicial)
    const op = () => luzes.first().evaluate((el) => +getComputedStyle(el).opacity);
    await expect(async () => {
      expect(await op(), "o halo não se apagou de dia").toBe(0);
    }).toPass({ timeout: 5000 });

    await page.getByRole("button", { name: "Noite", exact: true }).click();
    // a transição é de 1,2s — espera a opacidade chegar ao fim
    await expect(async () => {
      expect(await op(), "o halo não acendeu à noite").toBe(1);
    }).toPass({ timeout: 5000 });
  });
});
