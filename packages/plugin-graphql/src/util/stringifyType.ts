import type { TypeWrapper } from "./unwrapType.js";

// `wrappers` is ordered outermost-first (see `unwrapType`), so wrap the name
// starting from the innermost wrapper: [LIST, NON_NULL] is `[T!]`, not `[T]!`.
export const stringifyType = (name: string, wrappers: TypeWrapper[]): string =>
  wrappers.reduceRight(
    (type, kind) => (kind === "LIST" ? `[${type}]` : `${type}!`),
    name,
  );
