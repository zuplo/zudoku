import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "dist/**"],
    // Runs the *.test-d.ts type tests (e.g. the preset descriptor drift guard)
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
    },
  },
});
