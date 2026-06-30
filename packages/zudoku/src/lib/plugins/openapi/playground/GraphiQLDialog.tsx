import { PlayIcon } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import type { SecuritySchemeItem } from "../util/extractOperationSecuritySchemes.js";
import { AuthSelectorPopover } from "./AuthSelectorPopover.js";

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
  operation: OperationsFragmentFragment;
  securitySchemes: SecuritySchemeItem[];
  defaultTabs?: GraphiQLTab[];
};

export const GraphiQLDialog = ({
  endpoint,
  operation,
  securitySchemes,
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
        className="max-w-7xl! w-full h-[80vh] overflow-hidden p-0 flex flex-col gap-0"
        aria-describedby={undefined}
        showCloseButton
      >
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b ps-10 pe-3">
          <DialogTitle className="text-sm font-medium">
            GraphQL Playground
          </DialogTitle>
          <AuthSelectorPopover
            operation={operation}
            url={endpoint}
            securitySchemes={securitySchemes}
            showLabel
          />
        </div>
        {open && (
          <Suspense fallback={null}>
            <div className="flex-1 min-h-0">
              <GraphiQLPanel
                endpoint={endpoint}
                defaultTabs={defaultTabs}
                security={operation.security}
              />
            </div>
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
};
