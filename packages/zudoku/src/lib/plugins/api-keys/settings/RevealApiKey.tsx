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

  const { key, createdOn, expiresOn } = apiKey;
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
              Created {getTimeAgo(createdOn)}.
            </span>
          )}{" "}
          {expiresOn && expiresSoon && (
            <span className="text-xs text-primary">
              Expires in {daysUntilExpiry}{" "}
              {daysUntilExpiry === 1 ? "day" : "days"}.
            </span>
          )}
          {expiresOn && isExpired && (
            <span className="text-xs text-primary">
              Expired{" "}
              {daysUntilExpiry === 0
                ? "today."
                : `${daysUntilExpiry * -1} days ago.`}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        {expiresOn && onDeleteKey && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <TrashIcon size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete API Key</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this API key?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      onDeleteKey();
                    }}
                  >
                    Delete
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

const getTimeAgo = (date: string) => {
  const now = new Date();
  const created = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

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
