import { z } from "zod/mini";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";

const GraphQLExtensionSchema = z.union([
  z.literal(true),
  z.object({
    endpoint: z.optional(z.string()),
  }),
]);

export type GraphQLEndpointConfig = { endpoint?: string };

export const getGraphQLEndpoint = (
  operation: OperationsFragmentFragment,
): GraphQLEndpointConfig | undefined => {
  const extension = operation.extensions?.["x-graphql"];
  if (extension === undefined) return undefined;

  const parsed = GraphQLExtensionSchema.safeParse(extension);
  if (!parsed.success) return undefined;

  return parsed.data === true ? {} : parsed.data;
};
