import type { IntrospectionField, IntrospectionType } from "graphql";
import { useMemo, useState } from "react";
import { cn } from "zudoku";
import { SearchIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { Input } from "zudoku/ui/Input.js";
import { useGraphQLSchema } from "../context.js";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  findTypes,
} from "../util/findType.js";
import { kindToRootType, ROOT_TYPES, typeMetadata } from "../util/types.js";

type SearchItem = {
  id: string;
  label: string;
  detail?: string | null;
  kind: string;
  to: string;
};

export const SchemaSearch = () => {
  const { schema, basePath } = useGraphQLSchema();
  const [query, setQuery] = useState("");

  const items = useMemo(
    () => buildSearchItems(schema, basePath),
    [schema, basePath],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? items
        .filter((item) =>
          [item.label, item.detail, item.kind]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedQuery)),
        )
        .slice(0, 8)
    : [];

  return (
    <div className="relative mt-8 max-w-3xl">
      <SearchIcon
        className="absolute left-3 top-2.5 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search operations, types, fields, and arguments"
        className="h-10 pl-9"
      />
      {results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          {results.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="block border-b px-3 py-2.5 last:border-b-0 hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-sm font-semibold">
                  {item.label}
                </span>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-xs", kindClass(item.kind))}
                >
                  {item.kind}
                </Badge>
              </div>
              {item.detail && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const buildSearchItems = (
  schema: ReturnType<typeof useGraphQLSchema>["schema"],
  basePath: string,
): SearchItem[] => {
  const operations = [
    ...toOperationItems(findQueryFields(schema), ROOT_TYPES.QUERY, basePath),
    ...toOperationItems(
      findMutationFields(schema),
      ROOT_TYPES.MUTATION,
      basePath,
    ),
    ...toOperationItems(
      findSubscriptionFields(schema),
      ROOT_TYPES.SUBSCRIPTION,
      basePath,
    ),
  ];

  const types = findTypes(schema)
    .filter(
      (type) =>
        type.name !== schema.queryType?.name &&
        type.name !== schema.mutationType?.name &&
        type.name !== schema.subscriptionType?.name,
    )
    .flatMap((type) => toTypeItems(type, basePath));

  return [...operations, ...types];
};

const toOperationItems = (
  fields: readonly IntrospectionField[],
  rootType: keyof typeof typeMetadata,
  basePath: string,
): SearchItem[] =>
  fields.map((field) => ({
    id: `${rootType}:${field.name}`,
    label: field.name,
    detail: field.description,
    kind: typeMetadata[rootType].labelSingular,
    to: `${basePath}/${rootType}/${field.name}`,
  }));

const toTypeItems = (
  type: IntrospectionType,
  basePath: string,
): SearchItem[] => {
  const rootType = kindToRootType[type.kind];
  if (!rootType) return [];

  const items: SearchItem[] = [
    {
      id: `type:${type.name}`,
      label: type.name,
      detail: "description" in type ? type.description : undefined,
      kind: typeMetadata[rootType].labelSingular,
      to: `${basePath}/${rootType}/${type.name}`,
    },
  ];

  if ("fields" in type && type.fields) {
    items.push(
      ...type.fields.map((field) => ({
        id: `field:${type.name}.${field.name}`,
        label: `${type.name}.${field.name}`,
        detail: field.description,
        kind: "Field",
        to: `${basePath}/${rootType}/${type.name}`,
      })),
    );
  }

  if ("inputFields" in type && type.inputFields) {
    items.push(
      ...type.inputFields.map((field) => ({
        id: `input:${type.name}.${field.name}`,
        label: `${type.name}.${field.name}`,
        detail: field.description,
        kind: "Input",
        to: `${basePath}/${rootType}/${type.name}`,
      })),
    );
  }

  return items;
};

const kindClass = (kind: string) => {
  switch (kind) {
    case "Query":
      return typeMetadata[ROOT_TYPES.QUERY].colorClass;
    case "Mutation":
      return typeMetadata[ROOT_TYPES.MUTATION].colorClass;
    case "Subscription":
      return typeMetadata[ROOT_TYPES.SUBSCRIPTION].colorClass;
    default:
      return "";
  }
};
