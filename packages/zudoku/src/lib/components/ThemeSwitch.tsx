import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../util/cn.js";
import { useIsClient } from "./ClientOnly.js";

export const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  const theme = isClient ? resolvedTheme : undefined;

  return (
    <button
      type="button"
      className="flex rounded-full border p-0.5 gap-0.5 group"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={
        !isClient
          ? "Toggle theme"
          : theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
    >
      <div
        className={cn(
          "rounded-full p-0.5 border border-transparent [&>svg>circle]:transition-colors [&>svg>path]:transition-transform transition-all [&>svg>path]:duration-200 [&>svg>circle]:duration-500 [&>svg>circle]:fill-transparent",
          theme === "light" && "border-border bg-muted",
          theme === "dark" &&
            "group-hover:[&>svg>path]:scale-110 group-hover:[&>svg>path]:-translate-x-px group-hover:[&>svg>path]:-translate-y-px group-hover:rotate-15",
        )}
      >
        <SunIcon size={16} />
      </div>
      <div
        className={cn(
          "rounded-full p-0.5 border border-transparent transition-transform transform-gpu duration-500",
          theme === "dark" &&
            "border-border bg-muted [&>svg>path]:fill-white [&>svg>path]:stroke-transparent",
          theme === "light" &&
            "group-hover:rotate-[-10deg] [&>svg>path]:stroke-currentColor",
        )}
      >
        <MoonIcon size={16} />
      </div>
    </button>
  );
};
