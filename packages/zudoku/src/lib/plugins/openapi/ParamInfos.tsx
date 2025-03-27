import { ChevronsLeftRightIcon } from "lucide-react";
import { isValidElement, useState } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import { type SchemaObject } from "../../oas/parser/index.js";
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

  return [
    schema.type === "array" && schema.items.type
      ? `${schema.items.type}[]`
      : Array.isArray(schema.type)
        ? schema.type.join(" | ")
        : schema.type,

    schema.enum && "enum",
    schema.format,
    schema.minimum && `min: ${schema.minimum}`,
    schema.maximum && `max: ${schema.maximum}`,
    schema.minLength && `minLength: ${schema.minLength}`,
    schema.maxLength && `maxLength: ${schema.maxLength}`,
    schema.minItems && `minItems: ${schema.minItems}`,
    schema.maxItems && `maxItems: ${schema.maxItems}`,
    schema.uniqueItems && "unique",
    schema.minProperties && `minProps: ${schema.minProperties}`,
    schema.maxProperties && `maxProps: ${schema.maxProperties}`,
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
