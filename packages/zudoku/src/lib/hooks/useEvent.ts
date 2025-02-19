import { useEffect } from "react";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { ZudokuEvents } from "../core/ZudokuContext.js";

/**
 * Hook to subscribe to Zudoku events with automatic cleanup
 * @param event The event to subscribe to
 * @param callback The callback to be called when the event is emitted
 */
export function useEvent<E extends keyof ZudokuEvents>(
  event: E,
  callback: ZudokuEvents[E],
) {
  const zudoku = useZudoku();

  useEffect(() => {
    const unsubscribe = zudoku.addEventListener(event, callback);
    return () => unsubscribe();
  }, [zudoku, event, callback]);
}
