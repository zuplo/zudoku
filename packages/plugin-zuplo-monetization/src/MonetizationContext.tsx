import { createContext, type ReactNode, use } from "react";
import type { Plan } from "./types/PlanType.js";

export type BeforeCheckoutProps = {
  /** The plan the user chose on the pricing page. */
  plan: Plan;
  /**
   * Proceed to checkout. Call this only once your own submit has succeeded —
   * no Stripe Checkout Session exists until it fires.
   */
  onComplete: () => void;
  /** Abandon the purchase and return to the pricing page. */
  onCancel: () => void;
};

export interface MonetizationConfig {
  pricing?: {
    subtitle?: string;
    title?: string;
    units?: Record<string, string>;
  };
  checkout?: {
    /**
     * Rendered on `/checkout` in place of the Stripe redirect, so questions can
     * be asked before the user reaches payment (company size, use case, …).
     *
     * Return `null` to skip straight to checkout — e.g. for a free plan, or a
     * plan that needs no qualification. Persisting the answers is the caller's
     * job: submit them wherever they belong, then call `onComplete()`. A failed
     * submit simply never calls it, so the user is never sent to Stripe.
     *
     * The route renders without the site layout, so the returned node owns the
     * full page.
     *
     * Note this gates the checkout *route*, not the metering API — treat it as
     * qualification, not as a constraint the purchase cannot proceed without.
     */
    renderBeforeCheckout?: (props: BeforeCheckoutProps) => ReactNode | null;
  };
}

export const MonetizationContext = createContext<MonetizationConfig>({});

export const useMonetizationConfig = () => use(MonetizationContext);
