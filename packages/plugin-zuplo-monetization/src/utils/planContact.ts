import type { Plan } from "../types/PlanType.js";

export const DEFAULT_CONTACT_LABEL = "Contact Sales";

export type PlanContact = {
  /** Ready-to-use href: an absolute URL, a `mailto:` link, or an in-app path. */
  href: string;
  label: string;
  /** Absolute http(s) target, i.e. one that should open in a new tab. */
  isExternal: boolean;
};

// Bare-email detection without a regex: an `a@b.c` pattern expressed as
// `[^\s@]+@[^\s@]+\.[^\s@]+` backtracks polynomially (the character class
// matches `.` too), and the input is operator-supplied metadata.
const isBareEmail = (target: string) => {
  if (/\s/.test(target)) return false;
  const parts = target.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return (
    local !== "" &&
    domain.includes(".") &&
    !domain.startsWith(".") &&
    !domain.endsWith(".")
  );
};

const trimmed = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

// Only schemes that cannot execute script are accepted. Plan metadata is
// authored in the Zuplo dashboard, but it ends up in an `href`, so
// `javascript:` / `data:` targets are dropped rather than rendered. A
// protocol-relative `//host` target is dropped too: it looks in-app but
// navigates off-site.
const toHref = (target: string) => {
  // Scheme first: `mailto:sales@acme.com` also satisfies the bare-email shape.
  if (/^(https?:|mailto:)/i.test(target)) return target;
  if (isBareEmail(target)) return `mailto:${target}`;
  if (/^[/#]/.test(target) && !target.startsWith("//")) return target;
  return undefined;
};

/**
 * Contact target for a plan sold through sales rather than self-serve checkout
 * (see `isCustomPlan`), read from the plan's metadata:
 *
 * - `contactUrl` — an absolute URL, a bare email address (turned into a
 *   `mailto:` link), or an in-app path such as `/contact`
 * - `contactLabel` — CTA text, defaults to `"Contact Sales"`
 *
 * Returns `undefined` when no usable target is configured, so call sites can
 * fall back instead of rendering a CTA that goes nowhere.
 */
export const getPlanContact = (
  plan: Pick<Plan, "metadata">,
): PlanContact | undefined => {
  const target = trimmed(plan.metadata?.contactUrl);
  if (!target) return undefined;

  const href = toHref(target);
  if (!href) return undefined;

  return {
    href,
    label: trimmed(plan.metadata?.contactLabel) ?? DEFAULT_CONTACT_LABEL,
    isExternal: /^https?:/i.test(href),
  };
};
