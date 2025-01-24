import { MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "zudoku/ui/Button.js";
import { cn } from "../util/cn.js";

export const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === "dark" ? MoonStarIcon : SunIcon;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className={cn(!resolvedTheme && "opacity-0")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <ThemeIcon size={18} />
    </Button>
  );
};
