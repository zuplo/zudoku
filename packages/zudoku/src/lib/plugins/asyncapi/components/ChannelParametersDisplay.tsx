import { Fragment } from "react";
import { Heading } from "../../../components/Heading.js";
import { Markdown } from "../../../components/Markdown.js";
import { Frame, FramePanel } from "../../../ui/Frame.js";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "../../../ui/Item.js";
import { ColorizedParam } from "../../openapi/ColorizedParam.js";
import { EnumValues } from "../../openapi/components/EnumValues.js";
import type { ChannelParameterResult } from "../graphql/queries.js";

type ChannelParametersDisplayProps = {
  parameters: ChannelParameterResult[];
  id: string;
};

/**
 * Display channel parameters in OpenAPI-style format
 */
export const ChannelParametersDisplay = ({
  parameters,
  id,
}: ChannelParametersDisplayProps) => {
  if (parameters.length === 0) return null;

  return (
    <>
      <Heading level={3} id={`${id}/parameters`}>
        Channel Parameters
      </Heading>
      <Frame>
        <FramePanel className="p-0!">
          <ItemGroup className="overflow-clip">
            {parameters.map((param, index) => (
              <Fragment key={param.name}>
                {index > 0 && <ItemSeparator />}
                <ChannelParameterItem parameter={param} id={id} />
              </Fragment>
            ))}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </>
  );
};

/**
 * Individual channel parameter item
 */
const ChannelParameterItem = ({
  parameter,
  id,
}: {
  parameter: ChannelParameterResult;
  id: string;
}) => {
  const hasContent = Boolean(
    parameter.description ||
      parameter.enum ||
      parameter.default ||
      parameter.examples ||
      parameter.location,
  );

  return (
    <Item>
      <ItemContent className="gap-y-2">
        <div>
          <ItemTitle className="inline me-2">
            <ColorizedParam
              name={parameter.name}
              backgroundOpacity="15%"
              className="px-2"
              slug={`${id}-${parameter.name}`}
            />
          </ItemTitle>
          <span className="text-muted-foreground">
            {parameter.location && (
              <span className="text-xs">location: {parameter.location}</span>
            )}
          </span>
        </div>
        {hasContent && (
          <div className="flex flex-col gap-1.5">
            {parameter.description && (
              <Markdown content={parameter.description} className="prose-sm" />
            )}
            {parameter.enum && <EnumValues values={parameter.enum} />}
            {parameter.default && (
              <div className="text-sm">
                <span className="text-muted-foreground">Default: </span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {parameter.default}
                </code>
              </div>
            )}
            {parameter.examples && parameter.examples.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Examples: </span>
                {parameter.examples.map((ex, i) => (
                  <span key={ex}>
                    {i > 0 && ", "}
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {ex}
                    </code>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </ItemContent>
    </Item>
  );
};
