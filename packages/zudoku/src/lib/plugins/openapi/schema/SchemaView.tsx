import { InfoIcon } from "lucide-react";
import { Markdown } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Card } from "../../../ui/Card.js";
import { groupBy } from "../../../util/groupBy.js";
import { ConstValue } from "../components/ConstValue.js";
import { EnumValues } from "../components/EnumValues.js";
import { ParamInfos } from "../ParamInfos.js";
import { AllOfGroupView } from "./AllOfGroup/AllOfGroupView.js";
import { SchemaExampleAndDefault } from "./SchemaExampleAndDefault.js";
import { SchemaPropertyItem } from "./SchemaPropertyItem.js";
import { UnionView } from "./UnionView.js";
import { isBasicType } from "./utils.js";

const renderMarkdown = (content?: string) =>
  content && (
    <Markdown
      className="text-sm leading-normal line-clamp-4"
      content={content}
    />
  );

const renderBasicSchema = (
  schema: SchemaObject,
  cardHeader?: React.ReactNode,
) => (
  <Card className="overflow-hidden">
    {cardHeader}
    <div className="p-4 space-y-2">
      <span className="text-sm text-muted-foreground">
        <ParamInfos schema={schema} />
      </span>
      {schema.enum && <EnumValues values={schema.enum} />}
      {renderMarkdown(schema.description)}
      <SchemaExampleAndDefault schema={schema} />
    </div>
  </Card>
);

export const SchemaView = ({
  schema,
  defaultOpen = false,
  cardHeader,
  embedded,
}: {
  schema?: SchemaObject | null;
  defaultOpen?: boolean;
  cardHeader?: React.ReactNode;
  embedded?: boolean;
}) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <Card className="overflow-hidden">
        {cardHeader}
        <div className="text-sm text-muted-foreground italic p-4">
          No data returned
        </div>
      </Card>
    );
  }

  if (schema.const) {
    return <ConstValue schema={schema} />;
  }

  if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
    return <UnionView schema={schema} cardHeader={cardHeader} />;
  }

  if (Array.isArray(schema.allOf)) {
    return <AllOfGroupView schema={schema} cardHeader={cardHeader} />;
  }

  if (isBasicType(schema.type)) {
    return renderBasicSchema(schema, cardHeader);
  }

  if (schema.type === "array" && typeof schema.items === "object") {
    return <SchemaView schema={schema.items} cardHeader={cardHeader} />;
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
        <SchemaView schema={schema.additionalProperties} embedded />
      ) : schema.additionalProperties === true ? (
        <div className="text-sm p-4 bg-border/20 hover:bg-border/30 flex items-center gap-1">
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

    const Component = embedded ? "div" : Card;

    return (
      <Component className="divide-y overflow-hidden">
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
      </Component>
    );
  }

  return null;
};
