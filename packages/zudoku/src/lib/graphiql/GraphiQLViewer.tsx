import { Suspense, use, useEffect, useMemo, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Spinner } from "../components/Spinner.js";
import { ErrorMessage } from "../errors/ErrorMessage.js";
import { useTheme } from "../hooks/index.js";
import { cn } from "../util/cn.js";
import { useLatest } from "../util/useLatest.js";
import "./graphiql-theme.css";
import {
  type CdnGraphiQL,
  type GraphiQLComponentProps,
  type GraphiQLFetcher,
  loadGraphiQLFromCdn,
} from "./loadGraphiQLFromCdn.js";
import "./graphiql.css";

export type { GraphiQLFetcher };

export type GraphiQLTab = {
  query: string;
  variables?: string;
  headers?: string;
};

export type GraphiQLViewerProps = {
  endpoint?: string;
  fetcher?: GraphiQLFetcher;
  schema?: unknown;
  headers?: Record<string, string>;
  defaultHeaders?: string;
  defaultTabs?: GraphiQLTab[];
  initialQuery?: string;
  initialVariables?: string;
  initialHeaders?: string;
  onEditQuery?: (query: string) => void;
  onEditVariables?: (variables: string) => void;
  onEditHeaders?: (headers: string) => void;
  shouldPersistHeaders?: boolean;
  // Hides re-fetch/shortkeys/settings toolbar buttons; defaults to true.
  hideToolbarButtons?: boolean;
  resetKey?: string | number;
  className?: string;
};

type Root = ReturnType<CdnGraphiQL["createRoot"]>;
type Mounted = { root: Root; host: HTMLDivElement };
type ForcedTheme = "light" | "dark";

// graphiql exposes its Monaco instance as the `__MONACO` global; its graphiql-*
// editor themes live there. Undocumented and tied to the pinned graphiql version.
type MonacoGlobal = typeof globalThis & {
  __MONACO?: { editor: { setTheme: (theme: string) => void } };
};

let warnedMissingMonaco = false;

const setEditorTheme = (forcedTheme: ForcedTheme) => {
  const monaco = (globalThis as MonacoGlobal).__MONACO;
  if (!monaco) {
    if (process.env.NODE_ENV === "development" && !warnedMissingMonaco) {
      warnedMissingMonaco = true;
      // biome-ignore lint/suspicious/noConsole: dev-only diagnostic for a fragile global
      console.warn("[zudoku] GraphiQL __MONACO global missing; theme not set.");
    }
    return;
  }
  monaco.editor.setTheme(
    forcedTheme === "dark" ? "graphiql-DARK" : "graphiql-LIGHT",
  );
};

const createFetcher = (
  { createGraphiQLFetcher }: CdnGraphiQL,
  { fetcher, endpoint, headers }: GraphiQLViewerProps,
): GraphiQLFetcher => {
  if (fetcher) return fetcher;
  if (endpoint) return createGraphiQLFetcher({ url: endpoint, headers });

  // No endpoint: `schema` still feeds the docs explorer, but execution rejects.
  return () =>
    Promise.reject(
      new Error("No GraphQL endpoint configured for this playground."),
    );
};

// Props GraphiQL only reads on mount; bundled so they don't trigger re-renders.
type StaticProps = Omit<
  GraphiQLViewerProps,
  | "fetcher"
  | "endpoint"
  | "headers"
  | "schema"
  | "resetKey"
  | "className"
  | "hideToolbarButtons"
>;

const renderGraphiQL = (
  { React, GraphiQL }: CdnGraphiQL,
  root: Root,
  key: string | number,
  graphiqlProps: GraphiQLComponentProps,
) => {
  root.render(
    React.createElement(
      React.Suspense,
      {},
      React.createElement(
        GraphiQL,
        { ...graphiqlProps, key },
        React.createElement(GraphiQL.Logo, null, "GraphQL Playground"),
      ),
    ),
  );
};

// Separate host node so a deferred unmount can't disturb a sibling root.
const mountRoot = (mod: CdnGraphiQL, container: HTMLElement): Mounted => {
  const host = document.createElement("div");
  host.className = "h-full w-full";
  container.appendChild(host);
  return { root: mod.createRoot(host), host };
};

const unmountRoot = ({ root, host }: Mounted) => {
  // Defer so we never unmount synchronously mid-render (StrictMode).
  setTimeout(() => {
    root.unmount();
    host.remove();
  }, 0);
};

// Monaco's theme is global and resets when editors mount; reapply on DOM
// changes, throttled to once per frame.
const watchEditorTheme = (container: HTMLElement, forcedTheme: ForcedTheme) => {
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      setEditorTheme(forcedTheme);
    });
  };
  schedule();
  const observer = new MutationObserver(schedule);
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
};

// Drives a separate CDN React root so GraphiQL's own React/Monaco stay isolated.
const GraphiQLViewerImpl = (props: GraphiQLViewerProps) => {
  const { resolvedTheme } = useTheme();
  const forcedTheme: ForcedTheme = resolvedTheme === "dark" ? "dark" : "light";
  const mod = use(loadGraphiQLFromCdn());

  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Mounted | null>(null);
  const {
    className,
    schema,
    resetKey,
    fetcher: fetcherProp,
    endpoint,
    headers,
    hideToolbarButtons = true,
    ...staticProps
  } = props;
  const staticRef = useLatest<StaticProps>(staticProps);

  const fetcher = useMemo(
    () => createFetcher(mod, { fetcher: fetcherProp, endpoint, headers }),
    [mod, fetcherProp, endpoint, headers],
  );

  // Create the root once; the render effect reuses it so editor state survives.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const instance = mountRoot(mod, container);
    rootRef.current = instance;
    return () => {
      rootRef.current = null;
      unmountRoot(instance);
    };
  }, [mod]);

  // Re-render on the props GraphiQL re-reads; mount-only props come from the ref.
  useEffect(() => {
    if (!rootRef.current) return;
    renderGraphiQL(mod, rootRef.current.root, resetKey ?? "default", {
      ...staticRef.current,
      fetcher,
      schema,
      defaultQuery: staticRef.current.initialQuery,
      forcedTheme,
    });
  }, [mod, fetcher, schema, forcedTheme, resetKey, staticRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return watchEditorTheme(container, forcedTheme);
  }, [forcedTheme]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "zudoku-graphiql relative h-full w-full",
        hideToolbarButtons && "hide-toolbar-buttons",
        className,
      )}
    />
  );
};

// Own the Suspense/error boundary for the CDN load so callers don't need to —
// otherwise the suspense bubbles to the page and resets its state.
export const GraphiQLViewer = (props: GraphiQLViewerProps) => (
  <ErrorBoundary
    fallbackRender={({ error }) => (
      <div
        className={cn("grid h-full place-items-center p-8", props.className)}
      >
        <ErrorMessage error={error} />
      </div>
    )}
  >
    <Suspense
      fallback={
        <div
          className={cn(
            "grid h-full place-items-center text-muted-foreground",
            props.className,
          )}
        >
          <Spinner size={24} />
        </div>
      }
    >
      <GraphiQLViewerImpl {...props} />
    </Suspense>
  </ErrorBoundary>
);

export default GraphiQLViewer;
