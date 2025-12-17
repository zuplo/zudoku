import type {
  IntrospectionField,
  IntrospectionInputValue,
  IntrospectionNamedTypeRef,
  IntrospectionQuery,
  IntrospectionType,
  IntrospectionTypeRef,
} from "graphql";

export type Introspection = IntrospectionQuery["__schema"];
export type RootKind = "query" | "mutation" | "subscription";

const rootTypeName = (schema: Introspection, root: RootKind) =>
  root === "query"
    ? schema.queryType?.name
    : root === "mutation"
      ? schema.mutationType?.name
      : schema.subscriptionType?.name;

export const findType = (
  schema: Introspection,
  name: string,
): IntrospectionType | undefined => schema.types.find((t) => t.name === name);

export const getRootFields = (
  schema: Introspection,
  root: RootKind,
): readonly IntrospectionField[] => {
  const name = rootTypeName(schema, root);
  if (!name) return [];
  const type = findType(schema, name);
  return type && "fields" in type && type.fields ? type.fields : [];
};

/** Unwrap NON_NULL/LIST wrappers down to the underlying named type. */
export const namedTypeRef = (
  ref: IntrospectionTypeRef,
): IntrospectionNamedTypeRef => {
  let current = ref;
  while ("ofType" in current && current.ofType) current = current.ofType;
  return current as IntrospectionNamedTypeRef;
};

/** Render a type ref to GraphQL notation, e.g. `[User!]!`. */
export const typeRefString = (ref: IntrospectionTypeRef): string => {
  if (ref.kind === "NON_NULL" && ref.ofType)
    return `${typeRefString(ref.ofType)}!`;
  if (ref.kind === "LIST" && ref.ofType)
    return `[${typeRefString(ref.ofType)}]`;
  return (ref as IntrospectionNamedTypeRef).name;
};

/** Fields a named type exposes when expanded (object/interface or input). */
export const expandableFields = (
  type: IntrospectionType | undefined,
): readonly (IntrospectionField | IntrospectionInputValue)[] => {
  if (!type) return [];
  if ("fields" in type && type.fields) return type.fields;
  if ("inputFields" in type && type.inputFields) return type.inputFields;
  return [];
};

export const renderArgs = (args: readonly IntrospectionInputValue[]): string =>
  args.length === 0
    ? ""
    : `(${args.map((a) => `${a.name}: ${typeRefString(a.type)}`).join(", ")})`;
