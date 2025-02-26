import type { PropsWithChildren } from "react";
import "./Stepper.css";

const Stepper = ({ children }: PropsWithChildren) => {
  return <div className="stepper">{children}</div>;
};

export { Stepper };
