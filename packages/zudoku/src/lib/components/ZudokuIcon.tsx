import { Icon as IconifyIcon, iconLoaded } from "@iconify/react";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { MissingIcon } from "../MissingIcon.js";
import { parseIconName } from "../util/iconName.js";

// Runtime API fetch (api.iconify.design) is a dev convenience. In production it's off by
// default — unresolved icons render the MissingIcon fallback. `icons.runtimeFetch: true`
// in the config opts prod back in (wired via `configureIconRuntimeFetch`).
let runtimeFetchOverride: boolean | undefined;

export const configureIconRuntimeFetch = (enabled?: boolean) => {
  runtimeFetchOverride = enabled;
};

const runtimeFetchAllowed = () => runtimeFetchOverride ?? import.meta.env.DEV;

export type IconInput = string | LucideIcon;

export type ZudokuIconProps = Omit<
  ComponentProps<typeof IconifyIcon>,
  "icon"
> & {
  icon: IconInput;
  size?: number;
};

/**
 * Renders an icon from either an iconify `prefix:name` string (registered at build time
 * via the per-icon virtual modules) or a legacy lucide component reference. String icons
 * are the supported path; component refs are accepted for backwards compatibility.
 */
export const Icon = ({
  icon,
  size = 16,
  width,
  height,
  className,
  ...props
}: ZudokuIconProps) => {
  // A falsy ref (e.g. lucide's `iconNode` API, where `icon` is undefined) would crash React
  // with "Element type is invalid".
  if (!icon) return null;

  if (typeof icon !== "string") {
    const LegacyIcon = icon;
    // Forward the full prop surface so component icons match the string path, not just
    // size/className. Lucide components accept SVG props.
    return (
      <LegacyIcon
        size={size}
        width={width}
        height={height}
        className={className}
        {...props}
      />
    );
  }

  const name = parseIconName(icon).id;

  if (!iconLoaded(name) && !runtimeFetchAllowed()) {
    return <MissingIcon name={name} size={size} className={className} />;
  }

  return (
    <IconifyIcon
      ssr
      icon={name}
      // A single explicit dimension mirrors to the other so the icon stays square;
      // both fall back to `size`.
      width={width ?? height ?? size}
      height={height ?? width ?? size}
      className={className}
      {...props}
    />
  );
};
