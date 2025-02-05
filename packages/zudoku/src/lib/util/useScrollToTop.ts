import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export const useScrollToTop = () => {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    const isNewPage = previousPath.current !== location.pathname;
    const hasAnchor = location.hash !== "";

    if (isNewPage && !hasAnchor) {
      window.scrollTo(0, 0);
    }

    previousPath.current = location.pathname;
  }, [location.pathname, location.hash]);
};
