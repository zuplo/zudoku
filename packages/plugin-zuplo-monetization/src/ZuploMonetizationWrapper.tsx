import { joinUrl, throwIfProblemJson, type ZudokuContext } from "zudoku";
import { ClientOnly } from "zudoku/components";
import {
  type MutationFunctionContext,
  QueryClient,
  QueryClientProvider,
  type QueryFunctionContext,
} from "zudoku/react-query";
import { Outlet } from "zudoku/router";
import {
  MonetizationContext,
  type MonetizationConfig,
} from "./MonetizationContext.js";

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

const getBaseUrl = (context?: ZudokuContext) => {
  // Resolve the gateway from the deployment's env. `context` is intentionally
  // omitted for unauthenticated requests (e.g. the public pricing page), so we
  // fall back to the build-time `import.meta.env` value (which `context.env`
  // also mirrors). We deliberately do NOT default to the production gateway: a
  // missing value should fail loudly rather than silently route staging (or any
  // other environment) to production.
  const gatewayUrl: string | undefined =
    context?.env.ZUPLO_GATEWAY_SERVICE_URL ??
    import.meta.env.ZUPLO_GATEWAY_SERVICE_URL;
  if (!gatewayUrl) {
    throw new Error(
      "ZUPLO_GATEWAY_SERVICE_URL is not set; refusing to fall back to the production gateway (https://api.zuploedge.com). Set it to your environment's gateway service (e.g. https://api.zuploedge.net for staging).",
    );
  }
  return gatewayUrl;
};

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

        const request = new Request(joinUrl(getBaseUrl(q.meta?.context), url), {
          ...q.meta?.request,
          headers: {
            "Content-Type": "application/json",
            ...q.meta?.request?.headers,
          },
        });

        const response = await fetch(
          q.meta?.context ? await q.meta.context.signRequest(request) : request,
        );

        await throwIfProblemJson(response);
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

        const request = new Request(joinUrl(getBaseUrl(m.meta?.context), url), {
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

        await throwIfProblemJson(response);
        if (!response.ok) {
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

export const ZuploMonetizationWrapper = ({
  options = {},
}: {
  options: MonetizationConfig;
}) => (
  <QueryClientProvider client={queryClient}>
    <MonetizationContext value={options}>
      <ClientOnly>
        <Outlet />
      </ClientOnly>
    </MonetizationContext>
  </QueryClientProvider>
);

export default ZuploMonetizationWrapper;
