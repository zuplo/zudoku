import { Badge } from "zudoku/ui/Badge.js";
import type { SecurityRequirement } from "./graphql/graphql.js";
import { getSchemeInfo } from "./util/authHelpers.js";

export const AuthorizationListItem = ({
  requirement,
}: {
  requirement: SecurityRequirement;
}) => {
  const schemeInfo = getSchemeInfo(requirement.name);

  return (
    <div className="flex-1 flex items-center gap-3">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium">{requirement.name}</span>
          <Badge variant="secondary" className="text-xs">
            {schemeInfo.displayName}
          </Badge>
        </div>
        {requirement.scopes && requirement.scopes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {requirement.scopes.map((scope) => (
              <Badge
                key={scope}
                variant="outline"
                className="text-xs font-mono"
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
