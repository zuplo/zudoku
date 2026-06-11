import type { ZudokuConfig } from "zudoku";
import base from "./zudoku.base.js";

// The hand-written layer on top of the generated `zudoku.base.ts`:
// scalars defined here win over the layer, plugins concatenate.
const config: ZudokuConfig = {
  extends: [base],
  site: { title: "Cosmo Cargo" },
  navigation: [
    { type: "doc", file: "home", label: "Welcome" },
    { type: "link", to: "/graphql", label: "GraphQL API" },
  ],
};

export default config;
