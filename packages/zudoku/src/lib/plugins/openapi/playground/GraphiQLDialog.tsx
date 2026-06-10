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

// Best-effort warm on hover/focus; swallow errors so a failed preload neither
// reports an unhandled rejection nor poisons the real load on click.
const preloadGraphiQL = () => {
  void import("./GraphiQL.js").catch(() => {});
  void import("../../../graphiql/loadGraphiQLFromCdn.js")
    .then((m) => m.loadGraphiQLFromCdn())
    .catch(() => {});
};

export type GraphiQLTab = {
  query: string;
  variables?: string;
  headers?: string;
};

export type GraphiQLDialogProps = {
  endpoint: string;
  defaultHeaders?: string;
  defaultTabs?: GraphiQLTab[];
};

export const GraphiQLDialog = ({
  endpoint,
  defaultHeaders,
  defaultTabs,
}: GraphiQLDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="group gap-1"
          onMouseEnter={preloadGraphiQL}
          onFocus={preloadGraphiQL}
        >
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
          <DialogTitle>GraphQL Playground</DialogTitle>
        </VisuallyHidden>
        {open && (
          <Suspense fallback={null}>
            <GraphiQLPanel
              endpoint={endpoint}
              defaultHeaders={defaultHeaders}
              defaultTabs={defaultTabs}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
};
