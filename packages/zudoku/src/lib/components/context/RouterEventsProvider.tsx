import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLatest } from "../../util/useLatest.js";
import { useZudoku } from "./ZudokuContext.js";

const RouterEventsProvider = () => {
  const location = useLocation();
  const zudoku = useZudoku();
  const emit = useLatest(zudoku.emitEvent);

  useEffect(() => {
    emit.current("location", location);
  }, [emit, location]);

  return null;
};

export { RouterEventsProvider };
