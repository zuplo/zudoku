import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  NO_IDENTITY,
  SECURITY_SCHEME_PREFIX,
} from "../playground/constants.js";
import {
  applySecurityCredentials,
  getSecurityQueryParams,
  type SecurityCredential,
} from "../playground/securityCredentialsStore.js";
import { EMPTY_RESOLVED_AUTH, type ResolvedAuth } from "./createHttpSnippet.js";

const PLACEHOLDER_URL = "https://zudoku.invalid/";

const headersFromRequest = (request: Request) =>
  Array.from(request.headers.entries()).map(([name, value]) => ({
    name,
    value,
  }));

export const resolveSchemeAuth = ({
  operation,
  schemeName,
  credentials,
}: {
  operation: OperationsFragmentFragment;
  schemeName: string;
  credentials: Record<string, SecurityCredential>;
}): ResolvedAuth => {
  const cred = credentials[schemeName];
  if (!cred?.isAuthorized) return EMPTY_RESOLVED_AUTH;

  const security = operation.security;
  const schemeInOperation = security?.some((req) =>
    req.schemes.some((s) => s.scheme.name === schemeName),
  );
  if (!schemeInOperation) return EMPTY_RESOLVED_AUTH;

  const schemeCredentials = { [schemeName]: cred };
  try {
    const request = new Request(PLACEHOLDER_URL);
    applySecurityCredentials(request, security, schemeCredentials);
    const queryEntries = getSecurityQueryParams(security, schemeCredentials);
    return {
      headers: headersFromRequest(request),
      queryString: queryEntries.map(([name, value]) => ({ name, value })),
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning
    console.warn(
      `[Zudoku] Failed to apply security scheme "${schemeName}" to snippet:`,
      error,
    );
    return EMPTY_RESOLVED_AUTH;
  }
};

export const resolveIdentityAuth = async (
  identity: ApiIdentity,
  url: string,
): Promise<ResolvedAuth> => {
  try {
    const baseRequest = new Request(URL.canParse(url) ? url : PLACEHOLDER_URL);
    const authorized = await identity.authorizeRequest(baseRequest);
    const queryString = Array.from(
      new URL(authorized.url).searchParams.entries(),
    ).map(([name, value]) => ({ name, value }));
    return {
      headers: headersFromRequest(authorized),
      queryString,
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning
    console.warn(
      `[Zudoku] Identity "${identity.id}" failed to authorize snippet request:`,
      error,
    );
    return EMPTY_RESOLVED_AUTH;
  }
};

// Dispatcher kept for the combined test surface; prefer calling the sync/async
// halves directly from hooks so secrets stay out of React Query keys.
export const resolveAuthForSnippet = async ({
  operation,
  identityId,
  identities,
  credentials,
  url = PLACEHOLDER_URL,
}: {
  operation: OperationsFragmentFragment;
  identityId: string | null | undefined;
  identities: ApiIdentity[] | undefined;
  credentials: Record<string, SecurityCredential>;
  url?: string;
}): Promise<ResolvedAuth> => {
  if (!identityId || identityId === NO_IDENTITY) return EMPTY_RESOLVED_AUTH;

  if (identityId.startsWith(SECURITY_SCHEME_PREFIX)) {
    return resolveSchemeAuth({
      operation,
      schemeName: identityId.slice(SECURITY_SCHEME_PREFIX.length),
      credentials,
    });
  }

  const identity = identities?.find((i) => i.id === identityId);
  if (!identity) return EMPTY_RESOLVED_AUTH;
  return resolveIdentityAuth(identity, url);
};
