import path from "node:path";
import { getZudokuConfig, type Plugin } from "zudoku/vite";
import { inspectZuploContext } from "./src/context/inspect.js";

const VIRTUAL_ID = "virtual:zuplo-context";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

// The node-only entry must never end up in client/server bundles; they read
// the baked virtual context instead, so it is replaced with an empty stub.
const NODE_ENTRY_ID = "@zuplo/zudoku/node";
const RESOLVED_NODE_STUB_ID = "\0zuplo-node-stub";

export const zuploVitePlugin = (): Plugin => ({
  name: "zuplo-zudoku",
  resolveId(id) {
    if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    if (id === NODE_ENTRY_ID) return RESOLVED_NODE_STUB_ID;
  },
  async load(id) {
    if (id === RESOLVED_NODE_STUB_ID) {
      return "export const inspectZuploContext = undefined; export const getProcessors = undefined;";
    }
    if (id !== RESOLVED_VIRTUAL_ID) return;

    const rootDir = getZudokuConfig().__meta.rootDir;
    const context = await inspectZuploContext({ rootDir });

    // Reload when a scanned OpenAPI file changes (e.g. routes marked as
    // GraphQL endpoints are added or removed)
    for (const fileName of context.configFiles) {
      this.addWatchFile(path.resolve(rootDir, "../config", fileName));
    }

    return `export const zuploContext = ${JSON.stringify(context)};`;
  },
});
