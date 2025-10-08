import { useQuery } from "@tanstack/react-query";
import { CircleFadingArrowUpIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "../ui/Button.js";

const BuildStatusSchema = z.object({
  buildId: z.string(),
  timestamp: z.string(),
  status: z.enum(["in-progress", "success", "failed"]),
});

export const BuildCheck = ({
  buildId,
  environmentType,
  endpoint = "/__zuplo/docs",
}: {
  buildId?: string;
  environmentType?: string;
  endpoint?: string;
}) => {
  const buildStatusQuery = useQuery({
    queryKey: ["zuplo-build-check", buildId, endpoint],
    refetchInterval: 3000,
    enabled: buildId !== undefined && environmentType === "WORKING_COPY",
    retry: false,
    queryFn: () =>
      fetch(endpoint, { signal: AbortSignal.timeout(2000) })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch build status");
          return res.json();
        })
        .then((data) => BuildStatusSchema.parse(data)),
  });

  useEffect(() => {
    if (
      buildStatusQuery.data?.status === "success" &&
      buildStatusQuery.data.buildId
    ) {
      // biome-ignore lint/suspicious/noDocumentCookie: CookieStore too new to use
      document.cookie = `zuplo-build=${buildStatusQuery.data.buildId}; path=/; max-age=300; secure; SameSite=None`;
    }
  }, [buildStatusQuery.data]);

  if (
    buildStatusQuery.isError ||
    !buildStatusQuery.data ||
    buildStatusQuery.data.buildId === buildId
  ) {
    return null;
  }

  const isCompleted = buildStatusQuery.data.status === "success";

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
      {isCompleted && (
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
      )}
    </div>
  );
};
