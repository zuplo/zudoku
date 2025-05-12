import { type ZudokuBuildConfig } from "zudoku";

const buildConfig: ZudokuBuildConfig = {
  processors: [
    async ({ file, schema }) => {
      schema.info.description = `${schema.info.description}\n\nThis schema was processed by a build processor in ${file}. See more in the [build configuration guide](https://zudoku.dev/docs/guides/processors).`;

      return schema;
    },
  ],
};

export default buildConfig;
