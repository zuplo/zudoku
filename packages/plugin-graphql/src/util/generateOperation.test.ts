import type { IntrospectionInputObjectType } from "graphql";
import { buildSchema, introspectionFromSchema } from "graphql";
import { describe, expect, it } from "vitest";
import {
  findMutationFields,
  findQueryFields,
  type GraphQLSchema,
} from "./findType.js";
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

const argumentSchema = introspectionFromSchema(
  buildSchema(/* GraphQL */ `
    type Query {
      search(
        term: String!
        states: [String]
        resultSize: Int
        limit: Int! = 10
      ): [Hit!]!
      bulk(ids: [ID!]!): [Hit!]!
      sorted(order: SortOrder!): [Hit!]!
      tree(node: NodeInput!): Hit
    }

    enum SortOrder {
      LEGACY @deprecated(reason: "gone")
      RELEVANCE
      PRICE
    }

    input NodeInput {
      name: String!
      child: NodeInput
    }

    type Hit {
      id: ID!
    }
  `),
).__schema;

const argumentIndex = buildSchemaIndex(argumentSchema);

const generateQuery = (name: string, index = argumentIndex) => {
  const field = findQueryFields(index.schema).find((f) => f.name === name);
  if (!field) throw new Error(`Expected ${name} query to exist`);

  return generateGraphQLOperation({ field, operationType: "query", index });
};

describe("example variables", () => {
  it("only fills in required arguments and keeps defaults in the document", () => {
    const { document, variables } = generateQuery("search");

    // Optional arguments stay in the document so they are discoverable, but
    // sending a placeholder for them would change what the operation does.
    expect(variables).toEqual({ term: "" });
    expect(document.startsWith("query Search(")).toBe(true);
    expect(document).toContain("$states: [String]");
    expect(document).toContain("$resultSize: Int");
    expect(document).toContain("$limit: Int! = 10");
  });

  it("uses an empty list for required list arguments", () => {
    expect(generateQuery("bulk").variables).toEqual({ ids: [] });
  });

  it("skips deprecated enum values", () => {
    expect(generateQuery("sorted").variables).toEqual({ order: "RELEVANCE" });
  });

  it("only fills in required input object fields", () => {
    expect(generateQuery("tree").variables).toEqual({ node: { name: "" } });
  });

  it("stops at input objects that require themselves", () => {
    // A valid schema cannot require an input object within itself, but the
    // introspection result comes from a remote endpoint and is not validated,
    // so the generator must not recurse forever on one.
    const cyclicSchema: GraphQLSchema = JSON.parse(
      JSON.stringify(argumentSchema),
    );
    const nodeInput = cyclicSchema.types.find(
      (type): type is IntrospectionInputObjectType => type.name === "NodeInput",
    );
    const child = nodeInput?.inputFields.find((f) => f.name === "child");
    if (!child) throw new Error("Expected NodeInput.child to exist");
    Object.assign(child, {
      type: { kind: "NON_NULL", name: null, ofType: child.type },
    });

    expect(
      generateQuery("tree", buildSchemaIndex(cyclicSchema)).variables,
    ).toEqual({ node: { name: "", child: null } });
  });
});
