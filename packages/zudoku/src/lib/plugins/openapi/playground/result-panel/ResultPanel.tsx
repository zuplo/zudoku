import type { UseMutationResult } from "@tanstack/react-query";
import { SendIcon, UnplugIcon } from "lucide-react";
import { Spinner } from "zudoku/components";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button } from "../../../../ui/Button.js";
import { cn } from "../../../../util/cn.js";
import type { PlaygroundResult } from "../Playground.js";
import ResponseStatusBar from "./ResponseStatusBar.js";
import { ResponseTab } from "./ResponseTab.js";

export const ResultPanel = ({
  queryMutation,
  showLongRunningWarning,
  onCancel,
  tip,
  isFinished,
  progress,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  queryMutation: UseMutationResult<PlaygroundResult, Error, any>;
  showLongRunningWarning?: boolean;
  onCancel?: () => void;
  isFinished: boolean;
  progress: number;
  tip?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col overflow-y-auto h-[80vh] bg-muted/50">
      {(queryMutation.isPending || queryMutation.data) && (
        <ResponseStatusBar
          status={queryMutation.data?.status}
          time={queryMutation.data?.time}
          size={queryMutation.data?.size}
          isFinished={isFinished}
          progress={progress}
        />
      )}
      {queryMutation.error ? (
        <div className="max-w-2/3 mx-auto mt-20">
          <Alert>
            <UnplugIcon size={24} strokeWidth={1.5} className="me-5" />
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>
              {queryMutation.error.message ||
                String(queryMutation.error) ||
                "Unexpected error"}
            </AlertDescription>
          </Alert>
        </div>
      ) : queryMutation.data ? (
        <ResponseTab
          request={queryMutation.data.request}
          size={queryMutation.data.size}
          headers={queryMutation.data.headers}
          body={queryMutation.data.body}
          isBinary={queryMutation.data.isBinary}
          fileName={queryMutation.data.fileName}
          blob={queryMutation.data.blob}
        />
      ) : queryMutation.isPending ? (
        <div className="grid place-items-center h-full">
          <div className="flex flex-col gap-2 items-center mt-20">
            <Spinner />
            <div
              className={cn(
                "opacity-0 pointer-events-none transition-opacity h-20 text-sm text-muted-foreground duration-300 flex flex-col gap-2 items-center",
                showLongRunningWarning && "opacity-100 pointer-events-auto",
              )}
            >
              Looks like the request is taking longer than expected.
              <Button
                type="button"
                onClick={onCancel}
                size="sm"
                className="w-fit"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <div className="flex flex-col gap-4 items-center">
            <SendIcon
              size={64}
              className="text-muted-foreground"
              strokeWidth={1.2}
            />
            <span className="text-[16px] font-semibold text-muted-foreground">
              Send your first request
            </span>
            {tip}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPanel;
