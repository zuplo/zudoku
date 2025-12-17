import type {
  IntrospectionEnumType,
  IntrospectionField,
  IntrospectionInputObjectType,
  IntrospectionInputValue,
  IntrospectionObjectType,
  IntrospectionType,
  IntrospectionTypeRef,
} from "graphql";
import type { GraphQLSchema } from "./findType.js";
import { findType } from "./findType.js";
import { stringifyType } from "./stringifyType.js";
import { unwrapType, type TypeWrapper } from "./unwrapType.js";

type OperationType = "query" | "mutation" | "subscription";

export type GeneratedGraphQLOperation = {
  operationName: string;
  document: string;
  variables: Record<string, unknown>;
  variablesJson: string;
};

export const generateGraphQLOperation = ({
  field,
  operationType,
  schema,
}: {
  field: IntrospectionField;
  operationType: OperationType;
  schema: GraphQLSchema;
}): GeneratedGraphQLOperation => {
  const operationName = toOperationName(field.name);
  const variables = Object.fromEntries(
    field.args.map((arg) => [arg.name, getExampleValue(arg.type, schema)]),
  );
  const variableDefinitions = field.args
    .map((arg) => `$${arg.name}: ${formatType(arg.type)}`)
    .join(", ");
  const argumentList = field.args
    .map((arg) => `${arg.name}: $${arg.name}`)
    .join(", ");
  const selectionSet = buildSelectionSet(field.type, schema, 1);

  const lines = [
    `${operationType} ${operationName}${
      variableDefinitions ? `(${variableDefinitions})` : ""
    } {`,
    `  ${field.name}${argumentList ? `(${argumentList})` : ""}${
      selectionSet ? ` ${selectionSet}` : ""
    }`,
    `}`,
  ];

  return {
    operationName,
    document: lines.join("\n"),
    variables,
    variablesJson: JSON.stringify(variables, null, 2),
  };
};

const toOperationName = (name: string) =>
  name
    .replace(/(^|[^a-zA-Z0-9])([a-zA-Z0-9])/g, (_match, _separator, char) =>
      char.toUpperCase(),
    )
    .replace(/[^a-zA-Z0-9]/g, "") || "GraphQLOperation";

const formatType = (type: IntrospectionTypeRef) => {
  const wrappers: TypeWrapper[] = [];
  const unwrapped = unwrapType(type, wrappers);
  return stringifyType(unwrapped.name, wrappers);
};

const buildSelectionSet = (
  type: IntrospectionTypeRef,
  schema: GraphQLSchema,
  depth = 0,
  seen = new Set<string>(),
): string => {
  const unwrapped = unwrapType(type, []);
  const resolvedType = findType(unwrapped.name, schema);

  if (!resolvedType) return "";

  if (resolvedType.kind === "SCALAR" || resolvedType.kind === "ENUM") {
    return "";
  }

  if (resolvedType.kind === "UNION") {
    const possibleTypes = resolvedType.possibleTypes.slice(0, 2);
    const lines = ["{", `${indent(depth + 1)}__typename`];

    for (const possibleType of possibleTypes) {
      const objectType = findType<IntrospectionObjectType>(
        possibleType.name,
        schema,
        ["OBJECT"],
      );
      if (!objectType) continue;

      const nested = buildFieldSelection(objectType, schema, depth + 2, seen);
      if (nested.length > 0) {
        lines.push(
          `${indent(depth + 1)}... on ${possibleType.name} {`,
          ...nested,
          `${indent(depth + 1)}}`,
        );
      }
    }

    lines.push(`${indent(depth)}}`);
    return lines.join("\n");
  }

  if (
    (resolvedType.kind !== "OBJECT" && resolvedType.kind !== "INTERFACE") ||
    depth >= 3 ||
    seen.has(resolvedType.name)
  ) {
    return "";
  }

  const lines = buildFieldSelection(resolvedType, schema, depth + 1, seen);
  if (lines.length === 0) return "";

  return ["{", ...lines, `${indent(depth)}}`].join("\n");
};

const buildFieldSelection = (
  type:
    | IntrospectionObjectType
    | Extract<IntrospectionType, { kind: "INTERFACE" }>,
  schema: GraphQLSchema,
  depth: number,
  seen: Set<string>,
) => {
  const nextSeen = new Set(seen).add(type.name);
  const selectedFields = prioritizeFields(type.fields).slice(0, 8);
  const lines: string[] = [];

  for (const field of selectedFields) {
    if (hasRequiredArgs(field)) continue;

    const nestedSelection = buildSelectionSet(
      field.type,
      schema,
      depth,
      nextSeen,
    );

    if (nestedSelection) {
      lines.push(`${indent(depth)}${field.name} ${nestedSelection}`);
    } else if (isLeafType(field.type, schema)) {
      lines.push(`${indent(depth)}${field.name}`);
    }
  }

  if (lines.length === 0) {
    const fallback = type.fields.find((field) =>
      isLeafType(field.type, schema),
    );
    if (fallback) lines.push(`${indent(depth)}${fallback.name}`);
  }

  return lines;
};

const prioritizeFields = (fields: readonly IntrospectionField[]) => {
  const score = (field: IntrospectionField) => {
    if (field.name === "id") return 0;
    if (field.name === "name") return 1;
    if (field.name === "title") return 2;
    if (field.name === "__typename") return 9;
    return 3;
  };

  return [...fields].sort((a, b) => score(a) - score(b));
};

const hasRequiredArgs = (field: IntrospectionField) =>
  field.args.some((arg) => arg.defaultValue == null && isNonNull(arg.type));

const isNonNull = (type: IntrospectionTypeRef) => type.kind === "NON_NULL";

const isLeafType = (type: IntrospectionTypeRef, schema: GraphQLSchema) => {
  const unwrapped = unwrapType(type, []);
  const resolvedType = findType(unwrapped.name, schema);
  return resolvedType?.kind === "SCALAR" || resolvedType?.kind === "ENUM";
};

const getExampleValue = (
  type: IntrospectionTypeRef,
  schema: GraphQLSchema,
): unknown => {
  if (type.kind === "NON_NULL") {
    return getExampleValue(type.ofType, schema);
  }

  if (type.kind === "LIST") {
    return [getExampleValue(type.ofType, schema)];
  }

  const resolvedType = findType(type.name, schema);

  switch (resolvedType?.kind) {
    case "SCALAR":
      return getScalarExample(type.name);
    case "ENUM":
      return (resolvedType as IntrospectionEnumType).enumValues[0]?.name ?? "";
    case "INPUT_OBJECT":
      return getInputObjectExample(resolvedType, schema);
    default:
      return null;
  }
};

const getInputObjectExample = (
  type: IntrospectionInputObjectType,
  schema: GraphQLSchema,
) =>
  Object.fromEntries(
    type.inputFields
      .filter((field) => field.defaultValue == null && isNonNull(field.type))
      .map((field) => [field.name, getInputFieldExample(field, schema)]),
  );

const getInputFieldExample = (
  field: IntrospectionInputValue,
  schema: GraphQLSchema,
) => getExampleValue(field.type, schema);

const getScalarExample = (name: string) => {
  switch (name) {
    case "Int":
    case "Float":
      return 0;
    case "Boolean":
      return false;
    case "ID":
      return "id";
    default:
      return "";
  }
};

const indent = (depth: number) => "  ".repeat(depth);
