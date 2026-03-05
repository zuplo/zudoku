import { use, type PropsWithChildren } from "react";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { ZudokuReactContext } from "./ZudokuReactContext.js";

export const ZudokuProvider = ({
  children,
  context,
}: PropsWithChildren<{ context: ZudokuContext }>) => {
  if (context.initialize) use(context.initialize);

  return (
    <ZudokuReactContext.Provider value={context}>
      {children}
    </ZudokuReactContext.Provider>
  );
};
