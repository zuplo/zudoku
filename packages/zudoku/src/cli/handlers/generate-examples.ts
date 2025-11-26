import * as fs from "node:fs";
import type { ExamplesArguments } from "../cmds/generate.js";
import { generateSchemaExample } from "../../lib/plugins/openapi/util/generateSchemaExample.js";

type Method = "get" | "post" | "put" | "delete";
type Schema = { $ref: string } | { type: string, [key: string]: any};

interface ConfigContent {
  schema: Schema;
  example?: any;
  examples?: any;
}

export async function examplesHandler(argv: ExamplesArguments) {
  const { schema: schemaFile, paths, mode } = argv;
  console.log({ schemaFile, paths, mode }); if (schemaFile.endsWith(".json")) {
    const json = fs.readFileSync(schemaFile, "utf-8");
    const { paths, components } = JSON.parse(json);

    // Multiple ways to have examples show up to RequestBody via "content.type"
    // - having a schema with $ref to a component that has example defined per property
    // - "example" object with properties (not necessarily have to be inline w schema)
    // - "examples" with named keys (eg { "domestic": {...}, "international": {...} })

    // 1. find endpoints without explicit example(s)
    const withoutExamples: ({ path: string, method: Method, side: "req" | "res", type: string, schema: Schema })[] = [];
    Object.entries(paths).map(([path, endpoints]) => {
      Object.entries(endpoints as Record<Method, any>).map(([method, config]) => {
        if (config.requestBody) {
          Object.entries(config.requestBody.content as Record<string, any>).map(([type, content]: [type: string, content: ConfigContent]) => {
            if (!(content?.example || content?.examples)) {
              withoutExamples.push({ path, method: method as Method, side: "req", type, schema: content.schema });
            }
          })
        }
        if (config.responses) {
          Object.entries(config.responses as Record<string, any>).map(([code, info]: [code: string, info: Record<string, any>]) => {
            if (info.content) {
              Object.entries(info.content as Record<string, any>).map(([type, content]: [type: string, content: ConfigContent]) => {
                if (!(content?.example || content?.examples)) {
                  withoutExamples.push({ path, method: method as Method, side: "res", type, schema: content.schema });
                }
              })
            }
          })
        }
      })
    });


    // 2. per route without example...
    withoutExamples.map((route) => {
      // get the current schema
      let currentSchema = route.schema;
      if (route.schema.$ref) {
        const [componentName] = route.schema.$ref.match(/[^\/]+$/);
        const componentSchema = components.schemas[componentName];
        currentSchema = componentSchema;
      }

      // generate based on given schema
      // TODO: remove @ts-ignore
      // @ts-ignore
      const example = generateSchemaExample(currentSchema); // TODO: replace generateSchemaExample algo w faker/OpenAI
      console.log({ currentSchema, example });

      // add example to current route
    });
  }
}
