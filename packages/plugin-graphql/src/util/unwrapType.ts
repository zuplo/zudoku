import type { IntrospectionTypeRef } from "graphql";

export type TypeWrapper = "NON_NULL" | "LIST";

export const unwrapType = (
  type: IntrospectionTypeRef,
  wrappers: TypeWrapper[] = [],
): IntrospectionTypeRef & { kind: string; name: string } => {
  let current = type;
  while (current.kind === "NON_NULL" || current.kind === "LIST") {
    wrappers.push(current.kind);
    current = current.ofType;
  }
  return current as IntrospectionTypeRef & { kind: string; name: string };
};
