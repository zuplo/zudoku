import { MoonIcon, MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "zudoku/ui/Button.js";
import { cn } from "../util/cn.js";
import { ClientOnly } from "./ClientOnly.js";

export const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === "dark" ? MoonStarIcon : SunIcon;

  return (
    <ClientOnly fallback={<Button variant="ghost" size="icon" />}>
      <button
        type="button"
        className="flex rounded-xl border p-0.5 gap-0.5 group"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label={
          resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
      >
        <div
          className={cn(
            " rounded-full p-0.5 [&>svg>circle]:transition-colors [&>svg>circle]:duration-500 [&>svg>circle]:fill-transparent",
            resolvedTheme === "light" && "border bg-muted/50",
            resolvedTheme === "dark" &&
              "group-hover:[&>svg>circle]:fill-primary",
          )}
        >
          <SunIcon size={16} />
        </div>
        <div
          className={cn(
            "rounded-full p-0.5 transition-all transform duration-500 ",
            resolvedTheme === "dark" &&
              "border bg-card [&>svg>path]:fill-white",
            resolvedTheme === "light" && "group-hover:rotate-[-10deg]",
          )}
        >
          <MoonIcon size={16} />
        </div>
      </button>
    </ClientOnly>
  );
};
