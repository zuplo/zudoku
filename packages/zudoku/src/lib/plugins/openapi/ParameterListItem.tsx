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
              className="px-1"
              slug={`${id}-${parameter.name}`}
            />
          ) : (
            parameter.name
          )}
        </code>
        {paramSchema.type && (
          <>
            {paramSchema.type === "array"
              ? `${paramSchema.items.type}[]`
              : paramSchema.type}
          </>
        )}
        {parameter.required && "required"}
        {parameter.style === "form" && "form"}
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
