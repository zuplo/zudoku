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
}) => (
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
        <span className="py-px px-1.5 font-medium bg-primary/75 text-muted rounded-lg">
          required
        </span>
      )}
      {getParameterSchema(parameter).type && (
        <span className="text-muted-foreground">
          {getParameterSchema(parameter).type}
        </span>
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
