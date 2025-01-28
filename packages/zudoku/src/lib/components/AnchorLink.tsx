import React from "react";
import { Link, type LinkProps, useLocation } from "react-router";
import { useScrollToHash } from "../util/useScrollToAnchor.js";

/**
 * Link that scrolls to anchor even if the hash is already set in the URL.
 */
export const AnchorLink = (props: LinkProps) => {
  const location = useLocation();
  const scrollToHash = useScrollToHash();
  const hash = typeof props.to === "string" ? props.to : props.to.hash;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.(event);
    if (!hash?.startsWith("#") || hash !== location.hash) return;

    event.preventDefault();
    scrollToHash(hash);
  };

  return <Link {...props} onClick={handleClick} />;
};
