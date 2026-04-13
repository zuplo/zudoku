import { describe, expect, it } from "vitest";
import type { ResponseItem } from "../graphql/graphql.js";
import { resolveResponseExamples } from "./resolveResponseExamples.js";

const makeResponse = (
  statusCode: string,
  opts: {
    schema?: Record<string, unknown>;
    examples?: Array<{ name: string; value?: unknown }>;
  } = {},
): ResponseItem =>
  ({
    statusCode,
    description: null,
    content: [
      {
        mediaType: "application/json",
        schema: opts.schema ?? null,
        examples: opts.examples ?? [],
        encoding: null,
      },
    ],
  }) as ResponseItem;

const examplesOf = (result: ResponseItem[], index: number) =>
  result[index]?.content?.at(0)?.examples;

describe("resolveResponseExamples", () => {
  it("generates examples from schema when response has no explicit examples", () => {
    const responses = [
      makeResponse("200", {
        schema: { type: "object", properties: { id: { type: "integer" } } },
      }),
    ];

    const result = resolveResponseExamples(responses);

    expect(examplesOf(result, 0)).toEqual([{ name: "", value: { id: 0 } }]);
  });

  it("keeps explicit examples as-is", () => {
    const explicit = [{ name: "success", value: { id: 42 } }];
    const responses = [
      makeResponse("200", {
        schema: { type: "object", properties: { id: { type: "integer" } } },
        examples: explicit,
      }),
    ];

    const result = resolveResponseExamples(responses);

    expect(examplesOf(result, 0)).toEqual(explicit);
  });

  it("handles mixed: explicit examples on some responses, generated on others", () => {
    const responses = [
      makeResponse("200", {
        schema: { type: "object", properties: { id: { type: "integer" } } },
        examples: [{ name: "ok", value: { id: 1 } }],
      }),
      makeResponse("400", {
        schema: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      }),
    ];

    const result = resolveResponseExamples(responses);

    // 200 keeps explicit example
    expect(examplesOf(result, 0)).toEqual([{ name: "ok", value: { id: 1 } }]);
    // 400 gets generated example
    expect(examplesOf(result, 1)).toEqual([
      { name: "", value: { error: "error" } },
    ]);
  });

  it("generates for all responses when none have explicit examples", () => {
    const responses = [
      makeResponse("200", {
        schema: { type: "object", properties: { ok: { type: "boolean" } } },
      }),
      makeResponse("500", {
        schema: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      }),
    ];

    const result = resolveResponseExamples(responses);

    expect(examplesOf(result, 0)).toEqual([{ name: "", value: { ok: true } }]);
    expect(examplesOf(result, 1)).toEqual([
      { name: "", value: { message: "message" } },
    ]);
  });

  it("preserves empty examples when response has no schema", () => {
    const responses = [makeResponse("204")];

    const result = resolveResponseExamples(responses);

    expect(examplesOf(result, 0)).toEqual([]);
  });

  it("handles response with null content", () => {
    const response = {
      statusCode: "204",
      description: null,
      content: null,
    } as ResponseItem;

    const result = resolveResponseExamples([response]);

    expect(result[0]?.content).toBeFalsy();
  });
});
