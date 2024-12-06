import { describe, expect, it } from "vitest";
import { removeExtensions } from "./removeExtensions.js";

const baseDoc = {
  openapi: "3.1.0",
  "x-root-ext": "remove me",
  info: {
    title: "Test API",
    version: "1.0.0",
    "x-info-ext": "remove me",
  },
  paths: {
    "/test": {
      "x-path-ext": "remove me",
      parameters: [
        {
          name: "param1",
          in: "query",
          schema: { type: "string" },
          "x-param-ext": "remove me",
        },
      ],
      get: {
        "x-operation-ext": "remove me",
        responses: {
          "200": {
            description: "OK",
            "x-response-ext": "remove me",
          },
        },
        parameters: [
          {
            name: "opParam1",
            in: "header",
            schema: { type: "string" },
            "x-op-param-ext": "remove me",
          },
        ],
      },
    },
  },
  tags: [
    {
      name: "example",
      "x-tag-ext": "remove me",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        name: "api_key",
        in: "header",
        "x-security-ext": "remove me",
      },
    },
  },
};

describe("removeExtensions", () => {
  it("removes all x- extensions by default", () => {
    const processed = removeExtensions()(baseDoc);

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
    expect(processed.tags[0].name).toBe("example");
  });

  it("removes only specified x- extensions when names are provided", () => {
    const docWithExtraExtensions = {
      ...baseDoc,
      info: { ...baseDoc.info, "x-other-ext": "keep me" },
    };

    const processed = removeExtensions({
      keys: ["x-path-ext", "x-param-ext"],
    })(docWithExtraExtensions);

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
    };

    const processed = removeExtensions()(deeplyNested);

    expect(processed.a.b.c["x-deep-ext"]).toBeUndefined();
    expect(processed.a.b.c.d["x-another-ext"]).toBeUndefined();
    expect(processed.a.b.c.d.e).toBe("value");
  });

  it("does nothing if no x- extensions are present", () => {
    const docWithoutExtensions = {
      openapi: "3.1.0",
      info: { title: "API without extensions" },
    };

    const processed = removeExtensions()(docWithoutExtensions);

    expect(processed).toEqual(docWithoutExtensions);
  });
});
