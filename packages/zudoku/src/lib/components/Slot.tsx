import { type ReactNode, useId, useLayoutEffect } from "react";
import {
  type SlotType,
  useRenderSlot,
  useSlotContext,
} from "./context/SlotProvider.js";

// This is to augment the type of the Slot component with custom slot names
// This is useful for plugins to add custom slots to the Zudoku context
// and for the user to use them in their own components
export type CustomSlotNames = never;

type PredefinedSlotNames =
  | "api-keys-list-page"
  | "api-keys-list-page-before-keys"
  | "footer-after"
  | "footer-before"
  | "head-navigation-end"
  | "head-navigation-start"
  | "layout-after-head"
  | "layout-before-head"
  | "top-navigation-after"
  | "top-navigation-before"
  | "top-navigation-side"
  | "content-before"
  | "content-after"
  | "navigation-after"
  | "navigation-before";

export type SlotName = PredefinedSlotNames | CustomSlotNames;

export const Slot = {
  Source: ({
    name,
    children,
    type = "replace",
  }: {
    name: SlotName;
    type?: "prepend" | "replace" | "append";
    children: SlotType;
  }) => {
    const id = useId();
    const setSlot = useSlotContext((s) => s.setSlot);
    const clearSlot = useSlotContext((s) => s.clearSlot);

    if (import.meta.env.SSR) {
      setSlot(id, name, children, type);
    }

    useLayoutEffect(() => {
      setSlot(id, name, children, type);
      return () => clearSlot(id, name);
    }, [id, name, children, type, setSlot, clearSlot]);

    return null;
  },

  Target: ({ name, fallback }: { name: string; fallback?: ReactNode }) => {
    const slot = useRenderSlot(name);

    if (slot.length === 0) return fallback;
    return slot;
  },
};
