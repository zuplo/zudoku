import { CircleXIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../util/cn.js";
import { useZudoku } from "./context/ZudokuContext.js";

const COLOR_MAP = {
  info: "bg-blue-500",
  note: "bg-gray-500",
  tip: "bg-green-600",
  caution: "bg-orange-500",
  danger: "bg-rose-500",
};

export const Banner = () => {
  const { page } = useZudoku();
  const [isBannerOpen, setIsBannerOpen] = useState(true);

  return page?.banner && isBannerOpen ? (
    <div
      className={cn(
        "h-[--banner-height] text-primary-foreground text-sm font-medium px-4 flex items-center relative",
        page.banner.color ? COLOR_MAP[page.banner.color] : "bg-primary/90",
      )}
    >
      <div className="w-full">{page.banner.message}</div>
      {page.banner.dismissible && (
        <button
          type="button"
          className="absolute right-4 -m-1.5 p-1.5"
          onClick={() => setIsBannerOpen(false)}
        >
          <CircleXIcon size={16} />
        </button>
      )}
    </div>
  ) : (
    // reset for correct calculation of fixed elements and scroll padding
    <style>{`:root{ --banner-height: 0px }`}</style>
  );
};
