import { useRef, useState } from "react";

type COPY_STATE = "idle" | "failed" | "copied" | "loading";
export const DEFAULT_COPIED_TIMEOUT_MS = 2000;

export type CopyText = (() => Promise<string>) | string;

const useCopyToClipboard = (
  textToCopy: CopyText,
  { onCopy } = {
    onCopy: () => {},
  },
) => {
  const retrieveText =
    typeof textToCopy === "string" ? () => textToCopy : textToCopy;
  const [state, setCopyState] = useState<COPY_STATE>("idle");
  const timeoutRef = useRef<number>(undefined);

  const setCopySuccessState = () => {
    setCopyState("copied");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCopyState("idle");
    }, DEFAULT_COPIED_TIMEOUT_MS) as unknown as number;
  };

  const copyToClipboard = async () => {
    // we do this to make sure the loading state is not shown if the copy is instantaneous
    setTimeout(
      () =>
        setCopyState((prevState) =>
          prevState === "idle" ? "loading" : prevState,
        ),
      5,
    );
    const text = await retrieveText();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccessState();
      onCopy?.();
    } catch {
      setCopyState("failed");
    }
  };

  return {
    copyToClipboard,
    state,
  };
};

export default useCopyToClipboard;
