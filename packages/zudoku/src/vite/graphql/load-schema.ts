import fs from "node:fs/promises";
import path from "node:path";
import {
  buildSchema,
  getIntrospectionQuery,
  introspectionFromSchema,
  type IntrospectionQuery,
} from "graphql";

export type SchemaSource =
  | { type: "url"; input: string; headers?: Record<string, string> }
  | { type: "file"; input: string };

export const loadSchema = async (
  source: SchemaSource,
  rootDir: string,
): Promise<IntrospectionQuery> => {
  if (source.type === "url") {
    const response = await fetch(source.input, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...source.headers },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch GraphQL schema from ${source.input}: ${response.statusText}`,
      );
    }
    const json = (await response.json()) as { data: IntrospectionQuery };
    return json.data;
  }

  const filePath = path.isAbsolute(source.input)
    ? source.input
    : path.join(rootDir, source.input);
  const sdl = await fs.readFile(filePath, "utf-8");

  return introspectionFromSchema(buildSchema(sdl));
};
