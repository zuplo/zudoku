import type { OpenAPIV3_1 } from "openapi-types";
import { describe, expect, it } from "vitest";
import { getAllOperations, getAllSlugs } from "../../lib/oas/graphql/index.js";
import { generateCode } from "./schema-codegen.js";

const executeCode = (code: string) => {
  const encodedCode = encodeURIComponent(code);
  return import(`data:text/javascript,${encodedCode}`);
};

describe("Generate OpenAPI schema module", () => {
  it("should handle basic schema refs", async () => {
    const input = {
      components: {
        schemas: {
          Pet: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
          Error: {
            type: "object",
            properties: {
              code: { type: "integer" },
              message: { type: "string" },
            },
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
              default: {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    const successSchema =
      schema.paths["/pets"].get.responses["200"].content["application/json"]
        .schema;
    const errorSchema =
      schema.paths["/pets"].get.responses.default.content["application/json"]
        .schema;

    expect(successSchema).toStrictEqual(input.components.schemas.Pet);
    expect(successSchema.__$ref).toStrictEqual("#/components/schemas/Pet");
    expect(errorSchema).toStrictEqual(input.components.schemas.Error);
    expect(errorSchema.__$ref).toStrictEqual("#/components/schemas/Error");
  });

  it("should handle circular refs", async () => {
    const input = {
      components: {
        schemas: {
          Person: {
            type: "object",
            properties: {
              name: { type: "string" },
              bestFriend: { $ref: "#/components/schemas/Person" },
              pets: {
                type: "array",
                items: { $ref: "#/components/schemas/Pet" },
              },
            },
          },
          Pet: {
            type: "object",
            properties: {
              name: { type: "string" },
              owner: { $ref: "#/components/schemas/Person" },
            },
          },
        },
      },
    };

    const code = await generateCode(input);
    const { schema } = await executeCode(code);
    const person = schema.components.schemas.Person;
    const pet = schema.components.schemas.Pet;

    expect(person.properties.bestFriend).toStrictEqual(person);
    expect(person.properties.pets.items).toStrictEqual(pet);
    expect(pet.properties.owner).toStrictEqual(person);
  });

  it("should handle composition through refs", async () => {
    const input = {
      components: {
        schemas: {
          Pet: {
            type: "object",
            allOf: [
              { $ref: "#/components/schemas/Animal" },
              { $ref: "#/components/schemas/Named" },
            ],
          },
          Animal: {
            type: "object",
            properties: {
              species: { type: "string" },
            },
          },
          Named: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    const pet = schema.components.schemas.Pet;

    expect(pet.allOf[0]).toStrictEqual(input.components.schemas.Animal);
    expect(pet.allOf[1]).toStrictEqual(input.components.schemas.Named);
  });

  it("should handle discriminated unions with refs", async () => {
    const input = {
      components: {
        schemas: {
          Pet: {
            oneOf: [
              { $ref: "#/components/schemas/Cat" },
              { $ref: "#/components/schemas/Dog" },
            ],
            discriminator: { propertyName: "petType" },
          },
          Cat: {
            type: "object",
            properties: {
              petType: { type: "string", enum: ["cat"] },
              purrs: { type: "boolean" },
            },
          },
          Dog: {
            type: "object",
            properties: {
              petType: { type: "string", enum: ["dog"] },
              barks: { type: "boolean" },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    const pet = schema.components.schemas.Pet;

    expect(pet.oneOf[0]).toStrictEqual(input.components.schemas.Cat);
    expect(pet.oneOf[1]).toStrictEqual(input.components.schemas.Dog);
  });

  it("should handle URL-encoded characters in references", async () => {
    const input = {
      components: { schemas: { "Type With Space": { type: "string" } } },
      info: { schema: { $ref: "#/components/schemas/Type With Space" } },
    };

    const { schema } = await executeCode(await generateCode(input));
    expect(schema.info.schema).toStrictEqual(
      input.components.schemas["Type With Space"],
    );
  });

  it("should generate proper slugs for tags and operations", () => {
    const operations = getAllOperations({
      "/pets": {
        get: {
          tags: ["Pets & Animals"],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Pets & Animals", "Some other tag"],
          responses: { "201": { description: "Created" } },
        },
        head: {
          tags: ["Pets & Animals"],
          responses: { "200": { description: "OK" } },
        },
      },
      "/users": {
        get: {
          tags: ["Admins & Users"],
          responses: { "200": { description: "OK" } },
        },
      },
    });

    const slugs = getAllSlugs(operations, [
      { name: "Pets & Animals" },
      { name: "Admins & Users" },
    ]);

    expect(slugs.operations).toMatchInlineSnapshot(`
      {
        "/pets-get": "get-pets",
        "/pets-head": "head-pets",
        "/pets-post": "post-pets",
        "/users-get": "get-users",
      }
    `);
    expect(slugs.tags).toMatchInlineSnapshot(`
      {
        "Admins & Users": "admins-users",
        "Pets & Animals": "pets-animals",
        "Some other tag": "some-other-tag",
      }
    `);
  });

  it("should not add suffix to tag slugs when operation summaries match tag names", () => {
    const operations = getAllOperations({
      "/agreements": {
        get: {
          tags: ["Agreements"],
          summary: "Agreements",
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Agreements"],
          summary: "Create Agreement",
          responses: { "201": { description: "Created" } },
        },
      },
      "/assets": {
        get: {
          tags: ["Assets"],
          summary: "Assets",
          responses: { "200": { description: "OK" } },
        },
      },
    });

    const slugs = getAllSlugs(operations, [
      { name: "Agreements" },
      { name: "Assets" },
    ]);

    expect(slugs.tags).toStrictEqual({
      Agreements: "agreements",
      Assets: "assets",
    });
  });

  it("should generate correct code for circular refs", async () => {
    const input = {
      definitions: {
        child: {
          title: "child",
          type: "object",
          properties: {
            name: { type: "string" },
            pet: { $ref: "#/definitions/pet" },
          },
        },
        // self-reference
        thing: { $ref: "#/definitions/thing" },
        pet: {
          title: "pet",
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            species: { type: "string", enum: ["cat", "dog", "bird", "fish"] },
          },
        },
      },
    };

    const code = await generateCode(input);
    expect(code).toMatchInlineSnapshot(`
      "const __refs = Array.from({ length: 2 }, () => ({}));
      const __refMap = {
        "#/definitions/pet": __refs[0],
        "#/definitions/thing": __refs[1]
      };
      const __refMapPaths = Object.keys(__refMap);
      Object.assign(__refs[0], {
        "title": "pet",
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "age": {
            "type": "number"
          },
          "species": {
            "type": "string",
            "enum": [
              "cat",
              "dog",
              "bird",
              "fish"
            ]
          }
        }
      });
      Object.defineProperty(__refs[0], "__$ref", { value: __refMapPaths[0], enumerable: false });
      Object.assign(__refs[1], __refMap["#/definitions/thing"]);
      Object.defineProperty(__refs[1], "__$ref", { value: __refMapPaths[1], enumerable: false });
      export const schema = {
        "definitions": {
          "child": {
            "title": "child",
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "pet": __refMap["#/definitions/pet"]
            }
          },
          "thing": __refMap["#/definitions/thing"],
          "pet": {
            "title": "pet",
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "age": {
                "type": "number"
              },
              "species": {
                "type": "string",
                "enum": [
                  "cat",
                  "dog",
                  "bird",
                  "fish"
                ]
              }
            }
          }
        }
      };"
    `);
  });

  it("should handle refs with siblings without duplication", async () => {
    const input = {
      components: {
        schemas: {
          BaseType: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
          Container: {
            type: "object",
            properties: {
              // Same ref with different sibling properties
              first: {
                $ref: "#/components/schemas/BaseType",
                description: "First instance",
              },
              second: {
                $ref: "#/components/schemas/BaseType",
                description: "Second instance",
              },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    const container = schema.components.schemas.Container;

    // Both should inherit BaseType properties
    expect(container.properties.first.properties.id).toEqual({
      type: "string",
    });
    expect(container.properties.second.properties.id).toEqual({
      type: "string",
    });

    // Each should have its unique description
    expect(container.properties.first.description).toBe("First instance");
    expect(container.properties.second.description).toBe("Second instance");

    // They should be different object instances (not the same reference)
    expect(container.properties.first).not.toBe(container.properties.second);
  });

  it("should generate correct code for refs with siblings", async () => {
    const input = {
      components: {
        schemas: {
          Pet: {
            type: "object",
            properties: { name: { type: "string" } },
          },
          Response: {
            type: "object",
            // Ref with description sibling
            properties: {
              data: {
                $ref: "#/components/schemas/Pet",
                description: "The pet data",
              },
              // Plain ref without siblings
              error: { $ref: "#/components/schemas/Pet" },
            },
          },
        },
      },
    };

    const code = await generateCode(input);

    // Ref with siblings uses a merged variable and preserves __$ref
    expect(code).toContain(
      'const __merged_0 = Object.assign({}, __refMap["#/components/schemas/Pet"], {\n  "description": "The pet data"\n});',
    );
    expect(code).toContain(
      'Object.defineProperty(__merged_0, "__$ref", { value: __refMapPaths[0], enumerable: false });',
    );

    // Plain ref uses direct reference
    expect(code).toContain('"error": __refMap["#/components/schemas/Pet"]');
  });

  // --- Additional coverage for existing behaviour ---

  it("should resolve $ref pointing to another $ref (chained refs)", async () => {
    const input = {
      components: {
        schemas: {
          A: { type: "string" },
          B: { $ref: "#/components/schemas/A" },
        },
      },
      result: { $ref: "#/components/schemas/B" },
    };

    const { schema } = await executeCode(await generateCode(input));
    expect(schema.result.type).toBe("string");
  });

  it("should preserve object identity for same $ref used in multiple places", async () => {
    const input = {
      components: {
        schemas: {
          Shared: { type: "object", properties: { id: { type: "string" } } },
          A: {
            type: "object",
            properties: { ref: { $ref: "#/components/schemas/Shared" } },
          },
          B: {
            type: "object",
            properties: { ref: { $ref: "#/components/schemas/Shared" } },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    // Both should point to the exact same object
    expect(schema.components.schemas.A.properties.ref).toBe(
      schema.components.schemas.B.properties.ref,
    );
  });

  it("should handle $ref to deeply nested path", async () => {
    const input = {
      components: {
        schemas: {
          Outer: {
            type: "object",
            properties: {
              inner: {
                type: "object",
                properties: { value: { type: "number" } },
              },
            },
          },
        },
      },
      result: { $ref: "#/components/schemas/Outer" },
    };

    const { schema } = await executeCode(await generateCode(input));
    expect(schema.result.properties.inner.properties.value.type).toBe("number");
  });

  it("should handle schema with no $refs", async () => {
    const input = {
      components: {
        schemas: {
          Simple: { type: "string" },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    expect(schema.components.schemas.Simple.type).toBe("string");
  });

  it("should handle $ref with siblings that is also referenced without siblings", async () => {
    const input = {
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: { id: { type: "string" } },
          },
          WithDesc: {
            type: "object",
            properties: {
              data: {
                $ref: "#/components/schemas/Base",
                description: "With description",
              },
            },
          },
          WithoutDesc: {
            type: "object",
            properties: {
              data: { $ref: "#/components/schemas/Base" },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));

    // Sibling version has description
    expect(schema.components.schemas.WithDesc.properties.data.description).toBe(
      "With description",
    );
    expect(
      schema.components.schemas.WithDesc.properties.data.properties.id.type,
    ).toBe("string");

    // Plain version has NO description
    expect(
      schema.components.schemas.WithoutDesc.properties.data.description,
    ).toBeUndefined();
    expect(
      schema.components.schemas.WithoutDesc.properties.data.properties.id.type,
    ).toBe("string");
  });

  it("should handle circular ref with sibling description", async () => {
    const input = {
      components: {
        schemas: {
          Node: {
            type: "object",
            properties: {
              child: {
                $ref: "#/components/schemas/Node",
                description: "Recursive child node",
              },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    const node = schema.components.schemas.Node;

    // The child should be the same object (circular) with the description
    expect(node.properties.child.description).toBe("Recursive child node");
    expect(node.properties.child.type).toBe("object");
    // It should be the merged object (not identical to node, because it has extra description)
    expect(node.properties.child).not.toBe(node);
  });

  // --- Tests for #2191: $ref sibling descriptions in nested referenced schemas ---

  it("should preserve $ref sibling descriptions in nested referenced schemas (#2191)", async () => {
    const input = {
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

    const { schema } = await executeCode(await generateCode(input));

    // Top-level component — should always work
    expect(
      schema.components.schemas.ObjectContainingRef.properties.child
        .description,
    ).toBe("Description for ObjectContainingRef.child");

    // Inline object — should work
    expect(
      schema.components.schemas.Parent.properties.childObject.properties.child
        .description,
    ).toBe("Inline description for childObject.child");

    // $ref'd object nested inside Parent — the reported bug
    expect(
      schema.components.schemas.Parent.properties.childObjectRef.properties
        .child.description,
    ).toBe("Description for ObjectContainingRef.child");

    // Inline array items — should work
    expect(
      schema.components.schemas.Parent.properties.childObjectArray.items
        .properties.child.description,
    ).toBe("Inline description for childObjectArray.[].child");

    // $ref'd array items — the reported bug
    expect(
      schema.components.schemas.Parent.properties.childObjectArrayRef.items
        .properties.child.description,
    ).toBe("Description for ObjectContainingRef.child");
  });

  it("should preserve siblings through multiple levels of $ref nesting", async () => {
    const input = {
      components: {
        schemas: {
          Leaf: { type: "string" },
          Mid: {
            type: "object",
            properties: {
              leaf: {
                $ref: "#/components/schemas/Leaf",
                description: "Mid.leaf desc",
              },
            },
          },
          Top: {
            type: "object",
            properties: {
              mid: { $ref: "#/components/schemas/Mid" },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));

    // Through the $ref chain: Top -> Mid -> leaf (with sibling desc)
    expect(
      schema.components.schemas.Top.properties.mid.properties.leaf.description,
    ).toBe("Mid.leaf desc");
  });

  it("should handle OpenAPI v3.1 refs alongside description and summary", async () => {
    const input: OpenAPIV3_1.Document = {
      openapi: "3.1.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      components: {
        schemas: {
          Pet: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      },
      paths: {
        "/pets": {
          get: {
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Pet",
                      description: "A pet object with additional context",
                      summary: "Pet response",
                    },
                  },
                },
              },
              "201": {
                description: "Created",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Pet",
                      description: "A newly created pet",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const { schema } = await executeCode(await generateCode(input));
    const responseSchema200 =
      schema.paths["/pets"].get.responses["200"].content["application/json"]
        .schema;
    const responseSchema201 =
      schema.paths["/pets"].get.responses["201"].content["application/json"]
        .schema;

    // First response should have both description and summary
    // Note: __$ref is non-enumerable so it won't show in the snapshot
    expect(responseSchema200.__$ref).toBe("#/components/schemas/Pet");
    expect(responseSchema200).toMatchInlineSnapshot(`
      {
        "description": "A pet object with additional context",
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "summary": "Pet response",
        "type": "object",
      }
    `);

    // Second response should have only description (different from first)
    expect(responseSchema201.__$ref).toBe("#/components/schemas/Pet");
    expect(responseSchema201).toMatchInlineSnapshot(`
      {
        "description": "A newly created pet",
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "type": "object",
      }
    `);
  });
});
