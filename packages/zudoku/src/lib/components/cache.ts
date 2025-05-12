import { useQueryClient } from "@tanstack/react-query";

export const CACHE_KEYS = Object.freeze({
  API_IDENTITIES: ["api-identities"],
});

export const useCache = () => {
  const queryClient = useQueryClient();

  return {
    invalidateCache: async (key: keyof typeof CACHE_KEYS) => {
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS[key] });
    },
  };
};

/**
 * If a query has this key in its queryKey, it will not put its result in the dehydrated state in the SSR.
 *
 * This is useful if the query should only be suspended and not included in the initial HTML response.
 * (e.g. too large in size, or not needed for the initial page load)
 */
export const NO_DEHYDRATE = "no-dehydrate";
