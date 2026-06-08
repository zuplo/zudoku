import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

type NavigationFilterContextType = {
  query: string;
  setQuery: (query: string) => void;
};

const NavigationFilterContext = createContext<NavigationFilterContextType>({
  query: "",
  setQuery: () => {},
});

// Clear the filter when the active section or frame changes (`resetKey`). This
// is React's "adjust state during render" pattern: the previous key lives in
// state (not a ref) so it's concurrent-safe, and the reset runs in render rather
// than an effect so results never lag a frame and the nav subtree isn't
// remounted, which would kill the slide animation.
export const NavigationFilterProvider = ({
  resetKey,
  children,
}: PropsWithChildren<{ resetKey?: string }>) => {
  const [query, setQuery] = useState("");
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    if (query !== "") setQuery("");
  }

  return (
    <NavigationFilterContext.Provider value={{ query, setQuery }}>
      {children}
    </NavigationFilterContext.Provider>
  );
};

export const useNavigationFilter = () => useContext(NavigationFilterContext);
