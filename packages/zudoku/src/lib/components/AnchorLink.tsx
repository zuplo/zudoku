import { type MouseEvent } from "react";
import { NavLink, type NavLinkProps, useHref, useLocation } from "react-router";
import { useScrollToHash } from "../util/useScrollToAnchor.js";

/**
 * Link that scrolls to anchor even if the hash is already set in the URL.
 */
export const AnchorLink = (props: NavLinkProps) => {
  const location = useLocation();
  const scrollToHash = useScrollToHash();
  const hash = useHref(props.to).split("#")[1];

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.(event);
    if (hash !== location.hash.slice(1)) return;

    event.preventDefault();
    scrollToHash(hash);
  };

  return <NavLink {...props} onClick={handleClick} />;
};
