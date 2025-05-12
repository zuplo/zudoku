import { describe, expect, it } from "vitest";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { removeParameters } from "./removeParameters.js";

const baseDoc: OpenAPIDocument = {
  openapi: "3.1.0",
  info: {
    title: "Test API",
    version: "1.0.0",
  },
  components: {
    parameters: {
      commonParam: {
        name: "commonParam",
        in: "query",
        schema: { type: "string" },
      },
      headerParam: {
        name: "headerParam",
        in: "header",
        schema: { type: "string" },
      },
    },
  },
  paths: {
    "/test": {
      parameters: [
        {
          name: "pathParam",
          in: "path",
          schema: { type: "string" },
          required: true,
        },
        {
          name: "pathHeader",
          in: "header",
          schema: { type: "string" },
          required: true,
        },
      ],
      get: {
        parameters: [
          {
            name: "opParam",
            in: "query",
            schema: { type: "string" },
            required: true,
          },
          {
            name: "opHeader",
            in: "header",
            schema: { type: "string" },
            required: true,
          },
        ],
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },
  },
};

describe("removeParameters", () => {
  it("removes parameters by name", () => {
    const processed = removeParameters({
      names: ["pathParam", "opParam"],
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed.paths?.["/test"]?.parameters).toHaveLength(1);
    expect(processed.paths?.["/test"]?.parameters?.[0]?.name).toBe(
      "pathHeader",
    );
    expect(processed.paths?.["/test"]?.get?.parameters).toHaveLength(1);
    expect(processed.paths?.["/test"]?.get?.parameters?.[0]?.name).toBe(
      "opHeader",
    );
  });

  it("removes parameters by location", () => {
    const processed = removeParameters({
      in: ["header"],
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed.paths?.["/test"]?.parameters).toHaveLength(1);
    expect(processed.paths?.["/test"]?.parameters?.[0]?.in).toBe("path");
    expect(processed.paths?.["/test"]?.get?.parameters).toHaveLength(1);
    expect(processed.paths?.["/test"]?.get?.parameters?.[0]?.in).toBe("query");
  });

  it("removes parameters using shouldRemove callback", () => {
    const processed = removeParameters({
      shouldRemove: ({ parameter }) =>
        parameter.in === "header" && parameter.name.includes("op"),
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed.paths?.["/test"]?.parameters).toHaveLength(2);
    expect(processed.paths?.["/test"]?.get?.parameters).toHaveLength(1);
    expect(processed.paths?.["/test"]?.get?.parameters?.[0]?.name).toBe(
      "opParam",
    );
  });

  it("combines multiple removal criteria", () => {
    const processed = removeParameters({
      in: ["query", "header"],
      shouldRemove: ({ parameter }) => parameter.name === "pathHeader",
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed.paths?.["/test"]?.parameters).toHaveLength(1);
    expect(processed.paths?.["/test"]?.parameters?.[0]?.name).toBe("pathParam");
    expect(processed.paths?.["/test"]?.get?.parameters).toHaveLength(0);
  });

  it("handles missing parameters arrays", () => {
    const docWithoutParams = {
      openapi: "3.1.0",
      paths: {
        "/test": {
          get: {
            summary: "Test endpoint",
          },
        },
      },
    } as any;

    const processed = removeParameters({
      names: ["someParam"],
    })({
      schema: docWithoutParams,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed).toEqual(docWithoutParams);
  });

  it("preserves non-parameter properties", () => {
    const processed = removeParameters({
      names: ["globalParam"],
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed.openapi).toBe("3.1.0");
    expect(processed.paths?.["/test"]?.get).toBeDefined();
  });

  it("removes parameters from components", () => {
    const processed = removeParameters({
      in: ["header"],
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(Object.keys(processed.components?.parameters ?? {})).toHaveLength(1);
    expect(processed.components?.parameters?.commonParam).toBeDefined();
    expect(processed.components?.parameters?.headerParam).toBeUndefined();
  });
});
