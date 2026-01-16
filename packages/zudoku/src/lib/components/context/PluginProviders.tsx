import { type PropsWithChildren, type ReactNode, useMemo } from "react";
import {
  isContextProviderPlugin,
  type ZudokuPlugin,
} from "../../core/plugins.js";

export const PluginProviders = ({
  plugins,
  children,
}: PropsWithChildren<{ plugins?: ZudokuPlugin[] }>): ReactNode => {
  const providers = useMemo(
    () =>
      (plugins ?? [])
        .filter(isContextProviderPlugin)
        .flatMap((p) => (p.getProvider ? [p.getProvider()] : [])),
    [plugins],
  );

  return providers.reduceRight<ReactNode>(
    // biome-ignore lint/suspicious/noArrayIndexKey: Providers are stable and never reordered
    (acc, Provider, index) => <Provider key={index}>{acc}</Provider>,
    children,
  );
};
