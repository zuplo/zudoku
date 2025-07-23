import { Helmet } from "@zudoku/react-helmet-async";
import type { PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { joinUrl } from "../util/joinUrl.js";
import { useZudoku } from "./context/ZudokuContext.js";

export const Meta = ({ children }: PropsWithChildren) => {
  const { meta, options } = useZudoku();
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
      </Helmet>
      {children}
    </>
  );
};
