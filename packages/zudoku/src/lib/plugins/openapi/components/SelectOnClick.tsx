import { Slot, type SlotProps } from "@radix-ui/react-slot";

/**
 * Block-level children make the browser serialize a line break between them
 * when a selection is copied, even when they render on a single line — the
 * server origin and the path in the operation header are one such pair, so
 * copying the endpoint URL yielded "https://example.com\n/some/path".
 *
 * Such a newline is a layout artifact rather than content: wherever
 * `white-space` collapses, real newlines in the text are rendered — and
 * serialized — as spaces, so they can never reach us as "\n". Preformatted
 * content keeps its newlines, since there they are meaningful.
 */
const withoutLayoutNewlines = (element: HTMLElement, text: string) => {
  const { whiteSpace } = getComputedStyle(element);
  const preservesNewlines =
    whiteSpace.startsWith("pre") || whiteSpace === "break-spaces";

  return preservesNewlines ? text : text.replaceAll(/\r?\n/g, "");
};

export const SelectOnClick = ({
  asChild,
  onClick,
  onCopy,
  enabled = true,
  ...props
}: {
  asChild?: boolean;
  enabled?: boolean;
} & SlotProps) => {
  const Component = asChild ? Slot : "span";

  return (
    <Component
      onClick={(e) => {
        if (enabled) {
          const range = document.createRange();
          range.selectNodeContents(e.currentTarget);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        onClick?.(e);
      }}
      onCopy={(e) => {
        const selection = window.getSelection();
        const range =
          selection?.rangeCount === 1 ? selection.getRangeAt(0) : undefined;

        // Leave selections that reach outside this element to the browser.
        if (
          selection &&
          range &&
          e.currentTarget.contains(range.commonAncestorContainer)
        ) {
          // `Selection.toString()` is the layout-aware serialization that the
          // clipboard would receive; `Range.toString()` would instead give the
          // raw text-node data, which never carries the artifact to begin with.
          const selected = selection.toString();
          const copied = withoutLayoutNewlines(e.currentTarget, selected);

          // Only take over the clipboard when there is an artifact to remove,
          // so every other case keeps the browser's own payload.
          if (copied !== selected) {
            e.clipboardData.setData("text/plain", copied);
            e.preventDefault();
          }
        }
        onCopy?.(e);
      }}
      {...props}
    />
  );
};
