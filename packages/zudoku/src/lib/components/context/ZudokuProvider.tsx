import { useSuspenseQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import { ZudokuReactContext } from "./ZudokuContext.js";

export const ZudokuProvider = ({
  children,
  context,
}: PropsWithChildren<{ context: ZudokuContext }>) => {
  useSuspenseQuery({
    queryFn: async () => {
      await context.initialize();
      return true;
    },
    queryKey: ["zudoku-initialize"],
  });

  return (
    <ZudokuReactContext.Provider value={context}>
      {children}
    </ZudokuReactContext.Provider>
  );
};
