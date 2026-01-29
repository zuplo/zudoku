import { useSuspenseQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { NO_DEHYDRATE } from "../cache.js";
import { ZudokuReactContext } from "./ZudokuReactContext.js";

export const ZudokuProvider = ({
  children,
  context,
}: PropsWithChildren<{ context: ZudokuContext }>) => {
  useSuspenseQuery({
    queryFn: async () => {
      await context.initialize();
      return true;
    },
    queryKey: ["zudoku-initialize", NO_DEHYDRATE],
  });

  return (
    <ZudokuReactContext.Provider value={context}>
      {children}
    </ZudokuReactContext.Provider>
  );
};
