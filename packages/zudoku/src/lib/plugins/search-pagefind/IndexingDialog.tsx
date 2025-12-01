import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog.js";

type IndexingState =
  | { status: "idle" }
  | { status: "indexing"; total: number; current: number; path: string }
  | { status: "complete"; indexed: number }
  | { status: "error"; message: string };

const ProgressBar = ({
  total,
  current,
  barLength = 25,
  emptyChar = "░",
  filledChar = "█",
}: {
  total: number;
  current: number;
  barLength?: number;
  emptyChar?: string;
  filledChar?: string;
}) => {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((percent / 100) * barLength);
  const empty = barLength - filled;

  return (
    <>
      {filledChar.repeat(filled)}
      {emptyChar.repeat(empty)} {percent}% ({current}/{total})
    </>
  );
};

const IndexingDialog = ({ children }: PropsWithChildren) => {
  const [indexingState, setIndexingState] = useState<IndexingState>({
    status: "idle",
  });

  const startIndexing = useCallback(() => {
    setIndexingState({ status: "indexing", total: 0, current: 0, path: "" });

    const eventSource = new EventSource("/__z/pagefind-reindex");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "progress") {
        setIndexingState({
          status: "indexing",
          total: data.total,
          current: data.current,
          path: data.path,
        });
      } else if (data.type === "complete") {
        eventSource.close();
        if (data.success) {
          setIndexingState({ status: "complete", indexed: data.indexed });
        } else {
          setIndexingState({
            status: "error",
            message: data.error ?? "Indexing failed",
          });
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIndexingState({
        status: "error",
        message: "Connection lost during indexing",
      });
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (indexingState.status !== "idle") return;
    return startIndexing();
  }, [indexingState.status, startIndexing]);

  const handleDone = () => {
    if (indexingState.status !== "complete") return;
    window.location.reload();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-sm! top-1/3"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {indexingState.status === "indexing" && "Building Search Index"}
            {indexingState.status === "complete" && "Indexing Complete"}
            {indexingState.status === "error" && "Indexing Failed"}
            {indexingState.status === "idle" && "Build Search Index"}
          </DialogTitle>
          <DialogDescription>
            {indexingState.status === "indexing" && (
              <>
                {indexingState.total > 0 && (
                  <div className="font-mono text-sm mb-2">
                    <ProgressBar {...indexingState} />
                  </div>
                )}
                {indexingState.path && (
                  <span className="block text-xs truncate">
                    {indexingState.path}
                  </span>
                )}
              </>
            )}
            {indexingState.status === "complete" && (
              <>Successfully indexed {indexingState.indexed} pages.</>
            )}
            {indexingState.status === "error" && (
              <span className="text-destructive">{indexingState.message}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-end gap-2">
            {indexingState.status === "complete" && (
              <Button size="sm" onClick={handleDone}>
                Close and reload
              </Button>
            )}
            {indexingState.status === "error" && (
              <>
                <Button variant="outline" onClick={handleDone}>
                  Cancel
                </Button>
                <Button onClick={startIndexing}>Retry</Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IndexingDialog;
