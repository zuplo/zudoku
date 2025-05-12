import { describe, expect, it } from "vitest";
import { removeExtensions } from "./removeExtensions.js";

const baseDoc = {
  openapi: "3.1.0",
  "x-root-ext": "remove me",
  "x-zuplo-ext": "remove me too",
  info: {
    title: "Test API",
    version: "1.0.0",
    "x-info-ext": "remove me",
    "x-zuplo-info": "remove me too",
  },
  paths: {
    "/test": {
      "x-path-ext": "remove me",
      "x-zuplo-path": "remove me too",
      parameters: [
        {
          name: "param1",
          in: "query",
          schema: { type: "string" },
          "x-param-ext": "remove me",
          "x-zuplo-param": "remove me too",
        },
      ],
      get: {
        "x-operation-ext": "remove me",
        "x-zuplo-route": "remove me too",
        responses: {
          "200": {
            description: "OK",
            "x-response-ext": "remove me",
            "x-zuplo-response": "remove me too",
          },
        },
        parameters: [
          {
            name: "opParam1",
            in: "header",
            schema: { type: "string" },
            "x-op-param-ext": "remove me",
            "x-zuplo-param": "remove me too",
          },
        ],
      },
    },
  },
  tags: [
    {
      name: "example",
      "x-tag-ext": "remove me",
      "x-zuplo-tag": "remove me too",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        name: "api_key",
        in: "header",
        "x-security-ext": "remove me",
        "x-zuplo-security": "remove me too",
      },
    },
  },
} as any;

describe("removeExtensions", () => {
  it("removes all x- extensions by default", () => {
    const processed = removeExtensions()({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    const removedExtensions = [
      "x-root-ext",
      "info.x-info-ext",
      "paths./test.x-path-ext",
      "paths./test.parameters[0].x-param-ext",
      "paths./test.get.x-operation-ext",
      "paths./test.get.responses.200.x-response-ext",
      "paths./test.get.parameters[0].x-op-param-ext",
      "tags[0].x-tag-ext",
      "components.securitySchemes.ApiKeyAuth.x-security-ext",
    ];

    removedExtensions.forEach((ext) => {
      expect(processed).not.toHaveProperty(ext.split("."));
    });

    // Assert that non-x- fields remain unchanged
    expect(processed.openapi).toBe("3.1.0");
    expect(processed.info.title).toBe("Test API");
    expect(processed).toHaveProperty(
      ["paths", "/test", "get", "responses", "200", "description"],
      "OK",
    );
    expect(processed.tags?.[0]?.name).toBe("example");
  });

  it("removes only specified x- extensions when names are provided", () => {
    const docWithExtraExtensions = {
      ...baseDoc,
      info: { ...baseDoc.info, "x-other-ext": "keep me" },
    };

    const processed = removeExtensions({
      keys: ["x-path-ext", "x-param-ext"],
    })({
      schema: docWithExtraExtensions,
      file: "/file.json",
      dereference: async (id) => id,
    }) as any;

    // Assert specified extensions are removed
    expect(processed.paths["/test"]["x-path-ext"]).toBeUndefined();
    expect(
      processed.paths["/test"].parameters[0]["x-param-ext"],
    ).toBeUndefined();

    // Assert other x- fields remain
    expect(processed["x-root-ext"]).toBe("remove me");
    expect(processed.info["x-info-ext"]).toBe("remove me");
    expect(processed.info["x-other-ext"]).toBe("keep me");
  });

  it("handles deeply nested extensions", () => {
    const deeplyNested = {
      a: {
        b: {
          c: {
            "x-deep-ext": "remove me",
            d: {
              e: "value",
              "x-another-ext": "remove me",
            },
          },
        },
      },
    } as any;

    const processed = removeExtensions()({
      schema: deeplyNested,
      file: "/file.json",
      dereference: async (id) => id,
    }) as any;

    expect(processed.a.b.c["x-deep-ext"]).toBeUndefined();
    expect(processed.a.b.c.d["x-another-ext"]).toBeUndefined();
    expect(processed.a.b.c.d.e).toBe("value");
  });

  it("does nothing if no x- extensions are present", () => {
    const docWithoutExtensions = {
      openapi: "3.1.0",
      info: { title: "API without extensions" },
    } as any;

    const processed = removeExtensions()({
      schema: docWithoutExtensions,
      file: "/file.json",
      dereference: async (id) => id,
    });

    expect(processed).toEqual(docWithoutExtensions);
  });

  it("removes extensions based on shouldRemove callback", () => {
    const processed = removeExtensions({
      shouldRemove: (key) => key.startsWith("x-zuplo"),
    })({
      schema: baseDoc,
      file: "/file.json",
      dereference: async (id) => id,
    });

    // Should remove x-zuplo extensions
    const removedExtensions = [
      "x-zuplo-ext",
      "info.x-zuplo-info",
      "paths./test.x-zuplo-path",
      "paths./test.parameters.0.x-zuplo-param",
      "paths./test.get.x-zuplo-route",
      "paths./test.get.responses.200.x-zuplo-response",
      "paths./test.get.parameters.0.x-zuplo-param",
      "tags.0.x-zuplo-tag",
      "components.securitySchemes.ApiKeyAuth.x-zuplo-security",
    ];

    // Should keep other x- extensions
    const keptExtensions = [
      "x-root-ext",
      "info.x-info-ext",
      "paths./test.x-path-ext",
      "paths./test.parameters.0.x-param-ext",
      "paths./test.get.x-operation-ext",
      "paths./test.get.responses.200.x-response-ext",
      "paths./test.get.parameters.0.x-op-param-ext",
      "tags.0.x-tag-ext",
      "components.securitySchemes.ApiKeyAuth.x-security-ext",
    ];

    removedExtensions.forEach((ext) => {
      expect(processed).not.toHaveProperty(ext.split("."));
    });

    keptExtensions.forEach((ext) => {
      expect(processed).toHaveProperty(ext.split("."));
    });

    // Assert that non-x- fields remain unchanged
    expect(processed).toHaveProperty("openapi", "3.1.0");
    expect(processed).toHaveProperty("info.title", "Test API");
    expect(processed).toHaveProperty(
      "paths./test.get.responses.200.description",
      "OK",
    );
    expect(processed).toHaveProperty("tags.0.name", "example");
  });
});
