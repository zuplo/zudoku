import { describe, expect, it } from "vitest";
import { dereference } from "./index.js";

describe("dereference", () => {
  it("should resolve basic $ref", async () => {
    const schema = {
      components: {
        schemas: {
          Pet: { type: "object", properties: { name: { type: "string" } } },
        },
      },
      paths: {
        "/pets": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Pet" },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await dereference(schema);
    const responseSchema =
      result.paths["/pets"].get.responses["200"].content["application/json"]
        .schema;

    expect(responseSchema.type).toBe("object");
    expect(responseSchema.properties.name.type).toBe("string");
  });

  it("should preserve OAS 3.1 sibling properties alongside $ref", async () => {
    const schema = {
      components: {
        schemas: {
          Child: { type: "string" },
        },
      },
      paths: {
        "/test": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        field: {
                          $ref: "#/components/schemas/Child",
                          description: "Overridden description",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await dereference(schema);
    const field =
      result.paths["/test"].get.responses["200"].content["application/json"]
        .schema.properties.field;

    expect(field.type).toBe("string");
    expect(field.description).toBe("Overridden description");
  });

  it("should preserve sibling descriptions in nested $ref'd schemas", async () => {
    // Reproduces https://github.com/zuplo/zudoku/issues/2191
    const schema = {
      components: {
        schemas: {
          Child: { type: "string" },
          ObjectContainingRef: {
            type: "object",
            properties: {
              child: {
                $ref: "#/components/schemas/Child",
                description: "Description for ObjectContainingRef.child",
              },
            },
          },
          Parent: {
            type: "object",
            properties: {
              childObject: {
                type: "object",
                properties: {
                  child: {
                    $ref: "#/components/schemas/Child",
                    description: "Inline description for childObject.child",
                  },
                },
              },
              childObjectRef: {
                $ref: "#/components/schemas/ObjectContainingRef",
              },
              childObjectArray: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    child: {
                      $ref: "#/components/schemas/Child",
                      description:
                        "Inline description for childObjectArray.[].child",
                    },
                  },
                },
              },
              childObjectArrayRef: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/ObjectContainingRef",
                },
              },
            },
          },
        },
      },
    };

    const result = await dereference(schema);
    const parent = result.components.schemas.Parent;

    // Inline object: description preserved
    expect(parent.properties.childObject.properties.child.description).toBe(
      "Inline description for childObject.child",
    );

    // $ref'd object: description preserved (the reported bug)
    expect(parent.properties.childObjectRef.properties.child.description).toBe(
      "Description for ObjectContainingRef.child",
    );

    // Inline array items: description preserved
    expect(
      parent.properties.childObjectArray.items.properties.child.description,
    ).toBe("Inline description for childObjectArray.[].child");

    // $ref'd array items: description preserved (the reported bug)
    expect(
      parent.properties.childObjectArrayRef.items.properties.child.description,
    ).toBe("Description for ObjectContainingRef.child");
  });

  it("should let sibling properties override referenced properties", async () => {
    const schema = {
      components: {
        schemas: {
          Base: {
            type: "object",
            description: "Base description",
            properties: { id: { type: "string" } },
          },
        },
      },
      paths: {
        "/test": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Base",
                      description: "Overridden description",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await dereference(schema);
    const responseSchema =
      result.paths["/test"].get.responses["200"].content["application/json"]
        .schema;

    // Sibling description overrides the referenced schema's description
    expect(responseSchema.description).toBe("Overridden description");
    expect(responseSchema.properties.id.type).toBe("string");
  });
});
