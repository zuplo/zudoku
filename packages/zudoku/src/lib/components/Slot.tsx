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

type NoData = Record<string, never>;

type PredefinedSlotData = {
  "api-keys-list-page": NoData;
  "api-keys-list-page-before-keys": NoData;
  "footer-after": NoData;
  "footer-before": NoData;
  "head-navigation-end": NoData;
  "head-navigation-start": NoData;
  "layout-after-head": NoData;
  "layout-before-head": NoData;
  "top-navigation-after": NoData;
  "top-navigation-before": NoData;
  "top-navigation-side": NoData;
  "content-before": NoData;
  "content-after": NoData;
  "navigation-after": NoData;
  "navigation-before": NoData;
  "mobile-top-bar-end": NoData;
  "after-openapi-operation-description": { operationId: string | null };
  "before-openapi-operation-title": { operationId: string | null };
};

type SlotData = PredefinedSlotData & Record<CustomSlotNames, unknown>;

export type SlotName = keyof SlotData;

export type SlotConfig = Partial<{
  [N in keyof SlotData]: SlotType<SlotData[N]>;
}> &
  Record<string, SlotType<any>>;

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

  Target: ({
    name,
    fallback,
    data,
  }: {
    name: string;
    fallback?: ReactNode;
    data?: unknown;
  }) => {
    const slot = useRenderSlot(name, data);

    if (slot.length === 0) return fallback;
    return slot;
  },
};
