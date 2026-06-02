import { Head } from "@unhead/react";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import type { Location } from "react-router";
import { hasHead, type ZudokuPlugin } from "../core/plugins.js";

const flattenFragments = (node: ReactNode): ReactNode[] =>
  Children.toArray(node).flatMap((child) =>
    isValidElement(child) && child.type === Fragment
      ? flattenFragments((child.props as { children?: ReactNode }).children)
      : [child],
  );

export const PluginHeads = ({
  plugins,
  location,
}: {
  plugins: ZudokuPlugin[];
  location: Location;
}) => {
  const entries = plugins.flatMap((plugin) =>
    hasHead(plugin) ? (plugin.getHead?.({ location }) ?? []) : [],
  );

  return <Head>{flattenFragments(entries)}</Head>;
};
