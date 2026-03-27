import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn.js";
import { pastellize } from "../lib/pastellize.js";

export const DATA_ATTR = "data-linked-param";

const getResolvedTheme = () => {
  if (typeof document === "undefined") return "dark";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const subscribe = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", callback);
  };
};

const useResolvedTheme = () =>
  useSyncExternalStore(subscribe, getResolvedTheme, () => "dark");

export const usePastellizedColor = (name: string) => {
  const resolvedTheme = useResolvedTheme();

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
    // biome-ignore lint/a11y/noStaticElementInteractions: Just passing props through
    // biome-ignore lint/a11y/useKeyWithClickEvents: Just passing props through
    <span
      {...{ [DATA_ATTR]: normalizedSlug }}
      className={cn(
        // This may not contain (inline-)flex or (inline-)block otherwise it breaks the browser's full text search
        "relative transition-all duration-100 rounded-lg",
        "border border-(--border-color) p-0.5 text-(--param-color) bg-(--background-color)",
        "data-[active=true]:border-(--param-color) data-[active=true]:shadow-sm data-[active=true]:bottom-px",
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
