import { useCallback, useState } from "react";

export const useCopyToClipboard = (timeout = 2000) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      setIsCopied(true);

      setTimeout(() => setIsCopied(false), timeout);
    },
    [timeout],
  );

  return [isCopied, copyToClipboard] as const;
};
