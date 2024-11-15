import React from "react";
import { ProseClasses } from "../../components/Markdown.js";
import { cn } from "../../util/cn.js";
import { useExposedProps } from "../../util/useExposedProps.js";
import type { CustomPageConfig } from "./index.js";

export const CustomPage = ({
  element,
  render,
  prose = true,
}: Omit<CustomPageConfig, "path">) => {
  const exposedProps = useExposedProps();
  const content = render ? React.createElement(render, exposedProps) : element;

  return (
    <div className={cn(prose && ProseClasses, "max-w-full")}>{content}</div>
  );
};
