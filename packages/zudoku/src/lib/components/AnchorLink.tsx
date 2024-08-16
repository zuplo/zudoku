import React from "react";
import { Link, type LinkProps, useLocation } from "react-router-dom";

/**
 * Link that scrolls to anchor even if the hash is already set in the URL.
 */
export const AnchorLink = (props: LinkProps) => {
  const location = useLocation();
  const hash = typeof props.to === "string" ? props.to : props.to.hash;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hash?.startsWith("#") || hash !== location.hash) return;

    event.preventDefault();
    document.getElementById(hash.slice(1))?.scrollIntoView();
  };

  return <Link onClick={handleClick} {...props} />;
};
