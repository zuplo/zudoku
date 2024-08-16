import { MDXProvider } from "@mdx-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import {
  Fragment,
  memo,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useNavigation } from "react-router-dom";
import {
  DevPortalContext,
  queryClient,
  ZudokuContextOptions,
} from "../core/DevPortalContext.js";
import { hasHead, isMdxProviderPlugin } from "../core/plugins.js";
import { TopLevelError } from "../errors/TopLevelError.js";
import { StaggeredRenderContext } from "../plugins/openapi/StaggeredRender.js";
import { MdxComponents } from "../util/MdxComponents.js";
import "../util/requestIdleCallbackPolyfill.js";
import {
  ComponentsProvider,
  DEFAULT_COMPONENTS,
} from "./context/ComponentsContext.js";
import { ThemeProvider } from "./context/ThemeProvider.js";
import { ViewportAnchorProvider } from "./context/ViewportAnchorContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { SlotletProvider } from "./SlotletProvider.js";

const DevPortalInner = ({
  children,
  ...props
}: PropsWithChildren<ZudokuContextOptions>) => {
  const components = useMemo(
    () => ({ ...DEFAULT_COMPONENTS, ...props.overrides }),
    [props.overrides],
  );

  const mdxComponents = useMemo(() => {
    const componentsFromPlugins = (props.plugins ?? [])
      .filter(isMdxProviderPlugin)
      .flatMap((plugin) =>
        plugin.getMdxComponents ? [plugin.getMdxComponents()] : [],
      );

    return {
      ...componentsFromPlugins.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
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

  useEffect(() => {
    if (didNavigate) {
      return;
    }
    setDidNavigate(true);
  }, [didNavigate, navigation.location]);

  const [devPortalContext] = useState(() => new DevPortalContext(props));

  const heads = props.plugins
    ?.filter(hasHead)
    // eslint-disable-next-line react/no-array-index-key
    .map((plugin, i) => <Fragment key={i}>{plugin.getHead?.()}</Fragment>);

  return (
    <QueryClientProvider client={queryClient}>
      <Helmet>{heads}</Helmet>
      <StaggeredRenderContext.Provider value={staggeredValue}>
        <ZudokuProvider context={devPortalContext}>
          <MDXProvider components={mdxComponents}>
            <ThemeProvider>
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
    </QueryClientProvider>
  );
};

const Inner = memo(DevPortalInner);

const DevPortal = (props: ZudokuContextOptions) => {
  return (
    <ErrorBoundary FallbackComponent={TopLevelError}>
      <Inner {...props} />
    </ErrorBoundary>
  );
};
DevPortal.displayName = "DevPortal";

export { DevPortal };
