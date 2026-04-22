import type {
  OperationsFragmentFragment,
  SecuritySchemeItem,
} from "../graphql/graphql.js";

export const extractOperationSecuritySchemes = (
  operation: OperationsFragmentFragment,
): SecuritySchemeItem[] =>
  operation.security
    ? Array.from(
        new Map(
          operation.security.flatMap((req) =>
            req.schemes.map((s) => [s.scheme.name, s.scheme]),
          ),
        ).values(),
      )
    : [];
