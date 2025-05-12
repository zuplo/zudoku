import { MDXProvider } from "@mdx-js/react";
import { useQueryClient } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { ThemeProvider } from "next-themes";
import {
  memo,
  type PropsWithChildren,
  useContext,
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
import { StaggeredRenderContext } from "../plugins/openapi/StaggeredRender.js";
import { MdxComponents } from "../util/MdxComponents.js";
import "../util/requestIdleCallbackPolyfill.js";
import {
  ComponentsProvider,
  DEFAULT_COMPONENTS,
} from "./context/ComponentsContext.js";
import { RouterEventsEmitter } from "./context/RouterEventsEmitter.js";
import { ViewportAnchorProvider } from "./context/ViewportAnchorContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { SlotletProvider } from "./SlotletProvider.js";

let zudokuContext: ZudokuContext | undefined;

const ZudokoInner = memo(
  ({ children, ...props }: PropsWithChildren<ZudokuContextOptions>) => {
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
    const { stagger } = useContext(StaggeredRenderContext);
    const [didNavigate, setDidNavigate] = useState(false);
    const staggeredValue = useMemo(
      () => (didNavigate ? { stagger: true } : { stagger }),
      [stagger, didNavigate],
    );
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    useEffect(() => {
      if (didNavigate) {
        return;
      }
      setDidNavigate(true);
    }, [didNavigate, navigation.location]);

    zudokuContext ??= new ZudokuContext(props, queryClient);

    const heads = props.plugins
      ?.flatMap((plugin) =>
        hasHead(plugin) ? (plugin.getHead?.({ location }) ?? []) : [],
      )
      // eslint-disable-next-line react/no-array-index-key
      .map((entry, i) => <Helmet key={i}>{entry}</Helmet>);

    return (
      <>
        {heads}
        <StaggeredRenderContext.Provider value={staggeredValue}>
          <ZudokuProvider context={zudokuContext}>
            <RouterEventsEmitter />
            <MDXProvider components={mdxComponents}>
              <ThemeProvider attribute="class" disableTransitionOnChange>
                <ComponentsProvider value={components}>
                  <SlotletProvider slotlets={props.slotlets}>
                    <ViewportAnchorProvider>
                      {children ?? <Outlet />}
                    </ViewportAnchorProvider>
                  </SlotletProvider>
                </ComponentsProvider>
              </ThemeProvider>
            </MDXProvider>
          </ZudokuProvider>
        </StaggeredRenderContext.Provider>
      </>
    );
  },
);

ZudokoInner.displayName = "ZudokoInner";

const Zudoku = (props: ZudokuContextOptions) => {
  return (
    <ErrorBoundary FallbackComponent={TopLevelError}>
      <ZudokoInner {...props} />
    </ErrorBoundary>
  );
};
Zudoku.displayName = "Zudoku";

export { Zudoku };
