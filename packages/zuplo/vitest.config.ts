import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      // Stub the virtual modules that are provided by Vite plugins at build time
      "virtual:zuplo-context": fileURLToPath(
        new URL("./src/test/virtual-zuplo-context.ts", import.meta.url),
      ),
      "virtual:@zudoku/plugin-graphql/schema": fileURLToPath(
        new URL("./src/test/virtual-graphql-schema.ts", import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "dist/**"],
  },
});
