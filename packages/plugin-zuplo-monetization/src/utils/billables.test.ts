import { afterEach, describe, expect, it, vi } from "vitest";
import type { Subscription } from "../types/SubscriptionType.js";
import {
  activePhaseHasBillables,
  getActivePhase,
  hasFutureBillables,
} from "./billables.js";

type SubPhase = Subscription["phases"][number];

const phase = (o: {
  key: string;
  activeFrom: string;
  activeTo?: string;
  items?: Array<{ price?: unknown }>;
}): SubPhase =>
  ({
    activeFrom: o.activeFrom,
    activeTo: o.activeTo,
    createdAt: o.activeFrom,
    id: `phase-${o.key}`,
    itemTimelines: {},
    items: o.items ?? [],
    key: o.key,
    metadata: {},
    name: o.key,
    updatedAt: o.activeFrom,
  }) as unknown as SubPhase;

const sub = (phases: SubPhase[]): Subscription =>
  ({ phases }) as unknown as Subscription;

// A two-phase ramp mirroring an intro-discount subscription: 3 months of
// intro pricing, then a steady phase with no end.
const rampPhases = () => [
  phase({
    key: "intro",
    activeFrom: "2026-06-04T00:00:00.000Z",
    activeTo: "2026-09-04T00:00:00.000Z",
    items: [{ price: { type: "flat", amount: "375" } }],
  }),
  phase({
    key: "steady",
    activeFrom: "2026-09-04T00:00:00.000Z",
    items: [{ price: { type: "flat", amount: "750" } }],
  }),
];

const setNow = (iso: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
};

afterEach(() => {
  vi.useRealTimers();
});

describe("getActivePhase", () => {
  it("returns the phase whose window contains now (intro phase)", () => {
    setNow("2026-07-15T00:00:00.000Z");
    expect(getActivePhase(sub(rampPhases()))?.key).toBe("intro");
  });

  it("returns the steady phase once the intro window has passed", () => {
    setNow("2026-10-01T00:00:00.000Z");
    expect(getActivePhase(sub(rampPhases()))?.key).toBe("steady");
  });

  it("picks the later-starting phase at the exact transition boundary", () => {
    // At the boundary both windows match (activeTo and activeFrom are
    // inclusive); the latest activeFrom must win so the new phase's
    // pricing shows from the moment it starts.
    setNow("2026-09-04T00:00:00.000Z");
    expect(getActivePhase(sub(rampPhases()))?.key).toBe("steady");
  });

  it("returns undefined before the first phase starts", () => {
    setNow("2026-01-01T00:00:00.000Z");
    expect(getActivePhase(sub(rampPhases()))).toBeUndefined();
  });

  it("returns undefined when every phase has ended", () => {
    setNow("2026-12-01T00:00:00.000Z");
    const ended = [
      phase({
        key: "intro",
        activeFrom: "2026-06-04T00:00:00.000Z",
        activeTo: "2026-09-04T00:00:00.000Z",
      }),
    ];
    expect(getActivePhase(sub(ended))).toBeUndefined();
  });
});

describe("activePhaseHasBillables", () => {
  it("is true only when the active phase has priced items", () => {
    setNow("2026-07-15T00:00:00.000Z");
    expect(activePhaseHasBillables(sub(rampPhases()))).toBe(true);

    const freeIntro = [
      phase({
        key: "intro",
        activeFrom: "2026-06-04T00:00:00.000Z",
        activeTo: "2026-09-04T00:00:00.000Z",
        items: [{ price: undefined }],
      }),
    ];
    expect(activePhaseHasBillables(sub(freeIntro))).toBe(false);
  });
});

describe("hasFutureBillables", () => {
  it("is true while a priced phase is still in the future", () => {
    setNow("2026-07-15T00:00:00.000Z");
    expect(hasFutureBillables(sub(rampPhases()))).toBe(true);

    // Once the steady phase has started there's nothing left in the future.
    setNow("2026-10-01T00:00:00.000Z");
    expect(hasFutureBillables(sub(rampPhases()))).toBe(false);
  });
});
