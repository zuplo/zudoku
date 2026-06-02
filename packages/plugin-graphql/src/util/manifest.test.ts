import { buildSchema, introspectionFromSchema } from "graphql";
import { describe, expect, it } from "vitest";
import { buildManifest } from "./manifest.js";

const introspection = introspectionFromSchema(
  buildSchema(/* GraphQL */ `
    type Query {
      product(id: ID!): Product
    }

    type Mutation {
      createProduct(input: ProductInput!): Product!
    }

    input ProductInput {
      name: String!
    }

    type Product {
      id: ID!
    }

    enum Status {
      ACTIVE
    }

    interface Node {
      id: ID!
    }

    union Result = Product
  `),
);

describe("buildManifest", () => {
  const manifest = buildManifest(introspection);

  it("lists root operation field names", () => {
    expect(manifest.query).toEqual(["product"]);
    expect(manifest.mutation).toEqual(["createProduct"]);
    expect(manifest.subscription).toEqual([]);
  });

  it("excludes root operation types from objects", () => {
    expect(manifest.object).toEqual(["Product"]);
    expect(manifest.object).not.toContain("Query");
    expect(manifest.object).not.toContain("Mutation");
  });

  it("groups remaining types by kind", () => {
    expect(manifest.input).toEqual(["ProductInput"]);
    expect(manifest.enum).toEqual(["Status"]);
    expect(manifest.interface).toEqual(["Node"]);
    expect(manifest.union).toEqual(["Result"]);
  });

  it("omits introspection types", () => {
    const all = Object.values(manifest).flat();
    expect(all.some((name) => name.startsWith("__"))).toBe(false);
  });
});
