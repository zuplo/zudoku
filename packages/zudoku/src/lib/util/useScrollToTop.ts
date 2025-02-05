import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export const useScrollToTop = () => {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const previousHash = useRef(location.hash);

  useEffect(() => {
    const isNewPage = previousPath.current !== location.pathname;
    const hasAnchor = location.hash !== "";

    if (isNewPage && !hasAnchor) {
      window.scrollTo(0, 0);
    }

    previousPath.current = location.pathname;
    previousHash.current = location.hash;
  }, [location.pathname, location.hash]);
};
