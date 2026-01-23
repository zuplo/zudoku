import { MDXProvider } from "@mdx-js/react";
import { useQueryClient } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { ThemeProvider } from "next-themes";
import {
  memo,
  type PropsWithChildren,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation, useNavigation } from "react-router";
import { hasHead, isMdxProviderPlugin } from "../core/plugins.js";
import {
  ZudokuContext,
  type ZudokuContextOptions,
} from "../core/ZudokuContext.js";
import { TopLevelError } from "../errors/TopLevelError.js";
import { MdxComponents } from "../util/MdxComponents.js";
import "../util/requestIdleCallbackPolyfill.js";
import {
  ComponentsProvider,
  DEFAULT_COMPONENTS,
} from "./context/ComponentsContext.js";
import { RouterEventsEmitter } from "./context/RouterEventsEmitter.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ViewportAnchorProvider } from "./context/ViewportAnchorContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";

let zudokuContext: ZudokuContext | undefined;

const ZudokuInner = memo(
  ({
    children,
    env,
    ...props
  }: PropsWithChildren<
    ZudokuContextOptions & { env: Record<string, string> }
  >) => {
    const components = useMemo(
      () => ({ ...DEFAULT_COMPONENTS, ...props.overrides }),
      [props.overrides],
    );

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
    const [didNavigate, setDidNavigate] = useState(false);
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    useEffect(() => {
      if (didNavigate || !navigation.location) {
        return;
      }
      setDidNavigate(true);
    }, [didNavigate, navigation.location]);

    zudokuContext ??= new ZudokuContext(props, queryClient, env);

    const heads = props.plugins?.flatMap((plugin) =>
      hasHead(plugin) ? (plugin.getHead?.({ location }) ?? []) : [],
    );

    return (
      <>
        <Helmet>{heads}</Helmet>
        <ZudokuProvider context={zudokuContext}>
          <Suspense fallback={<div>Zudoku Loading...</div>}>
            <RouterEventsEmitter />
            <SlotProvider slots={props.slots ?? props.UNSAFE_slotlets}>
              <MDXProvider components={mdxComponents}>
                <ThemeProvider attribute="class" disableTransitionOnChange>
                  <ComponentsProvider value={components}>
                    <ViewportAnchorProvider>
                      {children ?? <Outlet />}
                    </ViewportAnchorProvider>
                  </ComponentsProvider>
                </ThemeProvider>
              </MDXProvider>
            </SlotProvider>
          </Suspense>
        </ZudokuProvider>
      </>
    );
  },
);

ZudokuInner.displayName = "ZudokuInner";

const Zudoku = (
  props: PropsWithChildren<
    ZudokuContextOptions & { env: Record<string, string> }
  >,
) => {
  return (
    <ErrorBoundary FallbackComponent={TopLevelError}>
      <ZudokuInner {...props} />
    </ErrorBoundary>
  );
};
Zudoku.displayName = "Zudoku";

export { Zudoku };
