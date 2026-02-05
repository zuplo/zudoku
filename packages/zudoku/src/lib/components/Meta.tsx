import { Helmet } from "@zudoku/react-helmet-async";
import type { PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { joinUrl } from "../util/joinUrl.js";
import { useZudoku } from "./context/ZudokuContext.js";

export const Meta = ({ children }: PropsWithChildren) => {
  const { options } = useZudoku();
  const { metadata: meta } = options;
  const location = useLocation();

  return (
    <>
      <Helmet titleTemplate={meta?.title} defaultTitle={meta?.defaultTitle}>
        {options.canonicalUrlOrigin && (
          <link
            rel="canonical"
            href={joinUrl(
              options.canonicalUrlOrigin,
              options.basePath,
              location.pathname,
            )}
          />
        )}
        {meta?.description && (
          <meta name="description" content={meta.description} />
        )}
        {meta?.favicon && <link rel="icon" href={meta.favicon} />}
        {meta?.generator && <meta name="generator" content={meta.generator} />}
        {meta?.applicationName && (
          <meta name="application-name" content={meta.applicationName} />
        )}
        {meta?.referrer && <meta name="referrer" content={meta.referrer} />}
        {meta?.keywords && meta.keywords.length > 0 && (
          <meta name="keywords" content={meta.keywords.join(", ")} />
        )}
        {meta?.authors?.map((author) => (
          <meta key={author} name="author" content={author} />
        ))}
        {meta?.creator && <meta name="creator" content={meta.creator} />}
        {meta?.publisher && <meta name="publisher" content={meta.publisher} />}
      </Helmet>
      {children}
    </>
  );
};
