import React, { type ReactElement, ReactNode, useContext } from "react";
import { isValidElementType } from "react-is";
export type Slotlets = Record<string, ReactNode | ReactElement>;

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

export const Slotlet = ({ name }: { name: string }) => {
  const context = useContext(SlotletContext);
  const componentOrElement = context?.[name];

  if (isValidElementType(componentOrElement)) {
    return React.createElement(componentOrElement);
  }

  return componentOrElement;
};
