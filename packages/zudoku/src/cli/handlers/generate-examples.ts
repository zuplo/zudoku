import * as fs from "node:fs";
import type { SchemaObject } from "../../lib/oas/parser/index.js";
import { type RecordAny, traverse } from "../../lib/util/traverse.js";
import type { ExamplesArguments } from "../cmds/generate.js";

export async function examplesHandler(argv: ExamplesArguments) {
  const { schema: schemaFile, paths, mode } = argv;
  console.log({ schemaFile, paths, mode });

  const needsExamplePaths: { node: RecordAny; path: string[] }[] = [];

  type TraverseTransformProps = {
    node: RecordAny;
    path: string[] | undefined;
  };

  function needsExample({
    node,
    path,
    schema,
  }: TraverseTransformProps & { schema: RecordAny }) {
    // Multiple ways to have examples show up to RequestBody/Responses via "content.type"
    // - having a schema with $ref to a component that has example defined per property
    // - "example" object with properties (not necessarily have to be inline w schema)
    // - "examples" with named keys (eg { "domestic": {...}, "international": {...} })

    // check if the path has a request body or responses
    if (path && (path.includes("requestBody") || path.includes("responses"))) {
      // check if the current [1] endpoint and [2] http method is accounted for
      if (
        !(
          needsExamplePaths.filter(
            (p) => p.path[1] === path[1] && p.path[2] === path[2],
          ).length > 0
        )
      ) {
        // check if current node path has a schema to work on and no examples
        if (path.indexOf("schema") === path.length - 1) {
          // check if explicit examples already exist
          const existingExample = path
            .toSpliced(path.length - 1, 1, "example")
            .reduce((current, key) => {
              return current?.[key];
            }, schema);
          const existingExamples = path
            .toSpliced(path.length - 1, 1, "examples")
            .reduce((current, key) => {
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

  type SchemaNode = SchemaObject & { $ref?: string };
  type GenerateExampleProps = {
    node: SchemaNode;
    key: string;
    schema: RecordAny;
  };

  function generateExample({ node, key, schema }: GenerateExampleProps): any {
    if (node.$ref) {
      const reference = (node.$ref as string)
        .split("/")
        .toSpliced(0, 1)
        .reduce((current, key) => {
          return current?.[key];
        }, schema);
      return generateExample({ node: reference, key, schema });
    }

    if (node.type === "object" && node.properties) {
      // go through each property key and recursively run this fn
      const result: RecordAny = {};
      for (const [prop, propSchema] of Object.entries(node.properties)) {
        if (typeof propSchema === "object") {
          result[prop] = generateExample({
            node: propSchema,
            key: prop,
            schema,
          });
        }
      }
      return result;
    }

    if (node.type === "array" && node.items) {
      // go through each items key and recursively run this fn twice
      return [
        generateExample({ node: node.items, key, schema }),
        generateExample({ node: node.items, key, schema }),
      ];
    }

    switch (node.type) {
      case "null":
        return null;
      case "boolean":
        return true;
      case "string":
        return "Bob";
      case "number":
      case "integer":
        return 123;
      default:
        return "Unaccounted type";
    }
  }

  if (schemaFile.endsWith(".json")) {
    const json = fs.readFileSync(schemaFile, "utf-8");
    const schema = JSON.parse(json);

    traverse(schema, (node, path) => {
      if (path?.includes("paths")) {
        if (needsExample({ node, path, schema })) {
          const example = generateExample({ node, key: "example", schema });
          console.log(
            JSON.stringify(example),
            "\n|",
            JSON.stringify(node),
            "\n",
          );
        }
      }
      return node;
    });
  }
}
