import { useHead, useSeoMeta } from "@unhead/react";
import type { PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { joinUrl } from "../util/joinUrl.js";
import { useZudoku } from "./context/ZudokuContext.js";

export const Meta = ({ children }: PropsWithChildren) => {
  const { options } = useZudoku();
  const { metadata } = options;
  const location = useLocation();

  const {
    title,
    defaultTitle,
    authors,
    keywords,
    favicon,
    referrer,
    ...seoMeta
  } = metadata ?? {};

  useSeoMeta(seoMeta);

  useHead({
    titleTemplate: (title) => (title ? metadata?.title : defaultTitle) ?? "",
    link: [
      ...(options.canonicalUrlOrigin
        ? [
            {
              rel: "canonical" as const,
              href: joinUrl(
                options.canonicalUrlOrigin,
                options.basePath,
                location.pathname,
              ),
            },
          ]
        : []),
      ...(favicon ? [{ rel: "icon" as const, href: favicon }] : []),
    ],
    meta: [
      ...(referrer ? [{ name: "referrer", content: referrer }] : []),
      ...(authors ? [{ name: "author", content: authors }] : []),
      ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    ],
  });

  return children;
};
