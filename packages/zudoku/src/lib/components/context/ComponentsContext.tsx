import {
  createContext,
  useContext,
  type ComponentProps,
  type ComponentType,
} from "react";
import { Header } from "../Header.js";

export const DEFAULT_COMPONENTS = {
  Header,
};

export type ComponentsContextType = {
  Header?: ComponentType<ComponentProps<typeof Header>>;
};

const ComponentsContext =
  createContext<Required<ComponentsContextType>>(DEFAULT_COMPONENTS);

export const ComponentsProvider = ComponentsContext.Provider;

export const useComponents = () => {
  return useContext(ComponentsContext);
};
