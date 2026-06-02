import { EyeIcon, EyeOffIcon, InfoIcon } from "lucide-react";
import { Fragment, useId, useLayoutEffect, useRef, useState } from "react";
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
import { ConstValue } from "../components/ConstValue.js";
import { EnumValues } from "../components/EnumValues.js";
import { ParamInfos } from "../ParamInfos.js";
import { SchemaExampleAndDefault } from "./SchemaExampleAndDefault.js";
import { SchemaPropertyItem } from "./SchemaPropertyItem.js";
import { SchemaRefLink } from "./SchemaRefLink.js";
import { UnionView } from "./UnionView.js";
import { getSchemaRefName, isArrayType, isBasicType } from "./utils.js";

const RootRefLabel = ({ name }: { name: string }) => (
  <div className="text-xs font-semibold flex items-center gap-1.5 px-4 py-2 border-b bg-muted/40">
    <SchemaRefLink name={name} />
  </div>
);

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

const PropertyGroup = ({
  properties,
  group,
  defaultOpen,
}: {
  properties: [string, SchemaObject][];
  group: "required" | "optional" | "deprecated";
  defaultOpen: boolean;
}) => (
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
);

const DeprecatedToggle = ({
  count,
  showDeprecated,
  onToggle,
  controlsId,
}: {
  count: number;
  showDeprecated: boolean;
  onToggle: () => void;
  controlsId: string;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={showDeprecated}
    aria-controls={controlsId}
    className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
  >
    {showDeprecated ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
    {showDeprecated
      ? "Hide deprecated fields"
      : `Show ${count} deprecated field${count !== 1 ? "s" : ""}`}
  </button>
);

const ObjectSchemaView = ({
  schema,
  defaultOpen,
  cardHeader,
  embedded,
  rootRefName,
}: {
  schema: SchemaObject;
  defaultOpen: boolean;
  cardHeader?: React.ReactNode;
  embedded?: boolean;
  rootRefName?: string;
}) => {
  const [showDeprecated, setShowDeprecated] = useState(false);
  const deprecatedRef = useRef<HTMLDivElement>(null);
  const deprecatedId = useId();

  // Upgrade hidden → hidden="until-found" so browser Cmd+F can find text inside.
  // Uses useLayoutEffect to set the attribute before paint, avoiding flash.
  // Managed imperatively because React types don't support "until-found" value.
  useLayoutEffect(() => {
    const el = deprecatedRef.current;
    if (!el) return;

    if (!showDeprecated) {
      el.setAttribute("hidden", "until-found");
    } else {
      el.removeAttribute("hidden");
    }

    const handler = () => setShowDeprecated(true);
    el.addEventListener("beforematch", handler);
    return () => el.removeEventListener("beforematch", handler);
  }, [showDeprecated]);

  const groupedProperties = Object.groupBy(
    Object.entries(schema.properties ?? {}),
    ([propertyName, property]) => {
      return property.deprecated
        ? "deprecated"
        : schema.required?.includes(propertyName)
          ? "required"
          : "optional";
    },
  );

  const nonDeprecatedGroupNames = ["required", "optional"] as const;
  const nonDeprecatedGroups = nonDeprecatedGroupNames.flatMap((group) => {
    const properties = groupedProperties[group];
    return properties ? { group, properties } : [];
  });

  const deprecatedProperties = groupedProperties.deprecated;

  const additionalObjectProperties = typeof schema.additionalProperties ===
    "object" && <SchemaView schema={schema.additionalProperties} embedded />;

  const hasUnion = Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf);
  const unionSection = hasUnion && <UnionView schema={schema} embedded />;

  const itemsList = nonDeprecatedGroups.map(({ group, properties }, index) => (
    <Fragment key={group}>
      {index > 0 && <ItemSeparator />}
      <PropertyGroup
        properties={properties}
        group={group}
        defaultOpen={defaultOpen}
      />
    </Fragment>
  ));

  const deprecatedList = deprecatedProperties && (
    <>
      {nonDeprecatedGroups.length > 0 && <ItemSeparator />}
      <PropertyGroup
        properties={deprecatedProperties}
        group="deprecated"
        defaultOpen={defaultOpen}
      />
    </>
  );

  if (embedded) {
    return (
      <>
        {itemsList}
        {deprecatedList}
        {unionSection &&
          (nonDeprecatedGroups.length > 0 || deprecatedProperties) && (
            <ItemSeparator />
          )}
        {unionSection}
      </>
    );
  }

  const hasPanelContent =
    nonDeprecatedGroups.length > 0 ||
    deprecatedProperties ||
    additionalObjectProperties ||
    unionSection;

  return (
    <Frame>
      {cardHeader}
      {schema.description && (
        <FrameHeader>
          <FrameDescription>{schema.description}</FrameDescription>
        </FrameHeader>
      )}
      {(hasPanelContent || rootRefName) && (
        <FramePanel className="p-0!">
          {rootRefName && <RootRefLabel name={rootRefName} />}
          {itemsList}
          {deprecatedProperties && (
            <div ref={deprecatedRef} id={deprecatedId} hidden={!showDeprecated}>
              {deprecatedList}
            </div>
          )}
          {additionalObjectProperties}
          {unionSection &&
            (nonDeprecatedGroups.length > 0 ||
              (showDeprecated && deprecatedProperties)) && <ItemSeparator />}
          {unionSection}
        </FramePanel>
      )}
      {(schema.additionalProperties === true || deprecatedProperties) && (
        <FrameFooter className="flex-row items-center justify-between">
          {schema.additionalProperties === true ? (
            <a
              className="text-sm flex items-center gap-1 hover:underline"
              href="https://swagger.io/docs/specification/v3_0/data-models/dictionaries/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Additional properties are allowed
              <InfoIcon size={14} />
            </a>
          ) : (
            <span />
          )}
          {deprecatedProperties && (
            <DeprecatedToggle
              count={deprecatedProperties.length}
              showDeprecated={showDeprecated}
              onToggle={() => setShowDeprecated(!showDeprecated)}
              controlsId={deprecatedId}
            />
          )}
        </FrameFooter>
      )}
    </Frame>
  );
};

export const SchemaView = ({
  schema,
  defaultOpen = false,
  cardHeader,
  embedded,
  hideRootRef,
}: {
  schema?: SchemaObject | null;
  defaultOpen?: boolean;
  cardHeader?: React.ReactNode;
  embedded?: boolean;
  hideRootRef?: boolean;
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

  const hasUnion = Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf);

  if (hasUnion && !schema.properties) {
    return (
      <UnionView schema={schema} cardHeader={cardHeader} embedded={embedded} />
    );
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

  if (schema.type === "object" || schema.properties || hasUnion) {
    const rootRefName =
      !embedded && !hideRootRef ? getSchemaRefName(schema) : undefined;
    return (
      <ObjectSchemaView
        schema={schema}
        defaultOpen={defaultOpen}
        cardHeader={cardHeader}
        embedded={embedded}
        rootRefName={rootRefName}
      />
    );
  }
};
