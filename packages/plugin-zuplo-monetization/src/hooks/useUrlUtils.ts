import { joinUrl } from "zudoku";
import { useZudoku } from "zudoku/hooks";

export const useUrlUtils = () => {
  const z = useZudoku();
  const basePath = z.options.basePath;

  return {
    generateUrl: (path: string) => {
      if (!window.location.origin) {
        throw new Error("Only works in browser environment");
      }

      return joinUrl(window.location.origin, basePath, path);
    },
  };
};
