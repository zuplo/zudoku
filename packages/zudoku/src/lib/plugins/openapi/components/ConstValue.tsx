import type { SchemaObject } from "../../../oas/parser/index.js";
import { SelectOnClick } from "./SelectOnClick.js";

export const ConstValue = ({
  schema,
  hideDescription = false,
}: {
  schema: SchemaObject;
  hideDescription?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div>
        <span className="text-muted-foreground">Const value: </span>
        <SelectOnClick className="border rounded px-1 font-mono">
          {schema.const}
        </SelectOnClick>
        {!hideDescription && schema.description && (
          <div className="text-muted-foreground">{schema.description}</div>
        )}
      </div>
    </div>
  );
};
