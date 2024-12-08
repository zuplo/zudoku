import React, {
  type ComponentType,
  type ReactElement,
  ReactNode,
  useContext,
} from "react";
import { isValidElementType } from "react-is";
import {
  type Location,
  type NavigateFunction,
  type Params,
  type SetURLSearchParams,
} from "react-router";
import { useExposedProps } from "../util/useExposedProps.js";

export type Slotlets = Record<
  string,
  ReactNode | ReactElement | ComponentType<ExposedComponentProps>
>;

const SlotletContext = React.createContext<Slotlets | undefined>({});

export const SlotletProvider = ({
  slotlets,
  children,
}: {
  children: ReactNode;
  slotlets?: Slotlets;
}) => {
  return (
    <SlotletContext.Provider value={slotlets}>
      {children}
    </SlotletContext.Provider>
  );
};

export type ExposedComponentProps = {
  location: Location;
  navigate: NavigateFunction;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  params: Params;
};

export const Slotlet = ({ name }: { name: string }) => {
  const context = useContext(SlotletContext);
  const componentOrElement = context?.[name];
  const slotletProps = useExposedProps();

  if (isValidElementType(componentOrElement)) {
    return React.createElement(componentOrElement, slotletProps);
  }

  return componentOrElement as ReactNode;
};
