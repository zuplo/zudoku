import {
  type ComponentType,
  createContext,
  Fragment,
  type PropsWithChildren,
  type ReactNode,
  use,
  useMemo,
  useRef,
} from "react";
import { createStore, useStore } from "zustand";
import {
  type ExposedComponentProps,
  useExposedProps,
} from "../../util/useExposedProps.js";

export type SlotType = ReactNode | ComponentType<ExposedComponentProps>;

type SlotItem = {
  id: string;
  content: SlotType;
  type: "prepend" | "replace" | "append";
  sequence: number;
};

type SlotStoreState = {
  items: Map<string, SlotItem[]>;
  // to guarantee the order of the items when appending/prepending
  sequences: Map<string, number>;
  getItems: (name: string) => SlotItem[];
  setSlot: (
    id: string,
    name: string,
    content: SlotType,
    type: "prepend" | "replace" | "append",
  ) => void;
  clearSlot: (id: string, name: string) => void;
};

export type SlotStore = ReturnType<typeof createSlotStore>;

const createSlotStore = ({
  slots = {},
}: {
  slots?: Record<string, SlotType>;
} = {}) => {
  const initialItems = new Map(
    Object.entries(slots).map(([id, content]) => [
      id,
      [{ id, content, type: "replace", sequence: 0 } satisfies SlotItem],
    ]),
  );
  const EMPTY_ITEMS: SlotItem[] = [];

  return createStore<SlotStoreState>()((set, get) => ({
    items: initialItems,
    sequences: new Map(),
    getItems: (name) => get().items.get(name) ?? EMPTY_ITEMS,
    setSlot: (id, name, content, type) =>
      set((state) => {
        if (content == null) return state;

        const items = new Map(state.items);
        const sequences = new Map(state.sequences);
        const existing = items.get(name) ?? [];
        const filtered = existing.filter((item) => item.id !== id);

        const currentSequence = sequences.get(name) ?? 0;
        const newSequence = currentSequence + 1;
        sequences.set(name, newSequence);

        const newItem = {
          id,
          content,
          type,
          // Use negative sequence values for "prepend" to ensure they are sorted before positive values for "append".
          sequence: type === "prepend" ? -newSequence : newSequence,
        } satisfies SlotItem;

        if (type === "replace") {
          const nonReplaceItems = filtered.filter(
            (item) => item.type !== "replace",
          );
          items.set(name, [...nonReplaceItems, newItem]);
        } else {
          items.set(name, [...filtered, newItem]);
        }

        return { items, sequences };
      }),
    clearSlot: (id, name) =>
      set((state) => {
        const items = new Map(state.items);
        const sequences = new Map(state.sequences);
        const existing = items.get(name) ?? [];
        const filtered = existing.filter((item) => item.id !== id);

        if (filtered.length === 0) {
          items.delete(name);
          sequences.delete(name);
        } else {
          items.set(name, filtered);
        }
        return { items, sequences };
      }),
  }));
};

const SlotContext = createContext(createSlotStore());

export const SlotProvider = ({
  children,
  slots,
}: PropsWithChildren<{
  slots?: Record<string, SlotType>;
}>) => {
  const store = useRef<SlotStore>(createSlotStore({ slots })).current;
  return <SlotContext value={store}>{children}</SlotContext>;
};

export function useSlotContext<T>(selector: (state: SlotStoreState) => T): T {
  const store = use(SlotContext);
  return useStore(store, selector);
}

const ORDER = ["prepend", "replace", "append"] as const;

export const useRenderSlot = (name: string) => {
  const exposedProps = useExposedProps();
  const items = useSlotContext((s) => s.getItems(name));

  return useMemo(() => {
    if (items.length === 0) return [];

    return items
      .toSorted((a, b) => {
        const typeOrder = ORDER.indexOf(a.type) - ORDER.indexOf(b.type);
        if (typeOrder !== 0) return typeOrder;
        return a.sequence - b.sequence;
      })
      .map((item) =>
        typeof item.content === "function" ? (
          <item.content key={item.id} {...exposedProps} />
        ) : (
          <Fragment key={item.id}>{item.content}</Fragment>
        ),
      );
  }, [items, exposedProps]);
};
