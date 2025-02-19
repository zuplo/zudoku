import { useEffect, useState } from "react";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { ZudokuEvents } from "../core/ZudokuContext.js";

type EventParameters<Event extends keyof ZudokuEvents> = Parameters<
  ZudokuEvents[Event]
>;

/**
 * Hook to subscribe to Zudoku events with automatic cleanup
 * @param event The event to subscribe to
 * @param callback Optional callback to be called when the event is emitted
 * @returns The latest event data if no callback is provided, or the callback's return value if it returns something
 */
export function useEvent<E extends keyof ZudokuEvents>(
  event: E,
): EventParameters<E>;
export function useEvent<E extends keyof ZudokuEvents, R>(
  event: E,
  callback: (...args: EventParameters<E>) => R,
): R;
export function useEvent<E extends keyof ZudokuEvents, R>(
  event: E,
  callback?: (...args: EventParameters<E>) => R,
) {
  const zudoku = useZudoku();
  const [latestData, setLatestData] = useState<R | EventParameters<E>>();

  useEffect(() => {
    return zudoku.addEventListener(event, ((...args: EventParameters<E>) => {
      if (callback) {
        const result = callback(...args);
        setLatestData(result);
      } else {
        setLatestData(args);
      }
    }) as ZudokuEvents[E]);
  }, [zudoku, event, callback]);

  return latestData;
}
