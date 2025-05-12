import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "zudoku/ui/Button.js";
import { cn } from "../util/cn.js";
import { ClientOnly } from "./ClientOnly.js";

export const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <ClientOnly fallback={<Button variant="ghost" size="icon" />}>
      <button
        type="button"
        className="flex rounded-full border p-0.5 gap-0.5 group"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label={
          resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
      >
        <div
          className={cn(
            "border border-transparent rounded-full p-0.5 [&>svg>circle]:transition-colors [&>svg>path]:transition-transform transition-all [&>svg>path]:duration-200 [&>svg>circle]:duration-500 [&>svg>circle]:fill-transparent",
            resolvedTheme === "light" && "border-border bg-muted",
            resolvedTheme === "dark" &&
              "group-hover:[&>svg>path]:scale-110 group-hover:[&>svg>path]:-translate-x-[1px] group-hover:[&>svg>path]:-translate-y-[1px] group-hover:rotate-[15deg] ",
          )}
        >
          <SunIcon size={16} />
        </div>
        <div
          className={cn(
            "border border-transparent rounded-full p-0.5 transition-transform transform-gpu duration-500",
            resolvedTheme === "dark" &&
              "border-border bg-muted [&>svg>path]:fill-white [&>svg>path]:stroke-transparent",
            resolvedTheme === "light" &&
              "group-hover:rotate-[-10deg] [&>svg>path]:stroke-currentColor",
          )}
        >
          <MoonIcon size={16} />
        </div>
      </button>
    </ClientOnly>
  );
};
