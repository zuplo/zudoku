import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";
import { useViewportAnchor } from "../components/context/ViewportAnchorContext.js";
import { DATA_ANCHOR_ATTR } from "../components/navigation/SidebarItem.js";
import { scrollIntoViewIfNeeded } from "./scrollIntoViewIfNeeded.js";

export const useScrollToHash = () => {
  const { setActiveAnchor } = useViewportAnchor();

  const scrollToHash = useCallback(
    (hash: string) => {
      const cleanHash = hash.replace(/^#/, "");

      // Operation list items might have subdivisions that the sidebar doesn't show.
      // The subdivisions are separated by a slash so we need to remove everything before the slash to get the sidebar correct item.
      const linkHash = cleanHash.split("/").at(0)!;
      const element = document.getElementById(decodeURIComponent(cleanHash));

      const link = document.querySelector(
        `[${DATA_ANCHOR_ATTR}="${linkHash}"]`,
      );

      if (element) {
        element.scrollIntoView();
        scrollIntoViewIfNeeded(link);
        // Set the active anchor after the scroll has happened
        // so the intersection observer doesn't trigger wrong items
        requestIdleCallback(() => setActiveAnchor(linkHash));
        return true;
      }

      // Scroll didn't happen
      return false;
    },
    [setActiveAnchor],
  );

  return scrollToHash;
};

export const useScrollToAnchor = () => {
  const location = useLocation();
  const { setActiveAnchor } = useViewportAnchor();
  const scrollToHash = useScrollToHash();

  useEffect(() => {
    if (!location.hash) return;

    if (!scrollToHash(location.hash)) {
      const observer = new MutationObserver((_, obs) => {
        if (!scrollToHash(location.hash)) return;
        obs.disconnect();
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, [location.hash, scrollToHash, setActiveAnchor]);
};
