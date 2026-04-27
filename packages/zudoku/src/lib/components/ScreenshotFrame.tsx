import { cva } from "class-variance-authority";
import type { CSSProperties, PropsWithChildren } from "react";
import { cn } from "../util/cn.js";

export type ScreenshotFramePosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  /** Flush to the bottom; gradient on the top and sides. */
  | "bottom"
  /** Flush to the start edge (left in LTR); gradient on the top, end, and bottom. */
  | "left"
  /** Flush to the end edge (right in LTR); gradient on the top, start, and bottom. */
  | "right";

/** Preset mesh gradients. Use `"primary"` with `primaryColor` for a theme derived from your brand color. */
export type ScreenshotFrameTheme =
  | "primary"
  | "ocean"
  | "sunset"
  | "neon"
  | "aurora"
  | "forest"
  | "twilight"
  | "rose";

/**
 * Gutter scales with frame width (via `cqi` on the container wrapper): stays modest on small
 * frames and grows on large ones, clamped for readability.
 */
const SF_GUTTER = "clamp(0.25rem, 8cqi, 4rem)";

function framePadding(position: ScreenshotFramePosition): CSSProperties {
  const g = SF_GUTTER;
  const symmetric = { paddingInline: g, paddingBlock: g } as const;
  switch (position) {
    case "center":
      return { padding: g };
    case "top-left":
    case "top-right":
      return { paddingTop: 0, paddingBottom: g, paddingInline: g };
    case "bottom-left":
    case "bottom-right":
    case "bottom":
      return { paddingBottom: 0, paddingTop: g, paddingInline: g };
    case "left":
    case "right":
      return { ...symmetric };
    default:
      return {};
  }
}

const frameLayout = cva(
  "flex w-full overflow-hidden rounded-2xl md:rounded-[1.125rem]",
  {
    variants: {
      position: {
        center: "items-center justify-center",
        "top-left": "items-start justify-start",
        "top-right": "items-start justify-end",
        "bottom-left": "items-end justify-start",
        "bottom-right": "items-end justify-end",
        bottom: "items-end justify-center",
        left: "items-center justify-start",
        right: "items-center justify-end",
      },
      aspect: {
        "4/3": "aspect-[4/3]",
        auto: "min-h-56 sm:min-h-64 md:min-h-72",
      },
    },
    defaultVariants: {
      position: "bottom-right",
      aspect: "4/3",
    },
  },
);

/** Rounded only on sides that sit against the gradient (flush block edge stays square). */
const innerRadius = cva("", {
  variants: {
    position: {
      center: "rounded-[14px]",
      "bottom-right": "rounded-ss-[14px] rounded-se-[14px] rounded-es-[14px]",
      "bottom-left": "rounded-ss-[14px] rounded-se-[14px] rounded-ee-[14px]",
      "top-left": "rounded-se-[14px] rounded-es-[14px] rounded-ee-[14px]",
      "top-right": "rounded-ss-[14px] rounded-es-[14px] rounded-ee-[14px]",
      bottom: "rounded-ss-[14px] rounded-se-[14px]",
      left: "rounded-[14px]",
      right: "rounded-[14px]",
    },
  },
  defaultVariants: { position: "bottom-right" },
});

function parseHexColor(
  hex: string,
): { b: number; g: number; r: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (![3, 6].includes(normalized.length)) {
    return null;
  }
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) {
    return null;
  }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; l: number; s: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/** Builds a multi-stop mesh gradient and base fill from a single hex brand color. */
export function meshStyleFromPrimary(hex: string): {
  backgroundColor: string;
  backgroundImage: string;
} {
  const rgb = parseHexColor(hex);
  if (!rgb) {
    return meshStyleFromPrimary("#3b82f6");
  }
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const h1 = h;
  const h2 = wrapHue(h + 52);
  const h3 = wrapHue(h - 42);
  const h4 = wrapHue(h + 118);
  const sat = Math.min(100, s + 12);
  const satSoft = Math.max(35, s * 0.55);
  const backgroundImage = [
    `radial-gradient(ellipse 85% 65% at 100% 0%, ${hsl(h2, Math.min(95, sat + 8), Math.min(72, l + 18))} 0%, transparent 55%)`,
    `radial-gradient(ellipse 75% 55% at 0% 0%, ${hsl(h1, Math.min(100, sat + 18), Math.max(22, l - 12))} 0%, transparent 52%)`,
    `radial-gradient(ellipse 70% 58% at 0% 100%, ${hsl(h3, Math.min(92, sat + 22), Math.min(78, l + 22))} 0%, transparent 50%)`,
    `radial-gradient(ellipse 88% 72% at 100% 100%, ${hsl(h4, satSoft, Math.min(94, l + 38))} 0%, transparent 48%)`,
    `linear-gradient(140deg, ${hsl(wrapHue(h - 8), sat * 0.65, Math.max(18, l * 0.42))} 0%, ${hsl(wrapHue(h + 35), sat * 0.55, Math.max(22, l * 0.48))} 100%)`,
  ].join(", ");
  const backgroundColor = hsl(
    h,
    Math.min(55, sat * 0.75),
    Math.max(14, l * 0.32),
  );
  return { backgroundColor, backgroundImage };
}

const PRESET_MESH: Record<Exclude<ScreenshotFrameTheme, "primary">, string> = {
  ocean: [
    `radial-gradient(ellipse 82% 62% at 100% 0%, hsl(195 100% 56%) 0%, transparent 56%)`,
    `radial-gradient(ellipse 72% 52% at 0% 0%, hsl(232 78% 26%) 0%, transparent 52%)`,
    `radial-gradient(ellipse 68% 56% at 0% 100%, hsl(320 88% 58%) 0%, transparent 52%)`,
    `radial-gradient(ellipse 90% 70% at 100% 100%, hsl(215 28% 91%) 0%, transparent 52%)`,
    `linear-gradient(142deg, hsl(238 58% 32%) 0%, hsl(285 45% 38%) 100%)`,
  ].join(", "),
  sunset: [
    `radial-gradient(ellipse 80% 60% at 100% 0%, hsl(28 96% 58%) 0%, transparent 55%)`,
    `radial-gradient(ellipse 70% 55% at 0% 20%, hsl(340 82% 52%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 65% 55% at 0% 100%, hsl(265 70% 48%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 85% 68% at 100% 100%, hsl(45 95% 72%) 0%, transparent 48%)`,
    `linear-gradient(135deg, hsl(310 55% 28%) 0%, hsl(20 75% 38%) 100%)`,
  ].join(", "),
  neon: [
    `radial-gradient(ellipse 78% 58% at 100% 0%, hsl(300 100% 62%) 0%, transparent 54%)`,
    `radial-gradient(ellipse 72% 52% at 0% 0%, hsl(190 100% 48%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 68% 56% at 0% 100%, hsl(265 95% 55%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 88% 70% at 100% 100%, hsl(165 85% 45%) 0%, transparent 46%)`,
    `linear-gradient(145deg, hsl(255 65% 22%) 0%, hsl(195 80% 28%) 100%)`,
  ].join(", "),
  aurora: [
    `radial-gradient(ellipse 80% 58% at 0% 0%, hsl(160 72% 42%) 0%, transparent 54%)`,
    `radial-gradient(ellipse 75% 55% at 100% 10%, hsl(195 85% 48%) 0%, transparent 52%)`,
    `radial-gradient(ellipse 70% 55% at 100% 100%, hsl(175 70% 46%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 82% 65% at 0% 100%, hsl(130 55% 40%) 0%, transparent 48%)`,
    `linear-gradient(140deg, hsl(200 50% 18%) 0%, hsl(165 45% 22%) 100%)`,
  ].join(", "),
  forest: [
    `radial-gradient(ellipse 78% 56% at 0% 0%, hsl(95 55% 36%) 0%, transparent 54%)`,
    `radial-gradient(ellipse 72% 52% at 100% 0%, hsl(145 48% 38%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 68% 54% at 100% 100%, hsl(85 60% 42%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 85% 68% at 0% 100%, hsl(35 45% 52%) 0%, transparent 46%)`,
    `linear-gradient(135deg, hsl(120 40% 14%) 0%, hsl(95 38% 18%) 100%)`,
  ].join(", "),
  twilight: [
    `radial-gradient(ellipse 80% 58% at 100% 0%, hsl(258 62% 58%) 0%, transparent 54%)`,
    `radial-gradient(ellipse 74% 54% at 0% 0%, hsl(230 55% 38%) 0%, transparent 52%)`,
    `radial-gradient(ellipse 68% 54% at 0% 100%, hsl(310 48% 52%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 86% 68% at 100% 100%, hsl(245 35% 78%) 0%, transparent 48%)`,
    `linear-gradient(138deg, hsl(250 45% 20%) 0%, hsl(280 40% 26%) 100%)`,
  ].join(", "),
  rose: [
    `radial-gradient(ellipse 78% 56% at 100% 0%, hsl(350 82% 72%) 0%, transparent 54%)`,
    `radial-gradient(ellipse 72% 52% at 0% 10%, hsl(330 55% 48%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 70% 56% at 0% 100%, hsl(15 75% 62%) 0%, transparent 50%)`,
    `radial-gradient(ellipse 88% 70% at 100% 100%, hsl(40 90% 88%) 0%, transparent 48%)`,
    `linear-gradient(135deg, hsl(320 42% 24%) 0%, hsl(350 48% 30%) 100%)`,
  ].join(", "),
};

const PRESET_BASE: Record<Exclude<ScreenshotFrameTheme, "primary">, string> = {
  ocean: "hsl(232 45% 18%)",
  sunset: "hsl(300 40% 16%)",
  neon: "hsl(255 55% 14%)",
  aurora: "hsl(200 48% 14%)",
  forest: "hsl(115 38% 12%)",
  twilight: "hsl(255 48% 16%)",
  rose: "hsl(325 42% 18%)",
};

function frameBackground(
  theme: ScreenshotFrameTheme,
  primaryColor: string,
): Pick<CSSProperties, "backgroundColor" | "backgroundImage"> {
  if (theme === "primary") {
    return meshStyleFromPrimary(primaryColor);
  }
  return {
    backgroundColor: PRESET_BASE[theme],
    backgroundImage: PRESET_MESH[theme],
  };
}

export const ScreenshotFrame = ({
  aspect = "4/3",
  caption,
  children,
  className,
  position = "bottom-right",
  primaryColor = "#3b82f6",
  theme = "ocean",
}: PropsWithChildren<{
  /** Outer frame proportions. `"4/3"` matches common marketing shots; `"auto"` grows from content. */
  aspect?: "4/3" | "auto";
  caption?: string;
  className?: string;
  position?: ScreenshotFramePosition;
  /** Used when `theme` is `"primary"` (hex, e.g. `#3b82f6`). */
  primaryColor?: string;
  theme?: ScreenshotFrameTheme;
}>) => {
  const bg = frameBackground(theme, primaryColor);

  const frameStyle: CSSProperties = {
    ...bg,
    ...framePadding(position),
  };

  return (
    <figure className={cn("not-prose w-full", className)}>
      <div className="w-full [container-type:inline-size]">
        <div className={frameLayout({ aspect, position })} style={frameStyle}>
          <div
            className={cn(
              innerRadius({ position }),
              "max-h-full max-w-full min-w-0 overflow-hidden",
              "shadow-[0_28px_64px_-14px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.1)]",
              "[&_img]:block [&_img]:h-auto [&_img]:max-h-full [&_img]:max-w-full [&_img]:object-contain",
            )}
          >
            {children}
          </div>
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
};
