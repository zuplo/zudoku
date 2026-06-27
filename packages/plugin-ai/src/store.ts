import { useSyncExternalStore } from "react";

type Listener = () => void;

// Module-level UI state for the Ask AI panel. It only ever holds an open/close
// boolean and is never mutated during server rendering (the panel always starts
// closed and is only toggled from client event handlers), so sharing it at
// module scope is safe.
let isOpen = false;
const listeners = new Set<Listener>();

const emitChange = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => isOpen;
const getServerSnapshot = () => false;

export const askAiStore = {
  getState: getSnapshot,
  open: () => {
    if (isOpen) return;
    isOpen = true;
    emitChange();
  },
  close: () => {
    if (!isOpen) return;
    isOpen = false;
    emitChange();
  },
  toggle: () => {
    isOpen = !isOpen;
    emitChange();
  },
};

/**
 * Programmatic access to the Ask AI chat panel. Use this from your own
 * components to open the assistant, e.g. from a call-to-action button.
 *
 * @example
 * ```tsx
 * const { open } = useAskAi();
 * return <button onClick={open}>Ask AI</button>;
 * ```
 */
export const useAskAi = () => {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    isOpen: open,
    open: askAiStore.open,
    close: askAiStore.close,
    toggle: askAiStore.toggle,
  };
};
