import { defineConfig } from "@playwright/test";

// em sessões paralelas cada worktree define PORTA — o servidor estático e
// a baseURL seguem-na; sem PORTA assume-se a 3100 da sessão única
const porta = process.env.PORTA ?? "3100";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${porta}`,
  },
  webServer: {
    // o site é export estático (output: "export") — testa-se o out/
    // tal como o GitHub Pages o serve, não `next start`
    // (o _serve-static lê PORTA do ambiente herdado)
    command: "npm run build && node scripts/_serve-static.mjs",
    url: `http://localhost:${porta}`,
    // com PORTA definida nunca se reutiliza o servidor de outra sessão —
    // porta ocupada tem de falhar alto, não testar o build errado
    reuseExistingServer: !process.env.CI && !process.env.PORTA,
    timeout: 180_000,
  },
});
