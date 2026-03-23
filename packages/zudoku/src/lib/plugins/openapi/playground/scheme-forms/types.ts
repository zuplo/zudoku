import type {
  SecuritySchemeIn,
  SecuritySchemeType,
} from "../../graphql/graphql.js";

export type OAuthScopeData = { name: string; description: string };
export type OAuthFlowData = {
  authorizationUrl?: string | null;
  tokenUrl?: string | null;
  refreshUrl?: string | null;
  scopes: OAuthScopeData[];
};

type ApiKeyScheme = {
  type: Extract<SecuritySchemeType, "apiKey">;
  in?: SecuritySchemeIn | null;
  paramName?: string | null;
};
type HttpScheme = {
  type: Extract<SecuritySchemeType, "http">;
  scheme?: string | null;
  bearerFormat?: string | null;
};
type OAuth2Scheme = {
  type: Extract<SecuritySchemeType, "oauth2">;
  flows?: {
    implicit?: OAuthFlowData | null;
    password?: OAuthFlowData | null;
    clientCredentials?: OAuthFlowData | null;
    authorizationCode?: OAuthFlowData | null;
  } | null;
};
type OpenIdConnectScheme = {
  type: Extract<SecuritySchemeType, "openIdConnect">;
  openIdConnectUrl?: string | null;
};
type MutualTLSScheme = {
  type: Extract<SecuritySchemeType, "mutualTLS">;
};

export type SecuritySchemeData = {
  name: string;
  description?: string | null;
} & (
  | ApiKeyScheme
  | HttpScheme
  | OAuth2Scheme
  | OpenIdConnectScheme
  | MutualTLSScheme
);
