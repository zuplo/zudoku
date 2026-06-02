import type {
  IntrospectionField,
  IntrospectionObjectType,
  IntrospectionType,
} from "graphql";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  type GraphQLSchema,
} from "./findType.js";
import { ROOT_TYPES, type RootType } from "./types.js";
import { unwrapType } from "./unwrapType.js";

type OperationType = "query" | "mutation" | "subscription";

export type ReturnedByRef = { fieldName: string; rootType: RootType };
export type AcceptedByRef = {
  fieldName: string;
  argName: string;
  rootType: RootType;
};
export type UsedByFieldRef = {
  label: string;
  ownerName: string;
  ownerKind: string;
  linkKind: RootType;
  linkName: string;
};
export type TypeReferences = {
  returnedBy: ReturnedByRef[];
  acceptedBy: AcceptedByRef[];
  usedByFields: UsedByFieldRef[];
};

export type SchemaIndex = {
  schema: GraphQLSchema;
  getType: <T extends IntrospectionType>(
    name: string,
    kinds?: IntrospectionType["kind"][],
  ) => T | undefined;
  getTypes: (kinds?: IntrospectionType["kind"][]) => IntrospectionType[];
  queryFields: readonly IntrospectionField[];
  mutationFields: readonly IntrospectionField[];
  subscriptionFields: readonly IntrospectionField[];
  operationFields: (op: OperationType) => readonly IntrospectionField[];
  implementedBy: (interfaceName: string) => IntrospectionObjectType[];
  typeReferences: (typeName: string) => TypeReferences;
};

const EMPTY_REFS: TypeReferences = {
  returnedBy: [],
  acceptedBy: [],
  usedByFields: [],
};

// Reverse-reference graph: built in one pass so type detail pages read O(1)
// instead of rescanning every type/field on each render (and each prerender).
const buildTypeReferences = (schema: GraphQLSchema) => {
  const map = new Map<string, TypeReferences>();
  const bucket = (name: string) => {
    const existing = map.get(name);
    if (existing) return existing;
    const created: TypeReferences = {
      returnedBy: [],
      acceptedBy: [],
      usedByFields: [],
    };
    map.set(name, created);
    return created;
  };

  const operations: {
    rootType: RootType;
    fields: readonly IntrospectionField[];
  }[] = [
    { rootType: ROOT_TYPES.QUERY, fields: findQueryFields(schema) },
    { rootType: ROOT_TYPES.MUTATION, fields: findMutationFields(schema) },
    {
      rootType: ROOT_TYPES.SUBSCRIPTION,
      fields: findSubscriptionFields(schema),
    },
  ];

  for (const { rootType, fields } of operations) {
    for (const field of fields) {
      bucket(unwrapType(field.type, []).name).returnedBy.push({
        fieldName: field.name,
        rootType,
      });
      for (const arg of field.args) {
        bucket(unwrapType(arg.type, []).name).acceptedBy.push({
          fieldName: field.name,
          argName: arg.name,
          rootType,
        });
      }
    }
  }

  const rootOperationKind = (name: string): RootType | null =>
    name === schema.queryType?.name
      ? ROOT_TYPES.QUERY
      : name === schema.mutationType?.name
        ? ROOT_TYPES.MUTATION
        : name === schema.subscriptionType?.name
          ? ROOT_TYPES.SUBSCRIPTION
          : null;

  for (const type of schema.types) {
    if (type.name.startsWith("__")) continue;
    const operationKind = rootOperationKind(type.name);
    const rootType =
      operationKind ??
      (type.kind === "OBJECT"
        ? ROOT_TYPES.OBJECT
        : type.kind === "INPUT_OBJECT"
          ? ROOT_TYPES.INPUT_OBJECT
          : type.kind === "INTERFACE"
            ? ROOT_TYPES.INTERFACE
            : null);
    if (!rootType) continue;

    const fields =
      type.kind === "INPUT_OBJECT"
        ? type.inputFields
        : type.kind === "OBJECT" || type.kind === "INTERFACE"
          ? type.fields
          : [];

    for (const field of fields) {
      bucket(unwrapType(field.type, []).name).usedByFields.push({
        label: `${type.name}.${field.name}`,
        ownerName: type.name,
        ownerKind: type.kind,
        linkKind: operationKind ?? rootType,
        linkName: operationKind ? field.name : type.name,
      });
    }
  }

  return map;
};

const cache = new WeakMap<GraphQLSchema, SchemaIndex>();

// Memoized by schema reference so it is computed once per loaded schema and
// shared across the client and every prerendered page.
export const buildSchemaIndex = (schema: GraphQLSchema): SchemaIndex => {
  const cached = cache.get(schema);
  if (cached) return cached;

  const byName = new Map<string, IntrospectionType>();
  const byKind = new Map<string, IntrospectionType[]>();
  const nonInternal: IntrospectionType[] = [];
  const implementedByMap = new Map<string, IntrospectionObjectType[]>();

  for (const type of schema.types) {
    byName.set(type.name, type);
    if (type.name.startsWith("__")) continue;
    nonInternal.push(type);
    const list = byKind.get(type.kind);
    if (list) list.push(type);
    else byKind.set(type.kind, [type]);
    if (type.kind === "OBJECT" && type.interfaces) {
      for (const iface of type.interfaces) {
        const impl = implementedByMap.get(iface.name);
        if (impl) impl.push(type);
        else implementedByMap.set(iface.name, [type]);
      }
    }
  }

  const referencesByType = buildTypeReferences(schema);
  const queryFields = findQueryFields(schema);
  const mutationFields = findMutationFields(schema);
  const subscriptionFields = findSubscriptionFields(schema);

  const index: SchemaIndex = {
    schema,
    getType: <T extends IntrospectionType>(
      name: string,
      kinds: IntrospectionType["kind"][] = [],
    ): T | undefined => {
      const type = byName.get(name);
      if (!type) return undefined;
      if (kinds.length > 0 && !kinds.includes(type.kind)) return undefined;
      return type as T;
    },
    getTypes: (kinds = []) =>
      kinds.length === 0
        ? nonInternal
        : kinds.flatMap((kind) => byKind.get(kind) ?? []),
    queryFields,
    mutationFields,
    subscriptionFields,
    operationFields: (op) =>
      op === "query"
        ? queryFields
        : op === "mutation"
          ? mutationFields
          : subscriptionFields,
    implementedBy: (name) => implementedByMap.get(name) ?? [],
    typeReferences: (name) => referencesByType.get(name) ?? EMPTY_REFS,
  };

  cache.set(schema, index);
  return index;
};
