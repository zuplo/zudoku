import { buildSchema, introspectionFromSchema } from "graphql";
import { describe, expect, it } from "vitest";
import { findMutationFields, findQueryFields } from "./findType.js";
import { generateGraphQLOperation } from "./generateOperation.js";
import { buildSchemaIndex } from "./schemaIndex.js";

const schema = introspectionFromSchema(
  buildSchema(/* GraphQL */ `
    type Query {
      product(id: ID!): Product
      products: [Product!]!
    }

    type Mutation {
      createProduct(input: ProductInput!): Product!
    }

    input ProductInput {
      name: String!
      price: Int!
      tags: [String!]
    }

    type Product {
      id: ID!
      name: String!
      price: Int!
      category: Category!
    }

    type Category {
      id: ID!
      name: String!
    }
  `),
).__schema;

const index = buildSchemaIndex(schema);

describe("generateGraphQLOperation", () => {
  it("generates a query with variables and a nested selection set", () => {
    const field = findQueryFields(schema).find(
      (field) => field.name === "product",
    );

    if (!field) throw new Error("Expected product query to exist");
    expect(
      generateGraphQLOperation({
        field,
        operationType: "query",
        index,
      }),
    ).toEqual({
      document: `query Product($id: ID!) {
  product(id: $id) {
    id
    name
    price
    category {
      id
      name
    }
  }
}`,
      operationName: "Product",
      variables: { id: "id" },
      variablesJson: JSON.stringify({ id: "id" }, null, 2),
    });
  });

  it("generates required input object variables for mutations", () => {
    const field = findMutationFields(schema).find(
      (field) => field.name === "createProduct",
    );

    if (!field) throw new Error("Expected createProduct mutation to exist");
    expect(
      generateGraphQLOperation({
        field,
        operationType: "mutation",
        index,
      }).variables,
    ).toEqual({
      input: {
        name: "",
        price: 0,
      },
    });
  });
});
