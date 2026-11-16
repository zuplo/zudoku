import { ChevronsLeftRightIcon } from "lucide-react";
import { isValidElement, useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import type { SchemaObject } from "../../oas/parser/index.js";
import { cn } from "../../util/cn.js";
import { SchemaRefLink } from "./schema/SchemaRefLink.js";
import { getSchemaRefName, isBinarySchema } from "./schema/utils.js";

const Pattern = ({ pattern }: { pattern: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandable = pattern.length > 20;
  const shortPattern = isExpandable ? `${pattern.slice(0, 20)}…` : pattern;

  return (
    <InlineCode
      className={cn("text-xs", isExpandable && "cursor-pointer")}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? pattern : shortPattern}
      {isExpandable && (
        <button type="button" className="p-1 translate-y-0.5">
          {!isExpanded && <ChevronsLeftRightIcon size={12} />}
        </button>
      )}
    </InlineCode>
  );
};

const getSchemaInfos = (schema?: SchemaObject, nullable?: boolean) => {
  if (!schema) return [];

  const items =
    schema.type === "array" && typeof schema.items === "object"
      ? schema.items
      : undefined;

  const getTypeLabel = () => {
    if (items) {
      const itemsRefName = getSchemaRefName(items);
      if (itemsRefName) {
        return <SchemaRefLink name={itemsRefName} suffix="[]" />;
      }
      if (items.type) {
        return Array.isArray(items.type)
          ? `(${items.type.join(" | ")})[]`
          : `${items.type}[]`;
      }
      if (isBinarySchema(items)) return "binary[]";
    }
    const refName = getSchemaRefName(schema);
    if (refName) return <SchemaRefLink name={refName} />;
    if (isBinarySchema(schema)) return "binary";
    return Array.isArray(schema.type) ? schema.type.join(" | ") : schema.type;
  };

  const getNullableTypeLabel = () => {
    const typeLabel = getTypeLabel();
    const hasNullType =
      Array.isArray(schema.type) && schema.type.includes("null");
    if (!nullable || !typeLabel || hasNullType) return typeLabel;

    return typeof typeLabel === "string" ? (
      `${typeLabel} | null`
    ) : (
      <>{typeLabel} | null</>
    );
  };

  return [
    getNullableTypeLabel(),

    schema.enum && "enum",
    schema.const && "const",
    schema.format,
    isBinarySchema(schema) && schema.contentMediaType,
    items?.contentMediaType,
    schema.minimum !== undefined && `min: ${schema.minimum}`,
    schema.maximum !== undefined && `max: ${schema.maximum}`,
    schema.minLength !== undefined && `minLength: ${schema.minLength}`,
    schema.maxLength !== undefined && `maxLength: ${schema.maxLength}`,
    schema.minItems !== undefined && `minItems: ${schema.minItems}`,
    schema.maxItems !== undefined && `maxItems: ${schema.maxItems}`,
    schema.minProperties !== undefined && `minProps: ${schema.minProperties}`,
    schema.maxProperties !== undefined && `maxProps: ${schema.maxProperties}`,
    schema.uniqueItems && "unique",
    schema.readOnly && "readOnly",
    schema.writeOnly && "writeOnly",
    schema.deprecated && "deprecated",
    schema.pattern && (
      <>
        pattern: <Pattern pattern={schema.pattern} />
      </>
    ),
  ];
};

export const ParamInfos = ({
  schema,
  nullable,
  extraItems = [],
  className,
}: {
  schema?: SchemaObject;
  nullable?: boolean;
  extraItems?: unknown[];
  className?: string;
}) => {
  const filteredItems = [
    ...getSchemaInfos(schema, nullable),
    ...extraItems,
  ].flatMap((item) =>
    typeof item === "string" || isValidElement(item) ? item : [],
  );

  return (
    <span className={className}>
      {filteredItems.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: index should be stable
        <span className="text-muted-foreground" key={index}>
          {item}
          {index < filteredItems.length - 1 && (
            <span className="text-muted-foreground/50">
              &nbsp;&middot;&nbsp;
            </span>
          )}
        </span>
      ))}
    </span>
  );
};
