import type { ZudokuContext } from "zudoku";
import { ClientOnly } from "zudoku/components";
import { QueryClient, QueryClientProvider } from "zudoku/react-query";
import { Outlet } from "zudoku/router";

declare module "zudoku/react-query" {
  interface Register {
    queryMeta: {
      context?: ZudokuContext;
    };
  }
}

const BASE_URL = "https://api.zuploedge.com";

export const createMutationFn = <G = void>(
  url: string | ((data: G) => string),
  context?: ZudokuContext,
  init?: RequestInit,
) => {
  return async (data: G) => {
    const urlString = typeof url === "function" ? url(data) : url;
    const request = new Request(`${BASE_URL}${urlString}`, {
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
      if (
        response.headers
          .get("content-type")
          ?.includes("application/problem+json")
      ) {
        const data = await response.json();
        throw new Error(data.detail ?? data.title);
      }
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    if (response.headers.get("content-type")?.includes("application/json")) {
      return response.json();
    }

    return response.text();
  };
};

export const queryClient = new QueryClient({
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
          q.meta?.context ? await q.meta.context.signRequest(request) : request,
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
    <QueryClientProvider client={queryClient}>
      <ClientOnly>
        <Outlet />
      </ClientOnly>
    </QueryClientProvider>
  );
};

export default ZuploMonetizationWrapper;
