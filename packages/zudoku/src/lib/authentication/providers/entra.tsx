import type * as oauth from "oauth4webapi";
import type { EntraAuthenticationConfig } from "../../../config/config.js";
import type {
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { OpenIDAuthenticationProvider } from "./openid.js";
import { getEntraIssuer } from "./util.js";

const ISSUER_TENANT_PLACEHOLDER = "{tenantid}";

export class EntraAuthenticationProvider
  extends OpenIDAuthenticationProvider
  implements AuthenticationPlugin
{
  constructor(config: EntraAuthenticationConfig) {
    super({ ...config, type: "openid", issuer: getEntraIssuer(config) });
  }

  // Multi-tenant authorities advertise a templated issuer that never matches
  // the requested authority, so the strict discovery check would throw. Expect
  // the template itself; resolveTokenIssuer resolves the concrete tenant per
  // token. Recommended by oauth4webapi's maintainer:
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

  // Without a usable ID token the template stays in place and fails the strict
  // `iss` validation loudly.
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
