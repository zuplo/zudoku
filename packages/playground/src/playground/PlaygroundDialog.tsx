import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@zudoku/ui/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@zudoku/ui/ui/Dialog.js";
import { PlayIcon } from "lucide-react";
import { type PropsWithChildren, useState } from "react";
import { Playground, type PlaygroundContentProps } from "./Playground.js";

export type PlaygroundDialogProps = PropsWithChildren<PlaygroundContentProps>;

const PlaygroundDialog = (props: PlaygroundDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        {props.children ?? (
          <Button variant="ghost" size="icon-xs" className="group">
            <PlayIcon
              className="fill-muted-foreground group-hover:fill-foreground transition"
              size={16}
              strokeWidth={1.5}
            />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="max-w-screen-xl! w-full overflow-hidden p-0"
        aria-describedby={undefined}
        showCloseButton={true}
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
