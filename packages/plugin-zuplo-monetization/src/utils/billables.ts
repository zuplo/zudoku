import type { Subscription } from "../types/SubscriptionType.js";

export const getActivePhase = (sub: Subscription) => {
  const now = Date.now();
  return sub.phases
    .filter(
      (p) =>
        new Date(p.activeFrom).getTime() <= now &&
        (!p.activeTo || new Date(p.activeTo).getTime() >= now),
    )
    .sort(
      (a, b) =>
        new Date(b.activeFrom).getTime() - new Date(a.activeFrom).getTime(),
    )[0];
};

export const activePhaseHasBillables = (sub: Subscription) =>
  getActivePhase(sub)?.items.some((i) => i.price != null) ?? false;

export const hasFutureBillables = (sub: Subscription) => {
  const now = Date.now();
  return sub.phases
    .filter((p) => new Date(p.activeFrom).getTime() > now)
    .some((p) => p.items.some((i) => i.price != null));
};
