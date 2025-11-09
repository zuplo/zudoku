import { useCallback, useEffect, useRef } from "react";

// Hook to automatically append an empty item when the
// last item has content so there is always at least one empty item.
export const useAutoAppendItem = <T extends { name: string; value: unknown }>(
  items: T[],
  onAppend: () => void,
) => {
  const prevLength = useRef(-1);

  useEffect(() => {
    // Skip if length hasn't changed (prevents double-append)
    // But allow first run (prevLength === -1)
    if (prevLength.current !== -1 && prevLength.current === items.length) {
      return;
    }
    prevLength.current = items.length;

    // If no items, append one
    if (items.length === 0) {
      onAppend();
      return;
    }

    // If last item has content, append empty one
    const lastItem = items[items.length - 1];
    if (lastItem?.name || lastItem?.value) {
      onAppend();
    }
  }, [items, onAppend]);

  return useCallback(
    (index: number) => {
      if (index !== items.length - 1) return;

      const lastFieldValue = items?.at(-1);
      if (!lastFieldValue) return;

      if (lastFieldValue.name || lastFieldValue.value) {
        onAppend();
      }
    },
    [items, onAppend],
  );
};
