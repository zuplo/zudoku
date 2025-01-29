import { MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "zudoku/ui/Button.js";
import { ClientOnly } from "./ClientOnly.js";

export const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === "dark" ? MoonStarIcon : SunIcon;

  return (
    <ClientOnly fallback={<Button variant="ghost" size="icon" />}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={
          resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <ThemeIcon size={18} />
      </Button>
    </ClientOnly>
  );
};
