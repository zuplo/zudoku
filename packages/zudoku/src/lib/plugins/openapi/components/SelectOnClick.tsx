import { Slot, type SlotProps } from "@radix-ui/react-slot";

export const SelectOnClick = ({
  asChild,
  onClick,
  copyValue,
  enabled = true,
  ...props
}: {
  asChild?: boolean;
  enabled?: boolean;
  /**
   * Copied in place of the rendered text. Browsers serialize a line break
   * between block-level children, so an element whose halves render on one
   * line — the server origin and the path in the operation header — has to
   * pass the joined value explicitly to keep it out of the clipboard.
   */
  copyValue?: string;
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
      onCopy={
        copyValue === undefined
          ? undefined
          : (e) => {
              e.clipboardData.setData("text/plain", copyValue);
              e.preventDefault();
            }
      }
      {...props}
    />
  );
};
