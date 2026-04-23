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
  const { options } = useZudoku();
  const { site } = options;
  const [isBannerOpen, setIsBannerOpen] = useState(true);

  if (!site?.banner || !isBannerOpen) {
    return <style>{`:root { --banner-height: 0px; }`}</style>;
  }

  const mappedColor =
    site.banner.color && site.banner.color in COLOR_MAP
      ? COLOR_MAP[site.banner.color as keyof typeof COLOR_MAP]
      : !site.banner.color
        ? "bg-primary"
        : undefined;

  const style = !mappedColor ? { backgroundColor: site.banner.color } : {};

  return (
    <div
      className={cn(
        "relative text-primary-foreground text-sm font-medium px-4 py-2 flex gap-2 items-center lg:h-(--banner-height)",
        mappedColor,
      )}
      style={style}
    >
      <div className="w-full">{site.banner.message}</div>
      {site.banner.dismissible && (
        <button
          type="button"
          className="md:absolute md:end-4 -m-1.5 p-1.5 hover:bg-accent-foreground/10 rounded-md"
          onClick={() => setIsBannerOpen(false)}
        >
          <CircleXIcon size={16} />
        </button>
      )}
    </div>
  );
};
