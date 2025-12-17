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
  label: string;
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
  const [state, setState] = useState<WorkbenchState>("collapsed");
  const [hasOpened, setHasOpened] = useState(false);
  const [height, setHeight] = useState(420);
  const [operation, setOperation] = useState<GraphQLPlaygroundOperation>();
  const [label, setLabel] = useState("Ready");

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

  const value = useMemo<GraphQLWorkbenchContextValue>(
    () => ({
      label,
      operation,
      openWorkbench(input) {
        requestId.current += 1;
        setOperation({
          id: requestId.current,
          query: input.query,
          variables: input.variables,
        });
        setLabel(input.label ?? "Operation loaded");
        setHasOpened(true);
        setState("open");
      },
      updateWorkbenchOperation,
    }),
    [label, operation, updateWorkbenchOperation],
  );

  const drawerEnabled = options.playground?.enabled !== false;

  return (
    <GraphQLWorkbenchContext.Provider value={value}>
      {/* Reserve room for the 44px collapsed drawer. */}
      <div className={cn(drawerEnabled && "pb-11")}>{children}</div>
      {drawerEnabled && (
        <GraphQLWorkbenchDrawer
          state={state}
          height={height}
          label={label}
          operation={operation}
          setHeight={setHeight}
          setState={(nextState) => {
            if (nextState !== "collapsed") setHasOpened(true);
            setState(nextState);
          }}
          hasOpened={hasOpened}
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

const GraphQLWorkbenchDrawer = ({
  state,
  height,
  label,
  operation,
  setHeight,
  setState,
  hasOpened,
  updateWorkbenchOperation,
}: {
  state: WorkbenchState;
  height: number;
  label: string;
  operation?: GraphQLPlaygroundOperation;
  setHeight: (height: number) => void;
  setState: (state: WorkbenchState) => void;
  hasOpened: boolean;
  updateWorkbenchOperation: GraphQLWorkbenchContextValue["updateWorkbenchOperation"];
}) => {
  const { options, schema } = useGraphQLSchema();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const resizeFrameRef = useRef<number | undefined>(undefined);
  const resizedHeightRef = useRef(height);
  const resizeStartRef = useRef<
    { clientY: number; height: number } | undefined
  >(undefined);
  const [isResizing, setIsResizing] = useState(false);
  const isStandalonePlayground = location.pathname.endsWith("/playground");
  const maxHeight = 900;
  const minHeight = 100;
  const getMaxHeight = () =>
    typeof window === "undefined" ? maxHeight : window.innerHeight - 48;
  const clampHeight = (nextHeight: number) =>
    Math.min(Math.max(nextHeight, minHeight), getMaxHeight());
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
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-t-lg border bg-background shadow-2xl">
        <div
          className="flex h-11 shrink-0 cursor-ns-resize items-center gap-2 border-b px-3"
          role="separator"
          aria-label="Resize playground"
          aria-orientation="horizontal"
          aria-valuemin={280}
          aria-valuemax={Math.max(280, maxHeight)}
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
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PlayIcon
              className="size-3.5 fill-current text-primary"
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium">
              GraphQL Playground
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {state === "collapsed" ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open playground"
                className="cursor-pointer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setState("open")}
              >
                <ChevronsUpIcon size={14} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Collapse playground"
                className="cursor-pointer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setState("collapsed")}
              >
                <ChevronsDownIcon size={14} />
              </Button>
            )}
            {state === "maximized" ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Restore playground"
                className="cursor-pointer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setState("open")}
              >
                <Minimize2Icon size={14} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Maximize playground"
                className="cursor-pointer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setState("maximized")}
              >
                <Maximize2Icon size={14} />
              </Button>
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
