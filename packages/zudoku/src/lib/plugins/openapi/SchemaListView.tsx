import { Markdown } from "../../components/Markdown.js";
import { SchemaObject } from "../../oas/parser/index.js";
import { Card } from "../../ui/Card.js";
import { groupBy } from "../../util/groupBy.js";
import { objectEntries } from "../../util/objectEntries.js";
import { SchemaListViewItem } from "./SchemaListViewItem.js";
import { SchemaListViewItemGroup } from "./SchemaListViewItemGroup.js";
import { SchemaProseClasses } from "./util/prose.js";

export const SchemaListView = ({
  name,
  schema,
  level = 0,
  defaultOpen = false,
}: {
  level?: number;
  defaultOpen?: boolean;
  name?: string;
  schema: SchemaObject;
}) => {
  const properties = Object.entries(schema.properties ?? {});
  const additionalProperties =
    typeof schema.additionalProperties === "object"
      ? Object.entries(schema.additionalProperties)
      : [];

  const combinedProperties = properties.concat(
    Array.isArray(additionalProperties) ? additionalProperties : [],
  );

  const groups = groupBy(combinedProperties, ([propertyName, property]) => {
    return property.deprecated
      ? "deprecated"
      : schema.required?.includes(propertyName)
        ? "required"
        : "optional";
  });

  if (schema.type === "array") {
    return (
      <Card className="overflow-hidden">
        <SchemaListViewItem
          propertyName={schema.title ?? name}
          isRequired={true}
          property={schema}
          defaultOpen={level === 0}
          nestingLevel={level}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {(schema.title ?? name) && (
        <div className="ml-2 my-1 font-bold">{schema.title ?? name}</div>
      )}
      {level === 0 && schema.description && (
        <Markdown className={SchemaProseClasses} content={schema.description} />
      )}
      <Card className="overflow-hidden">
        {objectEntries(groups).map(([group, properties]) => (
          <SchemaListViewItemGroup
            key={group}
            defaultOpen={defaultOpen}
            group={group}
            nestingLevel={level}
            properties={properties ?? []}
            required={schema.required ?? []}
          />
        ))}
      </Card>
    </div>
  );
};
