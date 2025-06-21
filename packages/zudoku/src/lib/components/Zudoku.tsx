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
import { I18nextProvider } from "react-i18next";
import { Outlet, useLocation, useNavigation } from "react-router";
import { hasHead, isMdxProviderPlugin } from "../core/plugins.js";
import {
  ZudokuContext,
  type ZudokuContextOptions,
} from "../core/ZudokuContext.js";
import { TopLevelError } from "../errors/TopLevelError.js";
import { createI18n } from "../i18n.js";
import { StaggeredRenderContext } from "../plugins/openapi/StaggeredRender.js";
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
    const i18n = useMemo(
      () =>
        createI18n(props.i18n?.resources ?? {}, props.i18n?.defaultLanguage),
      [props.i18n],
    );

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
            <I18nextProvider i18n={i18n}>
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
            </I18nextProvider>
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
