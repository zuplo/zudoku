import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../util/cn.js";
import { useCopyToClipboard } from "../util/useCopyToClipboard.js";
import { Button } from "./Button.js";

type Status = "active" | "expired" | "expiring" | "revoked" | "none";

export const SecretText = ({
  secret,
  revealed = false,
  previewChars = 5,
  className,
}: {
  secret: string;
  revealed?: boolean;
  previewChars?: number;
  className?: string;
}) => {
  return (
    <span className={cn("w-full truncate", className)}>
      <div
        className={cn(
          "w-40 inline-block md:w-fit",
          revealed ? "" : "opacity-50",
        )}
      >
        {revealed
          ? secret.slice(0, previewChars === 0 ? secret.length : -previewChars)
          : "•••• ".repeat(
              secret.slice(
                0,
                previewChars === 0 ? secret.length : -previewChars,
              ).length / 5,
            ) +
            "•".repeat(
              secret.slice(
                0,
                previewChars === 0 ? secret.length : -previewChars,
              ).length % 5,
            )}
      </div>
      {previewChars > 0 && <span>{secret.slice(-previewChars)}</span>}
    </span>
  );
};

export const Secret = ({
  secret,
  preview = 5,
  className,
  status,
  onCopy,
  revealed: controlledRevealed,
  onReveal,
  noReveal: disabledReveal,
}: {
  revealed?: boolean;
  noReveal?: boolean;
  secret: string;
  status?: Status;
  className?: string;
  preview?: number;
  onCopy?: (secret: string) => void;
  onReveal?: (revealed: boolean) => void;
}) => {
  const previewChars = Math.abs(preview);
  const [isRevealed, setRevealed] = useState(false);
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  const revealed = controlledRevealed ?? isRevealed;

  return (
    <div
      className={cn(
        "flex gap-2 items-center text-sm border rounded-md px-1",
        className,
      )}
    >
      <div className="font-mono w-full h-9 items-center flex px-2 text-xs gap-2">
        {status && (
          <div
            className={cn(
              "rounded-full shrink-0 w-2 h-2 mr-2",
              status === "active" && "bg-emerald-400",
              status === "expired" && "bg-neutral-200",
              status === "expiring" && "bg-yellow-400",
              status === "revoked" && "bg-red-400",
              status === "none" && "opacity-0",
            )}
          />
        )}
        <SecretText
          secret={secret}
          revealed={revealed}
          previewChars={previewChars}
        />
      </div>
      {disabledReveal !== true && (
        <Button
          variant="ghost"
          onClick={() => {
            setRevealed((prev) => !prev);
            onReveal?.(!revealed);
          }}
          size="icon"
        >
          {revealed ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={() => {
          copyToClipboard(secret);
          onCopy?.(secret);
        }}
        size="icon"
      >
        {isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </Button>
    </div>
  );
};
