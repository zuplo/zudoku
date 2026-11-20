import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import { valueToIdentitySelection } from "../../../hooks/useIdentityStore.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
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
  url,
}: {
  operation: OperationsFragmentFragment;
  identityId: string | null | undefined;
  identities: ApiIdentity[] | undefined;
  url: string;
}): ResolvedAuth => {
  const credentials = useSecurityCredentialsStore((s) => s.credentials);

  const selection = useMemo(
    () => valueToIdentitySelection(identityId),
    [identityId],
  );

  const schemeAuth = useMemo(
    () =>
      selection.type === "scheme"
        ? resolveSchemeAuth({
            operation,
            schemeNames: selection.names,
            credentials,
          })
        : undefined,
    [operation, selection, credentials],
  );

  const identity =
    selection.type === "identity"
      ? identities?.find((i) => i.id === selection.id)
      : undefined;

  const { data: identityAuth, error } = useQuery({
    enabled: identity !== undefined,
    retry: false,
    queryKey: ["resolved-identity-auth", identity?.id, url],
    // biome-ignore lint/style/noNonNullAssertion: guarded by enabled
    queryFn: () => resolveIdentityAuth(identity!, url),
  });

  if (error) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning
    console.warn("[Zudoku] Failed to resolve auth for snippet:", error);
  }

  return schemeAuth ?? identityAuth ?? EMPTY_RESOLVED_AUTH;
};
