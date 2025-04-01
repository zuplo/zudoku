import { describe, expect, it } from "vitest";
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
      schema.paths["/pets"].get.responses["default"].content["application/json"]
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

  it("should generate proper slugs for tags and operations", async () => {
    const input = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      tags: [{ name: "Pets & Animals" }, { name: "Admins & Users" }],
      paths: {
        "/pets": {
          tags: ["Pets & Animals"],
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
      },
    };

    const { slugs } = await executeCode(await generateCode(input));

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
        "Admins & Users": "admins-and-users",
        "Pets & Animals": "pets-and-animals",
        "Some other tag": "some-other-tag",
      }
    `);
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
      };
      export const slugs = {
        operations: {},
        tags: {},
      };"
    `);
  });
});
