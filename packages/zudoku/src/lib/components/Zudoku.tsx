import { MDXProvider } from "@mdx-js/react";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import {
  memo,
  type PropsWithChildren,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation, useNavigation } from "react-router";
import { hasProvider, isMdxProviderPlugin } from "../core/plugins.js";
import {
  ZudokuContext,
  type ZudokuContextOptions,
} from "../core/ZudokuContext.js";
import { TopLevelError } from "../errors/TopLevelError.js";
import { MdxComponents } from "../util/MdxComponents.js";
import { RenderContext } from "./context/RenderContext.js";
import { RouterEventsEmitter } from "./context/RouterEventsEmitter.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ViewportAnchorProvider } from "./context/ViewportAnchorContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { PluginHeads } from "./PluginHeads.js";

let zudokuContext: ZudokuContext | undefined;

const ZudokuInner = memo(
  ({
    children,
    env,
    ...props
  }: PropsWithChildren<
    ZudokuContextOptions & { env: Record<string, string> }
  >) => {
    const location = useLocation();
    const mdxComponents = useMemo(() => {
      const componentsFromPlugins = (props.plugins ?? [])
        .filter(isMdxProviderPlugin)
        .flatMap((plugin) =>
          plugin.getMdxComponents ? [plugin.getMdxComponents()] : [],
        );

      return {
        ...componentsFromPlugins.reduce(
          (acc, curr) => ({ ...acc, ...curr }),
          {},
        ),
        ...MdxComponents,
        ...props.mdx?.components,
      };
    }, [props.mdx?.components, props.plugins]);
    // Rendered as components (not called as functions) so providers can use
    // hooks and Zudoku's contexts. Memoized so they don't re-render on every
    // navigation.
    const content = useMemo(
      () =>
        (props.plugins ?? []).filter(hasProvider).reduceRight<ReactNode>(
          // biome-ignore lint/correctness/useJsxKeyInIterable: nested single children, not a list
          (inner, { Provider }) => <Provider>{inner}</Provider>,
          children ?? <Outlet />,
        ),
      [props.plugins, children],
    );
    const [didNavigate, setDidNavigate] = useState(false);
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    useEffect(() => {
      if (didNavigate || !navigation.location) {
        return;
      }
      setDidNavigate(true);
    }, [didNavigate, navigation.location]);

    const renderContext = use(RenderContext);
    if (typeof window === "undefined") {
      // Fresh context per SSR request to avoid leaking
      zudokuContext = new ZudokuContext(
        props,
        queryClient,
        env,
        renderContext.ssrAuth,
      );
    } else {
      zudokuContext ??= new ZudokuContext(props, queryClient, env);
    }

    return (
      <>
        <PluginHeads plugins={props.plugins ?? []} location={location} />
        <ZudokuProvider context={zudokuContext}>
          <RouterEventsEmitter />
          <SlotProvider slots={props.slots ?? props.UNSAFE_slotlets}>
            <MDXProvider components={mdxComponents}>
              <ThemeProvider attribute="class" disableTransitionOnChange>
                <ViewportAnchorProvider>{content}</ViewportAnchorProvider>
              </ThemeProvider>
            </MDXProvider>
          </SlotProvider>
        </ZudokuProvider>
      </>
    );
  },
);

ZudokuInner.displayName = "ZudokuInner";

const Zudoku = (
  props: PropsWithChildren<
    ZudokuContextOptions & { env?: Record<string, string> }
  >,
) => {
  return (
    <ErrorBoundary FallbackComponent={TopLevelError}>
      <ZudokuInner {...props} env={props.env ?? {}} />
    </ErrorBoundary>
  );
};
Zudoku.displayName = "Zudoku";

export { Zudoku };
