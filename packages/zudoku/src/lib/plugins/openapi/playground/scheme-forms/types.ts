import type {
  SecuritySchemeIn,
  SecuritySchemeType,
} from "../../graphql/graphql.js";

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
};
type OpenIdConnectScheme = {
  type: Extract<SecuritySchemeType, "openIdConnect">;
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
