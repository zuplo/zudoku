import { useQuery } from "@tanstack/react-query";
import { CircleFadingArrowUpIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { Button } from "../ui/Button.js";

const BuildStatusSchema = z.object({
  buildId: z.string(),
  timestamp: z.string(),
  status: z.enum(["in-progress", "success", "failed"]),
});

export const BuildCheck = ({
  buildId,
  endpoint = "/__zuplo/docs",
}: {
  buildId?: string;
  endpoint?: string;
}) => {
  const { t } = useTranslation();
  const buildStatusQuery = useQuery({
    queryKey: ["zuplo-build-check", buildId, endpoint],
    refetchInterval: 3000,
    enabled:
      typeof buildId !== "undefined" &&
      import.meta.env.ZUPLO_ENVIRONMENT_TYPE === "WORKING_COPY",
    retry: false,
    queryFn: () =>
      fetch(endpoint, { signal: AbortSignal.timeout(2000) })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch build status");
          return res.json();
        })
        .then((data) => BuildStatusSchema.parse(data)),
  });

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
          <span className="text-sm">{t("newVersion")}</span>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2">
          <LoaderCircleIcon size={16} className="animate-spin" />
          <span className="text-sm">{t("buildingNewVersion")}</span>
        </div>
      )}
      <span className="text-xs">
        {!isCompleted ? t("newVersionSoon") : t("reloadPage")}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          window.location.reload();
        }}
      >
        {t("reload")}
      </Button>
    </div>
  );
};
