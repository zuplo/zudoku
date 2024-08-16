/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert";
import test from "node:test";
import { checkTypescriptString } from "../ts.js";
import viteDocsPlugin from "./plugin-docs.js";

test("Builds code", async () => {
  const plugin = viteDocsPlugin({
    docs: { files: "docs/**/*.md" },
  } as any);
  if (!plugin.load) {
    throw new Error("Plugin does not have a load function");
  }
  if (typeof plugin.load !== "function") {
    throw new Error("Plugin.load is not a function");
  }

  const result = await plugin.load.call(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as any,
    "\0virtual:markdown-plugins",
  );
  if (result && typeof result === "object" && "code" in result) {
    const diagnostics = await checkTypescriptString(result.code);
    if (diagnostics.length > 0) {
      console.error(diagnostics);
    }
    assert.equal(diagnostics.length, 0);
  } else {
    assert.fail("Invalid return value from plugin.load");
  }
});
