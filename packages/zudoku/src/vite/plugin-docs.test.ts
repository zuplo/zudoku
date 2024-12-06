/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "vitest";
import viteDocsPlugin from "./plugin-docs.js";

test.skip("Builds code", async () => {
  const plugin = viteDocsPlugin(
    () => ({ docs: { files: "docs/**/*.md" } }) as any,
  );
  if (typeof plugin.load !== "function") {
    throw new Error("Plugin.load is not a function");
  }

  const code = await plugin.load.call(
    {} as any,
    "\0virtual:zudoku-docs-plugins",
  );

  // TODO: Fix this test
  // if (typeof code === "string") {
  //   const diagnostics = await checkTypescriptString(code);
  //   if (diagnostics.length > 0) {
  //     console.error(diagnostics);
  //   }
  //   console.log(diagnostics);
  //   expect(diagnostics).toHaveLength(0);
  // } else {
  //   expect.fail("Invalid return value from plugin.load");
  // }
});
