import { Slot, type SlotProps } from "@radix-ui/react-slot";

export const SelectOnClick = ({
  asChild,
  onClick,
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
      {...props}
    />
  );
};
