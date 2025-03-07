import type { PropsWithChildren } from "react";

// "stepper" class is defined in main.css
const Stepper = ({ children }: PropsWithChildren) => {
  return <div className="stepper">{children}</div>;
};

export { Stepper };
