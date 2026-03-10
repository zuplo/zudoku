import { Helmet } from "@zudoku/react-helmet-async";
import type { Location } from "react-router";
import { hasHead, type ZudokuPlugin } from "../core/plugins.js";

export const PluginHeads = ({
  plugins,
  location,
}: {
  plugins: ZudokuPlugin[];
  location: Location;
}) =>
  plugins
    .flatMap((plugin) =>
      hasHead(plugin) ? (plugin.getHead?.({ location }) ?? []) : [],
    )
    // biome-ignore lint/suspicious/noArrayIndexKey: No stable key available
    .map((entry, i) => <Helmet key={i}>{entry}</Helmet>);
