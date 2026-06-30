import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "dist/**"],
  },
});
