import type { SchemaObject } from "../../../oas/parser/index.js";
import { SelectOnClick } from "../components/SelectOnClick.js";

export const SchemaExampleAndDefault = ({
  schema,
}: {
  schema: SchemaObject;
}) => {
  const example = schema.examples?.at(0);
  const defaultValue = schema.default;

  if (example === undefined && defaultValue === undefined) return null;

  return (
    <div className="flex flex-col gap-1">
      {example !== undefined && (
        <div>
          <span className="text-muted-foreground">Example: </span>
          <SelectOnClick className="border rounded-sm px-1 font-mono">
            {typeof example === "object" || typeof example === "boolean"
              ? JSON.stringify(example)
              : example}
          </SelectOnClick>
        </div>
      )}
      {defaultValue !== undefined && (
        <div>
          <span className="text-muted-foreground">Default: </span>
          <SelectOnClick className="border rounded-sm px-1 font-mono">
            {typeof defaultValue === "object" ||
            typeof defaultValue === "boolean"
              ? JSON.stringify(defaultValue)
              : defaultValue}
          </SelectOnClick>
        </div>
      )}
    </div>
  );
};
