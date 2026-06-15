import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "dist/**", "lib/**", "standalone/**"],
    setupFiles: ["./vitest.setup.ts"],
    typecheck: {
      checker: "tsgo",
      tsconfig: "./tsconfig.app.json",
    },
  },
});
