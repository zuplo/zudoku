import { joinUrl, type ZudokuContext } from "zudoku";
import { ClientOnly } from "zudoku/components";
import {
  type MutationFunctionContext,
  QueryClient,
  QueryClientProvider,
  type QueryFunctionContext,
} from "zudoku/react-query";
import { Outlet } from "zudoku/router";

declare module "zudoku/react-query" {
  interface Register {
    queryMeta: {
      context?: ZudokuContext;
      request?: RequestInit;
    };
    mutationMeta: {
      context?: ZudokuContext;
      request?: RequestInit | ((variables: unknown) => RequestInit);
    };
  }
}

const BASE_URL = "https://api.zuploedge.com";

const hasVariables = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      queryFn: async (q: QueryFunctionContext) => {
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

        const request = new Request(`${BASE_URL}${url}`, {
          ...q.meta?.request,
          headers: {
            "Content-Type": "application/json",
            ...q.meta?.request?.headers,
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
      mutationFn: async (variables: unknown, m: MutationFunctionContext) => {
        if (!m.mutationKey || !Array.isArray(m.mutationKey)) {
          throw new Error("Mutation key must be an array");
        }
        if (m.mutationKey.length === 0) {
          throw new Error("Mutation key must be a non-empty array");
        }

        let url = m.mutationKey[0];

        if (!url || typeof url !== "string") {
          throw new Error("URL is required as first element of mutationKey");
        }

        // Interpolate URL template with variables
        // e.g., /keys/{keyId} with { keyId: '123' } -> /keys/123
        if (typeof url === "string" && hasVariables(variables)) {
          url = url.replace(/{(\w+)}/g, (_, key) => {
            const value = variables[key];
            if (value === undefined) {
              throw new Error(`Missing variable "${key}" for URL template`);
            }

            return encodeURIComponent(String(value));
          });
        }

        // Resolve request - can be static or a function of variables
        const init =
          typeof m.meta?.request === "function"
            ? m.meta.request(variables)
            : (m.meta?.request ?? {});
        const method = init.method || "POST";
        const body =
          init.body ??
          (method !== "GET" && method !== "HEAD"
            ? JSON.stringify(variables)
            : undefined);

        const request = new Request(joinUrl(BASE_URL, url), {
          ...init,
          method,
          body,
          headers: {
            "Content-Type": "application/json",
            ...init.headers,
          },
        });

        const response = await fetch(
          m.meta?.context ? await m.meta.context.signRequest(request) : request,
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

        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          return response.json();
        }

        return response.text();
      },
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
