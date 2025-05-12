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
      resolvedTheme === "light" ? { saturation: 85, lightness: 40 } : {},
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
}: {
  name: string;
  className?: string;
  backgroundOpacity?: string;
  borderOpacity?: string;
  slug?: string;
  children?: ReactNode;
  title?: string;
  onClick?: () => void;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const normalizedSlug = slug?.replace(/[{}]/g, "");
  const normalized = name.replace(/[{}]/g, "");
  const { text, background } = usePastellizedColor(normalized);

  const textColor = `hsl(${text} / 100%)`;
  const backgroundColor = `hsl(${background} / 10%)`;
  const borderColor = `hsl(${background} / 50%)`;

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
        // This may not contain (inline-)flex or (inline-)block otherwise it breaks the browser's full text search
        "relative transition-all duration-100 rounded-lg",
        "border border-[--border-color] p-0.5 text-[--param-color] bg-[--background-color]",
        "data-[active=true]:border-[--param-color] data-[active=true]:shadow data-[active=true]:bottom-px",
        className,
      )}
      title={title}
      suppressHydrationWarning
      ref={ref}
      onClick={onClick}
      style={
        {
          "--param-color": textColor,
          "--border-color": borderColor,
          "--background-color": backgroundColor,
        } as CSSProperties
      }
    >
      {children ?? name}
    </span>
  );
};
