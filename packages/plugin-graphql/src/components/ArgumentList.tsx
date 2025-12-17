import type { IntrospectionInputValue } from "graphql";
import { Markdown } from "zudoku/components";
import { TypeBadge } from "./TypeBadge.js";

export const ArgumentList = ({
  args,
}: {
  args: readonly IntrospectionInputValue[];
}) => {
  if (args.length === 0) return null;

  return (
    <div className="text-sm">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Arguments
      </div>
      <ul className="space-y-2 pl-4 border-l-2 border-border">
        {args.map((arg) => (
          <li key={arg.name}>
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-xs">{arg.name}</code>
              <TypeBadge type={arg.type} />
              {arg.defaultValue !== undefined && arg.defaultValue !== null && (
                <span className="text-muted-foreground text-xs">
                  = {arg.defaultValue}
                </span>
              )}
            </div>
            {arg.description && (
              <div className="mt-1 text-xs text-muted-foreground">
                <Markdown content={arg.description} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
