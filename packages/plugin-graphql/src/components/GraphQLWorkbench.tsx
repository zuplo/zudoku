import {
  createContext,
  type PropsWithChildren,
  type PointerEvent,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { cn, joinUrl } from "zudoku";
import { ApiIdentityPicker } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import {
  ChevronsDownIcon,
  ChevronsUpIcon,
  PictureInPicture2Icon,
  PlayIcon,
  XIcon,
} from "zudoku/icons";
import { Button } from "zudoku/ui/Button.js";
import { useGraphQLSchema } from "../context.js";
import { resolveEndpointUrl } from "../resolveEndpointUrl.js";
import {
  GraphQLPlayground,
  type GraphQLPlaygroundOperation,
} from "./GraphQLPlayground.js";
import "./GraphQLWorkbench.css";

type WorkbenchState = "closed" | "collapsed" | "open" | "detached";

type OpenWorkbenchInput = {
  query?: string;
  variables?: string;
};

type GraphQLWorkbenchContextValue = {
  operation?: GraphQLPlaygroundOperation;
  openWorkbench: (input?: OpenWorkbenchInput) => void;
  updateWorkbenchOperation: (
    operation: Partial<Omit<GraphQLPlaygroundOperation, "id">>,
  ) => void;
};

const GraphQLWorkbenchContext = createContext<
  GraphQLWorkbenchContextValue | undefined
>(undefined);

export const GraphQLWorkbenchProvider = ({ children }: PropsWithChildren) => {
  const { options } = useGraphQLSchema();
  const nextId = useRef(0);
  const [operation, setOperation] = useState<GraphQLPlaygroundOperation>();
  const [drawerState, setDrawerState] = useState<WorkbenchState>("collapsed");

  const updateWorkbenchOperation = useCallback(
    (input: Partial<Omit<GraphQLPlaygroundOperation, "id">>) => {
      setOperation((current) => {
        if (current) {
          return { ...current, ...input };
        }
        nextId.current += 1;
        return {
          id: nextId.current,
          query: input.query ?? "",
          variables: input.variables,
          headers: input.headers,
        };
      });
    },
    [],
  );

  const openWorkbench = useCallback((input?: OpenWorkbenchInput) => {
    if (input?.query !== undefined) {
      nextId.current += 1;
      setOperation({
        id: nextId.current,
        query: input.query,
        variables: input.variables,
      });
    }
    setDrawerState("open");
  }, []);

  const value = useMemo<GraphQLWorkbenchContextValue>(
    () => ({
      operation,
      openWorkbench,
      updateWorkbenchOperation,
    }),
    [operation, openWorkbench, updateWorkbenchOperation],
  );

  // Reopen after closing via the page's playground buttons (openWorkbench).
  const showDrawer =
    options.playground?.enabled !== false && drawerState !== "closed";

  return (
    <GraphQLWorkbenchContext.Provider value={value}>
      <div className={cn(showDrawer && "pb-14")}>{children}</div>
      {showDrawer && (
        <GraphQLWorkbenchDrawer
          operation={operation}
          state={drawerState}
          onStateChange={setDrawerState}
          updateWorkbenchOperation={updateWorkbenchOperation}
        />
      )}
    </GraphQLWorkbenchContext.Provider>
  );
};

export const useGraphQLWorkbench = () => {
  const context = use(GraphQLWorkbenchContext);
  if (!context) {
    throw new Error(
      "useGraphQLWorkbench must be used within GraphQLWorkbenchProvider",
    );
  }
  return context;
};

const MAX_HEIGHT_LIMIT = 900;
const MIN_HEIGHT = 100;
const DEFAULT_HEIGHT = 420;
const COLLAPSED_HEIGHT = 44;
const DRAG_THRESHOLD = 4;

type ViewTransition = { finished: Promise<unknown> };

// flushSync makes React commit inside the callback so the browser snapshots the
// new layout; unsupported browsers just apply the update instantly.
const withViewTransition = (update: () => void): ViewTransition | undefined => {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => ViewTransition;
  };
  if (typeof doc.startViewTransition === "function") {
    return doc.startViewTransition(() => flushSync(update));
  }
  update();
  return undefined;
};

const getMaxHeight = () =>
  typeof window === "undefined" ? MAX_HEIGHT_LIMIT : window.innerHeight - 48;

const clampHeight = (nextHeight: number) =>
  Math.min(Math.max(nextHeight, MIN_HEIGHT), getMaxHeight());

const useResizableHeight = (
  drawerRef: RefObject<HTMLDivElement | null>,
  {
    onOpen,
    onCollapse,
    onTap,
  }: { onOpen: () => void; onCollapse: () => void; onTap: () => void },
) => {
  const frameRef = useRef<number | undefined>(undefined);
  const currentHeightRef = useRef(DEFAULT_HEIGHT);
  const committedHeightRef = useRef(DEFAULT_HEIGHT);
  const startRef = useRef<
    { clientY: number; height: number; dragging: boolean } | undefined
  >(undefined);
  const [isResizing, setIsResizing] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const commitHeight = useCallback((nextHeight: number) => {
    committedHeightRef.current = nextHeight;
    setHeight(nextHeight);
  }, []);

  const startResize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const startHeight =
        drawerRef.current?.getBoundingClientRect().height ??
        committedHeightRef.current;
      startRef.current = {
        clientY: event.clientY,
        height: startHeight,
        dragging: false,
      };
      currentHeightRef.current = startHeight;
    },
    [drawerRef],
  );

  const resize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      if (event.buttons !== 1 || !start) return;
      const delta = start.clientY - event.clientY;
      if (!start.dragging) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return;
        start.dragging = true;
        // Keep the rendered height in sync with the actual height before
        // switching to "open", so the drawer doesn't jump to a stale height
        setHeight(start.height);
        setIsResizing(true);
        onOpen();
      }
      // Allow dragging below MIN_HEIGHT down to the collapsed bar;
      // stopResize snaps to collapsed when released there
      currentHeightRef.current = Math.min(
        Math.max(start.height + delta, COLLAPSED_HEIGHT),
        getMaxHeight(),
      );

      if (frameRef.current !== undefined) return;
      frameRef.current = window.requestAnimationFrame(() => {
        drawerRef.current?.style.setProperty(
          "height",
          `${currentHeightRef.current}px`,
        );
        frameRef.current = undefined;
      });
    },
    [drawerRef, onOpen],
  );

  const stopResize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const start = startRef.current;
      if (!start) return;
      startRef.current = undefined;
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
      if (!start.dragging) {
        onTap();
        return;
      }
      setIsResizing(false);
      if (currentHeightRef.current < MIN_HEIGHT) {
        setHeight(committedHeightRef.current);
        onCollapse();
      } else {
        commitHeight(currentHeightRef.current);
      }
    },
    [commitHeight, onCollapse, onTap],
  );

  return { height, commitHeight, isResizing, startResize, resize, stopResize };
};

const GraphQLWorkbenchDrawer = ({
  operation,
  state,
  onStateChange,
  updateWorkbenchOperation,
}: {
  operation?: GraphQLPlaygroundOperation;
  state: WorkbenchState;
  onStateChange: (state: WorkbenchState) => void;
  updateWorkbenchOperation: GraphQLWorkbenchContextValue["updateWorkbenchOperation"];
}) => {
  const { options, schema, endpoint: configuredEndpoint } = useGraphQLSchema();
  const { env } = useZudoku();
  const gatewayUrl = env.ZUPLO_SERVER_URL;
  const endpoint =
    resolveEndpointUrl(configuredEndpoint, gatewayUrl) ??
    (gatewayUrl ? joinUrl(gatewayUrl, "graphql") : undefined);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);
  if (state !== "collapsed") hasOpened.current = true;

  const { height, commitHeight, isResizing, startResize, resize, stopResize } =
    useResizableHeight(drawerRef, {
      onOpen: () => onStateChange("open"),
      onCollapse: () => onStateChange("collapsed"),
      onTap: () => {
        if (state === "collapsed") onStateChange("open");
      },
    });

  const isDetached = state === "detached";

  // Blur is applied only after the morph finishes: backdrop-filter baked into a
  // view-transition snapshot flashes for one frame when the snapshot is swapped
  // for the live element. It eases in via a CSS transition instead.
  const [backdropBlurred, setBackdropBlurred] = useState(false);

  const dockedStateRef = useRef<WorkbenchState>("open");

  const detach = useCallback(() => {
    dockedStateRef.current = state;
    const applyBlur = () => setBackdropBlurred(true);
    const transition = withViewTransition(() => onStateChange("detached"));
    if (transition) {
      void transition.finished.then(applyBlur, applyBlur);
    } else {
      applyBlur();
    }
  }, [state, onStateChange]);
  const dock = useCallback(() => {
    // Remove the blur synchronously so the dock snapshot is captured unblurred
    // (the CSS removes it instantly; only the fade-in is animated).
    flushSync(() => setBackdropBlurred(false));
    withViewTransition(() => onStateChange(dockedStateRef.current));
  }, [onStateChange]);

  useEffect(() => {
    if (!isDetached) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dock();
    };
    document.addEventListener("keydown", onKeyDown);
    // Compensate for the removed scrollbar so page content doesn't shift.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isDetached, dock]);

  const drawerHeight =
    state === "collapsed" ? `${COLLAPSED_HEIGHT}px` : `${height}px`;

  // Spread as one object so biome can tie aria-modal to role="dialog".
  const dialogProps = isDetached
    ? ({
        role: "dialog",
        "aria-modal": true,
        "aria-label": "GraphQL Playground",
      } as const)
    : undefined;

  const toggleCollapsed = () =>
    onStateChange(state === "collapsed" ? "open" : "collapsed");

  return (
    <>
      {isDetached && (
        <button
          type="button"
          aria-label="Dock playground"
          tabIndex={-1}
          className={cn(
            "gql-workbench-backdrop fixed inset-0 z-40 cursor-default bg-black/50",
            backdropBlurred && "backdrop-blur-sm",
          )}
          style={{ viewTransitionName: "graphql-workbench-backdrop" }}
          onClick={dock}
        />
      )}
      <div
        ref={drawerRef}
        className={cn(
          // The full-width container must let clicks through its empty side
          // gutters; interactive children re-enable pointer events.
          "pointer-events-none fixed",
          isDetached
            ? "inset-4 z-50 mx-auto my-auto h-[80vh] max-h-[calc(100vh-3rem)] max-w-7xl"
            : "inset-x-0 bottom-0 z-40 px-3",
          !isResizing && !isDetached && "transition-[height] duration-200",
        )}
        style={isDetached ? undefined : { height: drawerHeight }}
        {...dialogProps}
        data-pagefind-ignore="all"
      >
        {!isDetached && (
          <div
            className="group pointer-events-auto absolute inset-x-3 top-0 z-20 mx-auto h-4 max-w-6xl cursor-row-resize after:absolute after:inset-x-0 after:-top-1 after:bottom-0 after:content-['']"
            role="separator"
            aria-label="Resize playground"
            aria-orientation="horizontal"
            aria-valuemin={MIN_HEIGHT}
            // window-dependent, so the SSR fallback value never matches the client
            suppressHydrationWarning
            aria-valuemax={getMaxHeight()}
            aria-valuenow={height}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault();
                if (state === "collapsed") {
                  onStateChange("open");
                } else {
                  commitHeight(clampHeight(height + 40));
                }
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (state === "collapsed") return;
                if (height - 40 < MIN_HEIGHT) {
                  onStateChange("collapsed");
                } else {
                  commitHeight(height - 40);
                }
              }
            }}
            onPointerDown={startResize}
            onPointerMove={resize}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            onLostPointerCapture={stopResize}
          >
            <div
              className={cn(
                "mx-auto mt-1.5 h-1 w-10 rounded-full bg-border transition-colors group-hover:bg-foreground/30",
                isResizing && "bg-foreground/30",
              )}
            />
          </div>
        )}
        <div
          className={cn(
            "pointer-events-auto mx-auto flex h-full flex-col overflow-hidden border bg-background shadow-2xl",
            isDetached ? "max-w-7xl rounded-lg" : "max-w-6xl rounded-t-lg",
          )}
          style={{ viewTransitionName: "graphql-workbench" }}
        >
          <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2"
                aria-expanded={state !== "collapsed"}
                onClick={isDetached ? undefined : toggleCollapsed}
              >
                <PlayIcon
                  className="size-3.5 fill-current text-primary"
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium">
                  GraphQL Playground
                </span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <ApiIdentityPicker showLabel />
              {isDetached ? (
                <DrawerToolbarButton
                  label="Dock playground"
                  icon={PictureInPicture2Icon}
                  onClick={dock}
                />
              ) : (
                <>
                  <DrawerToolbarButton
                    label="Open as dialog"
                    icon={PictureInPicture2Icon}
                    onClick={detach}
                  />
                  {state === "collapsed" ? (
                    <DrawerToolbarButton
                      label="Open playground"
                      icon={ChevronsUpIcon}
                      onClick={() => onStateChange("open")}
                    />
                  ) : (
                    <DrawerToolbarButton
                      label="Collapse playground"
                      icon={ChevronsDownIcon}
                      onClick={() => onStateChange("collapsed")}
                    />
                  )}
                </>
              )}
              <DrawerToolbarButton
                label="Close playground"
                icon={XIcon}
                onClick={() => onStateChange("closed")}
              />
            </div>
          </div>
          {hasOpened.current && (
            <GraphQLPlayground
              endpoint={endpoint}
              headers={options.playground?.headers}
              schema={{ __schema: schema }}
              operation={operation}
              onOperationChange={updateWorkbenchOperation}
              className="h-full min-h-0 rounded-none border-0"
            />
          )}
        </div>
      </div>
    </>
  );
};

const DrawerToolbarButton = ({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof ChevronsUpIcon;
  onClick: () => void;
}) => (
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    className="cursor-pointer"
    onPointerDown={(event) => event.stopPropagation()}
    onClick={onClick}
  >
    <Icon size={14} />
  </Button>
);
