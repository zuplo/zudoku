import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";
import fs from "node:fs/promises";
import { schema } from "./lib/oas/graphql/index.js";

async function fixImports(filePath: string) {
  const data = await fs.readFile(filePath, "utf8");

  // Handle imports/exports
  let result = data.replace(
    /(import|export) (.*) from (['"])(\.\/[^'"]*)\3/g,
    (match, keyword, p1, quote, p2) =>
      p2.endsWith(".js")
        ? match
        : `${keyword} ${p1} from ${quote}${p2}.js${quote}`,
  );

  // Handle dynamic imports
  result = result.replace(
    /import\((['"])(\.\/[^'"]*)\1\)/g,
    (match, quote, p2) =>
      p2.endsWith(".js") ? match : `import(${quote}${p2}.js${quote})`,
  );

  await fs.writeFile(filePath, result, "utf8");
}

const config: CodegenConfig = {
  schema: printSchema(schema),
  documents: ["src/lib/plugins/openapi/**/*.tsx"],
  generates: {
    ["./src/lib/plugins/openapi/graphql/"]: {
      preset: "client",
      config: {
        documentMode: "string",
      },
    },
    "schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
      },
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
