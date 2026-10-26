import { useCallback } from "react";
import {
  useApiIdentities,
  useZudoku,
} from "../components/context/ZudokuContext.js";
import type { ApiIdentity } from "../core/ZudokuContext.js";
import { useLatest } from "../util/useLatest.js";
import {
  identitySelectionToValue,
  useIdentityStore,
  valueToIdentitySelection,
} from "./useIdentityStore.js";

const EMPTY_IDENTITIES: ApiIdentity[] = [];

const findIdentity = (
  identities: ApiIdentity[] | undefined,
  value: string | null,
): ApiIdentity | null => {
  const selection = valueToIdentitySelection(value);
  if (selection.type !== "identity") return null;
  return identities?.find((identity) => identity.id === selection.id) ?? null;
};

/**
 * The API identity used to authorize playground ("try it") requests.
 *
 * Identities are provided by plugins implementing `ApiIdentityPlugin` (e.g.
 * the API keys plugin). The selection is shared across all playgrounds —
 * OpenAPI, GraphQL, and any custom plugin using this hook — and persists for
 * the session.
 *
 * Use `<ApiIdentityPicker />` from `zudoku/components` for the matching UI.
 *
 * @example Authorize requests in a playground fetcher
 * ```ts
 * const { authorizeRequest } = useApiIdentitySelection();
 *
 * const execute = async (body: string) => {
 *   const request = new Request(endpoint, { method: "POST", body });
 *   const response = await fetch(await authorizeRequest(request));
 *   return response.json();
 * };
 * ```
 */
export const useApiIdentitySelection = () => {
  const identitiesQuery = useApiIdentities();
  const { getApiIdentities } = useZudoku();
  const selectedValue = useIdentityStore((s) => s.rememberedIdentity);
  const setRememberedIdentity = useIdentityStore(
    (s) => s.setRememberedIdentity,
  );
  const identitiesRef = useLatest(identitiesQuery.data);

  const identities = identitiesQuery.data ?? EMPTY_IDENTITIES;
  const selectedIdentity = findIdentity(identitiesQuery.data, selectedValue);

  const selectIdentity = useCallback(
    (id: string | null) =>
      setRememberedIdentity(
        identitySelectionToValue(
          id === null ? { type: "none" } : { type: "identity", id },
        ),
      ),
    [setRememberedIdentity],
  );

  /**
   * Applies the selected identity to a request, returning the request
   * unchanged when nothing is selected. Stable across renders and resolves
   * the selection at call time, so it's safe to close over in fetchers.
   */
  const authorizeRequest = useCallback(
    async (request: Request): Promise<Request> => {
      const value = useIdentityStore.getState().rememberedIdentity;
      if (valueToIdentitySelection(value).type !== "identity") return request;
      // A persisted selection can be used before the identities query has
      // resolved (e.g. right after a reload) — fetch them rather than
      // silently sending the request unauthorized.
      const identities = identitiesRef.current ?? (await getApiIdentities());
      const identity = findIdentity(identities, value);
      return identity ? identity.authorizeRequest(request) : request;
    },
    [identitiesRef, getApiIdentities],
  );

  return {
    identities,
    isLoading: identitiesQuery.isLoading,
    selectedIdentity,
    selectIdentity,
    authorizeRequest,
  };
};
