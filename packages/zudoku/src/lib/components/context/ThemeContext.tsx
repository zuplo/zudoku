import { createContext, useContext } from "react";

export const ThemeContext = createContext<readonly [boolean, () => void]>([
  false,
  () => {},
]);

export const useTheme = () => useContext(ThemeContext);
