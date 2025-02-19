import { useEffect, useState } from "react";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { ZudokuEvents } from "../core/ZudokuContext.js";

/**
 * Hook to subscribe to Zudoku events with automatic cleanup
 * @param event The event to subscribe to
 * @param callback Optional callback to be called when the event is emitted
 * @returns The latest event data if no callback is provided, or the callback's return value if it returns something
 */
export function useEvent<E extends keyof ZudokuEvents>(
  event: E,
  callback?: ZudokuEvents[E],
) {
  const zudoku = useZudoku();
  const [latestData, setLatestData] =
    useState<Parameters<ZudokuEvents[E]>[0]>();

  useEffect(() => {
    const handler: ZudokuEvents[E] = ((...args) => {
      const result = callback?.(...args);
      if (!callback || result !== undefined) {
        setLatestData(result ?? args[0]);
      }
    }) as ZudokuEvents[E];

    const unsubscribe = zudoku.addEventListener(event, handler);
    return () => unsubscribe();
  }, [zudoku, event, callback]);

  return callback ? undefined : latestData;
}
