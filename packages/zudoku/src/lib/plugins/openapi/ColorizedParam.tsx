import { useTheme } from "next-themes";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../util/cn.js";
import { pastellize } from "../../util/pastellize.js";

export const DATA_ATTR = "data-linked-param";

export const usePastellizedColor = (name: string) => {
  const { resolvedTheme } = useTheme();

  return {
    text: pastellize(
      name,
      resolvedTheme === "light" ? { saturation: 95, lightness: 38 } : {},
    ),
    background: pastellize(
      name,
      resolvedTheme === "light" ? { saturation: 85, lightness: 30 } : {},
    ),
  };
};

export const useParamColor = (name: string) => {
  const normalized = name.replace(/[{}]/g, "");
  return usePastellizedColor(normalized);
};

export const ColorizedParam = ({
  name,
  className,
  slug,
  title,
  children,
  onClick,
  alwaysOn = false,
}: {
  name: string;
  className?: string;
  backgroundOpacity?: string;
  borderOpacity?: string;
  slug?: string;
  children?: ReactNode;
  title?: string;
  alwaysOn?: boolean;
  onClick?: () => void;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const normalizedSlug = slug?.replace(/[{}]/g, "");
  const normalized = name.replace(/[{}]/g, "");
  const { text } = usePastellizedColor(normalized);

  const textColor = `hsl(${text} / 100%)`;

  useEffect(() => {
    if (alwaysOn) return;
    if (!normalizedSlug) return;
    if (!ref.current) return;

    const onMouseEnter = () => {
      document
        .querySelectorAll(`[${DATA_ATTR}="${normalizedSlug}"]`)
        .forEach((el) => {
          if (el instanceof HTMLElement) {
            el.dataset.active = "true";
          }
        });
    };
    const onMouseLeave = () => {
      document
        .querySelectorAll(`[${DATA_ATTR}="${normalizedSlug}"]`)
        .forEach((el) => {
          if (el instanceof HTMLElement) {
            el.dataset.active = "false";
          }
        });
    };

    const el = ref.current;

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [normalizedSlug, alwaysOn]);

  return (
    <span
      {...{ [DATA_ATTR]: normalizedSlug }}
      className={cn(
        "relative inline-block rounded transition-all duration-200",
        className,
        "after:absolute after:-bottom-0.5 after:left-0",
        "after:content-['']",
        !alwaysOn &&
          "after:h-0.5 after:w-full after:bg-[--param-color] after:rounded-full",
        !alwaysOn &&
          "after:transition-opacity after:duration-200 after:pointer-events-none",
        alwaysOn && "text-[--param-color]",
        "after:opacity-30 after:data-[active=true]:opacity-100",
      )}
      title={title}
      suppressHydrationWarning
      ref={ref}
      onClick={onClick}
      data-active={alwaysOn || undefined}
      style={
        {
          "--param-color": textColor,
          "--border-color": textColor,
        } as CSSProperties
      }
    >
      {children ?? name}
    </span>
  );
};
