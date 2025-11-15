import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "dist/**", "lib/**", "standalone/**"],
    setupFiles: ["./vitest.setup.ts"],
    typecheck: {
      tsconfig: "./tsconfig.app.json",
    },
  },
});
