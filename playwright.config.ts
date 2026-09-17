import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    // o site é export estático (output: "export") — testa-se o out/
    // tal como o GitHub Pages o serve, não `next start`
    command: "npm run build && npx serve out -l 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
