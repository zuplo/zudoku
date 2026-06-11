import type { ZudokuConfig } from "zudoku";

// The hand-written layer on top of the generated `zudoku.base.ts`. The layer
// is referenced lazily (tsconfig-style) because it doesn't exist until
// `zudoku generate` runs — see the dev/build scripts in package.json.
// Scalars defined here win over the layer, plugins concatenate.
const config: ZudokuConfig = {
  extends: ["./zudoku.base"],
  site: { title: "Cosmo Cargo" },
  navigation: [
    { type: "doc", file: "home", label: "Welcome" },
    { type: "link", to: "/graphql", label: "GraphQL API" },
  ],
};

export default config;
