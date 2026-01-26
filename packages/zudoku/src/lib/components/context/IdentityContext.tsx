import { createContext, useContext } from "react";
import { Outlet } from "react-router";
import type { ApiIdentityContext } from "zudoku/plugins";

export const IdentityContext = createContext<ApiIdentityContext | undefined>(
  undefined,
);

export const IdentityContextProvider = ({
  value,
}: {
  value: ApiIdentityContext;
}) => {
  return (
    <IdentityContext.Provider value={value}>
      <Outlet />
    </IdentityContext.Provider>
  );
};

export const useIdentityContext = () => {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error(
      "useIdentityContext must be used within a IdentityContextProvider.",
    );
  }
  return context;
};
