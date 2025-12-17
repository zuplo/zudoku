import type {
  IntrospectionField,
  IntrospectionObjectType,
  IntrospectionType,
} from "graphql";

export type GraphQLSchema = {
  queryType: { name: string } | null | undefined;
  mutationType: { name: string } | null | undefined;
  subscriptionType: { name: string } | null | undefined;
  types: readonly IntrospectionType[];
  directives: readonly unknown[];
};

export const findType = <T extends IntrospectionType>(
  typeName: string,
  schema: GraphQLSchema,
  kinds: IntrospectionType["kind"][] = [],
): T | undefined =>
  schema.types.find(
    (type): type is T =>
      type.name === typeName &&
      (kinds.length === 0 || kinds.includes(type.kind)),
  );

export const findTypes = (
  schema: GraphQLSchema,
  kinds: IntrospectionType["kind"][] = [],
): IntrospectionType[] =>
  schema.types.filter(
    (type) =>
      !type.name.startsWith("__") &&
      (kinds.length === 0 || kinds.includes(type.kind)),
  );

export const findQueryFields = (
  schema: GraphQLSchema,
): readonly IntrospectionField[] => {
  if (!schema.queryType) return [];
  const type = findType<IntrospectionObjectType>(
    schema.queryType.name,
    schema,
    ["OBJECT"],
  );
  return type?.fields ?? [];
};

export const findMutationFields = (
  schema: GraphQLSchema,
): readonly IntrospectionField[] => {
  if (!schema.mutationType) return [];
  const type = findType<IntrospectionObjectType>(
    schema.mutationType.name,
    schema,
    ["OBJECT"],
  );
  return type?.fields ?? [];
};

export const findSubscriptionFields = (
  schema: GraphQLSchema,
): readonly IntrospectionField[] => {
  if (!schema.subscriptionType) return [];
  const type = findType<IntrospectionObjectType>(
    schema.subscriptionType.name,
    schema,
    ["OBJECT"],
  );
  return type?.fields ?? [];
};

export const findOperationFields = (
  operationType: "query" | "mutation" | "subscription",
  schema: GraphQLSchema,
): readonly IntrospectionField[] => {
  switch (operationType) {
    case "query":
      return findQueryFields(schema);
    case "mutation":
      return findMutationFields(schema);
    case "subscription":
      return findSubscriptionFields(schema);
  }
};
