import rehypeMermaid, { type RehypeMermaidOptions } from "rehype-mermaid";
import type { ZudokuBuildConfig } from "zudoku";

export default {
  rehypePlugins: (plugins) => [
    [rehypeMermaid, { strategy: "inline-svg" } satisfies RehypeMermaidOptions],
    ...plugins,
  ],
} satisfies ZudokuBuildConfig;
