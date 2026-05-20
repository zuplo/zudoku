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
import { useTranslation } from "../../components/context/useTranslation.js";

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
  const { t } = useTranslation();
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
            message: data.error ?? t("search.indexingFallback"),
          });
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIndexingState({
        status: "error",
        message: t("search.connectionLost"),
      });
    };

    return () => eventSource.close();
  }, [t]);

  useEffect(() => {
    return startIndexing();
  }, [startIndexing]);

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
            {indexingState.status === "indexing" && t("search.indexing")}
            {indexingState.status === "complete" && t("search.indexComplete")}
            {indexingState.status === "error" && t("search.indexFailed")}
            {indexingState.status === "idle" && t("search.buildIndex")}
          </DialogTitle>
          <DialogDescription>
            {indexingState.status === "indexing" && (
              <>
                {indexingState.total > 0 && (
                  <span className="font-mono text-sm mb-2 block">
                    <ProgressBar {...indexingState} />
                  </span>
                )}
                {indexingState.path && (
                  <span className="block text-xs truncate">
                    {indexingState.path}
                  </span>
                )}
              </>
            )}
            {indexingState.status === "complete" &&
              t("search.indexed", { count: indexingState.indexed })}
            {indexingState.status === "error" && (
              <span className="text-destructive">{indexingState.message}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-end gap-2">
            {indexingState.status === "complete" && (
              <Button size="sm" onClick={handleDone}>
                {t("search.closeAndReload")}
              </Button>
            )}
            {indexingState.status === "error" && (
              <>
                <Button variant="outline" onClick={handleDone}>
                  {t("search.cancel")}
                </Button>
                <Button onClick={startIndexing}>{t("search.retry")}</Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IndexingDialog;
