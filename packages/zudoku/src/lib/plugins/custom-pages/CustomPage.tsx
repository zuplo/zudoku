import React from "react";
import { cn } from "../../util/cn.js";
import { useExposedProps } from "../../util/useExposedProps.js";
import type { CustomPageConfig } from "./index.js";

export const CustomPage = ({
  element,
  render,
  prose = true,
}: Omit<CustomPageConfig, "path">) => {
  const slotletProps = useExposedProps();
  const content = render ? React.createElement(render, slotletProps) : element;

  return <div className={cn(prose && "prose max-w-full")}>{content}</div>;
};
