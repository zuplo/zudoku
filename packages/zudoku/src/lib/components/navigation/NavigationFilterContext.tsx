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

export const NavigationFilterProvider = ({ children }: PropsWithChildren) => {
  const [query, setQuery] = useState("");

  return (
    <NavigationFilterContext.Provider value={{ query, setQuery }}>
      {children}
    </NavigationFilterContext.Provider>
  );
};

export const useNavigationFilter = () => useContext(NavigationFilterContext);
