import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";
import { useViewportAnchor } from "../components/context/ViewportAnchorContext.js";
import { DATA_ANCHOR_ATTR } from "../components/navigation/SidebarItem.js";

const scrollIntoViewIfNeeded = (
  element: Element | null,
  options: ScrollIntoViewOptions = { block: "center" },
) => {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const isInView =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth);

  if (isInView) return;

  element.scrollIntoView(options);
};

export const useScrollToHash = () => {
  const { setActiveAnchor } = useViewportAnchor();

  const scrollToHash = useCallback(
    (hash: string) => {
      const cleanHash = hash
        .replace(/^#/, "")
        // Operation list items might have subdivisions that the sidebar doesn't show.
        // The subdivisions are separated by a slash so we need to remove everything before the slash to get the sidebar correct item.
        .split("/")
        .at(0)!;
      const element = document.getElementById(decodeURIComponent(cleanHash));
      const link = document.querySelector(
        `[${DATA_ANCHOR_ATTR}="${cleanHash}"]`,
      );

      if (element) {
        element.scrollIntoView();
        scrollIntoViewIfNeeded(link);
        requestIdleCallback(() => setActiveAnchor(cleanHash));
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
  }, [location.hash, setActiveAnchor]);
};
