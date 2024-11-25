import { useTheme } from "next-themes";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../util/cn.js";
import { pastellize } from "../../util/pastellize.js";

export const DATA_ATTR = "data-linked-param";

export const usePastellizedColor = (name: string) => {
  const { theme } = useTheme();
  return pastellize(
    name,
    theme === "light" ? { saturation: 85, lightness: 50 } : undefined,
  );
};

export const ColorizedParam = ({
  name,
  className,
  backgroundOpacity = "100%",
  borderOpacity = "100%",
  slug,
  children,
  onClick,
}: {
  name: string;
  className?: string;
  backgroundOpacity?: string;
  borderOpacity?: string;
  slug?: string;
  children?: ReactNode;
  onClick?: () => void;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const normalized = name.replace(/[{}]/g, "");
  const normalizedSlug = slug?.replace(/[{}]/g, "");
  const color = usePastellizedColor(normalized);

  const borderColor = `hsl(${color} / ${borderOpacity})`;
  const backgroundColor = `hsl(${color} / ${backgroundOpacity})`;

  useEffect(() => {
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
  }, [normalizedSlug]);

  return (
    <span
      {...{ [DATA_ATTR]: normalizedSlug }}
      className={cn(
        "relative after:rounded after:absolute after:inset-0 after:-bottom-0.5 after:border-b-2 after:transition-opacity after:duration-200",
        "after:pointer-events-none after:border-[--border-color] after:opacity-30 after:data-[active=true]:opacity-100",
        className,
      )}
      ref={ref}
      onClick={onClick}
      style={
        {
          "--border-color": borderColor,
          "--background-color": backgroundColor,
        } as CSSProperties
      }
    >
      {children ?? name}
    </span>
  );
};
