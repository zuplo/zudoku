import type { SVGProps } from "react";

/**
 * Inline `Check` icon, visually identical to `lucide-react`'s `CheckIcon`
 * (path: `M20 6 9 17l-5-5`). Kept local so the module has no icon-library
 * peer dep and consumers don't need a specific lucide-react version.
 */
export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
