import type { OperationsFragmentFragment } from "../graphql/graphql.js";

export type SecuritySchemeItem = NonNullable<
  OperationsFragmentFragment["security"]
>[number]["schemes"][number]["scheme"];

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
