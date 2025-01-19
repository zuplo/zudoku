import { useState } from "react";
import { Card } from "zudoku/ui/Card.js";
import { Markdown } from "../../components/Markdown.js";
import { type SchemaObject } from "../../oas/graphql/index.js";
import { ColorizedParam } from "./ColorizedParam.js";
import type { OperationListItemResult } from "./OperationList.js";
import type { ParameterGroup } from "./OperationListItem.js";

const getParameterSchema = (
  parameter: ParameterListItemResult,
): SchemaObject => {
  if (parameter.schema != null && typeof parameter.schema === "object") {
    return parameter.schema;
  }
  return {
    type: "string",
  };
};

const EnumValues = ({ values }: { values: any[] }) => {
  const [showAllEnums, setShowAllEnums] = useState(false);

  if (values.length <= 5 || showAllEnums) {
    return (
      <div>
        <span className="text-muted-foreground">enum</span>
        <Card className="rounded-lg bg-card/75 text-sm px-1 py-0.5 inline-block">
          <span className="text-xs">{values.join(", ")}</span>
        </Card>
      </div>
    );
  }
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setShowAllEnums(true);
      }}
      className="py-px px-1.5 font-medium bg-primary/75 text-xs text-muted rounded-lg"
    >
      {values.length} enum
    </button>
  );
};

export type ParameterListItemResult = NonNullable<
  OperationListItemResult["parameters"]
>[number];

export const ParameterListItem = ({
  parameter,
  group,
  id,
}: {
  parameter: ParameterListItemResult;
  group: ParameterGroup;
  id: string;
}) => {
  const paramSchema = getParameterSchema(parameter);

  return (
    <li className="p-4 bg-border/20 text-sm flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <code>
          {group === "path" ? (
            <ColorizedParam
              name={parameter.name}
              backgroundOpacity="15%"
              slug={id + "-" + parameter.name.toLocaleLowerCase()}
            />
          ) : (
            parameter.name
          )}
        </code>
        {parameter.required && (
          <span className="py-px px-1.5 font-medium bg-primary/75 text-xs text-muted rounded-lg">
            required
          </span>
        )}
        {paramSchema.type && (
          <div className="flex justify-between w-full gap-4">
            <div className="text-muted-foreground flex items-center">
              {paramSchema.type === "array"
                ? `${paramSchema.items.type}[]`
                : paramSchema.type}
            </div>
            {paramSchema.enum && <EnumValues values={paramSchema.enum} />}
          </div>
        )}
      </div>
      {parameter.description && (
        <Markdown
          content={parameter.description}
          className="text-sm prose-p:my-1 prose-code:whitespace-pre-line"
        />
      )}
    </li>
  );
};
