import { cn } from "zudoku";
import { ClockIcon, MoreVerticalIcon, Trash2Icon } from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge";
import { Button } from "zudoku/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu";
import { Frame, FrameFooter, FramePanel } from "zudoku/ui/Frame";
import { Secret } from "zudoku/ui/Secret";
import ConfirmDeleteKeyAlert from "./ConfirmDeleteKeyAlert";

export const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getTimeAgo = (dateString?: string) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 30) return `${diffInDays} days ago`;

  return formatDate(dateString);
};

export const ApiKey = ({
  apiKey,
  createdAt,
  lastUsed,
  expiresOn,
  isActive = true,
  label,
  onDelete,
}: {
  apiKey: string;
  createdAt?: string;
  lastUsed?: string;
  expiresOn?: string;
  isActive?: boolean;
  label?: string;
  deploymentName: string;
  consumerId: string;
  apiKeyId: string;
  onDelete: () => void;
}) => {
  const isExpiring =
    expiresOn &&
    new Date(expiresOn) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = expiresOn && new Date(expiresOn) < new Date();

  return (
    <Frame
      className={cn(
        isExpired && "opacity-50 hover:opacity-100 transition-opacity",
      )}
    >
      <FramePanel
        className={cn(
          isExpiring && "border-amber-300 dark:border-yellow-400/30",
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                {label || "API Key"}
              </span>
              {isActive ? (
                <Badge variant="muted">Active</Badge>
              ) : (
                <Badge variant="warning">Expiring</Badge>
              )}
            </div>

            {!isActive && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More options"
                  >
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ConfirmDeleteKeyAlert onDelete={onDelete}>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2Icon className="size-4" />
                      Delete key
                    </DropdownMenuItem>
                  </ConfirmDeleteKeyAlert>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Secret
            secret={apiKey}
            status={isActive ? "active" : "expiring"}
            className="max-w-fit"
          />
        </div>
      </FramePanel>

      <FrameFooter className="text-xs text-muted-foreground p-2.5">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3" />
            <span>Created {formatDate(createdAt)}</span>
          </div>
          <span className="text-muted-foreground/40">•</span>
          <span>Last updated {getTimeAgo(lastUsed)}</span>
          {expiresOn && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span
                className={cn(
                  isExpired && "text-red-600 font-medium dark:text-red-400",
                  isExpiring &&
                    !isExpired &&
                    "text-amber-500 font-medium dark:text-amber-400",
                )}
              >
                {isExpired ? "Expired" : "Expires"} on {formatDate(expiresOn)}
              </span>
            </>
          )}
        </div>
      </FrameFooter>
    </Frame>
  );
};
