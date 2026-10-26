import {
  AlertTriangleIcon,
  InfoIcon,
  LightbulbIcon,
  LockIcon,
  type LucideIcon,
  MegaphoneIcon,
  RocketIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useId } from "react";
import { cn } from "../util/cn.js";

const typeMap = {
  note: { color: "var(--callout-note)", Icon: InfoIcon as LucideIcon },
  tip: { color: "var(--callout-tip)", Icon: LightbulbIcon as LucideIcon },
  info: { color: "var(--callout-info)", Icon: InfoIcon as LucideIcon },
  caution: {
    color: "var(--callout-caution)",
    Icon: AlertTriangleIcon as LucideIcon,
  },
  danger: {
    color: "var(--callout-danger)",
    Icon: ShieldAlertIcon as LucideIcon,
  },
  sparkles: {
    color: "var(--callout-sparkles)",
    Icon: SparklesIcon as LucideIcon,
  },
  rocket: {
    color: "var(--callout-rocket)",
    Icon: RocketIcon as LucideIcon,
  },
  settings: {
    color: "var(--callout-settings)",
    Icon: SettingsIcon as LucideIcon,
  },
  zap: { color: "var(--callout-zap)", Icon: ZapIcon as LucideIcon },
  lock: { color: "var(--callout-lock)", Icon: LockIcon as LucideIcon },
  megaphone: {
    color: "var(--callout-megaphone)",
    Icon: MegaphoneIcon as LucideIcon,
  },
} as const;

type CalloutProps = {
  type: keyof typeof typeMap;
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: boolean | ReactNode;
};

export const Callout = ({
  type,
  children,
  title,
  className,
  icon = true,
}: CalloutProps) => {
  const { color, Icon } = typeMap[type];
  const titleId = useId();

  const style = {
    "--callout-color": color,
    backgroundColor:
      "color-mix(in oklab, var(--callout-color) 6%, var(--background))",
    borderColor: "color-mix(in oklab, var(--callout-color) 25%, transparent)",
  } as CSSProperties;

  const headingColor =
    "color-mix(in oklab, var(--callout-color) 70%, var(--foreground))";

  return (
    <div
      role="note"
      aria-labelledby={title ? titleId : undefined}
      style={style}
      className={cn(
        "not-prose rounded-xl border px-4 py-3 flex gap-3 text-sm my-3 text-foreground",
        "[&_a]:underline [&_a]:decoration-current [&_a]:decoration-from-font [&_a]:underline-offset-4 hover:[&_a]:decoration-1",
        "[&_.code-block-wrapper]:border",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-4 [&_ul>li]:ps-1 [&_ul>li]:my-1",
        className,
      )}
    >
      {!icon ? null : icon === true ? (
        <Icon
          className="shrink-0 mt-0.5"
          style={{ color: "var(--callout-color)" }}
          size={18}
          aria-hidden="true"
        />
      ) : (
        <span
          aria-hidden="true"
          className="shrink-0 mt-0.5 inline-flex items-center justify-center size-[18px] [&_svg]:size-full"
          style={{ color: "var(--callout-color)" }}
        >
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {title && (
          <p
            id={titleId}
            className="font-medium leading-snug"
            style={{ color: headingColor }}
          >
            {title}
          </p>
        )}
        <div className="overflow-x-auto leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
