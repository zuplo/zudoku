import type { IntrospectionEnumValue } from "graphql";
import { Markdown } from "zudoku/components";
import { Badge } from "zudoku/ui/Badge.js";

export const EnumValueList = ({
  values,
}: {
  values: readonly IntrospectionEnumValue[];
}) => {
  if (values.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">No values defined.</p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border">
      {values.map((value) => (
        <li key={value.name} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono font-semibold text-sm bg-muted px-1.5 py-0.5 rounded">
              {value.name}
            </code>
            {value.isDeprecated && (
              <Badge variant="destructive" className="text-xs">
                Deprecated
              </Badge>
            )}
          </div>

          {value.description && (
            <div className="mt-2 text-sm text-muted-foreground">
              <Markdown content={value.description} />
            </div>
          )}

          {value.isDeprecated && value.deprecationReason && (
            <div className="mt-2 text-sm text-destructive bg-destructive/10 rounded px-2 py-1">
              <strong>Deprecated:</strong> {value.deprecationReason}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
