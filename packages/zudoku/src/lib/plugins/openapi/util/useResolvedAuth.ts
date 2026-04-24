import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  NO_IDENTITY,
  SECURITY_SCHEME_PREFIX,
} from "../playground/constants.js";
import { useSecurityCredentialsStore } from "../playground/securityCredentialsStore.js";
import { EMPTY_RESOLVED_AUTH, type ResolvedAuth } from "./createHttpSnippet.js";
import {
  resolveIdentityAuth,
  resolveSchemeAuth,
} from "./resolveAuthForSnippet.js";

export const useResolvedAuth = ({
  operation,
  identityId,
  identities,
}: {
  operation: OperationsFragmentFragment;
  identityId: string | null | undefined;
  identities: ApiIdentity[] | undefined;
}): ResolvedAuth => {
  const credentials = useSecurityCredentialsStore((s) => s.credentials);

  const schemeName = identityId?.startsWith(SECURITY_SCHEME_PREFIX)
    ? identityId.slice(SECURITY_SCHEME_PREFIX.length)
    : undefined;

  const schemeAuth = useMemo(
    () =>
      schemeName
        ? resolveSchemeAuth({ operation, schemeName, credentials })
        : undefined,
    [operation, schemeName, credentials],
  );

  const isIdentityId = Boolean(
    identityId && identityId !== NO_IDENTITY && !schemeName,
  );
  const identity = isIdentityId
    ? identities?.find((i) => i.id === identityId)
    : undefined;

  const { data: identityAuth, error } = useQuery({
    enabled: identity !== undefined,
    retry: false,
    queryKey: ["resolved-identity-auth", identity?.id],
    // biome-ignore lint/style/noNonNullAssertion: guarded by enabled
    queryFn: () => resolveIdentityAuth(identity!),
  });

  if (error) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning
    console.warn("[Zudoku] Failed to resolve auth for snippet:", error);
  }

  return schemeAuth ?? identityAuth ?? EMPTY_RESOLVED_AUTH;
};
