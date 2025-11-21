import * as fs from "node:fs";
import type { ExamplesArguments } from "../cmds/generate.js";

type Method = "get" | "post" | "put" | "delete";

export async function examplesHandler(argv: ExamplesArguments) {
  const { schema, paths, mode } = argv;
  console.log({ schema, paths, mode });
  if (schema.endsWith(".json")) {
    const json = fs.readFileSync(schema, "utf-8");
    const { paths, components } = JSON.parse(json);

    // Multiple ways to have examples show up to RequestBody via "content.type"
    // - having a schema with $ref to a component that has example defined per property
    // - "example" object with properties (not necessarily have to be inline w schema)
    // - "examples" with named keys (eg { "domestic": {...}, "international": {...} })

    const withoutExamples: { path: string, method: Method, type: string, schema: Schema }[] = [];
    Object.entries(paths).map(([path, endpoints]) => {
      Object.entries(endpoints as Record<Method, any>).map(([method, config]) => {
        if (config.requestBody) {
          Object.entries(config.requestBody.content as Record<string, any>).map(([type, content]: [type: string, content: ConfigContent]) => {
            if (!(content?.example || content?.examples)) {
              withoutExamples.push({ path, method: method as Method, type, schema: content.schema });
            }
          })
        }
      })
    });

    console.log({ withoutExamples });
  }
}

type Schema = { $ref: string } | { type: string }

interface ConfigContent {
  schema: Schema;
  example?: any;
  examples?: any;
}
