import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "../util/cn.js";
import { useCopyToClipboard } from "../util/useCopyToClipboard.js";
import { Button } from "./Button.js";

export const Value = ({
  value,
  className,
  onCopy,
}: {
  value: string;
  className?: string;
  onCopy?: (value: string) => void;
}) => {
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  return (
    <div
      className={cn(
        "flex gap-2 items-center text-sm border rounded-md px-1",
        className,
      )}
    >
      <div className="font-mono w-full h-9 items-center flex px-2 text-xs gap-2">
        <span className="w-full truncate">
          <div className={"w-40 inline-block md:w-fit"}>{value}</div>
        </span>
      </div>

      <Button
        variant="ghost"
        onClick={() => {
          copyToClipboard(value);
          onCopy?.(value);
        }}
        size="icon"
      >
        {isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </Button>
    </div>
  );
};
