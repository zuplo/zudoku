import { Badge } from "zudoku/ui/Badge.js";
import type { SecurityRequirement } from "./graphql/graphql.js";

export const AuthorizationListItem = ({
  requirement,
}: {
  requirement: SecurityRequirement;
}) => {
  return (
    <div className="flex-1 flex items-center gap-3">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <code className="font-medium">{requirement.name}</code>
        </div>
        {requirement.scopes && requirement.scopes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">Scopes:</span>
            {requirement.scopes.map((scope) => (
              <Badge
                key={scope}
                variant="outline"
                className="border rounded-sm px-1 font-mono"
              >
                {scope}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
