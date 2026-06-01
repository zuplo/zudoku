import type { IntrospectionField, IntrospectionType } from "graphql";
import { useMemo, useState } from "react";
import { cn } from "zudoku";
import { SearchIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { Input } from "zudoku/ui/Input.js";
import { useGraphQLSchema } from "../context.js";
import type { SchemaIndex } from "../util/schemaIndex.js";
import { kindToRootType, ROOT_TYPES, typeMetadata } from "../util/types.js";

type SearchItem = {
  id: string;
  label: string;
  detail?: string | null;
  kind: string;
  to: string;
};

export const SchemaSearch = () => {
  const { index, basePath } = useGraphQLSchema();
  const [query, setQuery] = useState("");

  const items = useMemo(
    () => buildSearchItems(index, basePath),
    [index, basePath],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return items
      .filter((item) =>
        [item.label, item.detail, item.kind]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 8);
  }, [items, normalizedQuery]);

  return (
    <div className="relative max-w-3xl">
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
  index: SchemaIndex,
  basePath: string,
): SearchItem[] => {
  const operations = [
    ...toOperationItems(index.queryFields, ROOT_TYPES.QUERY, basePath),
    ...toOperationItems(index.mutationFields, ROOT_TYPES.MUTATION, basePath),
    ...toOperationItems(
      index.subscriptionFields,
      ROOT_TYPES.SUBSCRIPTION,
      basePath,
    ),
  ];

  const types = index
    .getTypes()
    .filter(
      (type) =>
        type.name !== index.schema.queryType?.name &&
        type.name !== index.schema.mutationType?.name &&
        type.name !== index.schema.subscriptionType?.name,
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
        to: `${basePath}/${rootType}/${type.name}#field-${field.name}`,
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
        to: `${basePath}/${rootType}/${type.name}#arg-${field.name}`,
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
