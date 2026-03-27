import type { PluggableList } from "unified";
import { remarkIf } from "./src/remark-if.js";

export default {
  checkRelativeLinks: "error",
  remarkPlugins: (defaultPlugins: PluggableList) => [
    ...defaultPlugins,
    // cSpell:ignore opensource
    [remarkIf, { mode: "opensource" }],
  ],
};
