import { InfoIcon } from "lucide-react";
import { Fragment } from "react";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
} from "zudoku/ui/Frame.js";
import { ItemGroup, ItemSeparator } from "zudoku/ui/Item.js";
import { Markdown } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { groupBy } from "../../../util/groupBy.js";
import { ConstValue } from "../components/ConstValue.js";
import { EnumValues } from "../components/EnumValues.js";
import { ParamInfos } from "../ParamInfos.js";
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
  embedded?: boolean,
) => {
  const content = (
    <>
      <span className="text-sm text-muted-foreground">
        <ParamInfos schema={schema} />
      </span>
      {schema.enum && <EnumValues values={schema.enum} />}
      {renderMarkdown(schema.description)}
      <SchemaExampleAndDefault schema={schema} />
    </>
  );

  if (embedded) {
    return <div className="space-y-2 p-4">{content}</div>;
  }

  return (
    <Frame>
      {cardHeader}
      <FramePanel className="space-y-2">{content}</FramePanel>
    </Frame>
  );
};

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
      <Frame>
        {cardHeader}
        <FramePanel>
          <div className="text-sm text-muted-foreground italic">
            No data returned
          </div>
        </FramePanel>
      </Frame>
    );
  }

  if (schema.const) {
    return <ConstValue schema={schema} />;
  }

  if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
    return <UnionView schema={schema} cardHeader={cardHeader} />;
  }

  if (isBasicType(schema.type)) {
    return renderBasicSchema(schema, cardHeader, embedded);
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
        <div className="text-sm p-4 flex items-center gap-1">
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

    const itemsList = groupNames.map(
      (group) =>
        groupedProperties[group] && (
          <ItemGroup key={group} className="overflow-clip">
            {groupedProperties[group].map(([name, schema]) => (
              <Fragment key={name}>
                <SchemaPropertyItem
                  name={name}
                  schema={schema}
                  group={group}
                  defaultOpen={defaultOpen}
                />
                <ItemSeparator />
              </Fragment>
            ))}
          </ItemGroup>
        ),
    );

    if (embedded) {
      return itemsList;
    }

    return (
      <Frame>
        {cardHeader}
        {schema.description && (
          <FrameHeader>
            <FrameDescription>{schema.description}</FrameDescription>
          </FrameHeader>
        )}

        <FramePanel className="p-0!">
          {itemsList}
          {additionalProperties}
        </FramePanel>
      </Frame>
    );
  }
};
