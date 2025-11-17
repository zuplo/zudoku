import { cn } from "../../../util/cn.js";
import { OverflowOverlay } from "../CollapsibleCode.js";

export const NonHighlightedCode = ({
  code,
  className,
}: {
  code: string;
  className?: string;
}) => (
  <pre
    className={cn(
      "relative text-(--shiki-light) dark:text-(--shiki-dark) p-2 text-xs font-mono max-h-[250px] leading-4.5 bg-(--shiki-light-bg) dark:bg-(--shiki-dark-bg) overflow-hidden",
      className,
    )}
  >
    <code>
      {code.split("\n").length > 13 && <OverflowOverlay />}
      {code}
    </code>
  </pre>
);
