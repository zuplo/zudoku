import type { SchemaObject } from "../../../oas/parser/index.js";
import { SelectOnClick } from "../components/SelectOnClick.js";

export const SchemaExampleAndDefault = ({
  schema,
}: {
  schema: SchemaObject;
}) => {
  const example = schema.examples?.at(0);
  const defaultValue = schema.default;

  if (!example && !defaultValue) return null;

  return (
    <div className="flex flex-col gap-1 text-xs">
      {example && (
        <div>
          <span className="text-muted-foreground">Example: </span>
          <SelectOnClick className="border rounded px-1 font-mono">
            {typeof example === "object" ? JSON.stringify(example) : example}
          </SelectOnClick>
        </div>
      )}
      {defaultValue && (
        <div>
          <span className="text-muted-foreground">Default: </span>
          <SelectOnClick className="border rounded px-1 font-mono">
            {typeof defaultValue === "object"
              ? JSON.stringify(defaultValue)
              : defaultValue}
          </SelectOnClick>
        </div>
      )}
    </div>
  );
};
