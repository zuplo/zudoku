import { describe, expect, it } from "vitest";
import { dereference } from "./index.js";

// Each test gets its own schema object to avoid the module-level cache
const makeSchema = <T>(s: T): T => structuredClone(s);

describe("dereference", () => {
  describe("existing behaviour", () => {
    it("should resolve a basic $ref", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Pet: {
              type: "object",
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
                      schema: { $ref: "#/components/schemas/Pet" },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const result = await dereference(schema);
      const resolved =
        result.paths["/pets"].get.responses["200"].content["application/json"]
          .schema;

      expect(resolved.type).toBe("object");
      expect(resolved.properties.name.type).toBe("string");
    });

    it("should resolve nested $refs", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Name: { type: "string" },
            Pet: {
              type: "object",
              properties: {
                name: { $ref: "#/components/schemas/Name" },
              },
            },
          },
        },
        result: { $ref: "#/components/schemas/Pet" },
      });

      const result = await dereference(schema);
      expect(result.result.type).toBe("object");
      expect(result.result.properties.name.type).toBe("string");
    });

    it("should resolve $ref inside arrays (oneOf/anyOf/allOf)", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            A: { type: "string" },
            B: { type: "number" },
          },
        },
        result: {
          oneOf: [
            { $ref: "#/components/schemas/A" },
            { $ref: "#/components/schemas/B" },
          ],
        },
      });

      const result = await dereference(schema);
      expect(result.result.oneOf[0].type).toBe("string");
      expect(result.result.oneOf[1].type).toBe("number");
    });

    it("should resolve $ref inside array items", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Item: { type: "string" },
          },
        },
        result: {
          type: "array",
          items: { $ref: "#/components/schemas/Item" },
        },
      });

      const result = await dereference(schema);
      expect(result.result.items.type).toBe("string");
    });

    it("should handle circular $refs without infinite loop", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Node: {
              type: "object",
              properties: {
                child: { $ref: "#/components/schemas/Node" },
              },
            },
          },
        },
      });

      const result = await dereference(schema);
      // The circular reference should be replaced with a sentinel string
      expect(typeof result.components.schemas.Node.properties.child).toBe(
        "string",
      );
    });

    it("should use custom resolvers when provided", async () => {
      const schema = makeSchema({
        result: { $ref: "external://Pet" },
      });

      const customResolver = async (ref: string) => {
        if (ref === "external://Pet") {
          return {
            type: "object",
            properties: { name: { type: "string" } },
          };
        }
        return undefined;
      };

      const result = await dereference(schema, [customResolver]);
      expect(result.result.type).toBe("object");
    });

    it("should preserve non-$ref properties on objects", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Pet: {
              type: "object",
              properties: { name: { type: "string" } },
            },
          },
        },
        wrapper: {
          title: "My wrapper",
          nested: { $ref: "#/components/schemas/Pet" },
        },
      });

      const result = await dereference(schema);
      expect(result.wrapper.title).toBe("My wrapper");
      expect(result.wrapper.nested.type).toBe("object");
    });
  });

  describe("OAS 3.1 $ref sibling properties (#2191)", () => {
    it("should preserve description alongside $ref", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Child: { type: "string" },
          },
        },
        result: {
          type: "object",
          properties: {
            field: {
              $ref: "#/components/schemas/Child",
              description: "Overridden description",
            },
          },
        },
      });

      const result = await dereference(schema);
      const field = result.result.properties.field;

      expect(field.type).toBe("string");
      expect(field.description).toBe("Overridden description");
    });

    it("should preserve summary alongside $ref", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Base: {
              type: "object",
              properties: { id: { type: "string" } },
            },
          },
        },
        result: {
          $ref: "#/components/schemas/Base",
          summary: "Summary override",
        },
      });

      const result = await dereference(schema);
      expect(result.result.type).toBe("object");
      expect(result.result.summary).toBe("Summary override");
    });

    it("should let sibling description override the referenced description", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Base: {
              type: "object",
              description: "Original",
              properties: { id: { type: "string" } },
            },
          },
        },
        result: {
          $ref: "#/components/schemas/Base",
          description: "Overridden",
        },
      });

      const result = await dereference(schema);
      expect(result.result.description).toBe("Overridden");
      expect(result.result.properties.id.type).toBe("string");
    });

    it("should preserve sibling descriptions in nested $ref'd schemas", async () => {
      // This is the exact scenario from issue #2191
      const schema = makeSchema({
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
      });

      const result = await dereference(schema);
      const parent = result.components.schemas.Parent;

      // Inline object — description preserved
      expect(parent.properties.childObject.properties.child.description).toBe(
        "Inline description for childObject.child",
      );

      // $ref'd object — description preserved (reported bug)
      expect(
        parent.properties.childObjectRef.properties.child.description,
      ).toBe("Description for ObjectContainingRef.child");

      // Inline array items — description preserved
      expect(
        parent.properties.childObjectArray.items.properties.child.description,
      ).toBe("Inline description for childObjectArray.[].child");

      // $ref'd array items — description preserved (reported bug)
      expect(
        parent.properties.childObjectArrayRef.items.properties.child
          .description,
      ).toBe("Description for ObjectContainingRef.child");
    });

    it("should preserve multiple sibling properties alongside $ref", async () => {
      const schema = makeSchema({
        components: {
          schemas: {
            Base: {
              type: "object",
              properties: { id: { type: "string" } },
            },
          },
        },
        result: {
          $ref: "#/components/schemas/Base",
          description: "desc",
          summary: "sum",
        },
      });

      const result = await dereference(schema);
      expect(result.result.type).toBe("object");
      expect(result.result.description).toBe("desc");
      expect(result.result.summary).toBe("sum");
    });
  });
});
