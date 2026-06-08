import type {
  Fetcher,
  createGraphiQLFetcher as CreateGraphiQLFetcher,
} from "@graphiql/toolkit";
import type { ComponentType, PropsWithChildren } from "react";
import type React from "react";
import type { createRoot as CreateRoot } from "react-dom/client";
import { ZudokuError } from "../util/invariant.js";
// Regenerate with `pnpm -F zudoku generate:sri` after bumping VERSIONS.
import sri from "./graphiql-sri.json" with { type: "json" };

export type GraphiQLFetcher = Fetcher;

// Loaded at runtime from CDN when the playground opens.
export const ESM_CDN = "https://esm.sh";

const VERSIONS = {
  react: "19.2.5",
  graphiql: "5.2.3",
  // Pinned: 0.37.5 breaks Monaco JSON language registration over CDN.
  graphiqlReact: "0.37.3",
  toolkit: "0.12.0",
  // Must match host's graphql version to avoid duplicate-instance bugs.
  graphql: "16.14.0",
} as const;

// Props for the CDN-loaded GraphiQL. Revisit when bumping VERSIONS.graphiql.
export type GraphiQLComponentProps = {
  fetcher: Fetcher;
  schema?: unknown;
  forcedTheme?: "light" | "dark";
  defaultHeaders?: string;
  defaultTabs?: { query: string; variables?: string; headers?: string }[];
  initialQuery?: string;
  defaultQuery?: string;
  initialVariables?: string;
  initialHeaders?: string;
  onEditQuery?: (query: string) => void;
  onEditVariables?: (variables: string) => void;
  onEditHeaders?: (headers: string) => void;
  shouldPersistHeaders?: boolean;
};

export type CdnGraphiQL = {
  React: typeof React;
  createRoot: typeof CreateRoot;
  GraphiQL: ComponentType<GraphiQLComponentProps> & {
    Logo: ComponentType<PropsWithChildren>;
  };
  createGraphiQLFetcher: typeof CreateGraphiQLFetcher;
};

let cached: Promise<CdnGraphiQL> | null = null;

// Also used by the SRI generator to produce graphiql-sri.json.
export const getCdnUrls = (cdn: string) => ({
  react: `${cdn}/react@${VERSIONS.react}`,
  reactDom: `${cdn}/react-dom@${VERSIONS.react}`,
  reactDomClient: `${cdn}/react-dom@${VERSIONS.react}/client`,
  graphql: `${cdn}/graphql@${VERSIONS.graphql}`,
  toolkit: `${cdn}/@graphiql/toolkit@${VERSIONS.toolkit}?standalone&external=graphql`,
  graphiqlReact: `${cdn}/@graphiql/react@${VERSIONS.graphiqlReact}?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid`,
  graphiql: `${cdn}/graphiql@${VERSIONS.graphiql}?standalone&external=react,react-dom,@graphiql/react,graphql`,
  setupWorkers: `${cdn}/graphiql@${VERSIONS.graphiql}/setup-workers/esm.sh`,
  styles: `${cdn}/graphiql@${VERSIONS.graphiql}/dist/style.css`,
});

type CdnUrlKey = keyof ReturnType<typeof getCdnUrls>;
const SRI: Partial<Record<CdnUrlKey, string>> = sri;

// SRI integrity for import-map modules (Chromium-only, ignored elsewhere).
const integrityFor = (cdn: string): Record<string, string> => {
  if (cdn !== ESM_CDN) return {};
  const urls = getCdnUrls(cdn);
  return Object.fromEntries(
    (Object.keys(urls) as CdnUrlKey[]).flatMap((key) => {
      const hash = SRI[key];
      return key === "styles" || !hash ? [] : [[urls[key], hash]];
    }),
  );
};

const injectImportMap = (cdn: string) => {
  if (
    typeof document === "undefined" ||
    document.querySelector("script[data-zudoku-graphiql-importmap]")
  ) {
    return;
  }
  const urls = getCdnUrls(cdn);
  const map = {
    imports: {
      react: urls.react,
      "react/": `${cdn}/react@${VERSIONS.react}/`,
      "react-dom": urls.reactDom,
      "react-dom/": `${cdn}/react-dom@${VERSIONS.react}/`,
      graphql: urls.graphql,
      "@graphiql/toolkit": urls.toolkit,
      "@graphiql/react": urls.graphiqlReact,
      graphiql: urls.graphiql,
      "graphiql/": `${cdn}/graphiql@${VERSIONS.graphiql}/`,
      "@emotion/is-prop-valid": "data:text/javascript,",
    },
    integrity: integrityFor(cdn),
  };
  const script = document.createElement("script");
  script.type = "importmap";
  script.dataset.zudokuGraphiqlImportmap = "true";
  script.textContent = JSON.stringify(map);
  document.head.appendChild(script);
};

const injectStyles = (cdn: string) => {
  if (
    typeof document === "undefined" ||
    document.querySelector("link[data-zudoku-graphiql-styles]")
  ) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = getCdnUrls(cdn).styles;
  if (cdn === ESM_CDN && SRI.styles) {
    link.integrity = SRI.styles;
    link.crossOrigin = "anonymous";
  }
  link.dataset.zudokuGraphiqlStyles = "true";
  document.head.appendChild(link);
};

const cdnLoadError = (cdn: string, cause?: Error) =>
  new ZudokuError("Could not load the GraphQL playground from the CDN.", {
    title: "Could not load the GraphQL playground",
    developerHint: `GraphiQL is loaded at runtime from ${cdn}. Ensure the network is reachable and your Content-Security-Policy allows ${cdn} (script-src, connect-src, and worker-src for the Monaco workers).`,
    cause,
  });

export const loadGraphiQLFromCdn = (
  cdn: string = ESM_CDN,
): Promise<CdnGraphiQL> => {
  if (cached) return cached;

  // The dynamic imports below pull https:// URLs, which Node can't resolve.
  if (typeof document === "undefined") {
    return Promise.reject(
      new ZudokuError("The GraphQL playground can only load in a browser.", {
        title: "Could not load the GraphQL playground",
      }),
    );
  }

  cached = (async (): Promise<CdnGraphiQL> => {
    injectImportMap(cdn);
    injectStyles(cdn);
    const urls = getCdnUrls(cdn);

    // Must run before imports so MonacoEnvironment is set when they initialize.
    await import(/* @vite-ignore */ urls.setupWorkers);

    const [react, reactDom, graphiql, toolkit] = await Promise.all([
      import(/* @vite-ignore */ urls.react),
      import(/* @vite-ignore */ urls.reactDomClient),
      import(/* @vite-ignore */ urls.graphiql),
      import(/* @vite-ignore */ urls.toolkit),
    ]);

    // Sanity-check exports before casting (CDN 404 would give empty modules).
    if (
      typeof reactDom.createRoot !== "function" ||
      typeof graphiql.GraphiQL !== "function" ||
      typeof toolkit.createGraphiQLFetcher !== "function"
    ) {
      throw cdnLoadError(cdn);
    }

    return {
      React: (react.default ?? react) as typeof import("react"),
      createRoot: reactDom.createRoot as typeof CreateRoot,
      GraphiQL: graphiql.GraphiQL as CdnGraphiQL["GraphiQL"],
      createGraphiQLFetcher:
        toolkit.createGraphiQLFetcher as typeof CreateGraphiQLFetcher,
    };
  })().catch((error: unknown) => {
    cached = null;
    throw error instanceof ZudokuError
      ? error
      : cdnLoadError(cdn, error instanceof Error ? error : undefined);
  });

  return cached;
};
