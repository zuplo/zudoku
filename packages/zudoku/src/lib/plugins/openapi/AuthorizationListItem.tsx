import { KeyRoundIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "zudoku/ui/Badge.js";
import { SelectOnClick } from "./components/SelectOnClick.js";
import type { SecurityRequirement } from "./graphql/graphql.js";

const getSecurityIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("bearer") || lowerName.includes("token")) {
    return <ShieldCheckIcon size={14} />;
  }
  if (lowerName.includes("basic") || lowerName.includes("apikey")) {
    return <KeyRoundIcon size={14} />;
  }
  return <LockIcon size={14} />;
};

const getSecurityType = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("bearer")) return "Bearer";
  if (lowerName.includes("basic")) return "Basic";
  if (lowerName.includes("apikey") || lowerName.includes("api"))
    return "API Key";
  if (lowerName.includes("oauth")) return "OAuth2";
  return "Security";
};

export const AuthorizationListItem = ({
  requirement,
}: {
  requirement: SecurityRequirement;
}) => {
  const securityType = getSecurityType(requirement.name);
  const icon = getSecurityIcon(requirement.name);

  return (
    <li className="p-4 bg-border/20 text-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <SelectOnClick asChild>
          <code className="font-semibold">{requirement.name}</code>
        </SelectOnClick>
        <Badge variant="secondary" className="text-xs">
          {securityType}
        </Badge>
      </div>
      {requirement.scopes && requirement.scopes.length > 0 && (
        <div className="flex flex-col gap-1 ml-6">
          <span className="text-xs text-muted-foreground font-medium">
            Required Scopes:
          </span>
          <div className="flex flex-wrap gap-1">
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
        </div>
      )}
    </li>
  );
};
