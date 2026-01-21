import { ZudokuContext } from "zudoku";
import { QueryClientProvider, QueryClient } from "zudoku/react-query";
import { Outlet } from "zudoku/router";

declare module "zudoku/react-query" {
  interface Register {
    queryMeta: {
      context?: ZudokuContext;
    };
  }
}

const BASE_URL = "https://api.zuploedge.com";

export const createMutationFn = (
  url: string,
  context?: ZudokuContext,
  init?: RequestInit,
) => {
  return async () => {
    const request = new Request(`${BASE_URL}${url}`, {
      method: "POST",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    const response = await fetch(
      context ? await context.signRequest(request) : request,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  };
};

export const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      queryFn: async (q) => {
        if (!Array.isArray(q.queryKey)) {
          throw new Error("Query key must be an array");
        }
        if (q.queryKey.length === 0) {
          throw new Error("Query key must be a non-empty array");
        }
        const url = q.queryKey[0];
        if (!url || typeof url !== "string") {
          throw new Error("URL is required");
        }

        const init = q.queryKey[1] ?? ({} as RequestInit);

        const request = new Request(`${BASE_URL}${url}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init.headers,
          },
        });

        const response = await fetch(
          q.meta.context ? await q.meta.context.signRequest(request) : request,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch request");
        }

        return response.json();
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export const ZuploMonetizationWrapper = () => {
  return (
    <QueryClientProvider client={client}>
      <Outlet />
    </QueryClientProvider>
  );
};

export default ZuploMonetizationWrapper;
