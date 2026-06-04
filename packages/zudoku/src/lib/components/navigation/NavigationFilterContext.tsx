import {
  createContext,
  type PropsWithChildren,
  useContext,
  useRef,
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

// `resetKey` changes when the active section changes. We reset the filter query
// during render (instead of remounting via a `key`) so the surrounding
// navigation subtree — and its slide animation — survives section changes.
export const NavigationFilterProvider = ({
  resetKey,
  children,
}: PropsWithChildren<{ resetKey?: string }>) => {
  const [query, setQuery] = useState("");
  const prevResetKey = useRef(resetKey);

  if (prevResetKey.current !== resetKey) {
    prevResetKey.current = resetKey;
    if (query !== "") setQuery("");
  }

  return (
    <NavigationFilterContext.Provider value={{ query, setQuery }}>
      {children}
    </NavigationFilterContext.Provider>
  );
};

export const useNavigationFilter = () => useContext(NavigationFilterContext);
