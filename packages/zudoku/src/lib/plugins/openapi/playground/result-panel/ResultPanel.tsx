import { UseMutationResult } from "@tanstack/react-query";
import { Spinner } from "../../../../components/Spinner.js";
import { Callout } from "../../../../ui/Callout.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../ui/Card.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../ui/Tabs.js";
import { cn } from "../../../../util/cn.js";
import { PlaygroundResult } from "../Playground.js";
import { RequestTab } from "./RequestTab.js";
import { ResponseTab } from "./ResponseTab.js";

export const ResultPanel = ({
  queryMutation,
  showPathParamsWarning,
}: {
  queryMutation: UseMutationResult<PlaygroundResult, Error, any, unknown>;
  showPathParamsWarning: boolean;
}) => {
  const status = ((queryMutation.data?.status ?? 0) / 100).toFixed(0);
  return (
    <div className="min-w-0 p-8 bg-muted/70 overflow-y-auto">
      {queryMutation.error ? (
        <div className="flex flex-col gap-2">
          {showPathParamsWarning && (
            <Callout type="caution">
              Some path parameters are missing values. Please fill them in to
              ensure the request is sent correctly.
            </Callout>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Request failed</CardTitle>
            </CardHeader>
            <CardContent>
              Error:{" "}
              {queryMutation.error.message ||
                String(queryMutation.error) ||
                "Unexpected error"}
            </CardContent>
          </Card>
        </div>
      ) : queryMutation.data ? (
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="response">
            <TabsList>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">
                Response
                <span
                  className={cn(
                    "text-xs font-mono ml-1",
                    status === "2" && "text-green-500",
                    status === "3" && "text-blue-500",
                    status === "4" && "text-yellow-500",
                    status === "5" && "text-red-500",
                  )}
                >
                  ({queryMutation.data.status})
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="request">
              <RequestTab {...queryMutation.data.request} />
            </TabsContent>
            <TabsContent value="response">
              <ResponseTab
                status={queryMutation.data.status}
                time={queryMutation.data.time}
                size={queryMutation.data.size}
                headers={queryMutation.data.headers}
                body={queryMutation.data.body}
                url={queryMutation.data.request.url}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid place-items-center h-full">
          <span className="text-[16px] font-semibold text-muted-foreground">
            {queryMutation.isPending ? (
              <Spinner />
            ) : (
              "Send a request first to see the response here"
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default ResultPanel;
