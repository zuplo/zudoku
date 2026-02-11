import { Fragment } from "react";
import { Heading } from "../../../components/Heading.js";
import { Markdown } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Frame, FramePanel } from "../../../ui/Frame.js";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "../../../ui/Item.js";
import { EnumValues } from "../../openapi/components/EnumValues.js";
import { ParamInfos } from "../../openapi/ParamInfos.js";

type HeadersDisplayProps = {
  headers: Record<string, unknown> | null;
  id: string;
  title?: string;
};

/**
 * Display message headers in OpenAPI-style format
 */
export const HeadersDisplay = ({
  headers,
  id,
  title = "Headers",
}: HeadersDisplayProps) => {
  if (!headers) return null;

  const schema = headers as SchemaObject;
  const properties = schema.properties as
    | Record<string, SchemaObject>
    | undefined;
  const requiredFields = (schema.required as string[]) ?? [];

  if (!properties || Object.keys(properties).length === 0) return null;

  // Sort by required status (required first)
  const sortedHeaders = Object.entries(properties).sort(([keyA], [keyB]) => {
    const aRequired = requiredFields.includes(keyA);
    const bRequired = requiredFields.includes(keyB);
    return aRequired === bRequired ? 0 : aRequired ? -1 : 1;
  });

  return (
    <>
      <Heading level={4} id={`${id}/headers`}>
        {title}
      </Heading>
      <Frame>
        <FramePanel className="p-0!">
          <ItemGroup className="overflow-clip">
            {sortedHeaders.map(([name, headerSchema], index) => (
              <Fragment key={name}>
                {index > 0 && <ItemSeparator />}
                <HeaderItem
                  name={name}
                  schema={headerSchema}
                  required={requiredFields.includes(name)}
                />
              </Fragment>
            ))}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </>
  );
};

/**
 * Individual header item
 */
const HeaderItem = ({
  name,
  schema,
  required,
}: {
  name: string;
  schema: SchemaObject;
  required: boolean;
}) => {
  const hasContent = Boolean(
    schema.description || schema.enum || schema.example !== undefined,
  );

  return (
    <Item>
      <ItemContent className="gap-y-2">
        <div>
          <ItemTitle className="inline me-2">
            <code>{name}</code>
          </ItemTitle>
          <ParamInfos
            className="inline"
            schema={schema}
            extraItems={[
              required && <span className="text-primary">required</span>,
            ]}
          />
        </div>
        {hasContent && (
          <div className="flex flex-col gap-1.5">
            {schema.description && (
              <Markdown content={schema.description} className="prose-sm" />
            )}
            {schema.enum && <EnumValues values={schema.enum as string[]} />}
          </div>
        )}
      </ItemContent>
    </Item>
  );
};
