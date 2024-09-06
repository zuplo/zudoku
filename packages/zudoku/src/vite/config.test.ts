import assert from "node:assert";
import path from "node:path";
import test from "node:test";
import { loadZudokuConfig } from "./config.js";

test("Should correctly load zudoku.config.ts file", async () => {
  const rootPath = path.resolve("../../examples/with-config/");
  const config = await loadZudokuConfig(rootPath);
  assert.equal(config.metadata?.title, "My Portal");
});
