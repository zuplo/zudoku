// Node-only entry: inspects the Zuplo project from disk and builds the OpenAPI
// schema processors. The companion Vite plugin stubs this module out in
// client/server bundles, which read the baked `virtual:zuplo-context` instead.
export { inspectZuploContext } from "./context/inspect.js";
export { getProcessors } from "./processors/index.js";
