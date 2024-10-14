import React, {
  type ComponentType,
  type ReactElement,
  ReactNode,
  useContext,
} from "react";
import { isValidElementType } from "react-is";
import { useLocation } from "react-router-dom";
export type Slotlets = Record<
  string,
  ReactNode | ReactElement | ComponentType<SlotletComponentProps>
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

export type SlotletComponentProps = {
  location: Location;
};

export const Slotlet = ({ name }: { name: string }) => {
  const context = useContext(SlotletContext);
  const componentOrElement = context?.[name];
  const location = useLocation();

  if (isValidElementType(componentOrElement)) {
    return React.createElement(componentOrElement, {
      location,
    });
  }

  return componentOrElement as ReactNode;
};
