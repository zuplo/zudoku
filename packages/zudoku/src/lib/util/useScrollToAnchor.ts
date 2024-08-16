import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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

export const useScrollToAnchor = () => {
  const location = useLocation();
  const { setActiveAnchor } = useViewportAnchor();

  useEffect(() => {
    if (!location.hash) return;

    const hash = decodeURIComponent(location.hash.split("/")[0].slice(1));

    const scrollToElement = () => {
      const element = document.getElementById(hash);
      const link = document.querySelector(`[${DATA_ANCHOR_ATTR}="${hash}"]`);

      if (element) {
        element.scrollIntoView();
        scrollIntoViewIfNeeded(link);
        requestIdleCallback(() => setActiveAnchor(hash));
        return true;
      }

      return false;
    };

    if (!scrollToElement()) {
      const observer = new MutationObserver((_, obs) => {
        if (!scrollToElement()) return;
        obs.disconnect();
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, [location.hash, setActiveAnchor]);
};
