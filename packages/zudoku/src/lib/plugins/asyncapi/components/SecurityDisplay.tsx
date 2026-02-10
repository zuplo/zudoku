import { KeyIcon, LockIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { Fragment } from "react";
import { Heading } from "../../../components/Heading.js";
import { Markdown } from "../../../components/Markdown.js";
import { Badge } from "../../../ui/Badge.js";
import { Frame, FramePanel } from "../../../ui/Frame.js";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "../../../ui/Item.js";
import type {
  SecurityRequirementResult,
  SecuritySchemeResult,
} from "../graphql/queries.js";

type SecurityDisplayProps = {
  security: SecurityRequirementResult[] | null;
  securitySchemes: SecuritySchemeResult[];
  id: string;
};

/**
 * Display security requirements in OpenAPI-style format
 */
export const SecurityDisplay = ({
  security,
  securitySchemes,
  id,
}: SecurityDisplayProps) => {
  if (!security || security.length === 0) return null;

  // Map scheme names to their full definitions
  const schemeMap = new Map(securitySchemes.map((s) => [s.name, s]));

  // Flatten security requirements to show individual schemes
  const schemes: Array<{
    scheme: SecuritySchemeResult;
    scopes: string[];
  }> = [];

  security.forEach((requirement) => {
    Object.entries(requirement).forEach(([schemeName, scopes]) => {
      const scheme = schemeMap.get(schemeName);
      if (scheme) {
        schemes.push({ scheme, scopes });
      }
    });
  });

  if (schemes.length === 0) return null;

  return (
    <>
      <Heading level={3} id={`${id}/security`}>
        Security
      </Heading>
      <Frame>
        <FramePanel className="p-0!">
          <ItemGroup className="overflow-clip">
            {schemes.map(({ scheme, scopes }, index) => (
              <Fragment key={scheme.name}>
                {index > 0 && <ItemSeparator />}
                <SecuritySchemeItem scheme={scheme} scopes={scopes} />
              </Fragment>
            ))}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </>
  );
};

/**
 * Get icon for security scheme type
 */
const getSecurityIcon = (type: string) => {
  switch (type) {
    case "apiKey":
      return <KeyIcon size={16} />;
    case "oauth2":
    case "openIdConnect":
      return <UserIcon size={16} />;
    case "http":
      return <LockIcon size={16} />;
    default:
      return <ShieldCheckIcon size={16} />;
  }
};

/**
 * Get badge variant for security scheme type
 */
const getSecurityBadgeVariant = (
  type: string,
): "default" | "secondary" | "outline" => {
  switch (type) {
    case "oauth2":
    case "openIdConnect":
      return "default";
    case "apiKey":
      return "secondary";
    default:
      return "outline";
  }
};

/**
 * Format security scheme type for display
 */
const formatSchemeType = (scheme: SecuritySchemeResult): string => {
  if (scheme.type === "http" && scheme.scheme) {
    return `HTTP ${scheme.scheme}`;
  }
  if (scheme.type === "apiKey" && scheme.in) {
    return `API Key (${scheme.in})`;
  }
  if (scheme.type === "oauth2") {
    return "OAuth 2.0";
  }
  if (scheme.type === "openIdConnect") {
    return "OpenID Connect";
  }
  return scheme.type;
};

/**
 * Individual security scheme item
 */
const SecuritySchemeItem = ({
  scheme,
  scopes,
}: {
  scheme: SecuritySchemeResult;
  scopes: string[];
}) => {
  return (
    <Item>
      <ItemMedia variant="icon">{getSecurityIcon(scheme.type)}</ItemMedia>
      <ItemContent className="gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ItemTitle className="me-2">
            <code>{scheme.name}</code>
          </ItemTitle>
          <Badge variant={getSecurityBadgeVariant(scheme.type)}>
            {formatSchemeType(scheme)}
          </Badge>
        </div>
        {scheme.description && (
          <Markdown content={scheme.description} className="prose-sm" />
        )}
        {scheme.bearerFormat && (
          <div className="text-sm text-muted-foreground">
            Bearer format:{" "}
            <code className="text-xs">{scheme.bearerFormat}</code>
          </div>
        )}
        {scheme.openIdConnectUrl && (
          <div className="text-sm text-muted-foreground">
            OpenID Connect URL:{" "}
            <code className="text-xs break-all">{scheme.openIdConnectUrl}</code>
          </div>
        )}
        {scopes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-sm text-muted-foreground">Scopes:</span>
            {scopes.map((scope) => (
              <Badge key={scope} variant="outline" className="text-xs">
                {scope}
              </Badge>
            ))}
          </div>
        )}
      </ItemContent>
    </Item>
  );
};
