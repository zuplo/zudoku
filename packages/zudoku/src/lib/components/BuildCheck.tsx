import { useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
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

  if (buildStatusQuery.data?.status === "completed") {
    return null;
  }

  if (buildStatusQuery.data?.buildId === buildId) {
    return null;
  }

  return (
    <div className="fixed p-4 rounded-xl w-92 border z-20 bg-muted text-muted-foreground left-0 right-0 top-4 mx-auto shadow-lg">
      <div className="flex flex-row items-center gap-2">
        <LoaderCircleIcon size={16} className="animate-spin" />
        <span className="text-sm">Building new version...</span>
      </div>
      <span className="text-xs">
        A new version of this will be available in a few minutes.
      </span>
      <Button variant="outline" size="sm" className="w-full">
        Reload
      </Button>
    </div>
  );
};
