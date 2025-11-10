import type { Mutate, StoreApi } from "zustand";

export type StoreWithPersist<T> = Mutate<
  StoreApi<T>,
  [["zustand/persist", unknown]]
>;

export const syncZustandState = <T>(store: StoreWithPersist<T>) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist.getOptions().name && e.newValue) {
      void store.persist.rehydrate();
    }
  };

  if (typeof window === "undefined") return;

  window.addEventListener("storage", storageEventCallback);

  return () => {
    window.removeEventListener("storage", storageEventCallback);
  };
};
