import { useSuspenseQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { DevPortalContext } from "../../core/DevPortalContext.js";
import { ZudokuReactContext } from "./ZudokuContext.js";

export const ZudokuProvider = ({
  children,
  context,
}: PropsWithChildren<{ context: DevPortalContext }>) => {
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
