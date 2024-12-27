import path from "node:path";
import { expect, it } from "vitest";
import { loadZudokuConfig } from "./config.js";

it("Should correctly load zudoku.config.ts file", async () => {
  const rootPath = path.resolve("../../examples/with-config/");
  const { config } = await loadZudokuConfig(
    {
      mode: "development",
      command: "serve",
    },
    rootPath,
  );
  expect(config.__meta.path).includes("/with-config/zudoku.config.");
});
