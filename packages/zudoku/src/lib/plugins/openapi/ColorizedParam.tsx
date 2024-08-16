import { useEffect, useRef, type ReactNode } from "react";
import { useTheme } from "../../components/context/ThemeContext.js";
import { cn } from "../../util/cn.js";
import { pastellize } from "../../util/pastellize.js";

export const DATA_ATTR = "data-linked-param";

export const usePastellizedColor = (name: string) => {
  const [isDark] = useTheme();
  return pastellize(
    name,
    !isDark ? { saturation: 85, lightness: 50 } : undefined,
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

    ref.current.addEventListener("mouseenter", onMouseEnter);
    ref.current.addEventListener("mouseleave", onMouseLeave);

    return () => {
      ref.current?.removeEventListener("mouseenter", onMouseEnter);
      ref.current?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [normalizedSlug]);

  return (
    <span
      className={cn("inline-flex relative rounded group", className)}
      {...{ [DATA_ATTR]: normalizedSlug }}
      ref={ref}
      onClick={onClick}
    >
      <span
        className="absolute inset-0 border-b-2 transition-opacity duration-200 opacity-30 group-data-[active=true]:opacity-100"
        style={{ borderColor, backgroundColor }}
      />
      <span className="relative">{children ?? name}</span>
    </span>
  );
};
