import type { CodegenConfig } from "@graphql-codegen/cli";
import fs from "node:fs/promises";

async function fixImports(filePath: string) {
  const data = await fs.readFile(filePath, "utf8");

  const result = data.replaceAll(
    /(import|export) (.*) from (['"])(\.\/[^'"]*)\3/gm,
    (match, keyword, p1, quote, p2) =>
      p2.endsWith(".js")
        ? match
        : `${keyword} ${p1} from ${quote}${p2}.js${quote}`,
  );

  await fs.writeFile(filePath, result, "utf8");
}
const zudokuPkgDir = new URL("../../packages/zudoku", import.meta.url).pathname;

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:9000/__z/graphql",
  documents: `${zudokuPkgDir}/src/lib/plugins/openapi/**/*.tsx`,
  generates: {
    [`${zudokuPkgDir}/src/lib/plugins/openapi/graphql/`]: {
      preset: "client",
      plugins: [],
    },
  },
  config: {
    useTypeImports: true,
    enumsAsTypes: true,
  },
  hooks: {
    afterAllFileWrite: [
      "prettier --write",
      async (...files) => {
        await Promise.all(files.map(fixImports));
      },
    ],
  },
};

export default config;
