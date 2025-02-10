import { useEffect, useRef } from "react";

// This hook is useful when you need to store a reference to a variable that changes over time,
// but you don't want to re-run any callbacks that depend on that variable every time it changes.
// By using a reference to the latest value, you can ensure that any callbacks only run when necessary,
// without any unnecessary re-renders.

// Note: It's safe to put the return value of this hook in a dependency array, because it won't change!
export const useLatest = <T>(current: T) => {
  const valueRef = useRef(current);
  valueRef.current = current;

  useEffect(() => {
    valueRef.current = current;
  }, [current]);

  return valueRef;
};
