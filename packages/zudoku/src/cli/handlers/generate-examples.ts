import * as fs from "node:fs";
import type { ExamplesArguments } from "../cmds/generate.js";
import { RecordAny, traverse } from "../../lib/util/traverse.js";

export async function examplesHandler(argv: ExamplesArguments) {
  const { schema: schemaFile, paths, mode } = argv;
  console.log({ schemaFile, paths, mode });

  const needsExamplePaths: { node: RecordAny, path: string[] }[] = []

  type TraverseTransformProps = {
    node: RecordAny;
    path: string[] | undefined;
  };

  function needsExample({ node, path, schema }: TraverseTransformProps & { schema: RecordAny }) {
    // Multiple ways to have examples show up to RequestBody/Responses via "content.type"
    // - having a schema with $ref to a component that has example defined per property
    // - "example" object with properties (not necessarily have to be inline w schema)
    // - "examples" with named keys (eg { "domestic": {...}, "international": {...} })

    // check if the path has a request body or responses
    if (path && (path.includes("requestBody") || path.includes("responses"))) {
      // check if the current [1] endpoint and [2] http method is accounted for
      if (!(needsExamplePaths.filter((p) => p.path[1] === path[1] && p.path[2] === path[2]).length > 0)) {

        // check if current node path has a schema to work on and no examples
        if (path.indexOf("schema") === path.length - 1) {

          // check if explicit examples already exist
          const existingExample = path.toSpliced(path.length-1, 1, "example").reduce((current, key) => {
            return current?.[key];
          }, schema);
          const existingExamples = path.toSpliced(path.length-1, 1, "examples").reduce((current, key) => {
            return current?.[key];
          }, schema);

          if (!existingExample && !existingExamples) {
            needsExamplePaths.push({ node, path });
            return true;
          }
        }
      }
    }
    return false;
  }

  function writeExample({ node, path }: TraverseTransformProps) {
    return node;
  }

  if (schemaFile.endsWith(".json")) {
    const json = fs.readFileSync(schemaFile, "utf-8");
    const schema = JSON.parse(json);

    traverse(schema, (node, path) => {
      // 1. find endpoints without explicit example(s)
      if (path?.includes("paths")) {
        needsExample({ node, path, schema }) ? console.log({ node, path }) : node;
      }
      return node;
    });
  }
}
