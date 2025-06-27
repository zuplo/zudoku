import { useState } from "react";
import { cn } from "zudoku";
import { CopyIcon } from "zudoku/icons";
import { BoxLongshadow } from "./BoxLongshadow";
import { TypingAnimation } from "./Terminal";

export const BentoInstall = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <BoxLongshadow
      className="w-full"
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
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
        <CopyIcon className="w-5 h-5" />
      </div>
    </BoxLongshadow>
  );
};
