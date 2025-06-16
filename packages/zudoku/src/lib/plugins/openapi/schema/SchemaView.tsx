import { InfoIcon } from "lucide-react";
import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { cn } from "../../../util/cn.js";
import { groupBy } from "../../../util/groupBy.js";
import { ConstValue } from "../components/ConstValue.js";
import { EnumValues } from "../components/EnumValues.js";
import { ParamInfos } from "../ParamInfos.js";
import { SchemaExampleAndDefault } from "./SchemaExampleAndDefault.js";
import {
  SchemaLogicalGroup,
  SchemaPropertyItem,
} from "./SchemaPropertyItem.js";
import { hasLogicalGroupings, isBasicType } from "./utils.js";

const renderMarkdown = (content?: string) =>
  content && (
    <Markdown
      className={cn(ProseClasses, "text-sm leading-normal line-clamp-4")}
      content={content}
    />
  );

const renderBasicSchema = (schema: SchemaObject) => (
  <div className="p-4 space-y-2">
    <span className="text-sm text-muted-foreground">
      <ParamInfos schema={schema} />
    </span>
    {schema.enum && <EnumValues values={schema.enum} />}
    {renderMarkdown(schema.description)}
    <SchemaExampleAndDefault schema={schema} />
  </div>
);

export const SchemaView = ({
  schema,
  defaultOpen = false,
  cardHeader,
}: {
  schema?: SchemaObject | null;
  defaultOpen?: boolean;
  cardHeader?: React.ReactNode;
}) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="overflow-hidden">
        {cardHeader}
        <div className="text-sm text-muted-foreground italic p-4">
          No data returned
        </div>
      </div>
    );
  }

  if (schema.const) {
    return <ConstValue schema={schema} />;
  }

  if (hasLogicalGroupings(schema)) {
    return <SchemaLogicalGroup schema={schema} />;
  }

  if (isBasicType(schema.type)) {
    return renderBasicSchema(schema);
  }

  if (schema.type === "array" && typeof schema.items === "object") {
    return <SchemaView schema={schema.items} />;
  }

  if (schema.type === "object") {
    const groupedProperties = groupBy(
      Object.entries(schema.properties ?? {}),
      ([propertyName, property]) => {
        return property.deprecated
          ? "deprecated"
          : schema.required?.includes(propertyName)
            ? "required"
            : "optional";
      },
    );
    const groupNames = ["required", "optional", "deprecated"] as const;

    const additionalProperties =
      typeof schema.additionalProperties === "object" ? (
        <SchemaView schema={schema.additionalProperties} />
      ) : schema.additionalProperties === true ? (
        <div
          className={cn(
            ProseClasses,
            "text-sm p-4 bg-border/20 hover:bg-border/30 flex items-center gap-1",
          )}
        >
          <span>Additional properties are allowed</span>
          <a
            className="p-0.5 -m-0.5"
            href="https://swagger.io/docs/specification/v3_0/data-models/dictionaries/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <InfoIcon size={14} />
          </a>
        </div>
      ) : null;

    return (
      <div className="divide-y overflow-hidden rounded-md border shadow-xs dark:shadow-none">
        {cardHeader}
        {groupNames.map(
          (group) =>
            groupedProperties[group] && (
              <ul key={group} className="divide-y">
                {groupedProperties[group].map(([name, schema]) => (
                  <SchemaPropertyItem
                    key={name}
                    name={name}
                    schema={schema}
                    group={group}
                    defaultOpen={defaultOpen}
                  />
                ))}
              </ul>
            ),
        )}
        {additionalProperties}
      </div>
    );
  }

  return null;
};
