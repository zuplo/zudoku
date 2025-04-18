import { useQuery } from "@tanstack/react-query";
import { CircleFadingArrowUpIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "../ui/Button.js";

export const BuildCheck = ({
  buildId,
  endpoint = "/__zuplo/docs",
}: {
  buildId?: string;
  endpoint?: string;
}) => {
  const buildStatusQuery = useQuery({
    queryKey: ["zuplo-build-check", buildId, endpoint],
    refetchInterval: 2000,
    enabled: !!buildId,
    queryFn: () =>
      fetch(endpoint).then((res) => res.json()) as Promise<{
        buildId: string;
        timestamp: string;
        status: "in-progress" | "completed" | "failed";
      }>,
  });

  if (buildStatusQuery.data?.buildId === buildId) {
    return null;
  }

  const isCompleted = buildStatusQuery.data?.status === "completed";

  return (
    <div className="fixed flex flex-col gap-3 p-4 rounded-xl w-96 border z-20 bg-background left-0 right-0 top-4 mx-auto shadow-lg">
      {isCompleted ? (
        <div className="flex flex-row items-center gap-2">
          <CircleFadingArrowUpIcon size={16} />
          <span className="text-sm">New version available</span>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2">
          <LoaderCircleIcon size={16} className="animate-spin" />
          <span className="text-sm">Building new version...</span>
        </div>
      )}
      <span className="text-xs">
        {!isCompleted
          ? "A new version of the developer portal will be available soon."
          : "To see the new version, reload the page now."}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload
      </Button>
    </div>
  );
};
