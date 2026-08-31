import { defineLink, Head, useHead } from "@unhead/react";
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
  canonicalUrlOrigin,
}: {
  plugins: ZudokuPlugin[];
  location: Location;
  canonicalUrlOrigin?: string;
}) => {
  const args = { location, canonicalUrlOrigin };
  const links = plugins.flatMap((plugin) =>
    hasHead(plugin) ? (plugin.getHeadLinks?.(args) ?? []) : [],
  );
  const entries = plugins.flatMap((plugin) =>
    hasHead(plugin) ? (plugin.getHead?.(args) ?? []) : [],
  );
  useHead({ link: links.map((link) => defineLink(link)) });

  return <Head>{flattenFragments(entries)}</Head>;
};
