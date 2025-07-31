import {
  type ComponentProps,
  type ComponentType,
  createContext,
  useContext,
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
