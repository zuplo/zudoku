import * as fs from "node:fs";
import type { ExamplesArguments } from "../cmds/generate.js";
import { RecordAny, traverse } from "../../lib/util/traverse.js";

export async function examplesHandler(argv: ExamplesArguments) {
  const { schema: schemaFile, paths, mode } = argv;
  console.log({ schemaFile, paths, mode });

  const needsExamplePaths: { node: RecordAny, path: string[] }[] = []
  function needsExample(node: RecordAny, path: string[]) {
    // check if the path has a request body or responses
    if (path.includes("requestBody") || path.includes("responses")) {
      // check if the current [1] endpoint and [2] http method is accounted for
      if (!(needsExamplePaths.filter((p) => p.path[1] === path[1] && p.path[2] === path[2]).length > 0)) {
        // check if current node path has a schema to work on
        if (path.includes("schema")) {
          needsExamplePaths.push({ node, path });
        }
      }
    }
  }

  if (schemaFile.endsWith(".json")) {
    const json = fs.readFileSync(schemaFile, "utf-8");
    const schema = JSON.parse(json);

    // Multiple ways to have examples show up to RequestBody via "content.type"
    // - having a schema with $ref to a component that has example defined per property
    // - "example" object with properties (not necessarily have to be inline w schema)
    // - "examples" with named keys (eg { "domestic": {...}, "international": {...} })

    // 1. find endpoints without explicit example(s)
    traverse(schema, (node, path) => {
      // if the current node is a path
      if (path?.includes("paths")) {
        needsExample(node, path)
      }
      return node;
    });


    console.log(needsExamplePaths);
  }
}
