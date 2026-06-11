import type { RecordAny } from "zudoku/processors/traverse";

// Routes are GraphQL endpoints when marked explicitly with the `x-graphql`
// extension (Route Designer "Mark as GraphQL") or when exposed as a GraphQL
// MCP endpoint via `x-zuplo-route.mcp.type`.
export const isGraphQLOperation = (operation: RecordAny): boolean =>
  operation["x-graphql"] === true ||
  operation["x-zuplo-route"]?.mcp?.type === "graphql";
