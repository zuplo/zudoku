import { InfoIcon } from "lucide-react";
import { Fragment } from "react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
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
import { isArrayType, isBasicType } from "./utils.js";

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

  if (isArrayType(schema) && typeof schema.items === "object") {
    const wrappedSchema: SchemaObject = {
      type: "object",
      properties: { "": schema },
    };

    return (
      <SchemaView schema={wrappedSchema} cardHeader={cardHeader} defaultOpen />
    );
  }

  const additionalObjectProperties = typeof schema.additionalProperties ===
    "object" && <SchemaView schema={schema.additionalProperties} embedded />;

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
    const groups = groupNames.flatMap((group) => {
      const properties = groupedProperties[group];
      return properties ? { group, properties } : [];
    });

    const itemsList = groups.map(({ group, properties }, index) => (
      <Fragment key={group}>
        {index > 0 && <ItemSeparator />}
        <ItemGroup className="overflow-clip">
          {properties.map(([name, schema], index) => (
            <Fragment key={name}>
              {index > 0 && <ItemSeparator />}
              <SchemaPropertyItem
                name={name}
                schema={schema}
                group={group}
                defaultOpen={defaultOpen}
              />
            </Fragment>
          ))}
        </ItemGroup>
      </Fragment>
    ));

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
        {(itemsList.length > 0 || additionalObjectProperties) && (
          <FramePanel className="p-0!">
            {itemsList}
            {additionalObjectProperties}
          </FramePanel>
        )}
        {schema.additionalProperties === true && (
          <FrameFooter>
            <a
              className="text-sm flex items-center gap-1 hover:underline"
              href="https://swagger.io/docs/specification/v3_0/data-models/dictionaries/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Additional properties are allowed
              <InfoIcon size={14} />
            </a>
          </FrameFooter>
        )}
      </Frame>
    );
  }
};
