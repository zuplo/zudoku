import os from "node:os";
import type { ZudokuBuildConfig } from "zudoku";

const buildConfig: ZudokuBuildConfig = {
  processors: [
    async ({ schema }) => {
      schema.info.description = `${schema.info.description}\n\n----\nThis schema was processed by a build processor at **${new Date().toLocaleString()}**. See more in the [build configuration guide](https://zudoku.dev/docs/guides/processors).`;

      return schema;
    },
  ],
  prerender: {
    workers: Math.floor(os.cpus().length * 0.75),
  },
};

export default buildConfig;
