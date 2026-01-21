import { useState } from "react";
import { useZudoku } from "zudoku/hooks";
import { ClockIcon, EyeIcon, EyeOffIcon, CopyIcon, Trash2Icon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { Card, CardContent } from "zudoku/ui/Card";
import { cn } from "zudoku/util/cn";

type ConsumerResponse = {
  id: string;
  name: string;
  createdOn: string;
  updatedOn: string;
  apiKeys: Array<{
    id: string;
    createdOn: string;
    updatedOn: string;
    key: string;
  }>;
};

export const ApiKey = ({
  apiKey,
  createdAt,
  lastUsed,
  expiresAt,
  isActive = true,
  label,
  deploymentName,
  consumerId,
  apiKeyId,
}: {
  apiKey: string;
  createdAt?: string;
  lastUsed?: string;
  expiresAt?: string;
  isActive?: boolean;
  label?: string;
  deploymentName: string;
  consumerId: string;
  apiKeyId: string;
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const isExpiring = expiresAt && new Date(expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log("Delete API Key", apiKeyId);
  };

  const maskKey = (key: string) => {
    const parts = key.split("_");
    if (parts.length >= 2) {
      const prefix = `${parts[0]}_${parts[1]}`;
      const masked = "•".repeat(16);
      const suffix = parts[parts.length - 1].slice(-4);
      return `${prefix}_${masked}${suffix}`;
    }
    return key;
  };

  return (
    <div className={isExpiring && !isExpired ? "border-l-4 border-yellow-500 pl-4" : ""}>
      <Card className={isExpiring && !isExpired ? "border-yellow-200 bg-yellow-50" : ""}>
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
              {expiresAt && !isActive && (
                <>
                  <span>•</span>
                  <span className="text-yellow-700 font-medium">
                    Expires {formatDate(expiresAt)}
                  </span>
                </>
              )}
            </div>

            {/* API Key Display */}
            <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-md font-mono text-sm">
              <span className="flex-1 select-all">
                {isRevealed ? apiKey : maskKey(apiKey)}
              </span>
              <button
                onClick={() => setIsRevealed(!isRevealed)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label={isRevealed ? "Hide API key" : "Show API key"}
              >
                {isRevealed ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Copy API key"
              >
                <CopyIcon className="size-4" />
              </button>
              {!isActive && (
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Delete API key"
                >
                  <Trash2Icon className="size-4" />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
