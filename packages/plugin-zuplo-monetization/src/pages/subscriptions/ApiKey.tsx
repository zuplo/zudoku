import { ClockIcon, Trash2Icon } from "zudoku/icons";
import { Card, CardContent } from "zudoku/ui/Card";
import { Secret } from "zudoku/ui/Secret";

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
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString?: string) => {
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

  const isExpiring =
    expiresOn &&
    new Date(expiresOn) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = expiresOn && new Date(expiresOn) < new Date();

  return (
    <Card
      className={
        isExpiring && !isExpired ? "border-yellow-200 bg-yellow-50" : ""
      }
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* API Key Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                {label || "API Key"}
              </span>
              {isActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Expiring
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              <span>Created {formatDate(createdAt)}</span>
            </div>
            <span>•</span>
            <span>Last used {getTimeAgo(lastUsed)}</span>
            {expiresOn && (
              <>
                <span>•</span>
                <span
                  className={
                    isExpired
                      ? "text-red-700 font-medium"
                      : isExpiring
                        ? "text-yellow-700 font-medium"
                        : ""
                  }
                >
                  Expires {formatDate(expiresOn)}
                </span>
              </>
            )}
          </div>

          {/* API Key Display */}
          <div className="flex items-center gap-2 rounded-md font-mono text-sm">
            <Secret secret={apiKey} status={isActive ? "active" : "expiring"} />
            {!isActive && (
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-700 p-1"
                type="button"
                aria-label="Delete API key"
              >
                <Trash2Icon className="size-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
