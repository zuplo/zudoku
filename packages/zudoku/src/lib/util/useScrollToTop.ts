import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const useScrollToTop = () => {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    window.scrollTo(0, 0);
    previousPath.current = location.pathname;
  }, [location.pathname]);
};
