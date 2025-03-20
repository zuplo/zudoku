import { isValidElement } from "react";
import { InlineCode } from "../../components/InlineCode.js";
import { type SchemaObject } from "../../oas/parser/index.js";

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
        pattern: <InlineCode className="text-xs">{schema.pattern}</InlineCode>
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
    <div className={className}>
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
    </div>
  );
};
