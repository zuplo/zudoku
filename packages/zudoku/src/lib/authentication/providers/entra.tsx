import type * as oauth from "oauth4webapi";
import type { EntraAuthenticationConfig } from "../../../config/config.js";
import type {
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { OpenIDAuthenticationProvider } from "./openid.js";
import { getEntraIssuer } from "./util.js";

// Microsoft Entra ID's multi-tenant authorities (common/organizations/
// consumers) return a templated issuer, e.g.
// "https://login.microsoftonline.com/{tenantid}/v2.0", while each token's
// `iss` carries the concrete tenant id.
const ISSUER_TENANT_PLACEHOLDER = "{tenantid}";

export class EntraAuthenticationProvider
  extends OpenIDAuthenticationProvider
  implements AuthenticationPlugin
{
  constructor(config: EntraAuthenticationConfig) {
    super({ ...config, type: "openid", issuer: getEntraIssuer(config) });
  }

  // Multi-tenant authorities return a templated issuer that never matches the
  // requested authority, so oauth4webapi's strict discovery check would throw.
  // Expect the template itself instead; per-token `iss` validation then
  // resolves the concrete tenant in resolveTokenIssuer. Pattern recommended by
  // oauth4webapi's maintainer:
  // https://github.com/panva/oauth4webapi/issues/100
  protected override async getExpectedDiscoveryIssuer(
    issuerUrl: URL,
    response: Response,
  ): Promise<URL> {
    try {
      const metadata = (await response.clone().json()) as { issuer?: unknown };
      return typeof metadata.issuer === "string" &&
        metadata.issuer.includes(ISSUER_TENANT_PLACEHOLDER)
        ? new URL(metadata.issuer)
        : issuerUrl;
    } catch {
      // Malformed body: keep the strict path so processDiscoveryResponse
      // surfaces the real error.
      return issuerUrl;
    }
  }

  // Rebuilds the concrete per-tenant issuer for multi-tenant token responses:
  // substitutes the ID token's `tid` claim into the templated issuer so
  // oauth4webapi's strict `iss` validation compares against the right tenant.
  // Responses without a usable ID token pass through unchanged (a leftover
  // template then fails that validation loudly).
  protected override async resolveTokenIssuer(
    as: oauth.AuthorizationServer,
    response: Response,
  ): Promise<oauth.AuthorizationServer> {
    if (!as.issuer.includes(ISSUER_TENANT_PLACEHOLDER)) return as;
    try {
      const body = (await response.clone().json()) as { id_token?: unknown };
      if (typeof body.id_token !== "string") return as;
      const { decodeJwt } = await import("jose");
      const { tid } = decodeJwt(body.id_token);
      return typeof tid === "string" && tid.length > 0
        ? {
            ...as,
            issuer: as.issuer.replace(ISSUER_TENANT_PLACEHOLDER, () => tid),
          }
        : as;
    } catch {
      return as;
    }
  }
}

const entraAuth: AuthenticationProviderInitializer<
  EntraAuthenticationConfig
> = (options) => new EntraAuthenticationProvider(options);

export default entraAuth;
