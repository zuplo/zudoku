// biome-ignore-all lint/suspicious/noExplicitAny: Allow any type
import { describe, expect, it } from "vitest";
import { dereference } from "./index.js";

const deref = (schema: Record<string, any>) =>
  dereference(schema) as Promise<Record<string, any>>;

describe("dereference", () => {
  it("should preserve sibling properties on $ref", async () => {
    const result = await deref({
      components: {
        schemas: {
          Child: { type: "string" },
          ObjectContainingRef: {
            type: "object",
            properties: {
              child: {
                $ref: "#/components/schemas/Child",
                description: "Override description",
              },
            },
          },
        },
      },
    });

    expect(
      result.components.schemas.ObjectContainingRef.properties.child,
    ).toEqual({
      type: "string",
      description: "Override description",
    });
  });

  it("should preserve sibling properties in nested $ref chains", async () => {
    const result = await deref({
      components: {
        schemas: {
          Child: { type: "string" },
          ObjectContainingRef: {
            type: "object",
            properties: {
              child: {
                $ref: "#/components/schemas/Child",
                description: "Description for child",
              },
            },
          },
          Parent: {
            type: "object",
            properties: {
              childObjectRef: {
                $ref: "#/components/schemas/ObjectContainingRef",
              },
            },
          },
        },
      },
    });

    const child =
      result.components.schemas.Parent.properties.childObjectRef.properties
        .child;
    expect(child.type).toBe("string");
    expect(child.description).toBe("Description for child");
  });

  it("should let sibling description override the referenced schema description", async () => {
    const result = await deref({
      components: {
        schemas: {
          Pet: {
            type: "object",
            description: "Original pet description",
            properties: { name: { type: "string" } },
          },
        },
      },
      paths: {
        "/pets": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Pet",
                      description: "Overridden description",
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const schema =
      result.paths["/pets"].get.responses["200"].content["application/json"]
        .schema;
    expect(schema.description).toBe("Overridden description");
    expect(schema.properties.name.type).toBe("string");
  });

  it("should preserve siblings through array item $refs", async () => {
    const result = await deref({
      components: {
        schemas: {
          Child: { type: "string" },
          ObjectContainingRef: {
            type: "object",
            properties: {
              child: {
                $ref: "#/components/schemas/Child",
                description: "Array item child desc",
              },
            },
          },
        },
      },
      paths: {
        "/items": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ObjectContainingRef",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const items =
      result.paths["/items"].get.responses["200"].content["application/json"]
        .schema.items;
    expect(items.properties.child.type).toBe("string");
    expect(items.properties.child.description).toBe("Array item child desc");
  });

  it("should drop siblings on circular $ref (sentinel is not an object)", async () => {
    const result = await deref({
      definitions: {
        Node: {
          type: "object",
          properties: {
            parent: {
              $ref: "#/definitions/Node",
              description: "The parent node",
            },
            name: { type: "string" },
          },
        },
      },
    });

    // Circular refs resolve to the sentinel string, siblings can't be merged
    expect(result.definitions.Node.properties.parent).toBe(
      "$[Circular Reference]",
    );
  });

  it("should not merge siblings when $ref resolves to a non-object", async () => {
    const result = await deref({
      definitions: {
        value: "just a string",
      },
      root: {
        $ref: "#/definitions/value",
        description: "should be ignored",
      },
    });

    expect(result.root).toBe("just a string");
  });
});
