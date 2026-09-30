import { describe, expect, it } from "vitest";
import type {
  Processor,
  ProcessorArg,
} from "../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../lib/oas/parser/index.js";
import { composeProcessors, schemaConfigurationChanged } from "./plugin-api.js";

describe("schemaConfigurationChanged", () => {
  const apis = {
    type: "file" as const,
    path: "reference",
    input: "./openapi.json",
  };

  it("refreshes schemas when only basePath changes", () => {
    expect(
      schemaConfigurationChanged(
        { apis, basePath: "/" },
        { apis, basePath: "/docs" },
      ),
    ).toBe(true);
  });

  it("does not refresh when schema inputs and basePath are unchanged", () => {
    expect(
      schemaConfigurationChanged(
        { apis, basePath: "/docs" },
        { apis: structuredClone(apis), basePath: "/docs" },
      ),
    ).toBe(false);
  });
});

describe("composeProcessors", () => {
  const schema = {
    openapi: "3.1.0",
    info: { title: "API", version: "1.0.0" },
    paths: {
      "/internal": { "x-internal": true, get: { summary: "Internal" } },
      "/users": {
        get: {
          summary: "List users",
          parameters: [
            { name: "debug", in: "query", "x-internal": true },
            { name: "limit", in: "query" },
          ],
        },
        delete: { summary: "Delete users", "x-internal": true },
      },
      "/flagged": { get: { summary: "Flagged by user processor" } },
    },
  } as unknown as OpenAPIDocument;

  const run = (processors: Processor[]) =>
    processors.reduce<Promise<OpenAPIDocument>>(
      async (acc, processor) =>
        processor({
          schema: await acc,
          file: "/openapi.json",
          params: {},
          dereference: async (s) => s,
        }),
      Promise.resolve(structuredClone(schema)),
    );

  it("removes x-internal paths, operations and parameters without Zuplo processors", async () => {
    const result = await run(composeProcessors([]));

    expect(result.paths?.["/internal"]).toBeUndefined();
    expect(result.paths?.["/users"]?.delete).toBeUndefined();
    expect(result.paths?.["/users"]?.get?.parameters).toEqual([
      { name: "limit", in: "query" },
    ]);
  });

  it("runs after user processors and before Zuplo processors", async () => {
    const markInternal: Processor = ({ schema }: ProcessorArg) => ({
      ...schema,
      paths: {
        ...schema.paths,
        "/flagged": { ...schema.paths?.["/flagged"], "x-internal": true },
      },
    });
    const seenByZuplo: string[][] = [];
    const zuploProcessor: Processor = ({ schema }: ProcessorArg) => {
      seenByZuplo.push(Object.keys(schema.paths ?? {}));
      return schema;
    };

    const result = await run(
      composeProcessors([markInternal], [zuploProcessor]),
    );

    expect(result.paths?.["/flagged"]).toBeUndefined();
    expect(seenByZuplo).toEqual([["/users"]]);
  });
});
