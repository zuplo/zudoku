import { graphql } from "./graphql/index.js";

// This module is intentionally not imported by the runtime. GraphQL Codegen
// scans it to keep the generated, tree-shakeable document used by index.tsx.
export const GetNavigationOperationsCodegenQuery = graphql(`
  query GetNavigationOperations($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      extensions
      description
      tags {
        slug
        name
        extensions
        operations {
          summary
          slug
          method
          operationId
          path
          isMcpServer
        }
      }
      components {
        schemas {
          __typename
        }
      }
    }
  }
`);
