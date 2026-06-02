import type { IntrospectionEnumValue } from "graphql";
import { Markdown } from "zudoku/components";
import { DeprecatedBadge, DeprecationReason } from "./Deprecation.js";

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
        <li key={value.name} className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono font-semibold text-sm bg-muted px-1.5 py-0.5 rounded">
              {value.name}
            </code>
            {value.isDeprecated && <DeprecatedBadge />}
          </div>

          {value.isDeprecated && value.deprecationReason && (
            <DeprecationReason reason={value.deprecationReason} />
          )}

          {value.description && (
            <div className="text-sm text-muted-foreground">
              <Markdown content={value.description} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
