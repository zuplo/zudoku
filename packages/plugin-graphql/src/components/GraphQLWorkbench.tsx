import {
  createContext,
  type PropsWithChildren,
  type PointerEvent,
  type RefObject,
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
import { Button } from "zudoku/ui/Button.js";
import { useGraphQLSchema } from "../context.js";
import {
  GraphQLPlayground,
  type GraphQLPlaygroundOperation,
} from "./GraphQLPlayground.js";

type WorkbenchState = "collapsed" | "open" | "maximized";

type OpenWorkbenchInput = {
  query?: string;
  variables?: string;
  label?: string;
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

  const drawerEnabled = options.playground?.enabled !== false;

  return (
    <GraphQLWorkbenchContext.Provider value={value}>
      <div className={cn(drawerEnabled && "pb-14")}>{children}</div>
      {drawerEnabled && (
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

const getMaxHeight = () =>
  typeof window === "undefined" ? MAX_HEIGHT_LIMIT : window.innerHeight - 48;

const clampHeight = (nextHeight: number) =>
  Math.min(Math.max(nextHeight, MIN_HEIGHT), getMaxHeight());

const useResizableHeight = (
  drawerRef: RefObject<HTMLDivElement | null>,
  onOpen: () => void,
) => {
  const frameRef = useRef<number | undefined>(undefined);
  const currentHeightRef = useRef(DEFAULT_HEIGHT);
  const startRef = useRef<{ clientY: number; height: number } | undefined>(
    undefined,
  );
  const [isResizing, setIsResizing] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const startResize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const startHeight = clampHeight(
        drawerRef.current?.getBoundingClientRect().height ?? height,
      );
      startRef.current = { clientY: event.clientY, height: startHeight };
      currentHeightRef.current = startHeight;
      drawerRef.current?.style.setProperty("height", `${startHeight}px`);
      onOpen();
      setIsResizing(true);
    },
    [drawerRef, height, onOpen],
  );

  const resize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.buttons !== 1 || !startRef.current) return;
      const nextHeight = clampHeight(
        startRef.current.height + startRef.current.clientY - event.clientY,
      );
      currentHeightRef.current = nextHeight;

      if (frameRef.current !== undefined) return;
      frameRef.current = window.requestAnimationFrame(() => {
        drawerRef.current?.style.setProperty(
          "height",
          `${currentHeightRef.current}px`,
        );
        frameRef.current = undefined;
      });
    },
    [drawerRef],
  );

  const stopResize = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setHeight(currentHeightRef.current);
    startRef.current = undefined;
    setIsResizing(false);
  }, []);

  return { height, setHeight, isResizing, startResize, resize, stopResize };
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
  const { options, schema } = useGraphQLSchema();
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);
  if (state !== "collapsed") hasOpened.current = true;

  const { height, setHeight, isResizing, startResize, resize, stopResize } =
    useResizableHeight(drawerRef, () => onStateChange("open"));

  const drawerHeight =
    state === "collapsed"
      ? "44px"
      : state === "maximized"
        ? "calc(100vh - 3rem)"
        : `${height}px`;

  return (
    <div
      ref={drawerRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3",
        !isResizing && "transition-[height] duration-200",
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
            onStateChange("open");
            setHeight(clampHeight(height + 40));
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onStateChange("open");
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
                onClick={() => onStateChange("open")}
              />
            ) : (
              <DrawerToolbarButton
                label="Collapse playground"
                icon={ChevronsDownIcon}
                onClick={() => onStateChange("collapsed")}
              />
            )}
            {state === "maximized" ? (
              <DrawerToolbarButton
                label="Restore playground"
                icon={Minimize2Icon}
                onClick={() => onStateChange("open")}
              />
            ) : (
              <DrawerToolbarButton
                label="Maximize playground"
                icon={Maximize2Icon}
                onClick={() => onStateChange("maximized")}
              />
            )}
          </div>
        </div>
        {hasOpened.current && (
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
