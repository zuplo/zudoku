import { ReactNode, useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext.js";

export const ThemeProvider = (props: { children: ReactNode }) => {
  const [dark, setDark] = useState(false);

  // On mount, read the preferred theme from the persistence
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = theme === "dark" || (!theme && prefersDark.matches);

    setDark(isDark);
  }, [dark]);

  // To toggle between dark and light modes
  const toggle = useCallback(() => {
    const toggled = !dark;
    document.documentElement.classList.toggle("dark", toggled);
    localStorage.setItem("theme", toggled ? "dark" : "light");
    setDark(toggled);
  }, [dark]);

  const value = [dark, toggle] as const;

  return <ThemeContext.Provider value={value} {...props} />;
};
