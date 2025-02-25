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
} as const;

export const Banner = () => {
  const { page } = useZudoku();
  const [isBannerOpen, setIsBannerOpen] = useState(true);

  if (!page?.banner || !isBannerOpen) {
    return <style>{`:root { --banner-height: 0px; }`}</style>;
  }

  const mappedColor =
    page.banner.color && page.banner.color in COLOR_MAP
      ? COLOR_MAP[page.banner.color as keyof typeof COLOR_MAP]
      : !page.banner.color
        ? "bg-primary"
        : undefined;

  const style = !mappedColor ? { backgroundColor: page.banner.color } : {};

  return (
    <div
      className={cn(
        "relative text-primary-foreground text-sm font-medium px-4 py-2 flex gap-2 items-center",
        mappedColor,
      )}
      data-pagefind-ignore="all"
      style={style}
    >
      <div className="w-full">{page.banner.message}</div>
      {page.banner.dismissible && (
        <button
          type="button"
          className="md:absolute md:right-4 -m-1.5 p-1.5 hover:bg-accent-foreground/10 rounded-md"
          onClick={() => setIsBannerOpen(false)}
        >
          <CircleXIcon size={16} />
        </button>
      )}
    </div>
  );
};
