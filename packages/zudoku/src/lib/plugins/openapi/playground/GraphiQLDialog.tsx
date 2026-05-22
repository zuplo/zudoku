import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PlayIcon } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";

const GraphiQLPanel = lazy(() => import("./GraphiQL.js"));

export type GraphiQLDialogProps = {
  endpoint: string;
  defaultQuery?: string;
  defaultHeaders?: string;
};

export const GraphiQLDialog = ({
  endpoint,
  defaultQuery,
  defaultHeaders,
}: GraphiQLDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" className="group gap-1">
          <span className="text-xs text-muted-foreground">Test</span>
          <PlayIcon
            className="fill-muted-foreground group-hover:fill-foreground transition"
            strokeWidth={1.5}
          />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-7xl! w-full h-[80vh] overflow-hidden p-0"
        aria-describedby={undefined}
        showCloseButton
      >
        <VisuallyHidden>
          <DialogTitle>GraphiQL</DialogTitle>
        </VisuallyHidden>
        {open && (
          <Suspense fallback={null}>
            <GraphiQLPanel
              endpoint={endpoint}
              defaultQuery={defaultQuery}
              defaultHeaders={defaultHeaders}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
};
