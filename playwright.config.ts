import { defineConfig } from "@playwright/test";

const PORT = 3077;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: !process.env.HEADED,
  },
  webServer: {
    command: `pnpm --filter cosmo-cargo exec zudoku preview --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
