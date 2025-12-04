import * as fs from "node:fs";
import { intro, multiselect, outro } from "@clack/prompts";
import colors from "picocolors";
import type { SchemaObject } from "../../lib/oas/parser/index.js";
import { type RecordAny, traverse } from "../../lib/util/traverse.js";
import type { ExamplesArguments } from "../cmds/generate.js";

export async function examplesHandler(argv: ExamplesArguments) {
  // --- Utilities

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

  // generates an explicit 'example' object
  function generateExample({ node, key, schema }: GenerateExampleProps): any {
    if (node.$ref) {
      const reference = (node.$ref as string)
        .split("/")
        .toSpliced(0, 1)
        .reduce((current, key) => {
          return current?.[key];
        }, schema);
      return generateExample({ node: reference, key, schema });
      // return "TODO: better $ref handling, stack overflow";
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
      const example = generateExample({ node: node.items, key, schema });
      return [example, example];
    }

    // primitives
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

  // --- CLI

  const { schema: schemaFile, paths, mode } = argv;
  console.log({ schemaFile, paths, mode });

  let schema: RecordAny = {};
  if (schemaFile.endsWith(".json")) {
    const json = fs.readFileSync(schemaFile, "utf-8");
    schema = JSON.parse(json);
  }

  // TODO: yaml parsing

  intro(colors.magenta("🧮 Zudoku: Schema Generate"));

  const pathsNeedsExample: TraverseTransformProps[] = [];
  traverse(schema, (node, path) => {
    if (path?.includes("paths")) {
      if (needsExample({ node, path, schema })) {
        pathsNeedsExample.push({ node, path });
      }
    }
    return node;
  });

  const confirmedPaths = (await multiselect({
    message: `Found ${pathsNeedsExample.length} paths. Select to generate:`,
    options: pathsNeedsExample.map(({ node, path }, i) => {
      if (path) {
        const methodIndex = path.findIndex(
          (v) =>
            v.toLowerCase() === "put" ||
            v.toLowerCase() === "post" ||
            v.toLowerCase() === "get" ||
            v.toLowerCase() === "delete",
        );
        const endpoint = path.slice(1, methodIndex);
        const type = path.find((v) => v === "requestBody" || v === "responses");
        return {
          value: i,
          label: `${colors.blue(path[methodIndex]?.toUpperCase())} ${endpoint} ${colors.dim(type === "requestBody" ? "(Request Body)" : "(Response)")}`,
        };
      }
      return { value: i, label: path };
    }),
  })) as number[];

  for (const i of confirmedPaths) {
    if (pathsNeedsExample[i]) {
      const example = generateExample({
        node: pathsNeedsExample?.[i].node,
        key: "example",
        schema,
      });
      console.log({ example });
    }
  }

  outro(colors.magenta("All done. Enjoy Zudoku 🧮"));
}
