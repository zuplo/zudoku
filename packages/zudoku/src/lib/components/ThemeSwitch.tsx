import { MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "zudoku/ui/Button.js";
import { ClientOnly } from "./ClientOnly.js";

export const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === "dark" ? MoonStarIcon : SunIcon;

  return (
    <ClientOnly>
      <Button
        variant="ghost"
        aria-label={
          resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
        className="p-2.5 -m-2.5 rounded-full"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <ThemeIcon size={18} />
      </Button>
    </ClientOnly>
  );
};
