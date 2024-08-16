import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { CirclePlayIcon } from "lucide-react";
import { type PropsWithChildren, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../../../components/Dialog.js";
import { Playground, type PlaygroundContentProps } from "./Playground.js";

export type PlaygroundDialogProps = PropsWithChildren<PlaygroundContentProps>;

const PlaygroundDialog = (props: PlaygroundDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        {props.children ?? (
          <CirclePlayIcon
            className="cursor-pointer text-primary hover:text-primary/80"
            size={16}
          />
        )}
      </DialogTrigger>

      <DialogContent
        className="max-w-screen-xl w-full h-5/6 overflow-auto p-0"
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
