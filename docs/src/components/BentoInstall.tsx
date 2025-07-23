import { useState } from "react";
import { cn } from "zudoku";
import { CheckIcon, CopyIcon } from "zudoku/icons";
import { BoxLongshadow } from "./BoxLongshadow";
import { TypingAnimation } from "./Terminal";

const useCopyToClipboard = (text: string, timeout = 2000) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, timeout);
  };

  return [isCopied, copyToClipboard] as const;
};

export const BentoInstall = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, copyToClipboard] = useCopyToClipboard(
    "npm create zudoku@latest",
  );
  return (
    <BoxLongshadow
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="font-mono font-medium text-center gap-2 relative border-b border-[black] h-12 flex items-center justify-center">
        <div className="flex items-center gap-2 absolute left-4 top-5">
          <div
            className={cn(
              "w-2.5 h-2.5 bg-neutral-200 rounded-full transition-colors",
              isHovered ? "bg-red-500" : "bg-neutral-200",
            )}
          />
          <div
            className={cn(
              "w-2.5 h-2.5 bg-neutral-200 rounded-full transition-colors",
              isHovered ? "bg-green-500" : "bg-neutral-200",
            )}
          />
        </div>
        terminal
      </div>
      <div className="flex justify-between items-center p-5">
        <div className="font-mono font-medium">
          {isHovered ? (
            <TypingAnimation>npm create zudoku@latest</TypingAnimation>
          ) : (
            <>
              npm create <span className="text-[#E379E0]">zudoku</span>@latest
            </>
          )}
          &nbsp;
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          className={cn("transition hover:-rotate-8", isCopied && "!rotate-0")}
        >
          {isCopied ? (
            <CheckIcon size={20} className="text-green-600" strokeWidth={5} />
          ) : (
            <CopyIcon size={20} />
          )}
        </button>
      </div>
    </BoxLongshadow>
  );
};
