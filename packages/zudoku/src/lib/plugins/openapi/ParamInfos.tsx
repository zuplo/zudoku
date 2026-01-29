import { ChevronsLeftRightIcon } from "lucide-react";
import { isValidElement, useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import type { SchemaObject } from "../../oas/parser/index.js";
import { cn } from "../../util/cn.js";

const Pattern = ({ pattern }: { pattern: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandable = pattern.length > 20;
  const shortPattern = isExpandable ? `${pattern.slice(0, 20)}…` : pattern;

  return (
    <InlineCode
      className={cn("text-xs", isExpandable && "cursor-pointer")}
      onClick={() => setIsExpanded(!isExpanded)}
      selectOnClick={false}
    >
      {isExpanded ? pattern : shortPattern}
      {isExpandable && (
        <button type="button" className="p-1 translate-y-[2px]">
          {!isExpanded && <ChevronsLeftRightIcon size={12} />}
        </button>
      )}
    </InlineCode>
  );
};

const getSchemaInfos = (schema?: SchemaObject) => {
  if (!schema) return [];

  const items =
    schema.type === "array" && typeof schema.items === "object"
      ? schema.items
      : undefined;

  return [
    items?.type
      ? Array.isArray(items.type)
        ? `(${items.type.join(" | ")})[]`
        : `${items.type}[]`
      : Array.isArray(schema.type)
        ? schema.type.join(" | ")
        : schema.type,

    schema.enum && "enum",
    schema.const && "const",
    schema.format,
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
  extraItems = [],
  className,
}: {
  schema?: SchemaObject;
  extraItems?: unknown[];
  className?: string;
}) => {
  const filteredItems = [...getSchemaInfos(schema), ...extraItems].flatMap(
    (item) => (typeof item === "string" || isValidElement(item) ? item : []),
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
