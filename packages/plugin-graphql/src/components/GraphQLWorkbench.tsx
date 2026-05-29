import {
  createContext,
  type PropsWithChildren,
  type PointerEvent,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "zudoku";
import {
  ChevronsDownIcon,
  ChevronsUpIcon,
  Maximize2Icon,
  Minimize2Icon,
  PlayIcon,
} from "zudoku/icons";
import { useLocation } from "zudoku/router";
import { Button } from "zudoku/ui/Button.js";
import { useGraphQLSchema } from "../context.js";
import {
  GraphQLPlayground,
  type GraphQLPlaygroundOperation,
} from "./GraphQLPlayground.js";

type WorkbenchState = "collapsed" | "open" | "maximized";

type OpenWorkbenchInput = {
  query: string;
  variables?: string;
  label?: string;
};

type GraphQLWorkbenchContextValue = {
  operation?: GraphQLPlaygroundOperation;
  openWorkbench: (input: OpenWorkbenchInput) => void;
  updateWorkbenchOperation: (
    operation: Partial<Omit<GraphQLPlaygroundOperation, "id">>,
  ) => void;
};

const GraphQLWorkbenchContext = createContext<
  GraphQLWorkbenchContextValue | undefined
>(undefined);

export const GraphQLWorkbenchProvider = ({ children }: PropsWithChildren) => {
  const { options } = useGraphQLSchema();
  const requestId = useRef(0);
  const [operation, setOperation] = useState<GraphQLPlaygroundOperation>();

  const updateWorkbenchOperation = useCallback(
    (input: Partial<Omit<GraphQLPlaygroundOperation, "id">>) => {
      setOperation((current) => {
        if (current) {
          return { ...current, ...input };
        }

        requestId.current += 1;
        return {
          id: requestId.current,
          query: input.query ?? "",
          variables: input.variables,
          headers: input.headers,
        };
      });
    },
    [],
  );

  const openWorkbench = useCallback((input: OpenWorkbenchInput) => {
    requestId.current += 1;
    setOperation({
      id: requestId.current,
      query: input.query,
      variables: input.variables,
    });
  }, []);

  const value = useMemo<GraphQLWorkbenchContextValue>(
    () => ({
      operation,
      openWorkbench,
      updateWorkbenchOperation,
    }),
    [operation, openWorkbench, updateWorkbenchOperation],
  );

  const drawerEnabled = options.playground?.enabled !== false;

  return (
    <GraphQLWorkbenchContext.Provider value={value}>
      {/* Reserve room for the 44px collapsed drawer. */}
      <div className={cn(drawerEnabled && "pb-14")}>{children}</div>
      {drawerEnabled && (
        <GraphQLWorkbenchDrawer
          operation={operation}
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

const GraphQLWorkbenchDrawer = ({
  operation,
  updateWorkbenchOperation,
}: {
  operation?: GraphQLPlaygroundOperation;
  updateWorkbenchOperation: GraphQLWorkbenchContextValue["updateWorkbenchOperation"];
}) => {
  const { options, schema } = useGraphQLSchema();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const resizeFrameRef = useRef<number | undefined>(undefined);
  const resizedHeightRef = useRef(DEFAULT_HEIGHT);
  const resizeStartRef = useRef<
    { clientY: number; height: number } | undefined
  >(undefined);
  const [isResizing, setIsResizing] = useState(false);
  const [state, setState] = useState<WorkbenchState>("collapsed");
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  // Auto-open the drawer when openWorkbench is called (id bumps).
  const [lastOpenedId, setLastOpenedId] = useState(operation?.id);
  if (operation?.id !== undefined && operation.id !== lastOpenedId) {
    setLastOpenedId(operation.id);
    setState("open");
  }
  // Mount the playground lazily on first open and keep it alive thereafter.
  const [hasOpened, setHasOpened] = useState(state !== "collapsed");
  if (!hasOpened && state !== "collapsed") {
    setHasOpened(true);
  }
  const isStandalonePlayground = location.pathname.endsWith("/playground");
  const getMaxHeight = () =>
    typeof window === "undefined" ? MAX_HEIGHT_LIMIT : window.innerHeight - 48;
  const clampHeight = (nextHeight: number) =>
    Math.min(Math.max(nextHeight, MIN_HEIGHT), getMaxHeight());
  const drawerHeight =
    state === "collapsed"
      ? "44px"
      : state === "maximized"
        ? "calc(100vh - 3rem)"
        : `${height}px`;

  if (isStandalonePlayground) {
    return null;
  }

  const startResize = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startHeight = clampHeight(
      drawerRef.current?.getBoundingClientRect().height ?? height,
    );

    resizeStartRef.current = {
      clientY: event.clientY,
      height: startHeight,
    };
    resizedHeightRef.current = startHeight;
    drawerRef.current?.style.setProperty("height", `${startHeight}px`);
    setState("open");
    setIsResizing(true);
  };

  const resize = (event: PointerEvent<HTMLElement>) => {
    if (event.buttons !== 1 || !resizeStartRef.current) return;
    const nextHeight = clampHeight(
      resizeStartRef.current.height +
        resizeStartRef.current.clientY -
        event.clientY,
    );
    resizedHeightRef.current = nextHeight;

    if (resizeFrameRef.current !== undefined) return;

    resizeFrameRef.current = window.requestAnimationFrame(() => {
      drawerRef.current?.style.setProperty(
        "height",
        `${resizedHeightRef.current}px`,
      );
      resizeFrameRef.current = undefined;
    });
  };

  const stopResize = (event: PointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setHeight(resizedHeightRef.current);
    resizeStartRef.current = undefined;
    setIsResizing(false);
  };

  return (
    <div
      ref={drawerRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3",
        !isResizing && "transition-[height] duration-200",
        isStandalonePlayground && "pointer-events-none translate-y-full",
      )}
      style={{ height: drawerHeight }}
      data-pagefind-ignore="all"
    >
      <div
        className="absolute inset-x-3 top-0 z-20 mx-auto h-0.5 max-w-6xl cursor-ns-resize hover:bg-border/50 after:absolute after:inset-x-3 after:-top-1 after:-bottom-1 after:content-['']"
        role="separator"
        aria-label="Resize playground"
        aria-orientation="horizontal"
        aria-valuemin={280}
        aria-valuemax={Math.max(280, MAX_HEIGHT_LIMIT)}
        aria-valuenow={height}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setState("open");
            setHeight(clampHeight(height + 40));
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setState("open");
            setHeight(clampHeight(height - 40));
          }
        }}
        onPointerDown={startResize}
        onPointerMove={resize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
        onLostPointerCapture={stopResize}
      />
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-t-lg border bg-background shadow-2xl">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PlayIcon
              className="size-3.5 fill-current text-primary"
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium">
              GraphQL Playground
            </span>
          </div>
          <div className="flex items-center gap-1">
            {state === "collapsed" ? (
              <DrawerToolbarButton
                label="Open playground"
                icon={ChevronsUpIcon}
                onClick={() => setState("open")}
              />
            ) : (
              <DrawerToolbarButton
                label="Collapse playground"
                icon={ChevronsDownIcon}
                onClick={() => setState("collapsed")}
              />
            )}
            {state === "maximized" ? (
              <DrawerToolbarButton
                label="Restore playground"
                icon={Minimize2Icon}
                onClick={() => setState("open")}
              />
            ) : (
              <DrawerToolbarButton
                label="Maximize playground"
                icon={Maximize2Icon}
                onClick={() => setState("maximized")}
              />
            )}
          </div>
        </div>
        {hasOpened && (
          <GraphQLPlayground
            endpoint={options.playground?.endpoint}
            headers={options.playground?.headers}
            schema={{ __schema: schema }}
            operation={operation}
            onOperationChange={updateWorkbenchOperation}
            className="h-full min-h-0 rounded-none border-0"
          />
        )}
      </div>
    </div>
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
