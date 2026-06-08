import { buildSchema, introspectionFromSchema } from "graphql";
import { describe, expect, it } from "vitest";
import { findMutationFields, findQueryFields } from "./findType.js";
import {
  generateGraphQLOperation,
  generateGraphQLTypeFragment,
} from "./generateOperation.js";
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

const recursiveSchema = introspectionFromSchema(
  buildSchema(/* GraphQL */ `
    type Query {
      me: User
      search: SearchResult
    }

    type User {
      id: ID!
      name: String!
      friend: User
      secret(token: ID!): String
      legacy: String @deprecated(reason: "gone")
    }

    type Post {
      id: ID!
      title: String!
    }

    union SearchResult = User | Post
  `),
).__schema;

const recursiveIndex = buildSchemaIndex(recursiveSchema);

describe("buildSelectionSet edge cases", () => {
  it("prunes self-referential fields and skips deprecated/required-arg fields", () => {
    const field = findQueryFields(recursiveSchema).find((f) => f.name === "me");
    if (!field) throw new Error("Expected me query to exist");

    const { document } = generateGraphQLOperation({
      field,
      operationType: "query",
      index: recursiveIndex,
    });

    expect(document).toBe(`query Me {
  me {
    id
    name
  }
}`);
    // friend (another User) would re-enter a type already in the ancestor
    // chain, so it is dropped rather than expanded infinitely.
    expect(document).not.toContain("friend");
    // Deprecated fields and fields with required args are skipped too.
    expect(document).not.toContain("legacy");
    expect(document).not.toContain("secret");
  });

  it("emits __typename and inline fragments for unions", () => {
    const type = recursiveIndex.getType("SearchResult");
    if (!type) throw new Error("Expected SearchResult union to exist");

    const fragment = generateGraphQLTypeFragment({
      type,
      index: recursiveIndex,
    });

    expect(fragment).toContain("__typename");
    expect(fragment).toContain("... on User {");
    expect(fragment).toContain("... on Post {");
  });

  it("returns undefined for scalar fragments", () => {
    const type = recursiveIndex.getType("ID");
    if (!type) throw new Error("Expected ID scalar to exist");

    expect(
      generateGraphQLTypeFragment({ type, index: recursiveIndex }),
    ).toBeUndefined();
  });
});
