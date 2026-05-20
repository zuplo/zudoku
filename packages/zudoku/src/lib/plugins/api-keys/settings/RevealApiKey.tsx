import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { Secret } from "zudoku/ui/Secret.js";
import { useTranslation } from "../../../components/context/useTranslation.js";
import { cn } from "../../../util/cn.js";
import type { ApiKey } from "../index.js";

export const RevealApiKey = ({
  apiKey,
  onDeleteKey,
  className,
}: {
  apiKey: ApiKey;
  onDeleteKey: () => void;
  className?: string;
}) => {
  const [revealed, setRevealed] = useState(false);
  const { t, locale } = useTranslation();

  const { key, description, createdOn, expiresOn } = apiKey;
  const isExpired = expiresOn && new Date(expiresOn) < new Date();
  const daysUntilExpiry = expiresOn
    ? Math.ceil(
        (new Date(expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : Infinity;
  const expiresSoon = daysUntilExpiry <= 7 && !isExpired;

  return (
    <div className={cn("grid col-span-full grid-cols-subgrid p-6", className)}>
      <div className="flex flex-col gap-1">
        {description && (
          <span className="text-sm font-medium">{description}</span>
        )}
        <Secret
          className="max-w-fit w-full"
          secret={key}
          status={isExpired ? "expired" : expiresSoon ? "expiring" : "active"}
          revealed={revealed}
          onReveal={setRevealed}
        />
        <div className="flex gap-1 mt-0.5 text-nowrap">
          {createdOn && (
            <span className="text-xs text-muted-foreground">
              {t("apiKeys.created", { timeAgo: getTimeAgo(createdOn, locale) })}
            </span>
          )}{" "}
          {expiresOn && expiresSoon && (
            <span className="text-xs text-primary">
              {daysUntilExpiry === 1
                ? t("apiKeys.expiresInOne")
                : t("apiKeys.expiresIn", { count: daysUntilExpiry })}
            </span>
          )}
          {expiresOn && isExpired && (
            <span className="text-xs text-primary">
              {daysUntilExpiry === 0
                ? t("apiKeys.expiredToday")
                : t("apiKeys.expiredDaysAgo", { count: daysUntilExpiry * -1 })}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        {expiresOn && onDeleteKey && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("apiKeys.deleteApiKey")}
              >
                <TrashIcon size={16} aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("apiKeys.deleteDialogTitle")}</DialogTitle>
                <DialogDescription>
                  {t("apiKeys.deleteDialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("apiKeys.cancel")}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      onDeleteKey();
                    }}
                  >
                    {t("apiKeys.delete")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

const getTimeAgo = (date: string, locale: string) => {
  const now = new Date();
  const created = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second");
  if (diffInSeconds < 3600)
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  if (diffInSeconds < 86400)
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  if (diffInSeconds < 2592000)
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  if (diffInSeconds < 31536000)
    return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
};
