import { SparklesIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useRef } from "react";
import { Button } from "../../ui/Button.js";
import { useAskAiStore } from "./store.js";
import type { ResolvedZudokuAiOptions } from "./types.js";

// Lazily loaded so that the AI SDK, the chat panel and the Markdown renderer
// (which pulls in the syntax highlighter) stay out of the entry-path bundle.
// They are only fetched once the visitor opens the assistant.
const AskAiChat = lazy(() =>
  import("./AskAiChat.js").then((module) => ({ default: module.AskAiChat })),
);

export const AskAiRoot = ({
  options,
}: {
  options: ResolvedZudokuAiOptions;
}) => {
  const isOpen = useAskAiStore((state) => state.isOpen);
  const toggle = useAskAiStore((state) => state.toggle);

  // Once the panel has been opened we keep it mounted (but render nothing when
  // closed) so the conversation is preserved when the visitor reopens it.
  const hasOpened = useRef(false);
  if (isOpen) {
    hasOpened.current = true;
  }

  const { shortcut, label } = options;
  useEffect(() => {
    const key = shortcut ? shortcut.toLowerCase() : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        key &&
        event.key.toLowerCase() === key &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        useAskAiStore.getState().toggle();
        return;
      }
      if (event.key === "Escape" && useAskAiStore.getState().isOpen) {
        useAskAiStore.getState().close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  return (
    <>
      {/* Floating trigger for small screens, where the header button is hidden. */}
      {!isOpen && (
        <Button
          type="button"
          size="icon"
          onClick={toggle}
          aria-label={label}
          aria-haspopup="dialog"
          title={label}
          className="fixed inset-e-4 bottom-4 z-40 size-12 rounded-full shadow-lg lg:hidden"
        >
          <SparklesIcon className="size-5" />
        </Button>
      )}
      {hasOpened.current && (
        <Suspense fallback={null}>
          <AskAiChat
            options={options}
            open={isOpen}
            onClose={() => useAskAiStore.getState().close()}
          />
        </Suspense>
      )}
    </>
  );
};
