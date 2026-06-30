import type {
  IntrospectionEnumType,
  IntrospectionField,
  IntrospectionInputObjectType,
  IntrospectionInputValue,
  IntrospectionObjectType,
  IntrospectionType,
  IntrospectionTypeRef,
} from "graphql";
import type { SchemaIndex } from "./schemaIndex.js";
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
  index,
}: {
  field: IntrospectionField;
  operationType: OperationType;
  index: SchemaIndex;
}): GeneratedGraphQLOperation => {
  const operationName = toOperationName(field.name);
  const variables = Object.fromEntries(
    field.args.map((arg) => [arg.name, getExampleValue(arg.type, index)]),
  );
  const variableDefinitions = field.args
    .map((arg) => `$${arg.name}: ${formatType(arg.type)}`)
    .join(", ");
  const argumentList = field.args
    .map((arg) => `${arg.name}: $${arg.name}`)
    .join(", ");
  const selectionSet = buildSelectionSet(field.type, index, 1);

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

export const generateGraphQLTypeFragment = ({
  type,
  index,
}: {
  type: IntrospectionType;
  index: SchemaIndex;
}): string | undefined => {
  if (
    type.kind !== "OBJECT" &&
    type.kind !== "INTERFACE" &&
    type.kind !== "UNION"
  ) {
    return undefined;
  }

  const selectionSet = buildSelectionSet(
    { kind: type.kind, name: type.name },
    index,
    0,
  );

  if (!selectionSet) return undefined;

  return `fragment ${type.name}Fields on ${type.name} ${selectionSet}`;
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
  index: SchemaIndex,
  depth = 0,
  seen = new Set<string>(),
): string => {
  const unwrapped = unwrapType(type, []);
  const resolvedType = index.getType(unwrapped.name);

  if (!resolvedType) return "";

  if (resolvedType.kind === "SCALAR" || resolvedType.kind === "ENUM") {
    return "";
  }

  if (resolvedType.kind === "UNION") {
    const possibleTypes = resolvedType.possibleTypes.slice(0, 2);
    const lines = ["{", `${indent(depth + 1)}__typename`];

    for (const possibleType of possibleTypes) {
      const objectType = index.getType<IntrospectionObjectType>(
        possibleType.name,
        ["OBJECT"],
      );
      if (!objectType) continue;

      const nested = buildFieldSelection(objectType, index, depth + 2, seen);
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

  const lines = buildFieldSelection(resolvedType, index, depth + 1, seen);
  if (lines.length === 0) return "";

  return ["{", ...lines, `${indent(depth)}}`].join("\n");
};

const buildFieldSelection = (
  type:
    | IntrospectionObjectType
    | Extract<IntrospectionType, { kind: "INTERFACE" }>,
  index: SchemaIndex,
  depth: number,
  seen: Set<string>,
) => {
  const nextSeen = new Set(seen).add(type.name);
  const selectedFields = prioritizeFields(type.fields).slice(0, 8);
  const lines: string[] = [];

  for (const field of selectedFields) {
    if (field.isDeprecated || hasRequiredArgs(field)) continue;

    const nestedSelection = buildSelectionSet(
      field.type,
      index,
      depth,
      nextSeen,
    );

    if (nestedSelection) {
      lines.push(`${indent(depth)}${field.name} ${nestedSelection}`);
    } else if (isLeafType(field.type, index)) {
      lines.push(`${indent(depth)}${field.name}`);
    }
  }

  if (lines.length === 0) {
    const fallback = type.fields.find(
      (field) => !field.isDeprecated && isLeafType(field.type, index),
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

const isLeafType = (type: IntrospectionTypeRef, index: SchemaIndex) => {
  const unwrapped = unwrapType(type, []);
  const resolvedType = index.getType(unwrapped.name);
  return resolvedType?.kind === "SCALAR" || resolvedType?.kind === "ENUM";
};

const getExampleValue = (
  type: IntrospectionTypeRef,
  index: SchemaIndex,
): unknown => {
  if (type.kind === "NON_NULL") {
    return getExampleValue(type.ofType, index);
  }

  if (type.kind === "LIST") {
    return [getExampleValue(type.ofType, index)];
  }

  const resolvedType = index.getType(type.name);

  switch (resolvedType?.kind) {
    case "SCALAR":
      return getScalarExample(type.name);
    case "ENUM":
      return (resolvedType as IntrospectionEnumType).enumValues[0]?.name ?? "";
    case "INPUT_OBJECT":
      return getInputObjectExample(resolvedType, index);
    default:
      return null;
  }
};

const getInputObjectExample = (
  type: IntrospectionInputObjectType,
  index: SchemaIndex,
) =>
  Object.fromEntries(
    type.inputFields
      .filter((field) => field.defaultValue == null && isNonNull(field.type))
      .map((field) => [field.name, getInputFieldExample(field, index)]),
  );

const getInputFieldExample = (
  field: IntrospectionInputValue,
  index: SchemaIndex,
) => getExampleValue(field.type, index);

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
