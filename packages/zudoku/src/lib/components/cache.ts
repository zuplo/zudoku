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
