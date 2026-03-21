import { KeyRoundIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "zudoku/ui/Badge.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "zudoku/ui/Tooltip.js";
import type {
  SecuritySchemeIn,
  SecuritySchemeType,
} from "./graphql/graphql.js";

type SecurityScheme = {
  name: string;
  type: SecuritySchemeType;
  description?: string | null;
  in?: SecuritySchemeIn | null;
  paramName?: string | null;
  scheme?: string | null;
  bearerFormat?: string | null;
  openIdConnectUrl?: string | null;
};

type SecurityRequirement = {
  schemes: Array<{
    scopes: Array<string>;
    scheme: SecurityScheme;
  }>;
};

const schemeIcon: Record<SecuritySchemeType, ReactNode> = {
  apiKey: <KeyRoundIcon size={12} />,
  http: <LockIcon size={12} />,
  oauth2: <ShieldCheckIcon size={12} />,
  openIdConnect: <ShieldCheckIcon size={12} />,
  mutualTLS: <LockIcon size={12} />,
};

const schemeLabel = (scheme: SecurityScheme): string => {
  switch (scheme.type) {
    case "apiKey":
      return `${scheme.paramName ?? "API Key"} (${scheme.in ?? "header"})`;
    case "http":
      return scheme.scheme === "bearer"
        ? `Bearer${scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ""}`
        : (scheme.scheme ?? "HTTP");
    case "oauth2":
      return "OAuth 2.0";
    case "openIdConnect":
      return "OpenID Connect";
    case "mutualTLS":
      return "Mutual TLS";
    default:
      return scheme.name;
  }
};

const SchemeTooltipContent = ({
  scheme,
  scopes,
}: {
  scheme: SecurityScheme;
  scopes: string[];
}) => (
  <div className="flex flex-col gap-1 max-w-xs">
    <div className="font-medium">{scheme.name}</div>
    <div className="text-xs text-muted-foreground capitalize">
      {scheme.type}
      {scheme.type === "apiKey" && scheme.in && ` in ${scheme.in}`}
      {scheme.type === "http" && scheme.scheme && ` (${scheme.scheme})`}
    </div>
    {scheme.description && <div className="text-xs">{scheme.description}</div>}
    {scopes.length > 0 && (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Required scopes:</span>
        <div className="flex flex-wrap gap-1">
          {scopes.map((scope) => (
            <code
              key={scope}
              className="text-[10px] bg-muted px-1 py-0.5 rounded"
            >
              {scope}
            </code>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const SecurityRequirements = ({
  security,
}: {
  security?: SecurityRequirement[] | null;
}) => {
  if (!security || security.length === 0) return null;

  // Filter out empty requirements (anonymous access markers)
  const requirements = security.filter((req) => req.schemes.length > 0);
  if (requirements.length === 0) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {requirements.map((req, reqIdx) => {
          const reqKey = `${reqIdx}-${req.schemes.map((s) => s.scheme.name).join("+")}`;
          return (
            <div key={reqKey} className="contents">
              {reqIdx > 0 && (
                <span className="text-[10px] text-muted-foreground font-medium uppercase">
                  or
                </span>
              )}
              {req.schemes.map((reqScheme, schemeIdx) => (
                <div key={reqScheme.scheme.name} className="contents">
                  {schemeIdx > 0 && (
                    <span className="text-[10px] text-muted-foreground">+</span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 py-0 h-5 font-normal cursor-default"
                      >
                        {schemeIcon[reqScheme.scheme.type]}
                        {schemeLabel(reqScheme.scheme)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start">
                      <SchemeTooltipContent
                        scheme={reqScheme.scheme}
                        scopes={reqScheme.scopes}
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
