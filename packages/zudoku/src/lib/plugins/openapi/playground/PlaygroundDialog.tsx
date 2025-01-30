import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { type PropsWithChildren, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { Playground, type PlaygroundContentProps } from "./Playground.js";

export type PlaygroundDialogProps = PropsWithChildren<PlaygroundContentProps>;

const HeroPlayIcon = ({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width={size}
    height={size}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
      clipRule="evenodd"
    />
  </svg>
);

const PlaygroundDialog = (props: PlaygroundDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        {props.children ?? (
          <button
            type="button"
            className="flex gap-1 items-center px-2 py-1 rounded-md transition text-xs bg-primary  text-primary-foreground shadow-sm hover:bg-primary/80"
          >
            Test
            <HeroPlayIcon size={14} />
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        className="max-w-screen-xl w-full h-5/6 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Playground</DialogTitle>
        </VisuallyHidden>
        {open && <Playground {...props} />}
      </DialogContent>
    </Dialog>
  );
};

export { PlaygroundDialog };
