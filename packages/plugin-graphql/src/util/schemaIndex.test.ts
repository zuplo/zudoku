import { buildSchema, introspectionFromSchema } from "graphql";
import { describe, expect, it } from "vitest";
import { buildSchemaIndex } from "./schemaIndex.js";

const schema = introspectionFromSchema(
  buildSchema(/* GraphQL */ `
    type Query {
      node(id: ID!): Node
      animals: [Animal!]!
    }

    interface Node {
      id: ID!
    }

    type Dog implements Node {
      id: ID!
      name: String!
    }

    type Cat implements Node {
      id: ID!
      lives: Int!
    }

    union Animal = Dog | Cat

    input AnimalFilter {
      kind: String
    }
  `),
).__schema;

const index = buildSchemaIndex(schema);

describe("buildSchemaIndex", () => {
  it("memoizes by schema reference", () => {
    expect(buildSchemaIndex(schema)).toBe(index);
  });

  it("looks up types by name and optional kind", () => {
    expect(index.getType("Dog")?.name).toBe("Dog");
    expect(index.getType("Dog", ["OBJECT"])?.name).toBe("Dog");
    expect(index.getType("Dog", ["SCALAR"])).toBeUndefined();
    expect(index.getType("Missing")).toBeUndefined();
  });

  it("excludes introspection types from getTypes", () => {
    const names = index.getTypes().map((type) => type.name);
    expect(names).toContain("Dog");
    expect(names.some((name) => name.startsWith("__"))).toBe(false);
  });

  it("resolves interface implementations", () => {
    const implementors = index.implementedBy("Node").map((type) => type.name);
    expect(implementors.sort()).toEqual(["Cat", "Dog"]);
  });

  it("records what a type is returned and accepted by", () => {
    const refs = index.typeReferences("Node");
    expect(refs.returnedBy).toContainEqual({
      fieldName: "node",
      rootType: "query",
    });
    expect(refs.acceptedBy).toEqual([]);
  });

  it("records arguments that accept a type", () => {
    const refs = index.typeReferences("ID");
    expect(refs.acceptedBy).toContainEqual({
      fieldName: "node",
      argName: "id",
      rootType: "query",
    });
    // ID is the type of Node.id, Dog.id, and Cat.id fields.
    const owners = refs.usedByFields.map((ref) => ref.ownerName).sort();
    expect(owners).toEqual(["Cat", "Dog", "Node"]);
  });
});
