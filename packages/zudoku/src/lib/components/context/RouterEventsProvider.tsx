import { useEffect, useRef } from "react";
import { useLocation, type Location } from "react-router";
import { useZudoku } from "./ZudokuContext.js";

const RouterEventsProvider = () => {
  const location = useLocation();
  const zudoku = useZudoku();
  const previousLocation = useRef<Location | undefined>(undefined);

  useEffect(() => {
    zudoku.emitEvent("location", {
      from: previousLocation.current,
      to: location,
    });
    previousLocation.current = location;
  }, [zudoku, location]);

  return null;
};

export { RouterEventsProvider };
