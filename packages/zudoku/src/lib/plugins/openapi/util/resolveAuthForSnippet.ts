import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import {
  securitySchemeNamesLabel,
  valueToIdentitySelection,
} from "../../../hooks/useIdentityStore.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  createAuthorizedRequest,
  resolveSelectedRequirement,
  type SecurityCredential,
} from "../playground/securityCredentialsStore.js";
import { EMPTY_RESOLVED_AUTH, type ResolvedAuth } from "./createHttpSnippet.js";

const PLACEHOLDER_URL = "https://zudoku.invalid/";

const headersFromRequest = (request: Request) =>
  Array.from(request.headers.entries()).map(([name, value]) => ({
    name,
    value,
  }));

const queryStringFromRequest = (request: Request) =>
  Array.from(new URL(request.url).searchParams.entries()).map(
    ([name, value]) => ({ name, value }),
  );

export const resolveSchemeAuth = ({
  operation,
  schemeNames,
  credentials,
}: {
  operation: OperationsFragmentFragment;
  schemeNames: string[];
  credentials: Record<string, SecurityCredential>;
}): ResolvedAuth => {
  const selected = resolveSelectedRequirement(
    operation.security,
    schemeNames,
    credentials,
  );
  if (!selected) {
    return EMPTY_RESOLVED_AUTH;
  }

  try {
    const request = createAuthorizedRequest(
      new URL(PLACEHOLDER_URL),
      undefined,
      selected,
    );
    return {
      headers: headersFromRequest(request),
      queryString: queryStringFromRequest(request),
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning
    console.warn(
      `[Zudoku] Failed to apply security scheme "${securitySchemeNamesLabel(schemeNames)}" to snippet:`,
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
    return {
      headers: headersFromRequest(authorized),
      queryString: queryStringFromRequest(authorized),
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
  const selection = valueToIdentitySelection(identityId);
  if (selection.type === "none") {
    return EMPTY_RESOLVED_AUTH;
  }

  if (selection.type === "scheme") {
    return resolveSchemeAuth({
      operation,
      schemeNames: selection.names,
      credentials,
    });
  }

  const identity = identities?.find((i) => i.id === selection.id);
  if (!identity) return EMPTY_RESOLVED_AUTH;
  return resolveIdentityAuth(identity, url);
};
