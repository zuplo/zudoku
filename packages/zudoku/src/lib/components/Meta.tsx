import { useHead } from "@unhead/react";
import type { PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { joinUrl } from "../util/joinUrl.js";
import { useZudoku } from "./context/ZudokuContext.js";

export const Meta = ({ children }: PropsWithChildren) => {
  const { options } = useZudoku();
  const { metadata: meta } = options;
  const location = useLocation();

  const favicon = meta?.favicon
    ? /^https?:\/\//.test(meta.favicon)
      ? meta.favicon
      : joinUrl(options.basePath, meta.favicon)
    : undefined;

  useHead({
    titleTemplate: (title) => (title ? meta?.title : meta?.defaultTitle) ?? "",
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
      ...(meta?.description
        ? [{ name: "description", content: meta.description }]
        : []),
      ...(meta?.generator
        ? [{ name: "generator", content: meta.generator }]
        : []),
      ...(meta?.applicationName
        ? [{ name: "application-name", content: meta.applicationName }]
        : []),
      ...(meta?.referrer ? [{ name: "referrer", content: meta.referrer }] : []),
      ...(meta?.keywords && meta.keywords.length > 0
        ? [{ name: "keywords", content: meta.keywords.join(", ") }]
        : []),
      ...(meta?.authors?.map((author) => ({
        name: "author",
        content: author,
      })) ?? []),
      ...(meta?.creator ? [{ name: "creator", content: meta.creator }] : []),
      ...(meta?.publisher
        ? [{ name: "publisher", content: meta.publisher }]
        : []),
      ...(meta?.robots ? [{ name: "robots", content: meta.robots }] : []),
    ],
  });

  return children;
};
